"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  ThumbsUp,
  ThumbsDown,
  SkipForward,
  Send,
  Music,
  Users,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Star,
  Zap,
  Settings,
  Trash2,
  Crown,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { buildDiceBearUrl, seedToColor } from "@/lib/avatar"
import TrackPlayer from "@/components/room/TrackPlayer"
import AuthPromptModal from "@/components/ui/AuthPromptModal"
import MyQueuePanel from "@/components/room/MyQueuePanel"
import RoomSettings from "@/components/room/RoomSettings"
import { getSourceBadge } from "@/lib/track-utils"
import type { DJQueueEntry, Profile, Room, RoomMember, SongHistoryEntry, TrackInfo, TrackSource, Vote, VoteCounts, VoteType } from "@/types"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  user: string
  text: string
  color: string
  system?: boolean
}

interface MusicRoomProps {
  room: Room
  members: (RoomMember & { profile: Profile })[]
  queue: (DJQueueEntry & { profile: Profile })[]
  votes: Vote[]
  currentDJProfile: Profile | null
  voteCounts: VoteCounts
  currentUserId: string | null
  currentUserProfile: Profile | null
  playbackElapsed: number
  hasVideo: boolean
  isCurrentDJ: boolean
  joiningQueue: boolean
  onJoinQueue: () => void
  onLeaveQueue: () => void
  onPickSong: () => void
  onSkip: () => void
  onEnded: () => void
  onVote: (type: VoteType) => void
  // New: queue management + room admin
  currentUserDJEntry: (DJQueueEntry & { profile: Profile }) | null
  onRemoveFromQueue: (userId: string) => Promise<void>
  onUpdateDJSongs: (songs: TrackInfo[]) => Promise<void>
  onDeleteRoom: () => Promise<void>
  onUpdateRoomName: (name: string) => Promise<void>
  onTransferOwnership: (username: string) => Promise<{ error?: string }>
}

// ─── Avatar URL helper ──────────────────────────────────────────────────────

function avatarUrl(profile: Profile | null | undefined): string {
  if (!profile?.username) return buildDiceBearUrl('default', 'b6e3f4', 'none', 'short01')
  return buildDiceBearUrl(
    profile.avatar_seed || profile.username,
    profile.avatar_seed ? profile.avatar_bg_color : seedToColor(profile.username),
    profile.avatar_accessory || "none",
    profile.avatar_hair || "short01"
  )
}

function userColor(userId: string): string {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0
  return h % 2 === 0 ? "#06b6d4" : "#7c3aed"
}

// ─── Floating Music Notes ───────────────────────────────────────────────────

function FloatingNotes() {
  const notes = ["♪", "♫", "♬", "♩", "♪"]
  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
      {notes.map((note, i) => (
        <span
          key={i}
          className="text-neon-purple text-xs opacity-0"
          style={{
            animation: `float-note 2.5s ease-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }}
        >
          {note}
        </span>
      ))}
    </div>
  )
}

// ─── EQ Bars ─────────────────────────────────────────────────────────────────

function EqBarsLarge() {
  const heights = [12, 20, 16, 24, 14, 22, 18, 10, 20, 16]
  return (
    <div className="flex items-end gap-[3px]">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background: i % 2 === 0 ? "var(--neon-cyan)" : "var(--neon-purple)",
            animation: `eq-bar 0.4s ease-in-out infinite`,
            animationDelay: `${i * 0.08}s`,
            height: `${h}px`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Spinning Turntable Platter ──────────────────────────────────────────────

function TurntablePlatter({ side }: { side: "left" | "right" }) {
  return (
    <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
      <div className="absolute inset-0 rounded-full bg-[#1a1a30] border-2 border-neon-purple/40 animate-spin-record neon-glow-purple">
        <div className="absolute inset-[6px] rounded-full border border-neon-purple/15" />
        <div className="absolute inset-[12px] rounded-full border border-neon-purple/10" />
        <div className="absolute inset-[18px] rounded-full border border-neon-purple/10" />
        <div className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-neon-purple/60" />
        <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-bg-primary" />
      </div>
      <div
        className="absolute top-1 w-[2px] h-10 bg-text-muted/50 origin-top"
        style={{
          [side === "left" ? "right" : "left"]: "2px",
          transform: side === "left" ? "rotate(-25deg)" : "rotate(25deg)",
        }}
      >
        <div className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-neon-cyan" style={{ left: "-2px" }} />
      </div>
    </div>
  )
}

// ─── Mixer ───────────────────────────────────────────────────────────────────

function Mixer() {
  return (
    <div className="flex flex-col items-center gap-1.5 px-3 md:px-4">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-neon" />
        <div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse-neon" style={{ animationDelay: "0.5s" }} />
        <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-neon" style={{ animationDelay: "1s" }} />
      </div>
      <div className="flex gap-1">
        {[8, 14, 18, 10, 16].map((h, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full"
            style={{ height: `${h}px`, background: i % 2 === 0 ? "var(--neon-cyan)" : "var(--neon-purple)", opacity: 0.7 }}
          />
        ))}
      </div>
      <div className="w-14 h-1 bg-border rounded-full relative">
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-2 bg-neon-cyan rounded-sm" />
      </div>
    </div>
  )
}

// ─── DJ Stage ────────────────────────────────────────────────────────────────

function DJStage({
  djProfile,
  hasVideo,
  isCurrentDJ,
  currentUserId,
  joiningQueue,
  sessionPoints,
  queue,
  activeDJSpot,
  onPickSong,
  onJoinQueue,
}: {
  djProfile: Profile | null
  hasVideo: boolean
  isCurrentDJ: boolean
  currentUserId: string | null
  joiningQueue: boolean
  sessionPoints: number
  queue: (DJQueueEntry & { profile: Profile })[]
  activeDJSpot: number | null
  onPickSong: () => void
  onJoinQueue: () => void
}) {
  const djName = djProfile
    ? djProfile.display_name || djProfile.username
    : "No DJ"

  return (
    <section className="relative flex flex-col items-center bg-stage-bg" aria-label="DJ Stage">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--neon-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--neon-cyan) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Cone spotlight */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-40 md:w-56 h-full opacity-15"
        style={{
          background: "linear-gradient(180deg, var(--neon-cyan) 0%, transparent 80%)",
          clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
        }}
      />

      {/* Floating notes & EQ */}
      <div className="relative z-10 pt-5 pb-2 flex flex-col items-center">
        <FloatingNotes />
        <EqBarsLarge />
      </div>

      {/* DJ label */}
      <div className="relative z-10 flex items-center gap-1 mb-1">
        <Star className="w-3 h-3 text-neon-cyan fill-neon-cyan" />
        <span className="text-[8px] md:text-[10px] text-neon-cyan uppercase tracking-widest neon-text-cyan">
          Now Spinning
        </span>
        <Star className="w-3 h-3 text-neon-cyan fill-neon-cyan" />
      </div>

      {/* DJ avatar */}
      {djProfile ? (
        <>
          <div className="relative z-10 animate-bounce-avatar-alt mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl(djProfile)}
              alt="DJ avatar"
              width={72}
              height={72}
              className="rounded-lg"
              style={{ filter: "drop-shadow(0 0 10px var(--neon-cyan))" }}
              crossOrigin="anonymous"
            />
          </div>
          {/* Session points badge */}
          {sessionPoints > 0 && (
            <div
              className="relative z-10 flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.45)' }}
            >
              <Zap className="w-2.5 h-2.5 text-neon-purple" />
              <span className="text-[8px] font-bold text-neon-purple">{sessionPoints}</span>
            </div>
          )}
          <span className="relative z-10 text-[9px] text-neon-cyan neon-text-cyan mb-2">{djName}</span>
          {/* Pick song CTA for the active DJ */}
          {isCurrentDJ && !hasVideo && (
            <button
              onClick={onPickSong}
              className="relative z-10 mb-3 px-4 py-1.5 text-[9px] uppercase tracking-wider rounded-full text-bg-primary font-bold"
              style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}
            >
              Pick a Song
            </button>
          )}
        </>
      ) : (
        <>
          <div className="relative z-10 mb-2 w-[72px] h-[72px] rounded-lg border-2 border-dashed border-neon-purple/30 flex items-center justify-center">
            <span className="text-2xl opacity-40">🎧</span>
          </div>
          <span className="relative z-10 text-[9px] text-text-muted mb-2">No DJ right now</span>
          <button
            onClick={onJoinQueue}
            disabled={joiningQueue}
            className="relative z-10 mb-3 px-4 py-1.5 text-[9px] uppercase tracking-wider rounded-full text-bg-primary font-bold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))" }}
          >
            {joiningQueue ? "Joining..." : "Be the DJ"}
          </button>
        </>
      )}

      {/* Raised platform */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="flex items-center justify-center gap-2 bg-bg-secondary/80 rounded-t-lg border border-border pt-3 pb-4 px-3">
          <TurntablePlatter side="left" />
          <Mixer />
          <TurntablePlatter side="right" />
        </div>
        <div className="h-1.5 rounded-b-sm" style={{ background: "linear-gradient(90deg, transparent, var(--neon-cyan), var(--neon-purple), var(--neon-cyan), transparent)" }} />
        <div className="h-1 opacity-60 blur-sm" style={{ background: "linear-gradient(90deg, transparent, var(--neon-cyan), var(--neon-purple), var(--neon-cyan), transparent)" }} />
      </div>

      <div
        className="w-full max-w-md h-4 opacity-30 -mt-1"
        style={{ background: "radial-gradient(ellipse at top, rgba(6,182,212,0.4), transparent)" }}
      />

      {/* 3-Spot Podium Row */}
      <div className="relative z-10 flex items-end justify-center gap-6 px-4 pb-2 pt-1 w-full max-w-md">
        {[1, 2, 3].map((spot) => {
          const entry = queue.find((q) => q.spot === spot)
          const isActive = spot === activeDJSpot
          const p = entry?.profile
          return (
            <div key={spot} className="flex flex-col items-center gap-1 relative">
              {isActive && (
                <Crown className="w-3 h-3 text-neon-cyan absolute -top-4" />
              )}
              {p ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buildDiceBearUrl(
                      p.avatar_seed || p.username,
                      p.avatar_seed ? p.avatar_bg_color : seedToColor(p.username),
                      p.avatar_accessory || 'none',
                      p.avatar_hair || 'short01'
                    )}
                    alt={p.display_name || p.username}
                    width={isActive ? 36 : 26}
                    height={isActive ? 36 : 26}
                    className={`rounded transition-all ${isActive ? 'ring-2 ring-neon-cyan' : 'opacity-70'}`}
                    crossOrigin="anonymous"
                  />
                  <span className={`text-[7px] truncate max-w-[48px] text-center ${isActive ? 'text-neon-cyan' : 'text-text-muted'}`}>
                    {p.display_name || p.username}
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className="rounded border border-dashed flex items-center justify-center"
                    style={{ width: 26, height: 26, borderColor: 'rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.04)' }}
                  >
                    <span className="text-[10px] text-text-muted/40">?</span>
                  </div>
                  <span className="text-[7px] text-text-muted/40">Spot {spot}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Checkerboard Dance Floor ────────────────────────────────────────────────

function DanceFloor({ members }: { members: (RoomMember & { profile: Profile })[] }) {
  const COLS = 14
  const ROWS = 7

  const sizeByRow = [48, 38, 30]
  const opacityByRow = [1, 0.85, 0.65]

  const rowPositions: Record<number, { x: string; y: string }[]> = {
    0: [
      { x: "12%", y: "55%" },
      { x: "35%", y: "60%" },
      { x: "58%", y: "52%" },
      { x: "82%", y: "58%" },
    ],
    1: [
      { x: "8%",  y: "35%" },
      { x: "30%", y: "30%" },
      { x: "55%", y: "32%" },
      { x: "78%", y: "28%" },
    ],
    2: [
      { x: "15%", y: "15%" },
      { x: "40%", y: "12%" },
      { x: "62%", y: "18%" },
      { x: "88%", y: "14%" },
    ],
  }

  // Distribute members across 3 rows — skip any with missing profiles
  const listeners = members
    .filter(m => m.profile?.username)
    .map((m, i) => ({
      name: m.profile.display_name || m.profile.username,
      url: avatarUrl(m.profile),
      row: i % 3,
    }))

  return (
    <section className="relative flex-1 bg-floor-bg overflow-hidden" aria-label="Dance Floor">
      {/* Checkerboard tiles */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          }}
        >
          {Array.from({ length: ROWS * COLS }).map((_, idx) => {
            const r = Math.floor(idx / COLS)
            const c = idx % COLS
            const isLight = (r + c) % 2 === 0
            const gridLineColor = (r + c) % 3 === 0 ? "var(--neon-purple)" : "var(--neon-cyan)"
            return (
              <div
                key={idx}
                className="relative"
                style={{
                  backgroundColor: isLight ? "rgba(26,26,53,0.6)" : "rgba(15,15,26,0.8)",
                  boxShadow: `inset 0 0 1px ${gridLineColor}`,
                }}
              >
                {(r + c) % 4 === 0 && (
                  <div
                    className="absolute inset-0 animate-floor-pulse"
                    style={{
                      background: `radial-gradient(circle, ${gridLineColor}20 0%, transparent 70%)`,
                      animationDelay: `${(r + c) * 0.15}s`,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Grid line overlay */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(var(--neon-purple) 1px, transparent 1px), linear-gradient(90deg, var(--neon-cyan) 1px, transparent 1px)`,
          backgroundSize: `${100 / COLS}% ${100 / ROWS}%`,
        }}
      />

      {/* Ambient stage light spill */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-20 opacity-10"
        style={{ background: "radial-gradient(ellipse at top, var(--neon-purple), transparent)" }}
      />

      {/* Audience avatars with depth perspective */}
      <div className="relative w-full h-full min-h-[240px] md:min-h-[300px]">
        {listeners.map((listener, i) => {
          const rowIdx = listener.row
          const positionsForRow = rowPositions[rowIdx] || rowPositions[2]
          const avatarsInThisRowBefore = listeners.filter((l, j) => l.row === rowIdx && j < i).length
          const pos = positionsForRow[avatarsInThisRowBefore % positionsForRow.length]
          const size = sizeByRow[rowIdx] || 30
          const isAlt = i % 2 === 0

          return (
            <div
              key={i}
              className={`absolute flex flex-col items-center gap-0.5 ${isAlt ? "animate-bounce-avatar" : "animate-bounce-avatar-alt"}`}
              style={{
                left: pos.x,
                top: pos.y,
                animationDelay: `${i * 0.12}s`,
                transform: "translate(-50%, -50%)",
                opacity: opacityByRow[rowIdx],
                zIndex: (rowIdx + 1) * 10,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listener.url}
                alt={`${listener.name}'s avatar`}
                width={size}
                height={size}
                className="rounded"
                crossOrigin="anonymous"
              />
              <span className="text-[7px] text-text-primary/70 truncate max-w-14 text-center">
                {listener.name}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── Emoji Reaction Burst ─────────────────────────────────────────────────────

const BURST_EMOJIS = ['🎵', '🎶', '✨', '🔥', '💜']

function EmojiReactionBurst({ onDone }: { onDone: () => void }) {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      emoji:    BURST_EMOJIS[i % BURST_EMOJIS.length],
      startX:   4 + Math.random() * 38,           // % — clusters left where Awesome button lives
      dx:       (Math.random() - 0.35) * 200,      // px horizontal drift, slight rightward bias
      dy:       200 + Math.random() * 260,         // px upward travel
      size:     14 + Math.random() * 16,           // px font size
      delay:    i * 0.04 + Math.random() * 0.12,  // s stagger
      duration: 1.5 + Math.random() * 0.9,        // s
      rotate:   (Math.random() - 0.5) * 90,       // deg spin
    }))
  , []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const longest = Math.max(...particles.map(p => p.delay + p.duration)) * 1000
    const t = setTimeout(onDone, longest + 200)
    return () => clearTimeout(t)
  }, [onDone, particles])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40" aria-hidden="true">
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: '64px',
            left: `${p.startX}%`,
            fontSize: `${p.size}px`,
            lineHeight: 1,
            animationName: 'emojiBurst',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: 'ease-out',
            animationFillMode: 'both',
            '--dx': `${p.dx}px`,
            '--dy': `-${p.dy}px`,
            '--rotate': `${p.rotate}deg`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ─── Now Playing Bar ─────────────────────────────────────────────────────────

function NowPlayingBar({
  track,
  artist,
  roomName,
  listenerCount,
  trackSource,
  showSettings,
  onOpenSettings,
}: {
  track: string
  artist: string
  roomName: string
  listenerCount: number
  trackSource: TrackSource | null
  showSettings: boolean
  onOpenSettings: () => void
}) {
  const badge = trackSource ? getSourceBadge(trackSource) : null

  return (
    <header className="flex items-center justify-between px-3 md:px-6 py-3 bg-bg-card border-b border-border animate-breathe-glow" aria-label="Now Playing">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="flex items-center gap-1.5">
          <Music className="w-4 h-4 text-neon-purple" />
          <span className="hidden md:inline text-[10px] text-neon-purple uppercase tracking-wider animate-neon-flicker">
            {roomName}
          </span>
        </div>
        <div className="h-4 w-px bg-border hidden md:block" />
        <div className="flex items-center gap-1.5 text-text-muted">
          <Users className="w-3 h-3" />
          <span className="text-[10px]">{listenerCount}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
        <div className="flex items-end gap-[2px]">
          {[0, 0.15, 0.3, 0.1].map((delay, i) => (
            <div
              key={i}
              className="w-[3px] bg-neon-cyan rounded-full"
              style={{ animation: "eq-bar 0.5s ease-in-out infinite", animationDelay: `${delay}s`, height: "4px" }}
            />
          ))}
        </div>
        <div className="flex flex-col items-center min-w-0">
          <div className="flex items-center gap-1.5">
            {badge && (
              <span
                className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: 'var(--neon-cyan)' }}
              >
                {badge.emoji} {badge.label}
              </span>
            )}
            <span className="text-[10px] md:text-xs text-neon-cyan neon-text-cyan truncate max-w-32 md:max-w-none">
              {track}
            </span>
          </div>
          <span className="text-[8px] md:text-[10px] text-text-muted truncate max-w-28 md:max-w-none">
            {artist}
          </span>
        </div>
        <div className="flex items-end gap-[2px]">
          {[0.2, 0.05, 0.25, 0.1].map((delay, i) => (
            <div
              key={i}
              className="w-[3px] bg-neon-cyan rounded-full"
              style={{ animation: "eq-bar 0.5s ease-in-out infinite", animationDelay: `${delay}s`, height: "4px" }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-text-muted" />
        <div className="hidden md:flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full ${i < 4 ? "bg-neon-cyan" : "bg-border"}`}
              style={{ height: `${6 + i * 3}px` }}
            />
          ))}
        </div>
        {showSettings && (
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md text-text-muted hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
            title="Room Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  )
}

// ─── Crowd Energy Meter ──────────────────────────────────────────────────────

function CrowdEnergyMeter({ awesome, lame }: { awesome: number; lame: number }) {
  const total = awesome + lame || 1
  const energy = Math.round((awesome / total) * 100)
  const segments = 10
  const filledSegments = Math.round((energy / 100) * segments)

  return (
    <div className="flex flex-col items-center gap-1 px-2 py-3">
      <Zap className="w-3.5 h-3.5 text-neon-cyan" />
      <div className="flex flex-col-reverse gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => {
          const isFilled = i < filledSegments
          const color = i < 3 ? "var(--neon-pink)" : i < 6 ? "var(--neon-purple)" : "var(--neon-cyan)"
          return (
            <div
              key={i}
              className="w-3 h-2 rounded-[1px] transition-all duration-500"
              style={{
                backgroundColor: isFilled ? color : "rgba(42,40,69,1)",
                boxShadow: isFilled ? `0 0 4px ${color}` : "none",
                animation: isFilled ? "energy-pulse 1.5s ease-in-out infinite" : "none",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          )
        })}
      </div>
      <span className="text-[7px] text-text-muted">{energy}%</span>
    </div>
  )
}

// ─── Vote Controls ────────────────────────────────────────────────────────────

function VoteControls({
  voteCounts,
  playbackElapsed,
  disabled,
  isCurrentDJ,
  isAdminOrOwner,
  onVote,
  onSkip,
}: {
  voteCounts: VoteCounts
  playbackElapsed: number
  disabled: boolean
  isCurrentDJ: boolean
  isAdminOrOwner: boolean
  onVote: (type: VoteType) => void
  onSkip: () => void
}) {
  // Rough track progress — 240s assumed max per song
  const trackProgress = Math.min((playbackElapsed / 240) * 100, 100)
  const userVote = voteCounts.userVote

  return (
    <footer className="bg-bg-card border-t border-border" aria-label="Vote controls">
      {/* Track progress */}
      <div className="relative h-1 bg-bg-secondary">
        <div className="absolute left-0 top-0 h-full bg-neon-cyan transition-all duration-1000" style={{ width: `${trackProgress}%` }} />
        <div className="absolute top-0 h-full w-1 bg-neon-cyan rounded-full neon-glow-cyan" style={{ left: `${trackProgress}%` }} />
      </div>

      <div className="flex items-center justify-between px-3 md:px-6 py-3">
        {/* Awesome button */}
        <div title={disabled && !isCurrentDJ ? "Sign in to vote" : undefined}>
        <button
          onClick={() => !disabled && onVote("awesome")}
          disabled={disabled || isCurrentDJ}
          className={`group flex items-center gap-2 md:gap-3 px-5 md:px-8 py-2.5 md:py-3 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
            userVote === "awesome" ? "neon-glow-purple" : "hover:opacity-90"
          }`}
          style={{
            background: userVote === "awesome"
              ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
              : "linear-gradient(135deg, #7c3aed60, #5b21b640)",
            border: `2px solid ${userVote === "awesome" ? "#7c3aed" : "#7c3aed50"}`,
          }}
          aria-label={`Vote awesome, currently ${voteCounts.awesome} votes`}
          aria-pressed={userVote === "awesome"}
        >
          <ThumbsUp className={`w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110 ${userVote === "awesome" ? "text-white fill-white/30" : "text-text-primary/70"}`} />
          <div className="flex flex-col items-start">
            <span className={`text-[8px] md:text-[10px] uppercase tracking-wider ${userVote === "awesome" ? "text-white" : "text-text-primary/70"}`}>
              Awesome
            </span>
            <span className={`text-xs md:text-sm font-mono ${userVote === "awesome" ? "text-white" : "text-text-primary"}`}>
              {voteCounts.awesome}
            </span>
          </div>
        </button>
        </div>

        {/* Center controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {(isCurrentDJ || isAdminOrOwner) && (
            <button
              onClick={onSkip}
              className="p-2 md:p-2.5 rounded-lg border border-border bg-bg-secondary text-text-muted hover:border-neon-purple/50 hover:text-neon-purple transition-all"
              aria-label="Skip track"
            >
              <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}
        </div>

        {/* Lame button */}
        <div title={disabled && !isCurrentDJ ? "Sign in to vote" : undefined}>
        <button
          onClick={() => !disabled && onVote("lame")}
          disabled={disabled || isCurrentDJ}
          className={`group flex items-center gap-2 md:gap-3 px-5 md:px-8 py-2.5 md:py-3 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90`}
          style={{
            background: userVote === "lame"
              ? "linear-gradient(135deg, #ef4444, #b91c1c)"
              : "linear-gradient(135deg, #ef444460, #b91c1c40)",
            border: `2px solid ${userVote === "lame" ? "#ef4444" : "#ef444450"}`,
            boxShadow: userVote === "lame" ? "0 0 12px rgba(239,68,68,0.4)" : "none",
          }}
          aria-label={`Vote lame, currently ${voteCounts.lame} votes`}
          aria-pressed={userVote === "lame"}
        >
          <div className="flex flex-col items-end">
            <span className={`text-[8px] md:text-[10px] uppercase tracking-wider ${userVote === "lame" ? "text-white" : "text-text-primary/70"}`}>
              Lame
            </span>
            <span className={`text-xs md:text-sm font-mono ${userVote === "lame" ? "text-white" : "text-text-primary"}`}>
              {voteCounts.lame}
            </span>
          </div>
          <ThumbsDown className={`w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110 ${userVote === "lame" ? "text-white fill-white/30" : "text-text-primary/70"}`} />
        </button>
        </div>
      </div>
    </footer>
  )
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  messages,
  currentUserName,
  disabled,
  onSend,
}: {
  messages: ChatMessage[]
  currentUserName: string | null
  disabled: boolean
  onSend: (text: string) => void
}) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function handleSend() {
    if (!input.trim() || disabled) return
    onSend(input.trim())
    setInput("")
  }

  return (
    <aside className="flex flex-col w-full bg-bg-card border-l border-border" aria-label="Chat">
      <div className="px-3 py-2 border-b border-border">
        <span className="text-[8px] md:text-[10px] text-neon-purple uppercase tracking-widest neon-text-purple">
          Room Chat
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 max-h-[200px] md:max-h-none">
        {messages.map((msg) =>
          msg.system ? (
            <div key={msg.id} className="flex items-center gap-1.5 py-0.5">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[8px] text-text-muted/60 italic shrink-0">{msg.text}</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>
          ) : (
            <div key={msg.id} className="flex gap-2 items-start">
              <span className="text-[9px] md:text-[10px] shrink-0" style={{ color: msg.color }}>
                {msg.user}:
              </span>
              <span className="text-[9px] md:text-[10px] text-text-primary/80 leading-relaxed break-words">
                {msg.text}
              </span>
            </div>
          )
        )}
        {messages.length === 0 && (
          <p className="text-[9px] text-text-muted text-center py-2">No messages yet</p>
        )}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend() }}
        className="flex items-center gap-2 p-2 border-t border-border"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "Sign in to chat" : "Say something..."}
          disabled={disabled}
          className="flex-1 bg-bg-secondary text-text-primary text-[9px] md:text-[10px] px-3 py-2 rounded-md border border-border focus:border-neon-cyan focus:outline-none placeholder:text-text-muted disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="p-2 text-neon-cyan hover:bg-neon-cyan/10 rounded-md transition-colors disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  )
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function RightSidebar({
  queue,
  voteCounts,
  messages,
  currentUserName,
  disabled,
  songHistory,
  isAdminOrOwner,
  activeDJSpot,
  onSendChat,
  onRemoveFromQueue,
}: {
  queue: (DJQueueEntry & { profile: Profile })[]
  voteCounts: VoteCounts
  messages: ChatMessage[]
  currentUserName: string | null
  disabled: boolean
  songHistory: SongHistoryEntry[]
  isAdminOrOwner: boolean
  activeDJSpot: number | null
  onSendChat: (text: string) => void
  onRemoveFromQueue: (userId: string) => Promise<void>
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`hidden md:flex flex-col border-l border-border bg-bg-card transition-all duration-300 ${collapsed ? "w-12" : "w-72"}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-2 border-b border-border text-text-muted hover:text-neon-cyan transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center pt-2">
          <CrowdEnergyMeter awesome={voteCounts.awesome} lame={voteCounts.lame} />
        </div>
      ) : (
        <>
          {/* DJ Queue — 3 fixed spots */}
          <div className="p-3 border-b border-border">
            <span className="text-[8px] text-neon-cyan uppercase tracking-widest neon-text-cyan">
              DJ Spots
            </span>
            <div className="flex flex-col gap-2 mt-2">
              {[1, 2, 3].map((spot) => {
                const entry = queue.find((q) => q.spot === spot)
                const isActive = spot === activeDJSpot
                const p = entry?.profile
                return (
                  <div
                    key={spot}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${isActive ? 'bg-neon-cyan/10 border border-neon-cyan/20' : 'border border-transparent'}`}
                  >
                    <span className={`text-[8px] font-mono shrink-0 ${isActive ? 'text-neon-cyan' : 'text-text-muted'}`}>
                      {isActive ? '▶' : spot}
                    </span>
                    {p ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatarUrl(p)}
                          alt={p.display_name || p.username}
                          width={22}
                          height={22}
                          className="rounded shrink-0"
                          crossOrigin="anonymous"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className={`text-[9px] truncate ${isActive ? 'text-neon-cyan' : 'text-text-primary/80'}`}>
                            {p.display_name || p.username}
                            {p.is_admin && <span className="ml-1 text-neon-purple" title="Admin">⚡</span>}
                          </span>
                          {entry && entry.songs.length > 0 && (
                            <span className="text-[7px] text-text-muted">{entry.songs.length} song{entry.songs.length !== 1 ? 's' : ''} queued</span>
                          )}
                        </div>
                        {isAdminOrOwner && (
                          <button
                            onClick={() => onRemoveFromQueue(entry!.user_id)}
                            className="text-text-muted hover:text-accent-red transition-colors shrink-0"
                            title="Remove DJ from spot"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-[8px] text-text-muted/50 italic">Empty</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Tracks */}
          {songHistory.length > 0 && (
            <div className="p-3 border-b border-border">
              <span className="text-[8px] text-neon-purple uppercase tracking-widest neon-text-purple">
                Recent Tracks
              </span>
              <div className="flex flex-col gap-2 mt-2">
                {songHistory.map((entry) => {
                  const srcBadge = entry.track_source ? getSourceBadge(entry.track_source as TrackSource) : null
                  return (
                    <div key={entry.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded shrink-0 bg-bg-secondary flex items-center justify-center text-base">
                        {srcBadge ? srcBadge.emoji : <Music className="w-3 h-3 text-text-muted" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] text-text-primary/80 truncate leading-tight">{entry.track_title || 'Unknown'}</span>
                        <span className="text-[7px] text-text-muted">{timeAgo(entry.played_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Energy meter */}
          <div className="flex items-center justify-center border-b border-border">
            <CrowdEnergyMeter awesome={voteCounts.awesome} lame={voteCounts.lame} />
            <span className="text-[7px] text-text-muted uppercase tracking-wider">Energy</span>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-h-0">
            <ChatPanel
              messages={messages}
              currentUserName={currentUserName}
              disabled={disabled}
              onSend={onSendChat}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main MusicRoom Component ─────────────────────────────────────────────────

export default function MusicRoom({
  room,
  members,
  queue,
  votes,
  currentDJProfile,
  voteCounts,
  currentUserId,
  currentUserProfile,
  playbackElapsed,
  hasVideo,
  isCurrentDJ,
  joiningQueue,
  onJoinQueue,
  onLeaveQueue,
  onPickSong,
  onSkip,
  onEnded,
  onVote,
  currentUserDJEntry,
  onRemoveFromQueue,
  onUpdateDJSongs,
  onDeleteRoom,
  onUpdateRoomName,
  onTransferOwnership,
}: MusicRoomProps) {
  const supabase = createClient()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [bursts, setBursts] = useState<number[]>([])
  const [songHistory, setSongHistory] = useState<SongHistoryEntry[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  // Stable ref so join/leave callbacks always see the latest profile
  const currentUserProfileRef = useRef(currentUserProfile)
  useEffect(() => { currentUserProfileRef.current = currentUserProfile }, [currentUserProfile])

  const isOwner = !!currentUserId && (room.owner_id === currentUserId || room.created_by === currentUserId)
  const isAdmin = currentUserProfile?.is_admin === true
  const isAdminOrOwner = isOwner || isAdmin

  function handleVote(type: VoteType) {
    if (type === 'awesome') {
      setBursts(prev => [...prev, Date.now()])
    }
    onVote(type)
  }

  function handleJoinQueue() {
    if (!currentUserId) {
      setShowAuthPrompt(true)
      return
    }
    onJoinQueue()
  }

  // Song history: fetch last 5 + subscribe to new plays
  useEffect(() => {
    supabase
      .from('song_history')
      .select('*')
      .eq('room_id', room.id)
      .order('played_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setSongHistory(data as SongHistoryEntry[])
      })

    const sub = supabase
      .channel(`song_history:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'song_history',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setSongHistory(prev => [payload.new as SongHistoryEntry, ...prev].slice(0, 5))
      })
      .subscribe()

    return () => { sub.unsubscribe() }
  }, [room.id, supabase])

  // Supabase Realtime Broadcast for ephemeral chat
  useEffect(() => {
    const channel = supabase.channel(`chat:${room.id}`)
    channelRef.current = channel

    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        setChatMessages((prev) => [...prev.slice(-99), payload as ChatMessage])
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return
        const profile = currentUserProfileRef.current
        if (!profile) return
        const name = profile.display_name || profile.username
        channel.send({
          type: 'broadcast',
          event: 'message',
          payload: { id: `sys-${Date.now()}`, user: '', text: `${name} joined the room 🎵`, color: '', system: true } satisfies ChatMessage,
        })
      })

    return () => {
      const profile = currentUserProfileRef.current
      if (profile) {
        const name = profile.display_name || profile.username
        channel.send({
          type: 'broadcast',
          event: 'message',
          payload: { id: `sys-${Date.now()}`, user: '', text: `${name} left the room`, color: '', system: true } satisfies ChatMessage,
        })
      }
      channel.unsubscribe()
    }
  }, [room.id, supabase])

  const handleSendChat = useCallback((text: string) => {
    if (!currentUserProfile || !channelRef.current) return
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      user: currentUserProfile.display_name || currentUserProfile.username,
      text,
      color: userColor(currentUserId!),
    }
    channelRef.current.send({ type: "broadcast", event: "message", payload: msg })
    // Optimistically add own message
    setChatMessages((prev) => [...prev.slice(-99), msg])
  }, [currentUserProfile, currentUserId])

  // Session points = awesome votes cast for the current DJ during this song
  const sessionPoints = votes.filter(v => v.vote_type === 'awesome').length

  const djName = currentDJProfile
    ? currentDJProfile.display_name || currentDJProfile.username
    : ""

  const track = room.current_video_title || (currentDJProfile ? `${djName} is picking...` : "Waiting for a DJ...")
  const artist = currentDJProfile ? `DJ: ${djName}` : ""

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-bg-primary">
      <AuthPromptModal isOpen={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} />

      {/* Emoji reaction bursts */}
      {bursts.map(id => (
        <EmojiReactionBurst
          key={id}
          onDone={() => setBursts(prev => prev.filter(b => b !== id))}
        />
      ))}

      {/* CRT scanline overlay */}
      <div className="scanline-overlay absolute inset-0 z-50 pointer-events-none" />

      {/* Hidden track player — YouTube / SoundCloud / Suno */}
      {hasVideo && (
        <TrackPlayer
          source={(room.current_track_source as TrackSource) ?? 'youtube'}
          videoId={room.current_video_id ?? undefined}
          trackUrl={room.current_track_url ?? room.current_video_id ?? ''}
          playbackElapsed={playbackElapsed}
          onEnded={onEnded}
        />
      )}

      {/* Room Settings Modal */}
      <RoomSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        room={room}
        onDeleteRoom={onDeleteRoom}
        onUpdateName={onUpdateRoomName}
        onTransferOwnership={onTransferOwnership}
      />

      {/* Now Playing Bar */}
      <NowPlayingBar
        track={track}
        artist={artist}
        roomName={room.name}
        listenerCount={members.length}
        trackSource={(room.current_track_source as TrackSource) ?? null}
        showSettings={isAdminOrOwner}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-0">
          <DJStage
            djProfile={currentDJProfile}
            hasVideo={hasVideo}
            isCurrentDJ={isCurrentDJ}
            currentUserId={currentUserId}
            joiningQueue={joiningQueue}
            sessionPoints={sessionPoints}
            queue={queue}
            activeDJSpot={room.active_dj_spot ?? null}
            onPickSong={onPickSong}
            onJoinQueue={handleJoinQueue}
          />

          {/* My Queue Panel — only visible to the active DJ */}
          {isCurrentDJ && currentUserDJEntry && (
            <div className="px-4 py-2 border-b border-border bg-bg-secondary/30">
              <MyQueuePanel
                songs={currentUserDJEntry.songs}
                isPlaying={isCurrentDJ}
                onUpdate={onUpdateDJSongs}
              />
            </div>
          )}

          <DanceFloor members={members} />
        </div>
        <RightSidebar
          queue={queue}
          voteCounts={voteCounts}
          messages={chatMessages}
          currentUserName={currentUserProfile ? (currentUserProfile.display_name || currentUserProfile.username) : null}
          disabled={!currentUserId}
          songHistory={songHistory}
          isAdminOrOwner={isAdminOrOwner}
          activeDJSpot={room.active_dj_spot ?? null}
          onSendChat={handleSendChat}
          onRemoveFromQueue={onRemoveFromQueue}
        />
      </div>

      {/* Vote Controls */}
      {hasVideo && (
        <VoteControls
          voteCounts={voteCounts}
          playbackElapsed={playbackElapsed}
          disabled={!currentUserId}
          isCurrentDJ={isCurrentDJ}
          isAdminOrOwner={isAdminOrOwner}
          onVote={handleVote}
          onSkip={onSkip}
        />
      )}
    </div>
  )
}
