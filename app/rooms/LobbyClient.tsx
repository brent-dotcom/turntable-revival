'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { buildDiceBearUrl, seedToColor } from '@/lib/avatar'
import { Users, Music, Disc3, Plus, Radio, Trash2, ShieldCheck } from 'lucide-react'
import type { RoomWithDJ } from '@/types'

// ─── Genre badge colours ─────────────────────────────────────────────────────

const GENRE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  'Electronic':  { bg: 'rgba(6,182,212,0.12)',  color: '#06b6d4', border: 'rgba(6,182,212,0.35)'  },
  'Hip-Hop':     { bg: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: 'rgba(124,58,237,0.35)' },
  'Indie':       { bg: 'rgba(236,72,153,0.12)', color: '#f472b6', border: 'rgba(236,72,153,0.35)' },
  'Rock':        { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.35)'  },
  'Pop':         { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.35)' },
  'R&B / Soul':  { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.35)' },
  'Jazz':        { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.35)' },
  'Lo-Fi':       { bg: 'rgba(52,211,153,0.12)', color: '#6ee7b7', border: 'rgba(52,211,153,0.35)' },
  'Metal':       { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: 'rgba(148,163,184,0.35)' },
  'Latin':       { bg: 'rgba(251,113,133,0.12)', color: '#fb7185', border: 'rgba(251,113,133,0.35)' },
  'Everything':  { bg: 'rgba(167,139,250,0.12)', color: '#c4b5fd', border: 'rgba(167,139,250,0.35)' },
}

const DEFAULT_GENRE_STYLE = { bg: 'rgba(107,104,128,0.15)', color: '#9ca3af', border: 'rgba(107,104,128,0.3)' }

// ─── Avatar helper ───────────────────────────────────────────────────────────

function djAvatarUrl(profile: RoomWithDJ['dj_profile']): string {
  if (!profile?.username) return buildDiceBearUrl('default', 'b6e3f4', 'none', 'short01')
  return buildDiceBearUrl(
    profile.avatar_seed || profile.username,
    profile.avatar_seed ? (profile.avatar_bg_color || 'b6e3f4') : seedToColor(profile.username),
    profile.avatar_accessory || 'none',
    profile.avatar_hair || 'short01',
  )
}

// ─── Re-fetch a single room with DJ profile ──────────────────────────────────

async function fetchRoomWithDJ(
  supabase: ReturnType<typeof createClient>,
  roomId: string,
): Promise<RoomWithDJ | null> {
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .eq('is_active', true)
    .single()
  if (!room) return null

  let dj_profile = null
  if (room.current_dj_id) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_seed, avatar_bg_color, avatar_hair, avatar_accessory')
      .eq('id', room.current_dj_id)
      .single()
    dj_profile = data
  }

  return { ...room, dj_profile }
}

// ─── Room Card ───────────────────────────────────────────────────────────────

function RoomCard({ room, isAdmin, onDelete }: { room: RoomWithDJ; isAdmin: boolean; onDelete: (id: string) => void }) {
  const isPlaying = !!room.current_video_id
  const djName = room.dj_profile?.display_name || room.dj_profile?.username
  const genreStyle = room.genre ? (GENRE_STYLE[room.genre] ?? DEFAULT_GENRE_STYLE) : null
  const isEmpty = room.listener_count === 0

  return (
  <div className="relative group">
    <Link
      href={`/rooms/${room.id}`}
      className="flex flex-col bg-bg-card border rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        borderColor: isPlaying ? 'rgba(124,58,237,0.5)' : 'rgba(42,40,69,1)',
        boxShadow: isPlaying
          ? '0 0 20px rgba(124,58,237,0.15), 0 0 40px rgba(6,182,212,0.05)'
          : 'none',
        animation: isPlaying ? 'lobbyCardPulse 3s ease-in-out infinite' : 'none',
      }}
    >
      {/* Room visual — never shows YouTube thumbnails */}
      <div
        className="relative w-full flex items-center justify-center py-7 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.10) 100%)' }}
      >
        {room.dj_profile ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={djAvatarUrl(room.dj_profile)}
            alt={djName ?? 'DJ avatar'}
            width={64}
            height={64}
            className="rounded-xl pixel-image"
            style={{ filter: isPlaying ? 'drop-shadow(0 0 8px rgba(6,182,212,0.6))' : undefined }}
          />
        ) : (
          <Disc3
            size={44}
            className="text-text-muted group-hover:text-accent-purple transition-colors"
            style={{ animation: isPlaying ? 'spin 3s linear infinite' : 'none' }}
          />
        )}

        {/* LIVE badge */}
        {isPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-accent-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}

        {/* Genre badge */}
        {genreStyle && (
          <div
            className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
            style={{ background: genreStyle.bg, color: genreStyle.color, borderColor: genreStyle.border }}
          >
            {room.genre}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h3 className="font-semibold text-text-primary group-hover:text-accent-cyan transition-colors leading-snug">
          {room.name}
        </h3>

        {/* Now playing */}
        {room.current_video_title ? (
          <p className="text-xs text-accent-cyan truncate flex items-center gap-1">
            <Music size={10} className="shrink-0" />
            {room.current_video_title}
          </p>
        ) : room.description ? (
          <p className="text-xs text-text-muted truncate">{room.description}</p>
        ) : null}

        {/* DJ row */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
          {room.dj_profile ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={djAvatarUrl(room.dj_profile)}
                alt={djName ?? 'DJ'}
                width={20}
                height={20}
                className="rounded pixel-image shrink-0"
              />
              <span className="text-xs text-text-secondary truncate">
                <span className="text-text-muted">DJ: </span>
                {djName}
              </span>
            </>
          ) : (
            <span className="text-xs text-text-muted italic">No DJ — grab the booth!</span>
          )}

          <div className="flex items-center gap-1 ml-auto text-xs text-text-muted shrink-0">
            <Users size={11} />
            <span>{room.listener_count}</span>
          </div>
        </div>
      </div>

      {/* Empty room CTA overlay */}
      {isEmpty && (
        <div className="px-4 pb-3">
          <div className="w-full text-center py-1.5 rounded-lg text-xs font-semibold text-accent-purple border border-accent-purple/30 bg-accent-purple/5 group-hover:bg-accent-purple/10 transition-colors">
            Start the party →
          </div>
        </div>
      )}
    </Link>

    {/* Admin delete button — outside the Link to avoid nested interactive */}
    {isAdmin && (
      <button
        onClick={(e) => { e.preventDefault(); onDelete(room.id) }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-accent-red/20 text-accent-red border border-accent-red/40 hover:bg-accent-red/30 transition-colors opacity-0 group-hover:opacity-100"
        title="Admin: delete room"
      >
        <Trash2 size={13} />
      </button>
    )}
  </div>
  )
}

// ─── Lobby Client ─────────────────────────────────────────────────────────────

interface LobbyClientProps {
  initialRooms: RoomWithDJ[]
  isLoggedIn: boolean
  isAdmin: boolean
}

export default function LobbyClient({ initialRooms, isLoggedIn, isAdmin }: LobbyClientProps) {
  const [rooms, setRooms] = useState<RoomWithDJ[]>(initialRooms)
  const supabase = createClient()

  async function handleAdminDelete(id: string) {
    if (!confirm('Delete this room? Cannot be undone.')) return
    await supabase.from('rooms').delete().eq('id', id)
    setRooms((prev) => prev.filter((r) => r.id !== id))
  }

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('lobby:rooms')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rooms' },
        async (payload) => {
          const room = await fetchRoomWithDJ(supabase, (payload.new as { id: string }).id)
          if (room?.is_active) {
            setRooms((prev) => [...prev, room])
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms' },
        async (payload) => {
          const updated = payload.new as { id: string; is_active: boolean }
          if (!updated.is_active) {
            setRooms((prev) => prev.filter((r) => r.id !== updated.id))
            return
          }
          const room = await fetchRoomWithDJ(supabase, updated.id)
          if (room) {
            setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)))
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'rooms' },
        (payload) => {
          setRooms((prev) => prev.filter((r) => r.id !== (payload.old as { id: string }).id))
        },
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [supabase])

  // ── Sort: active/playing first (by listeners desc), then empty ─────────────
  const sorted = [...rooms].sort((a, b) => {
    const aPlaying = !!a.current_video_id
    const bPlaying = !!b.current_video_id
    if (aPlaying !== bPlaying) return aPlaying ? -1 : 1
    return b.listener_count - a.listener_count
  })

  const activeCount = rooms.filter((r) => r.listener_count > 0).length

  return (
    <>
      {/* Pulse keyframe — injected once */}
      <style>{`
        @keyframes lobbyCardPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.15), 0 0 40px rgba(6,182,212,0.05); }
          50%       { box-shadow: 0 0 30px rgba(124,58,237,0.3),  0 0 60px rgba(6,182,212,0.1);  }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Live Rooms</h2>
          <p className="text-sm text-text-muted mt-0.5">
            {activeCount > 0 ? (
              <>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse mr-1.5 align-middle" />
                {activeCount} room{activeCount !== 1 ? 's' : ''} with listeners
              </>
            ) : (
              `${rooms.length} room${rooms.length !== 1 ? 's' : ''} — be the first to join!`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-2 text-accent-purple border border-accent-purple/40 text-sm font-semibold rounded-lg hover:bg-accent-purple/10 transition-colors"
            >
              <ShieldCheck size={14} />
              Admin
            </Link>
          )}
          {isLoggedIn ? (
            <Link
              href="/rooms/create"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              New Room
            </Link>
          ) : (
            <Link
              href="/signup"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Sign Up to DJ
            </Link>
          )}
        </div>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Radio size={48} className="text-text-muted" />
          <h3 className="text-lg font-semibold text-text-secondary">No rooms yet</h3>
          <p className="text-text-muted text-sm max-w-xs">
            Be the first to spin! Create a room and invite your friends.
          </p>
          <Link
            href={isLoggedIn ? '/rooms/create' : '/signup'}
            className="mt-2 px-6 py-2.5 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            {isLoggedIn ? 'Create First Room' : 'Sign Up to Start'}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((room) => (
            <RoomCard key={room.id} room={room} isAdmin={isAdmin} onDelete={handleAdminDelete} />
          ))}
        </div>
      )}
    </>
  )
}
