'use client'

import Avatar, { seedToColor } from '@/components/avatar/Avatar'
import { cn } from '@/lib/utils'
import type { Profile, RoomMember, Vote, VoteType } from '@/types'
import { useEffect, useRef, useState } from 'react'

interface AvatarRowProps {
  members: (RoomMember & { profile: Profile })[]
  votes: Vote[]
  currentVideoId: string | null
  currentDJId: string | null
}

export default function AvatarRow({
  members,
  votes,
  currentVideoId,
  currentDJId,
}: AvatarRowProps) {
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

  return (
    <div className="flex items-end justify-center gap-4 px-4 py-3 min-h-[88px] overflow-x-auto">
      {members.map((member) => {
        const vote = userVoteMap.get(member.user_id)
        const isDJ = member.user_id === currentDJId
        const isBouncing = bouncingUsers.has(member.user_id)
        const isShaking = shakingUsers.has(member.user_id)
        const profile = member.profile

        return (
          <div
            key={member.id}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            {/* Status indicator above avatar */}
            <div className="h-5 flex items-center justify-center">
              {isDJ && <span className="text-sm animate-bounce-slow">👑</span>}
              {vote && !isDJ && (
                <span className={cn(
                  'text-xs font-bold rounded px-1',
                  vote === 'awesome' ? 'text-accent-green' : 'text-accent-red'
                )}>
                  {vote === 'awesome' ? '▲' : '▼'}
                </span>
              )}
            </div>
            <Avatar
              seed={profile.avatar_seed || profile.id}
              bgColor={profile.avatar_seed ? profile.avatar_bg_color : seedToColor(profile.id)}
              accessory={profile.avatar_accessory || 'none'}
              hair={profile.avatar_hair || 'short01'}
              size="sm"
              bouncing={isBouncing}
              shaking={isShaking}
              label={profile.display_name || profile.username}
            />
          </div>
        )
      })}
    </div>
  )
}
