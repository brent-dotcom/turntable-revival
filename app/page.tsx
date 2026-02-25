import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Disc3, Music, Users, Zap, Radio, ChevronRight, LogIn } from 'lucide-react'
import { buildDiceBearUrl, seedToColor } from '@/lib/avatar'
import type { RoomWithDJ } from '@/types'

export const revalidate = 0

// ─── Shared genre colours (kept in sync with LobbyClient) ────────────────────

const GENRE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  'Electronic': { bg: 'rgba(6,182,212,0.12)',   color: '#06b6d4', border: 'rgba(6,182,212,0.35)'  },
  'Hip-Hop':    { bg: 'rgba(124,58,237,0.12)',  color: '#a78bfa', border: 'rgba(124,58,237,0.35)' },
  'Indie':      { bg: 'rgba(236,72,153,0.12)',  color: '#f472b6', border: 'rgba(236,72,153,0.35)' },
  'Rock':       { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.35)'  },
  'Pop':        { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.35)' },
  'R&B / Soul': { bg: 'rgba(249,115,22,0.12)',  color: '#fb923c', border: 'rgba(249,115,22,0.35)' },
  'Jazz':       { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.35)' },
  'Lo-Fi':      { bg: 'rgba(52,211,153,0.12)',  color: '#6ee7b7', border: 'rgba(52,211,153,0.35)' },
  'Metal':      { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: 'rgba(148,163,184,0.35)' },
  'Latin':      { bg: 'rgba(251,113,133,0.12)', color: '#fb7185', border: 'rgba(251,113,133,0.35)' },
  'Everything': { bg: 'rgba(167,139,250,0.12)', color: '#c4b5fd', border: 'rgba(167,139,250,0.35)' },
}
const DEFAULT_GENRE = { bg: 'rgba(107,104,128,0.15)', color: '#9ca3af', border: 'rgba(107,104,128,0.3)' }

function djAvatarUrl(profile: RoomWithDJ['dj_profile']): string {
  if (!profile?.username) return buildDiceBearUrl('default', 'b6e3f4', 'none', 'short01')
  return buildDiceBearUrl(
    profile.avatar_seed || profile.username,
    profile.avatar_seed ? (profile.avatar_bg_color || 'b6e3f4') : seedToColor(profile.username),
    profile.avatar_accessory || 'none',
    profile.avatar_hair || 'short01',
  )
}

// ─── Room Card (server-rendered) ─────────────────────────────────────────────

function RoomCard({ room }: { room: RoomWithDJ }) {
  const isPlaying = !!room.current_video_id
  const djName = room.dj_profile?.display_name || room.dj_profile?.username
  const genreStyle = room.genre ? (GENRE_STYLE[room.genre] ?? DEFAULT_GENRE) : null

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex flex-col bg-bg-card rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        border: `1px solid ${isPlaying ? 'rgba(124,58,237,0.5)' : 'rgba(42,40,69,1)'}`,
        boxShadow: isPlaying ? '0 0 24px rgba(124,58,237,0.18), 0 0 48px rgba(6,182,212,0.06)' : 'none',
      }}
    >
      {/* Thumbnail strip */}
      <div className="relative w-full aspect-video bg-bg-secondary overflow-hidden flex items-center justify-center">
        {room.current_video_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.current_video_thumbnail}
            alt={room.current_video_title ?? 'Now playing'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Disc3
            size={36}
            className="text-text-muted/40 group-hover:text-accent-purple transition-colors"
          />
        )}

        {isPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}

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
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <h3 className="font-semibold text-text-primary group-hover:text-accent-cyan transition-colors leading-snug">
          {room.name}
        </h3>

        {room.current_video_title ? (
          <p className="text-xs text-accent-cyan truncate flex items-center gap-1">
            <Music size={10} className="shrink-0" />
            {room.current_video_title}
          </p>
        ) : room.description ? (
          <p className="text-xs text-text-muted truncate">{room.description}</p>
        ) : null}

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
                <span className="text-text-muted">DJ: </span>{djName}
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
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch up to 6 active rooms sorted by listener count
  const { data: rawRooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_active', true)
    .order('listener_count', { ascending: false })
    .limit(6)

  // Batch-fetch DJ profiles
  const djIds = [...new Set((rawRooms ?? []).map(r => r.current_dj_id).filter(Boolean))] as string[]
  const djMap: Record<string, RoomWithDJ['dj_profile']> = {}
  if (djIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_seed, avatar_bg_color, avatar_hair, avatar_accessory')
      .in('id', djIds)
    for (const p of profiles ?? []) djMap[p.id] = p
  }

  const rooms: RoomWithDJ[] = (rawRooms ?? []).map(r => ({
    ...r,
    dj_profile: r.current_dj_id ? (djMap[r.current_dj_id] ?? null) : null,
  }))

  const liveCount = rooms.filter(r => r.listener_count > 0).length

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-bg-secondary/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Disc3 size={20} className="text-accent-purple animate-spin-slow" />
          <span
            className="font-bold text-text-primary"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.7rem' }}
          >
            Turntable Revival
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/rooms"
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Browse Rooms
          </Link>
          {user ? (
            <Link
              href="/rooms/create"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              + Create Room
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                <LogIn size={14} />
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center px-4 py-20 md:py-28 text-center">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-accent-purple/8 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-accent-cyan/6 rounded-full blur-3xl" />
          {/* Vinyl rings */}
          {[600, 500, 400, 300, 160].map((size, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border"
              style={{ width: size, height: size, opacity: 0.06 - i * 0.008 }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Disc3
              size={52}
              className="text-accent-purple"
              style={{ animation: 'spin 4s linear infinite', filter: 'drop-shadow(0 0 16px rgba(124,58,237,0.6))' }}
            />
            <div className="text-left">
              <div
                className="font-bold bg-gradient-to-r from-accent-purple via-accent-pink to-accent-cyan bg-clip-text text-transparent"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 'clamp(1.1rem, 4vw, 1.7rem)', lineHeight: 1.4 }}
              >
                Turntable
              </div>
              <div
                className="font-bold bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-pink bg-clip-text text-transparent"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 'clamp(1.1rem, 4vw, 1.7rem)', lineHeight: 1.4 }}
              >
                Revival
              </div>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-text-secondary max-w-md leading-relaxed">
            Join a room, grab the DJ booth, play YouTube tracks,
            and let the crowd vote in real-time.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2.5 justify-center">
            {[
              { icon: <Music size={13} />, text: 'YouTube Playback' },
              { icon: <Users size={13} />, text: 'Live DJ Rooms'    },
              { icon: <Zap   size={13} />, text: 'Real-time Voting' },
            ].map(({ icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-card border border-border text-sm text-text-secondary"
              >
                {icon} {text}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex gap-3 flex-wrap justify-center mt-2">
            <Link
              href="/rooms"
              className="px-8 py-3 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg text-sm"
              style={{ boxShadow: '0 4px 24px rgba(124,58,237,0.3)' }}
            >
              Browse Rooms
            </Link>
            {user ? (
              <Link
                href="/rooms/create"
                className="px-8 py-3 border border-border text-text-primary font-semibold rounded-xl hover:bg-bg-card transition-colors text-sm"
              >
                + Create Room
              </Link>
            ) : (
              <Link
                href="/signup"
                className="px-8 py-3 border border-border text-text-primary font-semibold rounded-xl hover:bg-bg-card transition-colors text-sm"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Live Rooms ──────────────────────────────────────────────────────── */}
      <section className="flex-1 px-4 md:px-8 pb-16 max-w-6xl mx-auto w-full">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-text-primary">Live Right Now</h2>
            {liveCount > 0 ? (
              <span className="flex items-center gap-1.5 text-xs text-accent-green">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                {liveCount} active
              </span>
            ) : (
              <span className="text-xs text-text-muted">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <Link
            href="/rooms"
            className="flex items-center gap-1 text-sm text-accent-cyan hover:underline"
          >
            See all rooms <ChevronRight size={14} />
          </Link>
        </div>

        {rooms.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <Radio size={44} className="text-text-muted/50" />
            <h3 className="text-base font-semibold text-text-secondary">No rooms live yet</h3>
            <p className="text-sm text-text-muted max-w-xs">
              Be the first to spin! Create a room and invite your friends.
            </p>
            <Link
              href={user ? '/rooms/create' : '/signup'}
              className="mt-2 px-6 py-2.5 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              {user ? 'Create the First Room' : 'Sign Up to Start'}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map(room => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}

        {rooms.length > 0 && (
          <div className="flex justify-center mt-8">
            <Link
              href="/rooms"
              className="flex items-center gap-2 px-6 py-2.5 border border-border text-text-secondary text-sm rounded-xl hover:border-accent-purple/50 hover:text-text-primary transition-all"
            >
              View all rooms <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
