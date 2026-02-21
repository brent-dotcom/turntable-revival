// ============================================================
// Database Types
// ============================================================

export type AvatarType = 'human' | 'robot' | 'cat' | 'alien'
export type AvatarAccessory = 'none' | 'headphones' | 'hat' | 'glasses'
export type VoteType = 'awesome' | 'lame'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_type: AvatarType
  avatar_color: string
  avatar_accessory: AvatarAccessory
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  name: string
  slug: string
  description: string | null
  created_by: string | null
  current_dj_id: string | null
  current_video_id: string | null
  current_video_title: string | null
  current_video_thumbnail: string | null
  video_started_at: string | null
  lame_threshold: number
  is_active: boolean
  listener_count: number
  created_at: string
  updated_at: string
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
// YouTube Types
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
  // Computed elapsed seconds since video_started_at
  elapsedSeconds: number
}

// ============================================================
// Avatar Config
// ============================================================

export interface AvatarConfig {
  type: AvatarType
  color: string
  accessory: AvatarAccessory
}

export const AVATAR_TYPES: { value: AvatarType; label: string; emoji: string }[] = [
  { value: 'human', label: 'Human', emoji: '🧑' },
  { value: 'robot', label: 'Robot', emoji: '🤖' },
  { value: 'cat', label: 'Cat', emoji: '🐱' },
  { value: 'alien', label: 'Alien', emoji: '👽' },
]

export const AVATAR_ACCESSORIES: { value: AvatarAccessory; label: string; emoji: string }[] = [
  { value: 'none', label: 'None', emoji: '—' },
  { value: 'headphones', label: 'Headphones', emoji: '🎧' },
  { value: 'hat', label: 'Hat', emoji: '🎩' },
  { value: 'glasses', label: 'Glasses', emoji: '👓' },
]

export const AVATAR_COLORS = [
  '#7c3aed', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#f97316', // orange
  '#3b82f6', // blue
  '#84cc16', // lime
  '#ffffff', // white
]
