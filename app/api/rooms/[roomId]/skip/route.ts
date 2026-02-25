import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { TrackInfo } from '@/types'

const SKIP_COOLDOWN_SECONDS = 15

// POST /api/rooms/[roomId]/skip
export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const supabase = createClient()

  // Prefer Authorization header (more reliable in production API routes where
  // cookie propagation after middleware refresh can be inconsistent).
  // Fall back to cookie-based auth handled by createClient().
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  const { data: { user } } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { roomId } = params

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
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

    if (lamePercent < room.lame_threshold) {
      return NextResponse.json(
        { error: 'Only the DJ, owner, admin, or lame vote threshold can skip' },
        { status: 403 }
      )
    }
  }

  // Atomic cooldown check
  const { data: claimed } = await supabase
    .from('rooms')
    .update({ last_skipped_at: new Date().toISOString() })
    .eq('id', roomId)
    .or(`last_skipped_at.is.null,last_skipped_at.lt.${new Date(Date.now() - SKIP_COOLDOWN_SECONDS * 1000).toISOString()}`)
    .select('id')
    .single()

  if (!claimed) {
    return NextResponse.json({ error: 'Skip cooldown active' }, { status: 429 })
  }

  // Check if the current DJ has more songs in their queue
  if (room.current_dj_id && room.active_dj_spot) {
    const { data: djEntry } = await supabase
      .from('dj_queue')
      .select('id, songs')
      .eq('room_id', roomId)
      .eq('user_id', room.current_dj_id)
      .single()

    if (djEntry && Array.isArray(djEntry.songs) && djEntry.songs.length > 0) {
      // Pop the first song and play it
      const [nextTrack, ...remaining] = djEntry.songs as TrackInfo[]

      // Update the DJ's songs array
      await supabase
        .from('dj_queue')
        .update({ songs: remaining })
        .eq('id', djEntry.id)

      if (nextTrack) {
        // Play the next song in this DJ's queue
        await supabase
          .from('rooms')
          .update({
            current_video_id: nextTrack.videoId ?? null,
            current_video_title: nextTrack.title,
            current_video_thumbnail: nextTrack.thumbnail ?? null,
            current_track_source: nextTrack.source,
            current_track_url: nextTrack.trackUrl,
            video_started_at: new Date().toISOString(),
          })
          .eq('id', roomId)

        // Log to song_history
        await supabase.from('song_history').insert({
          room_id: roomId,
          played_by_user_id: room.current_dj_id,
          track_url: nextTrack.trackUrl,
          track_title: nextTrack.title,
          track_source: nextTrack.source,
        })

        return NextResponse.json({ ok: true, action: 'next_song' })
      }
      // Remaining is empty — fall through to rotation below
    }
  }

  // No more songs for this DJ — rotate to the next occupied spot.
  // Clear all video/track fields first so hasVideo resets to false for the
  // incoming DJ. advance_dj_queue pre-dates these columns so it won't clear them.
  await supabase
    .from('rooms')
    .update({
      current_video_id: null,
      current_video_title: null,
      current_video_thumbnail: null,
      video_started_at: null,
      current_track_url: null,
      current_track_source: null,
    })
    .eq('id', roomId)

  const { error: advanceError } = await supabase.rpc('advance_dj_queue', {
    p_room_id: roomId,
  })

  if (advanceError) {
    return NextResponse.json({ error: advanceError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, action: 'advance_queue' })
}
