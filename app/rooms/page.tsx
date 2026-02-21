import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Disc3, Plus, Users } from 'lucide-react'
import type { Room } from '@/types'

export const revalidate = 10

export default async function RoomsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_active', true)
    .order('listener_count', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2">
          <Disc3 size={24} className="text-accent-purple animate-spin-slow" />
          <span className="font-bold text-text-primary" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.75rem' }}>
            Turntable Revival
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/rooms/create"
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={14} />
                New Room
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">Live Rooms</h2>
          <span className="text-sm text-text-muted">
            {rooms?.length ?? 0} room{rooms?.length !== 1 ? 's' : ''}
          </span>
        </div>

        {!rooms || rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <Disc3 size={48} className="text-text-muted" />
            <h3 className="text-lg font-semibold text-text-secondary">No rooms yet</h3>
            <p className="text-text-muted text-sm max-w-xs">
              Be the first to spin! Create a room and invite your friends.
            </p>
            {user ? (
              <Link
                href="/rooms/create"
                className="mt-2 px-6 py-2.5 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
              >
                Create First Room
              </Link>
            ) : (
              <Link
                href="/signup"
                className="mt-2 px-6 py-2.5 bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
              >
                Sign Up to Start
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(rooms as Room[]).map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RoomCard({ room }: { room: Room }) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex flex-col gap-3 p-4 bg-bg-card border border-border rounded-xl hover:border-accent-purple/50 hover:bg-bg-hover transition-all duration-200"
    >
      {/* Thumbnail / vinyl */}
      <div className="relative w-full aspect-video bg-bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
        {room.current_video_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.current_video_thumbnail}
            alt={room.current_video_title ?? 'Now playing'}
            className="w-full h-full object-cover"
          />
        ) : (
          <Disc3
            size={40}
            className="text-text-muted group-hover:text-accent-purple transition-colors group-hover:animate-spin-slow"
          />
        )}
        {room.current_video_id && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-accent-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-text-primary group-hover:text-accent-cyan transition-colors">
          {room.name}
        </h3>
        {room.current_video_title && (
          <p className="text-xs text-text-muted truncate">
            🎵 {room.current_video_title}
          </p>
        )}
        {room.description && !room.current_video_title && (
          <p className="text-xs text-text-muted truncate">{room.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-text-muted">
        <Users size={12} />
        <span>{room.listener_count} listening</span>
      </div>
    </Link>
  )
}
