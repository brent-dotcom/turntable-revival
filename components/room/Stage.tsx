'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import Avatar, { seedToColor } from '@/components/avatar/Avatar'
import YouTubePlayer from '@/components/room/YouTubePlayer'
import Button from '@/components/ui/Button'
import { Disc3, Music } from 'lucide-react'
import Link from 'next/link'
import type { Profile, Room, DJQueueEntry } from '@/types'

interface StageProps {
  currentDJProfile: Profile | null
  queue: (DJQueueEntry & { profile: Profile })[]
  currentDJId: string | null
  room: Room
  hasVideo: boolean
  playbackElapsed: number
  onEnded: () => void
  isCurrentDJ: boolean
  currentUserId: string | null
  joiningQueue: boolean
  onPickSong: () => void
  onSkip: () => void
  onJoinQueue: () => void
}

const LASERS = [
  { left: '18%', dur: '5s',   from: '-35deg', to:  '-5deg', cyan: false },
  { left: '32%', dur: '7s',   from: '-20deg', to:  '12deg', cyan: true  },
  { left: '50%', dur: '6s',   from: '-18deg', to:  '18deg', cyan: false },
  { left: '68%', dur: '8s',   from:  '-8deg', to:  '20deg', cyan: true  },
  { left: '82%', dur: '5.5s', from:  '-5deg', to:  '35deg', cyan: false },
]

export default function Stage({
  currentDJProfile,
  queue,
  currentDJId,
  room,
  hasVideo,
  playbackElapsed,
  onEnded,
  isCurrentDJ,
  currentUserId,
  joiningQueue,
  onPickSong,
  onSkip,
  onJoinQueue,
}: StageProps) {
  const [audioOnly, setAudioOnly] = useState(false)

  // Build 5 podium slots: [queue[1]] [queue[0]] [active] [queue[2]] [queue[3]]
  const slots: Array<(DJQueueEntry & { profile: Profile }) | 'active' | null> = [
    queue[1] ?? null,
    queue[0] ?? null,
    'active',
    queue[2] ?? null,
    queue[3] ?? null,
  ]

  return (
    <div className="relative h-[300px] overflow-hidden bg-black booth-border stage-bg flex-shrink-0">
      {/* Laser beams (z-0) */}
      {LASERS.map((l, i) => (
        <div
          key={i}
          className={cn('laser', l.cyan && 'laser-cyan')}
          style={{
            left: l.left,
            '--laser-dur': l.dur,
            '--laser-from': l.from,
            '--laser-to': l.to,
          } as React.CSSProperties}
        />
      ))}

      {/* YouTube iframe — always rendered when there's a video (z-10) */}
      {hasVideo && (
        <div className="absolute inset-0 z-10">
          <YouTubePlayer
            key={room.current_video_id!}
            videoId={room.current_video_id!}
            startSeconds={playbackElapsed}
            onEnded={onEnded}
            muted={false}
          />
        </div>
      )}

      {/* Audio-only overlay — covers video but keeps iframe alive */}
      {hasVideo && audioOnly && (
        <div className="absolute inset-0 z-20 bg-bg-primary flex flex-col items-center justify-center gap-5 px-8">
          <div className="flex gap-1 items-end h-10">
            {[3,5,7,9,6,8,5,7,4,6].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-accent-purple to-accent-cyan rounded-full animate-pulse"
                style={{ height: `${h * 4}px`, animationDelay: `${i * 70}ms`, animationDuration: `${0.8 + i * 0.1}s` }}
              />
            ))}
          </div>
          <div className="text-center">
            <p className="text-accent-cyan font-semibold text-lg truncate max-w-xs neon-text-cyan">
              ♪ {room.current_video_title}
            </p>
            <p className="text-text-muted text-xs mt-1">Now Playing — Audio Only</p>
          </div>
        </div>
      )}

      {/* Audio-only toggle button (z-30) */}
      {hasVideo && (
        <button
          onClick={() => setAudioOnly((v) => !v)}
          className="absolute top-2 right-2 z-30 text-xs px-2 py-1 rounded-lg bg-black/60 text-text-muted hover:text-text-primary border border-white/10 transition-colors"
        >
          {audioOnly ? '🎬 Show Video' : '🎵 Audio Only'}
        </button>
      )}

      {/* No-video empty state */}
      {!hasVideo && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
          <Disc3
            size={64}
            className={cn(
              'transition-colors duration-500',
              currentDJProfile
                ? 'text-accent-purple animate-spin-slow drop-shadow-[0_0_20px_rgba(124,58,237,0.6)]'
                : 'text-text-muted'
            )}
          />
          {currentDJProfile ? (
            <div className="text-center">
              <p className="text-text-secondary text-sm">
                <span className="text-accent-cyan font-semibold">
                  {currentDJProfile.display_name || currentDJProfile.username}
                </span>{' '}
                is picking a song...
              </p>
              {isCurrentDJ && (
                <Button variant="primary" className="mt-3" onClick={onPickSong}>
                  <Music size={16} />
                  Pick a Song
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-text-secondary text-sm">No DJ spinning right now</p>
              {currentUserId && (
                <Button variant="primary" className="mt-3" onClick={onJoinQueue} loading={joiningQueue}>
                  <Music size={16} />
                  Be the DJ
                </Button>
              )}
              {!currentUserId && (
                <p className="text-text-muted text-xs mt-2">
                  <Link href="/login" className="text-accent-cyan hover:underline">Sign in</Link> to DJ
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Song info gradient bar (z-20, bottom of stage) */}
      {room.current_video_title && hasVideo && !audioOnly && (
        <div className="absolute bottom-14 left-0 right-0 z-20 p-3 bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white font-semibold truncate flex-1 mr-4 drop-shadow">
              ♪ {room.current_video_title}
            </p>
            {isCurrentDJ && (
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={onPickSong} className="text-xs">
                  Change
                </Button>
                <Button variant="danger" size="sm" onClick={onSkip} className="text-xs">
                  Skip
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Podium row — absolute bottom, z-20 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-center gap-3 px-4 pb-2">
        {slots.map((slot, i) => {
          if (slot === 'active') {
            // Active DJ center podium
            if (!currentDJProfile) {
              return (
                <div key="active" className="flex flex-col items-center gap-1">
                  <div className="podium-empty w-10 h-[52px] flex items-center justify-center text-text-muted/40 text-lg">?</div>
                </div>
              )
            }
            return (
              <div key="active" className="flex flex-col items-center gap-1 relative">
                {/* Spotlight glow beneath avatar */}
                <div className="spotlight w-20 h-7 absolute -bottom-1" />
                <span className="text-base animate-bounce-slow z-10">👑</span>
                <Avatar
                  seed={currentDJProfile.avatar_seed || currentDJProfile.username}
                  bgColor={currentDJProfile.avatar_seed ? currentDJProfile.avatar_bg_color : seedToColor(currentDJProfile.username)}
                  accessory={currentDJProfile.avatar_accessory || 'none'}
                  hair={currentDJProfile.avatar_hair || 'short01'}
                  size="lg"
                  label={currentDJProfile.display_name || currentDJProfile.username}
                />
              </div>
            )
          }

          if (!slot) {
            return (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
                <div className="podium-empty w-10 h-[52px] flex items-center justify-center text-text-muted/40 text-lg">?</div>
              </div>
            )
          }

          const p = slot.profile
          return (
            <div key={slot.id} className="flex flex-col items-center gap-1">
              <Avatar
                seed={p.avatar_seed || p.username}
                bgColor={p.avatar_seed ? p.avatar_bg_color : seedToColor(p.username)}
                accessory={p.avatar_accessory || 'none'}
                hair={p.avatar_hair || 'short01'}
                size="sm"
                label={p.display_name || p.username}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
