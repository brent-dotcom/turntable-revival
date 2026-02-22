'use client'

import { useRoom } from '@/hooks/useRoom'
import RoomHeader from '@/components/room/RoomHeader'
import DJQueue from '@/components/room/DJQueue'
import VoteBar from '@/components/room/VoteBar'
import AvatarRow from '@/components/room/AvatarRow'
import YouTubePlayer from '@/components/room/YouTubePlayer'
import SongPicker from '@/components/room/SongPicker'
import AvatarCustomizer from '@/components/avatar/AvatarCustomizer'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import type { AvatarConfig } from '@/types'
import { Disc3, Music } from 'lucide-react'
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
  const [showAvatarSetup, setShowAvatarSetup] = useState(false)
  const [joiningQueue, setJoiningQueue] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [audioOnly, setAudioOnly] = useState(false)
  const skippingRef = useRef(false)

  const isCurrentDJ = room?.current_dj_id === currentUserId
  const hasVideo = !!room?.current_video_id

  // Find the current user's profile from members
  const currentUserProfile = members.find((m) => m.user_id === currentUserId)?.profile ?? null

  // Show avatar setup on first login — only once, persisted in localStorage
  useEffect(() => {
    if (!currentUserId || !currentUserProfile || currentUserProfile.avatar_seed) return
    const key = `avatar_setup_seen_${currentUserId}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      setShowAvatarSetup(true)
    }
  }, [currentUserId, currentUserProfile])

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
    setVideoEnded(true)
    await skipSong()
    setVideoEnded(false)
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
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <RoomHeader
        room={room}
        memberCount={members.length}
        currentUserProfile={currentUserProfile}
      />

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* Left panel — video + voting */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* DJ Booth — video area with neon glow */}
          <div className="relative flex-1 min-h-0 bg-black booth-border">
            {hasVideo ? (
              <>
                {/* Keep iframe in DOM for audio — position off-screen in audio-only mode */}
                <div style={audioOnly ? {
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  top: '-9999px',
                  left: '-9999px',
                  overflow: 'hidden',
                } : { height: '100%' }}>
                  <YouTubePlayer
                    key={room.current_video_id!}
                    videoId={room.current_video_id!}
                    startSeconds={playbackElapsed}
                    onEnded={handleSongEnded}
                    muted={false}
                  />
                </div>
                {/* Audio-only now-playing display */}
                {audioOnly && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
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
                      <p className="text-accent-cyan font-semibold text-base truncate max-w-xs neon-text-cyan">
                        ♪ {room.current_video_title}
                      </p>
                      <p className="text-text-muted text-xs mt-1">Now Playing — Audio Only</p>
                    </div>
                  </div>
                )}
                {/* Audio-only toggle */}
                <button
                  onClick={() => setAudioOnly((v) => !v)}
                  className="absolute top-2 right-2 z-20 text-xs px-2 py-1 rounded-lg bg-black/60 text-text-muted hover:text-text-primary border border-white/10 transition-colors"
                >
                  {audioOnly ? '🎬 Show Video' : '🎵 Audio Only'}
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 min-h-[300px] bg-booth-glow">
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
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white font-semibold truncate flex-1 mr-4 drop-shadow">
                    ♪ {room.current_video_title}
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
            <div className="p-4 border-t border-border/50 bg-bg-secondary/40">
              <VoteBar
                counts={voteCounts}
                onVote={castVote}
                disabled={!currentUserId}
                isDJ={isCurrentDJ}
              />
            </div>
          )}

          {/* Avatar crowd row */}
          <div className="border-t border-border/50 bg-bg-secondary/20 scanlines relative">
            <AvatarRow
              members={members}
              votes={votes}
              currentVideoId={room.current_video_id}
              currentDJId={room.current_dj_id}
            />
          </div>
        </div>

        {/* Right sidebar — DJ queue */}
        <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-border/50 bg-bg-secondary/20 flex flex-col">
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
            <div className="p-4 border-t border-border/50">
              <p className="text-xs text-text-muted text-center mb-3">
                Sign in to join the queue and vote
              </p>
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="flex-1 text-center py-2 border border-border text-text-secondary text-sm rounded-xl hover:bg-bg-hover transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 text-center py-2 bg-gradient-to-r from-accent-purple to-accent-cyan text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_12px_rgba(124,58,237,0.3)]"
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

      {/* First-time avatar setup modal */}
      {currentUserId && currentUserProfile && (
        <Modal
          isOpen={showAvatarSetup}
          onClose={() => setShowAvatarSetup(false)}
          title="Set Up Your Avatar"
        >
          <div className="mb-4">
            <p className="text-sm text-text-muted">
              Welcome! Customize your avatar before joining the crowd.
            </p>
          </div>
          <AvatarCustomizer
            userId={currentUserId}
            seed={currentUserId}
            initial={{
              bgColor: currentUserProfile.avatar_bg_color || 'b6e3f4',
              accessory: currentUserProfile.avatar_accessory || 'none',
              hair: currentUserProfile.avatar_hair || 'short01',
            }}
            onSave={(_config: AvatarConfig) => setShowAvatarSetup(false)}
          />
        </Modal>
      )}
    </div>
  )
}
