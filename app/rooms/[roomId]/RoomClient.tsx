'use client'

import { useRoom } from '@/hooks/useRoom'
import MusicRoom from '@/components/room/MusicRoom'
import SongPicker from '@/components/room/SongPicker'
import Modal from '@/components/ui/Modal'
import type { User } from '@supabase/supabase-js'
import { Disc3 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
    currentUserProfile,
    voteCounts,
    isLoading,
    error,
    currentUserId,
    currentUserIsOwner,
    currentUserIsAdmin,
    playbackElapsed,
    joinQueue,
    leaveQueue,
    playSong,
    skipSong,
    castVote,
    removeFromQueue,
    updateDJSongs,
    deleteRoom,
    updateRoomName,
    transferOwnership,
  } = useRoom(roomId)

  const router = useRouter()
  const [showSongPicker, setShowSongPicker] = useState(false)
  const [joiningQueue, setJoiningQueue] = useState(false)
  const skippingRef = useRef(false)

  const isCurrentDJ = room?.current_dj_id === currentUserId
  const hasVideo = !!room?.current_video_id || !!room?.current_track_url

  // The current user's queue entry (contains their songs array)
  const currentUserDJEntry = queue.find((q) => q.user_id === currentUserId) ?? null

  // Prompt the active DJ to pick a song when it's their turn and nothing is playing
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
    // Only the active DJ's client advances the queue — prevents race conditions
    // where a spectator's request wins the cooldown claim and the dj_queue UPDATE
    // silently fails RLS (auth.uid() ≠ DJ's user_id).
    if (!isCurrentDJ) return
    if (skippingRef.current) return
    skippingRef.current = true
    console.log('[AutoAdvance] Song ended — DJ client triggering skip')
    await skipSong()
    setTimeout(() => { skippingRef.current = false }, 3_000)
  }

  async function handleDeleteRoom() {
    await deleteRoom()
    router.push('/rooms')
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
        onPickSong={() => {
          if (!currentUserId) { router.push('/login'); return }
          setShowSongPicker(true)
        }}
        onSkip={skipSong}
        onEnded={handleSongEnded}
        onVote={castVote}
        currentUserDJEntry={currentUserDJEntry}
        onRemoveFromQueue={removeFromQueue}
        onUpdateDJSongs={updateDJSongs}
        onDeleteRoom={handleDeleteRoom}
        onUpdateRoomName={updateRoomName}
        onTransferOwnership={transferOwnership}
      />

      <Modal
        isOpen={showSongPicker}
        onClose={() => setShowSongPicker(false)}
        title="Pick a Song"
      >
        <SongPicker
          onPlay={async (track) => {
            await playSong(track)
            setShowSongPicker(false)
          }}
          onCancel={() => setShowSongPicker(false)}
        />
      </Modal>
    </>
  )
}
