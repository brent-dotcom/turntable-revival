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
}

/** Hidden 1px player — keeps audio alive for all three source types */
export default function TrackPlayer({
  source,
  videoId,
  trackUrl,
  playbackElapsed,
  onEnded,
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
    return <SunoAudioPlayer key={trackUrl} audioUrl={trackUrl} onEnded={onEnded} />
  }

  return null
}

// ─── Suno audio element with autoplay + ended callback ───────────────────────

function SunoAudioPlayer({ audioUrl, onEnded }: { audioUrl: string; onEnded: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    // Attempt autoplay (may be gated by browser autoplay policy)
    el.play().catch(() => {/* blocked by browser — user interaction required */})
  }, [audioUrl])

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
