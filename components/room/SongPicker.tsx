'use client'

import { useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { detectTrackSource, getSourceBadge } from '@/lib/track-utils'
import { getYouTubeThumbnail } from '@/lib/utils'
import type { TrackInfo } from '@/types'
import { Music, Search } from 'lucide-react'
import Image from 'next/image'

interface SongPickerProps {
  onPlay: (track: TrackInfo) => void
  onCancel?: () => void
}

interface TrackPreview {
  title: string
  thumbnail?: string
  trackUrl: string
}

export default function SongPicker({ onPlay, onCancel }: SongPickerProps) {
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<TrackPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const detected = input.trim() ? detectTrackSource(input.trim()) : null
  const badge = detected && detected.type !== 'unknown' ? getSourceBadge(detected.type) : null

  // Auto-fetch preview when URL changes (debounced)
  useEffect(() => {
    setPreview(null)
    setError('')

    if (!detected || detected.type === 'unknown') return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchPreview()
    }, 600)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input])

  async function fetchPreview() {
    if (!detected || detected.type === 'unknown') return
    setLoading(true)
    setError('')

    try {
      if (detected.type === 'youtube') {
        setPreview({
          title: 'YouTube Video',
          thumbnail: getYouTubeThumbnail(detected.id),
          trackUrl: detected.url,
        })
      } else if (detected.type === 'soundcloud') {
        const res = await fetch(
          `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(detected.url)}`
        )
        if (!res.ok) throw new Error('Could not fetch SoundCloud info')
        const data = await res.json()
        setPreview({ title: data.title ?? 'SoundCloud Track', trackUrl: detected.url })
      } else if (detected.type === 'suno') {
        const res = await fetch(`/api/suno-track?id=${detected.id}`)
        if (!res.ok) throw new Error('Could not fetch Suno track info')
        const data = await res.json()
        setPreview({ title: data.title ?? 'Suno Track', trackUrl: data.audioUrl })
      }
    } catch {
      setError('Could not load track info — check the URL and try again')
    } finally {
      setLoading(false)
    }
  }

  function handlePlay() {
    if (!detected || detected.type === 'unknown' || !preview) return
    const track: TrackInfo = {
      source: detected.type,
      videoId: detected.type === 'youtube' ? detected.id : undefined,
      trackUrl: preview.trackUrl,
      title: preview.title,
      thumbnail: preview.thumbnail,
    }
    onPlay(track)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Paste a YouTube, SoundCloud, or Suno URL to queue your song.
      </p>

      {/* URL input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="youtube.com/watch?v=…  |  soundcloud.com/…  |  suno.com/song/…"
            onKeyDown={(e) => e.key === 'Enter' && fetchPreview()}
            className="flex-1"
          />
          {/* Source badge */}
          {badge && (
            <p className="text-xs text-text-muted mt-1 ml-1">
              {badge.emoji} Detected: <span className="text-text-primary font-semibold">{badge.label}</span>
            </p>
          )}
          {detected?.type === 'unknown' && input.trim().length > 5 && (
            <p className="text-xs text-accent-red mt-1 ml-1">
              ❓ Unrecognized URL — paste a YouTube, SoundCloud, or Suno link
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          onClick={fetchPreview}
          loading={loading}
          className="flex-shrink-0"
        >
          <Search size={16} />
        </Button>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-accent-red">{error}</p>}

      {/* Preview card */}
      {preview && (
        <div className="flex gap-3 p-3 bg-bg-secondary rounded-xl border border-border animate-fade-in">
          {preview.thumbnail && (
            <div className="relative w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-bg-card">
              <Image src={preview.thumbnail} alt="Track thumbnail" fill className="object-cover" />
            </div>
          )}
          {!preview.thumbnail && badge && (
            <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-bg-card flex items-center justify-center text-2xl">
              {badge.emoji}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Input
              value={preview.title}
              onChange={(e) => setPreview((p) => p ? { ...p, title: e.target.value } : null)}
              placeholder="Track title"
              className="text-sm py-1"
            />
            <p className="text-xs text-text-muted mt-1 truncate">{detected?.url}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={handlePlay}
          disabled={!preview || loading}
          className="flex-1"
        >
          <Music size={16} />
          Play Now
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
