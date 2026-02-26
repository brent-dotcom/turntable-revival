'use client'

import { useEffect, useRef, useCallback } from 'react'

interface YouTubePlayerProps {
  videoId: string
  startSeconds: number
  onEnded?: () => void
  onReady?: () => void
  onPlayerReady?: (player: YT.Player) => void
  muted?: boolean
}

declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
    _ytApiLoading?: boolean
    _ytApiReady?: boolean
    _ytApiCallbacks?: (() => void)[]
  }
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window._ytApiReady) return resolve()

    if (!window._ytApiCallbacks) window._ytApiCallbacks = []
    window._ytApiCallbacks.push(resolve)

    if (!window._ytApiLoading) {
      window._ytApiLoading = true
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)

      window.onYouTubeIframeAPIReady = () => {
        window._ytApiReady = true
        window._ytApiCallbacks?.forEach((cb) => cb())
        window._ytApiCallbacks = []
      }
    }
  })
}

export default function YouTubePlayer({
  videoId,
  startSeconds,
  onEnded,
  onReady,
  onPlayerReady,
  muted = false,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const onEndedRef = useRef(onEnded)
  const onReadyRef = useRef(onReady)
  const onPlayerReadyRef = useRef(onPlayerReady)
  // Capture startSeconds only once — changing it must not recreate the player
  const startSecondsRef = useRef(startSeconds)

  useEffect(() => { onEndedRef.current = onEnded }, [onEnded])
  useEffect(() => { onReadyRef.current = onReady }, [onReady])
  useEffect(() => { onPlayerReadyRef.current = onPlayerReady }, [onPlayerReady])

  const createPlayer = useCallback(async () => {
    await loadYouTubeAPI()
    if (!containerRef.current) return

    // Destroy existing player
    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }

    const div = document.createElement('div')
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(div)

    playerRef.current = new window.YT.Player(div, {
      width: '100%',
      height: '100%',
      videoId,
      playerVars: {
        autoplay: 1,
        start: Math.floor(startSecondsRef.current),
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        mute: muted ? 1 : 0,
        playsinline: 1,
        origin: process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin,
      },
      events: {
        onReady: (event) => {
          if (!muted) event.target.unMute()
          event.target.setVolume(80)
          event.target.playVideo()
          onReadyRef.current?.()
          onPlayerReadyRef.current?.(event.target)
        },
        onStateChange: (event) => {
          console.log('[YT] stateChange:', event.data)
          if (event.data === window.YT.PlayerState.ENDED) {
            console.log('[YT] ENDED — calling onEnded')
            onEndedRef.current?.()
          }
        },
        onError: (event) => {
          console.error('YouTube player error:', event.data)
          // On error, call onEnded to advance queue
          if ([2, 5, 100, 101, 150].includes(event.data)) {
            onEndedRef.current?.()
          }
        },
      },
    })
  }, [videoId, muted])

  useEffect(() => {
    createPlayer()
    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [createPlayer])

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
