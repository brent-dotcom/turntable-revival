'use client'

import Avatar from '@/components/avatar/Avatar'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { DJQueueEntry, Profile, Room } from '@/types'
import { Crown, Mic2, Music } from 'lucide-react'

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <Music size={14} />
          DJ Queue
        </h3>
        {queue.length > 0 && (
          <span className="text-xs text-text-muted bg-bg-secondary px-2 py-0.5 rounded-full">
            {queue.length} waiting
          </span>
        )}
      </div>

      {/* Current DJ */}
      {currentDJ && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-purple/10 border border-accent-purple/30">
          <div className="relative">
            <Avatar
              type={currentDJ.avatar_type}
              color={currentDJ.avatar_color}
              accessory={currentDJ.avatar_accessory}
              size="sm"
            />
            <Crown
              size={12}
              className="absolute -top-1.5 -right-1.5 text-accent-yellow fill-accent-yellow"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {currentDJ.display_name || currentDJ.username}
            </p>
            <p className="text-xs text-accent-purple">Now DJing</p>
          </div>
          {isCurrentDJ && (
            <Button variant="danger" size="sm" onClick={onSkip}>
              Skip
            </Button>
          )}
        </div>
      )}

      {!currentDJ && (
        <div className="flex items-center justify-center p-4 rounded-xl border border-dashed border-border text-text-muted text-sm">
          No DJ — be the first!
        </div>
      )}

      {/* Queue list */}
      {queue.length > 0 && (
        <div className="flex flex-col gap-2">
          {queue.map((entry, idx) => (
            <div
              key={entry.id}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg',
                entry.user_id === currentUserId
                  ? 'bg-accent-cyan/10 border border-accent-cyan/20'
                  : 'bg-bg-secondary'
              )}
            >
              <span className="text-xs text-text-muted w-5 text-center font-mono">
                {idx + 1}
              </span>
              <Avatar
                type={entry.profile.avatar_type}
                color={entry.profile.avatar_color}
                accessory={entry.profile.avatar_accessory}
                size="xs"
              />
              <span className="flex-1 text-sm text-text-primary truncate">
                {entry.profile.display_name || entry.profile.username}
              </span>
              {entry.user_id === currentUserId && (
                <span className="text-xs text-accent-cyan">You</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Queue action */}
      {currentUserId && (
        <div className="flex flex-col gap-2">
          {isCurrentDJ ? (
            <p className="text-xs text-center text-text-muted py-1">
              You&apos;re DJing! Pick a song above.
            </p>
          ) : userInQueue ? (
            <>
              <p className="text-xs text-center text-accent-cyan">
                You&apos;re #{userPosition + 1} in queue
              </p>
              <Button variant="ghost" size="sm" onClick={onLeaveQueue}>
                Leave Queue
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={onJoinQueue}
              loading={isJoining}
              className="w-full"
            >
              <Mic2 size={14} />
              Join DJ Queue
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
