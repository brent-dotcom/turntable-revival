'use client'

import { useEffect, useRef, useState } from 'react'
import Avatar, { seedToColor } from '@/components/avatar/Avatar'
import { cn } from '@/lib/utils'
import type { Profile, RoomMember, Vote, VoteType } from '@/types'

interface DanceFloorProps {
  members: (RoomMember & { profile: Profile })[]
  votes: Vote[]
  currentVideoId: string | null
  currentDJId: string | null
  hasVideo: boolean
}

export default function DanceFloor({
  members,
  votes,
  currentVideoId,
  currentDJId,
  hasVideo,
}: DanceFloorProps) {
  const [bouncingUsers, setBouncingUsers] = useState<Set<string>>(new Set())
  const [shakingUsers, setShakingUsers] = useState<Set<string>>(new Set())
  const prevVotesRef = useRef<Vote[]>([])

  useEffect(() => {
    const prevIds = new Set(prevVotesRef.current.map((v) => v.id))
    const newVotes = votes.filter((v) => !prevIds.has(v.id))

    newVotes.forEach((vote) => {
      if (vote.vote_type === 'awesome') {
        setBouncingUsers((prev) => new Set([...prev, vote.user_id]))
        setTimeout(() => {
          setBouncingUsers((prev) => {
            const next = new Set(prev)
            next.delete(vote.user_id)
            return next
          })
        }, 700)
      } else if (vote.vote_type === 'lame') {
        setShakingUsers((prev) => new Set([...prev, vote.user_id]))
        setTimeout(() => {
          setShakingUsers((prev) => {
            const next = new Set(prev)
            next.delete(vote.user_id)
            return next
          })
        }, 600)
      }
    })

    prevVotesRef.current = votes
  }, [votes])

  const userVoteMap = new Map<string, VoteType>()
  if (currentVideoId) {
    votes
      .filter((v) => v.video_id === currentVideoId)
      .forEach((v) => userVoteMap.set(v.user_id, v.vote_type))
  }

  if (members.length === 0) {
    return (
      <div className="disco-floor relative min-h-[100px] flex items-center justify-center">
        <p className="text-text-muted/40 text-xs">No audience yet</p>
      </div>
    )
  }

  return (
    <div className="disco-floor relative min-h-[160px] scanlines">
      <div className="flex flex-wrap justify-center gap-4 px-6 py-5">
        {members.map((member, index) => {
          const vote = userVoteMap.get(member.user_id)
          const isBouncing = bouncingUsers.has(member.user_id)
          const isShaking = shakingUsers.has(member.user_id)
          const profile = member.profile

          // Deterministic idle dance timing per avatar index
          const dur = 1.1 + (index % 5) * 0.1
          const delay = (index * 137) % 600

          return (
            <div
              key={member.id}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              {/* Vote badge above avatar */}
              <div className="h-5 flex items-center justify-center">
                {vote && (
                  <span className={cn(
                    'text-xs font-bold rounded px-1',
                    vote === 'awesome' ? 'text-accent-green' : 'text-accent-red'
                  )}>
                    {vote === 'awesome' ? '▲' : '▼'}
                  </span>
                )}
              </div>
              <div
                style={
                  hasVideo && !isBouncing && !isShaking
                    ? {
                        animation: `idleDance ${dur}s ease-in-out infinite`,
                        animationDelay: `${delay}ms`,
                      }
                    : undefined
                }
              >
                <Avatar
                  seed={profile.avatar_seed || profile.username}
                  bgColor={profile.avatar_seed ? profile.avatar_bg_color : seedToColor(profile.username)}
                  accessory={profile.avatar_accessory || 'none'}
                  hair={profile.avatar_hair || 'short01'}
                  size="sm"
                  bouncing={isBouncing}
                  shaking={isShaking}
                  label={profile.display_name || profile.username}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
