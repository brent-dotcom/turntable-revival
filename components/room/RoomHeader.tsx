'use client'

import { cn } from '@/lib/utils'
import type { Room } from '@/types'
import { Disc3, Users } from 'lucide-react'
import Link from 'next/link'

interface RoomHeaderProps {
  room: Room
  memberCount: number
}

export default function RoomHeader({ room, memberCount }: RoomHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Link
          href="/rooms"
          className="text-text-muted hover:text-text-primary transition-colors text-sm"
        >
          ← Rooms
        </Link>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <Disc3
            size={18}
            className={cn(
              'text-accent-purple',
              room.current_video_id && 'animate-spin-slow'
            )}
          />
          <h1 className="font-semibold text-text-primary">{room.name}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Users size={14} />
        <span>{memberCount}</span>
      </div>
    </header>
  )
}
