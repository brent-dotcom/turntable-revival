import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Disc3 } from 'lucide-react'
import type { RoomWithDJ } from '@/types'
import LobbyClient from './LobbyClient'

export const revalidate = 0 // fully dynamic — realtime handled client-side

export default async function RoomsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch active rooms
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_active', true)
    .order('listener_count', { ascending: false })
    .order('created_at', { ascending: false })

  // Batch-fetch DJ profiles for rooms that have a current DJ
  const djIds = [...new Set(
    (rooms ?? []).filter(r => r.current_dj_id).map(r => r.current_dj_id as string)
  )]

  const { data: djProfiles } = djIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_seed, avatar_bg_color, avatar_hair, avatar_accessory')
        .in('id', djIds)
    : { data: [] }

  const profileMap = Object.fromEntries((djProfiles ?? []).map(p => [p.id, p]))

  const enrichedRooms: RoomWithDJ[] = (rooms ?? []).map(r => ({
    ...r,
    dj_profile: r.current_dj_id ? (profileMap[r.current_dj_id] ?? null) : null,
  }))

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2">
          <Disc3 size={24} className="text-accent-purple animate-spin-slow" />
          <span className="font-bold text-text-primary" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.75rem' }}>
            Turntable Revival
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/profile"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Profile
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <LobbyClient initialRooms={enrichedRooms} isLoggedIn={!!user} />
      </div>
    </div>
  )
}
