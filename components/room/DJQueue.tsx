'use client'

import Avatar, { seedToColor } from '@/components/avatar/Avatar'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { DJQueueEntry, Profile, Room } from '@/types'
import { Crown, Mic2, Music2 } from 'lucide-react'

interface DJQueueProps {
  room: Room
  queue: (DJQueueEntry & { profile: Profile })[]
  currentDJ: Profile | null
  currentUserId: string | null
  onJoinQueue: () => void
  onLeaveQueue: () => void
  onSkip: () => void
  isJoining?: boolean
}

export default function DJQueue({
  room,
  queue,
  currentDJ,
  currentUserId,
  onJoinQueue,
  onLeaveQueue,
  onSkip,
  isJoining,
}: DJQueueProps) {
  const userInQueue = queue.some((q) => q.user_id === currentUserId)
  const isCurrentDJ = room.current_dj_id === currentUserId
  const userPosition = queue.findIndex((q) => q.user_id === currentUserId)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
          <Music2 size={12} className="text-accent-purple" />
          DJ Queue
        </h3>
        {queue.length > 0 && (
          <span className="text-xs text-text-muted bg-bg-secondary border border-border px-2 py-0.5 rounded-full">
            {queue.length} waiting
          </span>
        )}
      </div>

      {/* Current DJ */}
      {currentDJ ? (
        <div className="relative flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-accent-purple/15 to-accent-cyan/5 border border-accent-purple/40 shadow-[0_0_20px_rgba(124,58,237,0.1)]">
          {/* Pulsing indicator */}
          <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-accent-green shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
          <div className="relative">
            <Avatar
              seed={currentDJ.avatar_seed || currentDJ.id}
              bgColor={currentDJ.avatar_seed ? currentDJ.avatar_bg_color : seedToColor(currentDJ.id)}
              accessory={currentDJ.avatar_accessory || 'none'}
              hair={currentDJ.avatar_hair || 'short01'}
              size="sm"
            />
            <Crown
              size={11}
              className="absolute -top-1.5 -right-1 text-accent-yellow fill-accent-yellow drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">
              {currentDJ.display_name || currentDJ.username}
            </p>
            <p className="text-xs text-accent-purple font-semibold">On the decks</p>
          </div>
          {isCurrentDJ && (
            <Button variant="danger" size="sm" onClick={onSkip} className="flex-shrink-0">
              Skip
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-dashed border-border text-center">
          <span className="text-2xl">🎧</span>
          <p className="text-sm text-text-muted">No DJ right now</p>
          <p className="text-xs text-text-muted opacity-60">Be the first to spin!</p>
        </div>
      )}

      {/* Queue list */}
      {queue.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Up next</p>
          {queue.map((entry, idx) => {
            const isMe = entry.user_id === currentUserId
            const profile = entry.profile
            return (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl transition-all',
                  isMe
                    ? 'bg-accent-cyan/10 border border-accent-cyan/25 shadow-[0_0_10px_rgba(6,182,212,0.08)]'
                    : 'bg-bg-secondary border border-transparent'
                )}
              >
                <span className={cn(
                  'text-xs font-mono w-5 text-center font-bold',
                  isMe ? 'text-accent-cyan' : 'text-text-muted'
                )}>
                  {idx + 1}
                </span>
                <Avatar
                  seed={profile.avatar_seed || profile.id}
                  bgColor={profile.avatar_seed ? profile.avatar_bg_color : seedToColor(profile.id)}
                  accessory={profile.avatar_accessory || 'none'}
                  hair={profile.avatar_hair || 'short01'}
                  size="xs"
                />
                <span className="flex-1 text-sm text-text-primary truncate font-medium">
                  {profile.display_name || profile.username}
                </span>
                {isMe && (
                  <span className="text-xs text-accent-cyan font-bold">You</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Action */}
      {currentUserId && (
        <div className="flex flex-col gap-2">
          {isCurrentDJ ? (
            <p className="text-xs text-center text-text-muted py-1">
              You&apos;re DJing! Pick a song above.
            </p>
          ) : userInQueue ? (
            <>
              <div className="text-center py-1">
                <p className="text-xs text-accent-cyan font-semibold">
                  You&apos;re #{userPosition + 1} in line
                </p>
                <p className="text-xs text-text-muted mt-0.5">Hang tight!</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onLeaveQueue}>
                Leave Queue
              </Button>
            </>
          ) : (
            <button
              onClick={onJoinQueue}
              disabled={isJoining}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200',
                'bg-gradient-to-r from-accent-purple to-accent-cyan text-white',
                'shadow-[0_0_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_30px_rgba(124,58,237,0.55)]',
                'hover:scale-[1.02] active:scale-98',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isJoining ? (
                <span className="opacity-70">Joining...</span>
              ) : (
                <>
                  <Mic2 size={16} />
                  Jump In Queue
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
