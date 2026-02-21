'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/utils'
import type { YouTubeVideoInfo } from '@/types'
import { Music, Search, X } from 'lucide-react'
import Image from 'next/image'

interface SongPickerProps {
  onPlay: (video: YouTubeVideoInfo) => void
  onCancel?: () => void
}

export default function SongPicker({ onPlay, onCancel }: SongPickerProps) {
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState<YouTubeVideoInfo | null>(null)
  const [error, setError] = useState('')

  function handleLookup() {
    setError('')
    const id = extractYouTubeId(input.trim())
    if (!id) {
      setError('Enter a valid YouTube URL or video ID (e.g. dQw4w9WgXcQ)')
      return
    }
    setPreview({
      videoId: id,
      title: 'Loading title…',
      thumbnail: getYouTubeThumbnail(id),
    })
  }

  function handlePlay() {
    if (!preview) return
    onPlay(preview)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-text-secondary">
          Paste a YouTube URL or video ID to queue your song.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="youtube.com/watch?v=... or video ID"
          error={error}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          className="flex-1"
        />
        <Button variant="secondary" onClick={handleLookup} className="flex-shrink-0">
          <Search size={16} />
        </Button>
      </div>

      {preview && (
        <div className="flex gap-3 p-3 bg-bg-secondary rounded-xl border border-border animate-fade-in">
          <div className="relative w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-bg-card">
            <Image
              src={preview.thumbnail}
              alt="Video thumbnail"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={preview.title}
              onChange={(e) =>
                setPreview((p) => p ? { ...p, title: e.target.value } : null)
              }
              placeholder="Song title (optional)"
              className="text-sm py-1"
            />
            <p className="text-xs text-text-muted mt-1 font-mono">ID: {preview.videoId}</p>
          </div>
          <button
            onClick={() => setPreview(null)}
            className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={handlePlay}
          disabled={!preview}
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
