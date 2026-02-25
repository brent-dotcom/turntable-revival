export type TrackSource = 'youtube' | 'soundcloud' | 'suno' | 'unknown'

export interface TrackSourceResult {
  type: TrackSource
  id: string
  url: string
}

/** Detect track source type and extract relevant ID from a URL */
export function detectTrackSource(input: string): TrackSourceResult {
  const url = input.trim()

  // YouTube: watch, youtu.be, shorts
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) return { type: 'youtube', id: ytMatch[1], url }

  // YouTube: bare video ID (11 chars, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return { type: 'youtube', id: url, url: `https://www.youtube.com/watch?v=${url}` }
  }

  // SoundCloud: full URLs (soundcloud.com/artist/track) or shortened (on.soundcloud.com/id)
  if (/(?:on\.soundcloud\.com\/[^/\s]+|soundcloud\.com\/[^/\s]+\/[^/\s]+)/.test(url)) {
    return { type: 'soundcloud', id: url, url }
  }

  // Suno: full song UUID, short /s/ links, or suno.ai variants
  if (/suno\.(?:com|ai)\/(song\/[0-9a-f-]{36}|s\/[a-zA-Z0-9]+)/.test(url)) {
    const uuidMatch = url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
    return { type: 'suno', id: uuidMatch?.[1] ?? url, url }
  }

  return { type: 'unknown', id: '', url }
}

export interface SourceBadge {
  emoji: string
  label: string
}

export function getSourceBadge(source: TrackSource): SourceBadge {
  switch (source) {
    case 'youtube':    return { emoji: '🎵', label: 'YouTube' }
    case 'soundcloud': return { emoji: '☁️', label: 'SoundCloud' }
    case 'suno':       return { emoji: '🤖', label: 'Suno' }
    default:           return { emoji: '❓', label: 'Unknown' }
  }
}

/** Build the SoundCloud widget embed URL from a track page URL */
export function buildSoundCloudEmbedUrl(trackUrl: string): string {
  const encoded = encodeURIComponent(trackUrl)
  return `https://w.soundcloud.com/player/?url=${encoded}&auto_play=true&show_artwork=false&visual=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`
}
