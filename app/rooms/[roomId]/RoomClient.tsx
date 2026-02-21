'use client'

import { useRoom } from '@/hooks/useRoom'
import RoomHeader from '@/components/room/RoomHeader'
import DJQueue from '@/components/room/DJQueue'
import VoteBar from '@/components/room/VoteBar'
import AvatarRow from '@/components/room/AvatarRow'
import YouTubePlayer from '@/components/room/YouTubePlayer'
import SongPicker from '@/components/room/SongPicker'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import { Disc3, Music } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

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
  const [videoEnded, setVideoEnded] = useState(false)

  const isCurrentDJ = room?.current_dj_id === currentUserId
  const hasVideo = !!room?.current_video_id

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
    setVideoEnded(true)
    await skipSong()
    setVideoEnded(false)
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
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <RoomHeader room={room} memberCount={members.length} />

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Left panel — video + voting */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Video area */}
          <div className="relative flex-1 min-h-0 bg-black">
            {hasVideo ? (
              <YouTubePlayer
                key={room.current_video_id!}
                videoId={room.current_video_id!}
                startSeconds={playbackElapsed}
                onEnded={handleSongEnded}
                muted={false}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 min-h-[300px]">
                <Disc3
                  size={64}
                  className={cn(
                    'text-text-muted transition-colors',
                    currentDJProfile && 'text-accent-purple animate-spin-slow'
                  )}
                />
                {currentDJProfile ? (
                  <div className="text-center">
                    <p className="text-text-secondary text-sm">
                      {currentDJProfile.display_name || currentDJProfile.username} is picking a song...
                    </p>
                    {isCurrentDJ && (
                      <Button
                        variant="primary"
                        className="mt-3"
                        onClick={() => setShowSongPicker(true)}
                      >
                        <Music size={16} />
                        Pick a Song
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-text-secondary text-sm">No DJ spinning right now</p>
                    {currentUserId && (
                      <Button
                        variant="primary"
                        className="mt-3"
                        onClick={handleJoinQueue}
                        loading={joiningQueue}
                      >
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

            {/* Song info overlay */}
            {room.current_video_title && hasVideo && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white font-medium truncate flex-1 mr-4">
                    🎵 {room.current_video_title}
                  </p>
                  {isCurrentDJ && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowSongPicker(true)}
                        className="text-xs"
                      >
                        Change
                      </Button>
                      <Button variant="danger" size="sm" onClick={skipSong} className="text-xs">
                        Skip
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Voting section */}
          {hasVideo && (
            <div className="p-4 border-t border-border bg-bg-secondary/30">
              <VoteBar
                counts={voteCounts}
                onVote={castVote}
                disabled={!currentUserId}
                isDJ={isCurrentDJ}
              />
            </div>
          )}

          {/* Avatar row */}
          <div className="border-t border-border bg-bg-secondary/20">
            <AvatarRow
              members={members}
              votes={votes}
              currentVideoId={room.current_video_id}
              currentDJId={room.current_dj_id}
            />
          </div>
        </div>

        {/* Right sidebar — DJ queue */}
        <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-border bg-bg-secondary/20 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <DJQueue
              room={room}
              queue={queue}
              currentDJ={currentDJProfile}
              currentUserId={currentUserId}
              onJoinQueue={handleJoinQueue}
              onLeaveQueue={leaveQueue}
              onSkip={skipSong}
              isJoining={joiningQueue}
            />
          </div>

          {/* Sign-in prompt */}
          {!currentUserId && (
            <div className="p-4 border-t border-border">
              <p className="text-xs text-text-muted text-center mb-2">
                Sign in to join the queue and vote
              </p>
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="flex-1 text-center py-2 border border-border text-text-secondary text-sm rounded-lg hover:bg-bg-hover transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 text-center py-2 bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Song picker modal */}
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
    </div>
  )
}
