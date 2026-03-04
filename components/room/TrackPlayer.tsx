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
  /** Flips to true when the user taps the mobile audio-unlock overlay */
  audioUnlocked?: boolean
  /** On mobile, use a direct iframe embed instead of the YT IFrame API */
  isMobile?: boolean
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
  audioUnlocked,
  isMobile,
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
    if (isMobile) {
      // Mobile: use a direct iframe embed URL so the iframe element is created
      // synchronously within the user-gesture context (iOS Safari autoplay fix).
      // The YT IFrame API player is created in a useEffect which runs outside the
      // gesture, so autoplay would be blocked. A plain <iframe autoplay=1> is not.
      return (
        <div style={hiddenStyle}>
          <MobileYouTubePlayer
            key={videoId}
            videoId={videoId}
            startSeconds={playbackElapsed}
            onEnded={onEnded}
            onEmbedError={onEmbedError}
          />
        </div>
      )
    }
    return (
      <div style={hiddenStyle}>
        <YouTubePlayer
          key={videoId}
          videoId={videoId}
          startSeconds={playbackElapsed}
          onEnded={onEnded}
          onPlayerReady={onPlayerReady}
          onEmbedError={onEmbedError}
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

// ─── Mobile YouTube player via direct iframe embed URL ───────────────────────
// Uses a plain <iframe src="...?autoplay=1&playsinline=1"> instead of the YT
// IFrame API so that iframe creation can happen synchronously within the user's
// tap gesture (iOS Safari requires this for autoplay to work).
// Song-end detection uses YouTube's enablejsapi=1 postMessage events.

function MobileYouTubePlayer({
  videoId,
  startSeconds,
  onEnded,
  onEmbedError,
}: {
  videoId: string
  startSeconds: number
  onEnded: () => void
  onEmbedError?: () => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const onEndedRef = useRef(onEnded)
  const onEmbedErrorRef = useRef(onEmbedError)
  useEffect(() => { onEndedRef.current = onEnded }, [onEnded])
  useEffect(() => { onEmbedErrorRef.current = onEmbedError }, [onEmbedError])

  // YouTube iframes with enablejsapi=1 send postMessage events, but only after
  // the parent page sends a {"event":"listening"} handshake. State changes arrive
  // as {"event":"infoDelivery","info":{"playerState":N}} where playerState 0 = ended.
  // Errors arrive as {"event":"onError","info":code}.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!String(event.origin).includes('youtube.com')) return
      try {
        const data = JSON.parse(typeof event.data === 'string' ? event.data : '{}')
        console.log('[MobileYT] msg event=%s', data.event, data.info ?? data.info)

        // Primary format: infoDelivery (playerState 0 = ended)
        if (data.event === 'infoDelivery' && data.info?.playerState === 0) {
          console.log('[MobileYT] ENDED via infoDelivery — calling onEnded')
          onEndedRef.current?.()
        }
        // Fallback format (some player versions)
        if (data.event === 'onStateChange' && data.info === 0) {
          console.log('[MobileYT] ENDED via onStateChange — calling onEnded')
          onEndedRef.current?.()
        }
        // Embed errors
        if (data.event === 'onError') {
          const code = Number(data.info)
          console.warn('[MobileYT] error code:', code)
          if ([101, 150].includes(code)) {
            onEmbedErrorRef.current?.()
          } else {
            onEndedRef.current?.()
          }
        }
      } catch { /* non-JSON postMessage — ignore */ }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Send the "listening" handshake so YouTube starts delivering events
  function handleIframeLoad() {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'listening', id: 1 }),
      '*'
    )
  }

  const params = new URLSearchParams({
    autoplay: '1',
    playsinline: '1',
    enablejsapi: '1',
    controls: '0',
    rel: '0',
    modestbranding: '1',
    fs: '0',
    start: String(Math.floor(startSeconds)),
    origin: process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== 'undefined' ? window.location.origin : ''),
  })

  return (
    <iframe
      ref={iframeRef}
      src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
      width="1"
      height="1"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      title="YouTube player"
      style={{ border: 'none' }}
      onLoad={handleIframeLoad}
    />
  )
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
