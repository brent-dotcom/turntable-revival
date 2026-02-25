// ============================================================
// Database Types
// ============================================================

export type AvatarType = 'human' | 'robot' | 'cat' | 'alien'
export type AvatarAccessory = 'none' | 'variant01' | 'variant02' | 'variant03' | 'variant04'
export type AvatarHair =
  | 'short01'
  | 'short02'
  | 'short03'
  | 'short04'
  | 'short05'
  | 'long01'
  | 'long02'
  | 'mohawk01'
export type VoteType = 'awesome' | 'lame'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  // Legacy fields (still in DB)
  avatar_type: AvatarType
  avatar_color: string
  // DiceBear avatar fields
  avatar_seed: string | null
  avatar_bg_color: string
  avatar_accessory: AvatarAccessory
  avatar_hair: AvatarHair
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
  current_dj_id: string | null
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
  video_id: string
  title: string
  thumbnail: string | null
  dj_id: string | null
  dj_username: string | null
  played_at: string
}

export interface RoomWithDJ extends Room {
  dj_profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_seed' | 'avatar_bg_color' | 'avatar_hair' | 'avatar_accessory'> | null
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
// Track / Multi-source Types
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

// ============================================================
// Avatar Config
// ============================================================

export interface AvatarConfig {
  bgColor: string
  accessory: AvatarAccessory
  hair: AvatarHair
}

export const AVATAR_BG_COLORS: string[] = [
  'b6e3f4', // sky blue
  'c0aede', // lavender
  'ffd5dc', // rose
  'ffdfbf', // peach
  'd1fae5', // mint
  'fef3c7', // gold
  '7c3aed', // purple (brand)
  '06b6d4', // cyan (brand)
]

export const AVATAR_ACCESSORIES: { value: AvatarAccessory; label: string; emoji: string }[] = [
  { value: 'none', label: 'None', emoji: '—' },
  { value: 'variant01', label: 'Style A', emoji: '😎' },
  { value: 'variant02', label: 'Style B', emoji: '🤓' },
  { value: 'variant03', label: 'Style C', emoji: '✨' },
  { value: 'variant04', label: 'Style D', emoji: '🌟' },
]

export const AVATAR_HAIR_STYLES: { value: AvatarHair; label: string }[] = [
  { value: 'short01', label: 'Short A' },
  { value: 'short02', label: 'Short B' },
  { value: 'short03', label: 'Short C' },
  { value: 'short04', label: 'Short D' },
  { value: 'short05', label: 'Short E' },
  { value: 'long01', label: 'Long A' },
  { value: 'long02', label: 'Long B' },
  { value: 'mohawk01', label: 'Mohawk' },
]

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
