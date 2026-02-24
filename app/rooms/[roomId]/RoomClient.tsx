'use client'

import { useRoom } from '@/hooks/useRoom'
import MusicRoom from '@/components/room/MusicRoom'
import SongPicker from '@/components/room/SongPicker'
import Modal from '@/components/ui/Modal'
import type { User } from '@supabase/supabase-js'
import { Disc3 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

interface RoomClientProps {
  roomId: string
  initialUser: User | null
}

export default function RoomClient({ roomId, initialUser }: RoomClientProps) {
  const {
    room,
    members,
    queue,
    votes,
    currentDJProfile,
    voteCounts,
    isLoading,
    error,
    currentUserId,
    playbackElapsed,
    joinQueue,
    leaveQueue,
    playSong,
    skipSong,
    castVote,
  } = useRoom(roomId)

  const [showSongPicker, setShowSongPicker] = useState(false)
  const [joiningQueue, setJoiningQueue] = useState(false)
  const skippingRef = useRef(false)

  const isCurrentDJ = room?.current_dj_id === currentUserId
  const hasVideo = !!room?.current_video_id
  const currentUserProfile = members.find((m) => m.user_id === currentUserId)?.profile ?? null

  // Prompt DJ to pick a song when they're up but no video is playing
  useEffect(() => {
    if (isCurrentDJ && !hasVideo) {
      setShowSongPicker(true)
    }
  }, [isCurrentDJ, hasVideo])

  async function handleJoinQueue() {
    setJoiningQueue(true)
    await joinQueue()
    setJoiningQueue(false)
  }

  async function handleSongEnded() {
    if (skippingRef.current) return
    skippingRef.current = true
    await skipSong()
    setTimeout(() => { skippingRef.current = false }, 10_000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Disc3 size={40} className="text-accent-purple animate-spin-slow" />
          <p className="text-text-muted text-sm">Loading room...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <p className="text-accent-red mb-4">{error || 'Room not found'}</p>
          <Link href="/rooms" className="text-accent-cyan hover:underline text-sm">
            ← Back to rooms
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <MusicRoom
        room={room}
        members={members}
        queue={queue}
        votes={votes}
        currentDJProfile={currentDJProfile}
        voteCounts={voteCounts}
        currentUserId={currentUserId}
        currentUserProfile={currentUserProfile}
        playbackElapsed={playbackElapsed}
        hasVideo={hasVideo}
        isCurrentDJ={isCurrentDJ}
        joiningQueue={joiningQueue}
        onJoinQueue={handleJoinQueue}
        onLeaveQueue={leaveQueue}
        onPickSong={() => setShowSongPicker(true)}
        onSkip={skipSong}
        onEnded={handleSongEnded}
        onVote={castVote}
      />

      <Modal
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        title="Pick a Song"
      >
        <SongPicker
          onPlay={async (video) => {
            await playSong(video)
            setShowSongPicker(false)
          }}
          onCancel={() => setShowSongPicker(false)}
        />
      </Modal>
    </>
  )
}
