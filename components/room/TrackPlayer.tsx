'use client'

import { useEffect, useRef } from 'react'
import YouTubePlayer from '@/components/room/YouTubePlayer'
import { buildSoundCloudEmbedUrl } from '@/lib/track-utils'
import type { TrackSource } from '@/types'

interface TrackPlayerProps {
  source: TrackSource
  /** YouTube video ID */
  videoId?: string
  /** SoundCloud page URL or Suno CDN audio URL */
  trackUrl: string
  playbackElapsed: number
  onEnded: () => void
  onPlayerReady?: (player: YT.Player) => void
  onEmbedError?: () => void
  /** Called when the YT player transitions to PLAYING (used to auto-dismiss mobile overlay) */
  onPlaying?: () => void
  /** Flips to true when the user taps the mobile audio-unlock overlay */
  audioUnlocked?: boolean
}

/** Hidden 1px player — keeps audio alive for all three source types */
export default function TrackPlayer({
  source,
  videoId,
  trackUrl,
  playbackElapsed,
  onEnded,
  onPlayerReady,
  onEmbedError,
  onPlaying,
  audioUnlocked,
}: TrackPlayerProps) {
  const hiddenStyle: React.CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  }

  if (source === 'youtube' && videoId) {
    return (
      <div style={hiddenStyle}>
        <YouTubePlayer
          key={videoId}
          videoId={videoId}
          startSeconds={playbackElapsed}
          onEnded={onEnded}
          onPlayerReady={onPlayerReady}
          onEmbedError={onEmbedError}
          onPlaying={onPlaying}
          muted={false}
        />
      </div>
    )
  }

  if (source === 'soundcloud' && trackUrl) {
    return (
      <div style={hiddenStyle}>
        <iframe
          key={trackUrl}
          src={buildSoundCloudEmbedUrl(trackUrl)}
          width="100%"
          height="100%"
          allow="autoplay"
          title="SoundCloud player"
          style={{ border: 'none' }}
        />
      </div>
    )
  }

  if (source === 'suno' && trackUrl) {
    return <SunoAudioPlayer key={trackUrl} audioUrl={trackUrl} onEnded={onEnded} audioUnlocked={audioUnlocked} />
  }

  return null
}

// ─── Suno audio element with autoplay + ended callback ───────────────────────

function SunoAudioPlayer({
  audioUrl,
  onEnded,
  audioUnlocked,
}: {
  audioUrl: string
  onEnded: () => void
  audioUnlocked?: boolean
}) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    // Attempt autoplay (may be gated by browser autoplay policy on mobile)
    el.play().catch(() => {/* blocked — will retry when audioUnlocked flips */})
  }, [audioUrl])

  // Retry play after the user taps the mobile audio-unlock overlay
  useEffect(() => {
    if (!audioUnlocked) return
    audioRef.current?.play().catch(() => {})
  }, [audioUnlocked])

  return (
    <audio
      ref={audioRef}
      src={audioUrl}
      autoPlay
      onEnded={onEnded}
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
    />
  )
}
