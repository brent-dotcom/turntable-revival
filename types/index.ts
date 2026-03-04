// ============================================================
// Track / Multi-source Types (defined first — used by DJQueueEntry)
// ============================================================

export type TrackSource = 'youtube' | 'soundcloud' | 'suno'

/** Unified track info passed from SongPicker → playSong → DB */
export interface TrackInfo {
  source: TrackSource
  /** YouTube video ID (YouTube only) */
  videoId?: string
  /** SoundCloud page URL or Suno CDN audio URL */
  trackUrl: string
  title: string
  /** YouTube thumbnail URL (YouTube only) */
  thumbnail?: string
}

// ============================================================
// Database Types
// ============================================================

export type AvatarType = 'human' | 'robot' | 'cat' | 'alien'
export type VoteType = 'awesome' | 'lame'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  is_admin: boolean
  // Legacy fields (still in DB)
  avatar_type: AvatarType
  avatar_color: string
  // Avatar seed — used as Multiavatar seed
  avatar_seed: string | null
  // Kept for DB compatibility (no longer used for rendering)
  avatar_bg_color: string
  avatar_accessory: string
  avatar_hair: string
  dj_points: number
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  name: string
  slug: string
  description: string | null
  genre: string | null
  created_by: string | null
  /** Transferable ownership — may differ from created_by */
  owner_id: string | null
  current_dj_id: string | null
  /** Which podium spot (1/2/3) is currently active */
  active_dj_spot: number | null
  current_video_id: string | null
  current_video_title: string | null
  current_video_thumbnail: string | null
  video_started_at: string | null
  last_skipped_at: string | null
  /** Multi-source fields — added via migration */
  current_track_source: string | null
  current_track_url: string | null
  lame_threshold: number
  is_active: boolean
  listener_count: number
  created_at: string
  updated_at: string
}

export interface SongHistoryEntry {
  id: string
  room_id: string
  played_by_user_id: string | null
  track_url: string | null
  track_title: string | null
  track_source: string | null
  played_at: string
}

export interface RoomWithDJ extends Room {
  dj_profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_seed'> | null
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  joined_at: string
  last_seen_at: string
  // Joined
  profile?: Profile
}

export interface DJQueueEntry {
  id: string
  room_id: string
  user_id: string
  position: number
  /** Podium spot number: 1, 2, or 3 */
  spot: number
  /** Ordered array of queued TrackInfo objects (max 3) */
  songs: TrackInfo[]
  /** Timestamp of when this DJ last played a song — used for round-robin ordering */
  last_played_at: string | null
  created_at: string
  // Joined
  profile?: Profile
}

export interface Vote {
  id: string
  room_id: string
  user_id: string
  video_id: string
  vote_type: VoteType
  dj_id: string | null
  created_at: string
}

// ============================================================
// App State Types
// ============================================================

export interface RoomState {
  room: Room | null
  members: (RoomMember & { profile: Profile })[]
  queue: (DJQueueEntry & { profile: Profile })[]
  votes: Vote[]
  currentDjProfile: Profile | null
  isLoading: boolean
  error: string | null
}

export interface VoteCounts {
  awesome: number
  lame: number
  total: number
  awesomePercent: number
  lamePercent: number
  userVote: VoteType | null
}

// ============================================================
// YouTube Types (legacy, kept for reference)
// ============================================================

export interface YouTubeVideoInfo {
  videoId: string
  title: string
  thumbnail: string
  channelTitle?: string
  duration?: string
}

export interface PlaybackState {
  videoId: string | null
  startedAt: string | null
  isPlaying: boolean
  elapsedSeconds: number
}

// Legacy — kept for type compatibility
export const AVATAR_TYPES: { value: AvatarType; label: string; emoji: string }[] = [
  { value: 'human', label: 'Human', emoji: '🧑' },
  { value: 'robot', label: 'Robot', emoji: '🤖' },
  { value: 'cat', label: 'Cat', emoji: '🐱' },
  { value: 'alien', label: 'Alien', emoji: '👽' },
]

export const AVATAR_COLORS = [
  '#7c3aed', '#ec4899', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#f97316', '#3b82f6',
  '#84cc16', '#ffffff',
]
