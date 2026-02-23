'use client'

import { cn } from '@/lib/utils'
import type { Profile, Room } from '@/types'
import { buildDiceBearUrl, seedToColor } from '@/components/avatar/Avatar'
import { Disc3, User, Users } from 'lucide-react'
import Link from 'next/link'

interface RoomHeaderProps {
  room: Room
  memberCount: number
  currentUserProfile?: Profile | null
}

export default function RoomHeader({ room, memberCount, currentUserProfile }: RoomHeaderProps) {
  const isPlaying = !!room.current_video_id

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-bg-secondary/60 backdrop-blur-md">
      {/* Left: nav + room name */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/rooms"
          className="text-text-muted hover:text-text-primary transition-colors text-sm flex-shrink-0"
        >
          ← Rooms
        </Link>
        <div className="w-px h-4 bg-border flex-shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Disc3
              size={16}
              className={cn(
                'text-accent-purple flex-shrink-0',
                isPlaying && 'animate-spin-slow'
              )}
            />
            <h1 className="font-bold text-text-primary truncate">{room.name}</h1>
          </div>
          {room.current_video_title && isPlaying && (
            <p className="text-xs text-accent-cyan truncate mt-0.5 neon-text-cyan">
              ♪ {room.current_video_title}
            </p>
          )}
        </div>
      </div>

      {/* Right: members + profile */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-sm text-text-muted">
          <Users size={13} />
          <span>{memberCount}</span>
        </div>

        {currentUserProfile ? (
          <Link href="/profile" className="flex-shrink-0" title="Your profile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={buildDiceBearUrl(
                currentUserProfile.avatar_seed || currentUserProfile.username,
                currentUserProfile.avatar_seed ? currentUserProfile.avatar_bg_color : seedToColor(currentUserProfile.username),
                currentUserProfile.avatar_accessory || 'none',
                currentUserProfile.avatar_hair || 'short01'
              )}
              alt="Your avatar"
              width={30}
              height={30}
              className="rounded-lg ring-1 ring-white/20 hover:ring-accent-purple/60 transition-all"
              style={{ imageRendering: 'pixelated' }}
            />
          </Link>
        ) : (
          <Link
            href="/profile"
            className="text-text-muted hover:text-text-primary transition-colors"
            title="Profile"
          >
            <User size={16} />
          </Link>
        )}
      </div>
    </header>
  )
}
