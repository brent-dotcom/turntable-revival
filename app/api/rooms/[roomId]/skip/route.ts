import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { TrackInfo } from '@/types'

// Cooldown only applies to crowd-vote skips to prevent multi-client races.
// The active DJ and admins/owners bypass it entirely.
const VOTE_SKIP_COOLDOWN_SECONDS = 5

// POST /api/rooms/[roomId]/skip
export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  console.log('[Skip] POST received for room', params.roomId)

  // Require Authorization header — cookie-based auth is unreliable in
  // production API routes after middleware token refresh.
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    console.log('[Skip] No token — returning 401')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create a JWT-authenticated client so all DB operations run under the
  // user's identity and RLS policies (auth.uid() IS NOT NULL) are satisfied.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.log('[Skip] getUser() returned null — returning 401')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { roomId } = params

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
    console.log('[Skip] Room not found:', roomError?.message)
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin === true
  const isDJ = room.current_dj_id === user.id
  const isOwner = room.owner_id === user.id || room.created_by === user.id

  console.log('[Skip] user:', user.id, '| isDJ:', isDJ, '| isAdmin:', isAdmin, '| isOwner:', isOwner)
  console.log('[Skip] current_video_id:', room.current_video_id, '| active_dj_spot:', room.active_dj_spot)

  // Non-DJ, non-admin, non-owner: can only skip via lame vote threshold
  if (!isDJ && !isAdmin && !isOwner) {
    const { data: votes } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('room_id', roomId)
      .eq('video_id', room.current_video_id ?? '')

    const lameCount = votes?.filter((v) => v.vote_type === 'lame').length ?? 0
    const totalVotes = votes?.length ?? 0
    const lamePercent = totalVotes > 0 ? (lameCount / totalVotes) * 100 : 0

    console.log('[Skip] lame vote check:', { lameCount, totalVotes, lamePercent, threshold: room.lame_threshold })

    if (lamePercent < room.lame_threshold) {
      return NextResponse.json(
        { error: 'Only the DJ, owner, admin, or lame vote threshold can skip' },
        { status: 403 }
      )
    }

    // Crowd-vote skip: apply cooldown to prevent multi-client race
    const { data: claimed } = await supabase
      .from('rooms')
      .update({ last_skipped_at: new Date().toISOString() })
      .eq('id', roomId)
      .or(`last_skipped_at.is.null,last_skipped_at.lt.${new Date(Date.now() - VOTE_SKIP_COOLDOWN_SECONDS * 1000).toISOString()}`)
      .select('id')
      .single()

    if (!claimed) {
      console.log('[Skip] Crowd-vote cooldown active — returning 429')
      return NextResponse.json({ error: 'Skip cooldown active' }, { status: 429 })
    }
  }

  // DJ / admin / owner: just stamp last_skipped_at (no cooldown gate)
  await supabase
    .from('rooms')
    .update({ last_skipped_at: new Date().toISOString() })
    .eq('id', roomId)

  // ── Check if the current DJ has more songs in their queue ──────────────────
  // Look up by current_dj_id directly — do NOT gate on active_dj_spot since it
  // may legitimately be null for rooms created before the column was added.
  if (room.current_dj_id) {
    const { data: djEntry } = await supabase
      .from('dj_queue')
      .select('id, songs')
      .eq('room_id', roomId)
      .eq('user_id', room.current_dj_id)
      .single()

    console.log('[Skip] djEntry songs:', JSON.stringify(djEntry?.songs ?? []))

    if (djEntry && Array.isArray(djEntry.songs) && djEntry.songs.length > 0) {
      const songs = djEntry.songs as TrackInfo[]

      // songs[0] may still be the currently-playing track when it was started via
      // SongPicker without being removed from the queue first. Detect this for
      // both YouTube (videoId) and SoundCloud/Suno (trackUrl) so we never replay
      // the current song.
      const firstSongIsCurrent =
        (songs[0]?.videoId != null && songs[0].videoId === room.current_video_id) ||
        (songs[0]?.trackUrl != null && songs[0].trackUrl === room.current_track_url)
      const skipCurrentIdx = firstSongIsCurrent ? 1 : 0

      const nextTrack = songs[skipCurrentIdx] as TrackInfo | undefined
      // Everything after nextTrack stays queued
      const newQueue = songs.slice(skipCurrentIdx + 1)

      console.log('[Skip] firstSongIsCurrent:', firstSongIsCurrent, '| nextTrack:', nextTrack?.title ?? 'none', '| newQueue length:', newQueue.length)

      if (nextTrack) {
        // Update the DJ's songs array (remove played entry + the track we're about to play)
        const { error: queueUpdateError } = await supabase
          .from('dj_queue')
          .update({ songs: newQueue })
          .eq('id', djEntry.id)

        console.log('[Skip] dj_queue update error:', queueUpdateError?.message ?? 'none')

        // Play the next song
        const { error: roomUpdateError } = await supabase
          .from('rooms')
          .update({
            current_video_id: nextTrack.videoId ?? null,
            current_video_title: nextTrack.title,
            current_video_thumbnail: nextTrack.thumbnail ?? null,
            current_track_source: nextTrack.source ?? 'youtube',
            current_track_url: nextTrack.trackUrl,
            video_started_at: new Date().toISOString(),
          })
          .eq('id', roomId)

        console.log('[Skip] rooms update error:', roomUpdateError?.message ?? 'none')

        // Log to song_history
        await supabase.from('song_history').insert({
          room_id: roomId,
          played_by_user_id: room.current_dj_id,
          track_url: nextTrack.trackUrl,
          track_title: nextTrack.title,
          track_source: nextTrack.source,
        })

        console.log('[Skip] ✓ next_song played:', nextTrack.title)
        return NextResponse.json({ ok: true, action: 'next_song', track: nextTrack.title })
      }

      // All remaining songs in queue were the current song — treat as empty
      console.log('[Skip] No non-current songs found — falling through to advance_dj_queue')
    } else {
      console.log('[Skip] DJ queue is empty — advancing to next DJ')
    }
  } else {
    console.log('[Skip] No active DJ — advancing')
  }

  // No more songs for this DJ — rotate to the next occupied spot.
  // advance_dj_queue (SECURITY DEFINER) clears all video/track fields atomically.
  const { error: advanceError } = await supabase.rpc('advance_dj_queue', {
    p_room_id: roomId,
  })

  if (advanceError) {
    console.log('[Skip] advance_dj_queue error:', advanceError.message)
    return NextResponse.json({ error: advanceError.message }, { status: 500 })
  }

  // The new DJ's own client will auto-play their first queued song via
  // the RoomClient useEffect — no server-side auto-play needed here
  // (running under the old DJ's token can't read the new DJ's dj_queue rows).
  console.log('[Skip] ✓ advance_dj_queue completed')
  return NextResponse.json({ ok: true, action: 'advance_queue' })
}
