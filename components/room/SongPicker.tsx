'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { detectTrackSource, getSourceBadge } from '@/lib/track-utils'
import { getYouTubeThumbnail } from '@/lib/utils'
import type { TrackInfo } from '@/types'
import { Loader2, Music, Search } from 'lucide-react'
import Image from 'next/image'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Song {
  id: string
  genre: string
  artist: string
  title: string
  duration: number   // seconds
  youtube_url: string
  play_count: number
}

// ─── Genre config ─────────────────────────────────────────────────────────────

const GENRES = ['All', 'Hip-Hop', 'Electronic', 'Lo-Fi', 'Pop', 'R&B', 'Rock', 'House', 'Classic']

const GENRE_COLORS: Record<string, { bg: string; color: string }> = {
  'Hip-Hop':    { bg: 'rgba(124,58,237,0.18)',  color: '#a78bfa' },
  'Electronic': { bg: 'rgba(6,182,212,0.18)',   color: '#06b6d4' },
  'Lo-Fi':      { bg: 'rgba(52,211,153,0.18)',  color: '#6ee7b7' },
  'Pop':        { bg: 'rgba(245,158,11,0.18)',  color: '#fbbf24' },
  'R&B':        { bg: 'rgba(249,115,22,0.18)',  color: '#fb923c' },
  'Rock':       { bg: 'rgba(239,68,68,0.18)',   color: '#f87171' },
  'House':      { bg: 'rgba(16,185,129,0.18)',  color: '#34d399' },
  'Classic':    { bg: 'rgba(148,163,184,0.18)', color: '#94a3b8' },
}
const DEFAULT_GENRE_COLOR = { bg: 'rgba(107,104,128,0.18)', color: '#9ca3af' }

function genreColor(genre: string) {
  // Fuzzy match: 'Hip Hop' → 'Hip-Hop', 'r&b' → 'R&B', etc.
  const key = Object.keys(GENRE_COLORS).find(
    (k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === genre.toLowerCase().replace(/[^a-z0-9]/g, '')
  )
  return key ? GENRE_COLORS[key] : DEFAULT_GENRE_COLOR
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SongPickerProps {
  onPlay: (track: TrackInfo) => void
  onCancel?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SongPicker({ onPlay, onCancel }: SongPickerProps) {
  const supabase = createClient()

  // Library state
  const [query, setQuery]               = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [songs, setSongs]               = useState<Song[]>([])
  const [loading, setLoading]           = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // URL-fallback state
  const [showUrl, setShowUrl]     = useState(false)
  const [urlInput, setUrlInput]   = useState('')
  const [preview, setPreview]     = useState<{ title: string; thumbnail?: string; trackUrl: string } | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError]   = useState('')

  // ── Library fetch ──────────────────────────────────────────────────────────

  async function fetchSongs(q: string, genre: string) {
    setLoading(true)
    let qb = supabase.from('songs').select('*')

    if (q.trim()) {
      qb = qb.or(
        `title.ilike.%${q.trim()}%,artist.ilike.%${q.trim()}%,genre.ilike.%${q.trim()}%`
      )
    }

    if (genre !== 'All') {
      qb = qb.ilike('genre', `%${genre}%`)
    }

    const { data } = await qb.order('play_count', { ascending: false }).limit(20)
    setSongs((data ?? []) as Song[])
    setLoading(false)
  }

  // Initial load
  useEffect(() => { fetchSongs('', 'All') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search when query or genre changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSongs(query, selectedGenre), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selectedGenre]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Select from library ────────────────────────────────────────────────────

  function handleSelectSong(song: Song) {
    const detected = detectTrackSource(song.youtube_url)
    const videoId  = detected.type === 'youtube' ? detected.id : undefined

    const track: TrackInfo = {
      source:    'youtube',
      videoId,
      trackUrl:  song.youtube_url,
      title:     `${song.artist} — ${song.title}`,
      thumbnail: videoId ? getYouTubeThumbnail(videoId) : undefined,
    }

    // Increment play count (fire-and-forget via security-definer RPC)
    supabase.rpc('increment_song_play_count', { p_song_id: song.id }).then(() => {})

    onPlay(track)
  }

  // ── URL fallback ───────────────────────────────────────────────────────────

  const detected = urlInput.trim() ? detectTrackSource(urlInput.trim()) : null
  const badge    = detected && detected.type !== 'unknown' ? getSourceBadge(detected.type) : null

  useEffect(() => {
    setPreview(null)
    setUrlError('')
    if (!detected || detected.type === 'unknown') return

    const t = setTimeout(async () => {
      setUrlLoading(true)
      try {
        if (detected.type === 'youtube') {
          setPreview({ title: 'YouTube Video', thumbnail: getYouTubeThumbnail(detected.id), trackUrl: detected.url })
        } else if (detected.type === 'soundcloud') {
          const res = await fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(detected.url)}`)
          if (!res.ok) throw new Error()
          const data = await res.json()
          setPreview({ title: data.title ?? 'SoundCloud Track', trackUrl: detected.url })
        } else if (detected.type === 'suno') {
          const res = await fetch(`/api/suno-track?url=${encodeURIComponent(detected.url)}`)
          if (!res.ok) throw new Error()
          const data = await res.json()
          setPreview({ title: data.title ?? 'Suno Track', trackUrl: data.audioUrl })
        }
      } catch {
        setUrlError('Could not load track info — check the URL and try again')
      } finally {
        setUrlLoading(false)
      }
    }, 600)

    return () => clearTimeout(t)
  }, [urlInput]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleUrlPlay() {
    if (!detected || detected.type === 'unknown' || !preview) return
    onPlay({
      source:    detected.type,
      videoId:   detected.type === 'youtube' ? detected.id : undefined,
      trackUrl:  preview.trackUrl,
      title:     preview.title,
      thumbnail: preview.thumbnail,
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, or genres..."
          autoFocus
          className="w-full pl-9 pr-9 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
        )}
      </div>

      {/* Genre filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              selectedGenre === genre
                ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                : 'bg-bg-secondary border border-border text-text-muted hover:text-text-secondary hover:border-border/80'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Results list */}
      <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto -mx-1 px-1">
        {!loading && songs.length === 0 && (
          <div className="py-10 text-center text-sm text-text-muted">No results found</div>
        )}
        {songs.map((song) => {
          const gc = genreColor(song.genre)
          return (
            <button
              key={song.id}
              onClick={() => handleSelectSong(song)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-bg-secondary border border-transparent hover:border-border/60 text-left transition-all group w-full"
            >
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide"
                style={{ background: gc.bg, color: gc.color }}
              >
                {song.genre}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate group-hover:text-neon-cyan transition-colors">
                  {song.title}
                </div>
                <div className="text-xs text-text-muted truncate">{song.artist}</div>
              </div>
              <span className="text-xs text-text-muted shrink-0 font-mono tabular-nums">
                {formatDuration(song.duration)}
              </span>
            </button>
          )
        })}
      </div>

      {/* URL fallback */}
      <div className="border-t border-border/50 pt-2">
        <button
          onClick={() => setShowUrl((v) => !v)}
          className="text-xs text-text-muted hover:text-neon-cyan transition-colors"
        >
          {showUrl ? '↑ Hide URL input' : 'Paste URL instead →'}
        </button>

        {showUrl && (
          <div className="flex flex-col gap-3 mt-3">
            <div className="flex-1">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="youtube.com/watch?v=…  |  soundcloud.com/…  |  suno.com/song/…"
              />
              {badge && (
                <p className="text-xs text-text-muted mt-1 ml-1">
                  {badge.emoji} Detected: <span className="text-text-primary font-semibold">{badge.label}</span>
                </p>
              )}
              {detected?.type === 'unknown' && urlInput.trim().length > 5 && (
                <p className="text-xs text-accent-red mt-1 ml-1">
                  ❓ Unrecognized URL — paste a YouTube, SoundCloud, or Suno link
                </p>
              )}
            </div>

            {urlError && <p className="text-xs text-accent-red">{urlError}</p>}

            {preview && (
              <div className="flex gap-3 p-3 bg-bg-secondary rounded-xl border border-border">
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

            <Button
              variant="primary"
              onClick={handleUrlPlay}
              disabled={!preview || urlLoading}
              className="w-full"
            >
              {urlLoading ? <Loader2 size={16} className="animate-spin" /> : <Music size={16} />}
              Play URL
            </Button>
          </div>
        )}
      </div>

      {onCancel && (
        <Button variant="ghost" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      )}
    </div>
  )
}
