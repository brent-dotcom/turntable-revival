'use client'

import Avatar from '@/components/avatar/Avatar'
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
  const prevVotesRef = useRef<Vote[]>([])

  // Detect new awesome votes and trigger bounce animation
  useEffect(() => {
    const prevIds = new Set(prevVotesRef.current.map((v) => v.id))
    const newVotes = votes.filter((v) => !prevIds.has(v.id))

    newVotes.forEach((vote) => {
      if (vote.vote_type === 'awesome') {
        setBouncingUsers((prev) => new Set(Array.from(prev).concat(vote.user_id)))
        setTimeout(() => {
          setBouncingUsers((prev) => {
            const next = new Set(prev)
            next.delete(vote.user_id)
            return next
          })
        }, 1000)
      }
    })

    prevVotesRef.current = votes
  }, [votes])

  // Build a map of user votes for the current video
  const userVoteMap = new Map<string, VoteType>()
  if (currentVideoId) {
    votes
      .filter((v) => v.video_id === currentVideoId)
      .forEach((v) => userVoteMap.set(v.user_id, v.vote_type))
  }

  return (
    <div className="flex items-end justify-center gap-3 px-4 py-3 min-h-[80px] overflow-x-auto">
      {members.map((member) => {
        const vote = userVoteMap.get(member.user_id)
        const isDJ = member.user_id === currentDJId
        const isBouncing = bouncingUsers.has(member.user_id)

        return (
          <div
            key={member.id}
            className={cn(
              'flex flex-col items-center gap-1 flex-shrink-0 transition-all duration-300',
              isBouncing && 'drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]'
            )}
          >
            {/* DJ crown indicator */}
            {isDJ && (
              <span className="text-xs animate-bounce-slow">👑</span>
            )}
            {/* Vote indicator */}
            {vote && !isDJ && (
              <span className="text-xs">
                {vote === 'awesome' ? '👍' : '👎'}
              </span>
            )}
            <div
              className={cn(
                'transition-transform duration-300',
                isBouncing && 'animate-bounce'
              )}
            >
              <Avatar
                type={member.profile.avatar_type}
                color={member.profile.avatar_color}
                accessory={member.profile.avatar_accessory}
                size="sm"
                label={member.profile.display_name || member.profile.username}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
