import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const SKIP_COOLDOWN_SECONDS = 15

// POST /api/rooms/[roomId]/skip
export async function POST(
  _request: Request,
  { params }: { params: { roomId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  const isDJ = room.current_dj_id === user.id

  // Non-DJs can only skip via lame vote threshold
  if (!isDJ) {
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
        { error: 'Only the DJ or lame vote threshold can skip' },
        { status: 403 }
      )
    }
  }

  // Atomic cooldown check: claim the skip slot only if cooldown has elapsed.
  // If two requests race, only one will match this WHERE clause and get a row back.
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

  // Advance the queue
  const { error: advanceError } = await supabase.rpc('advance_dj_queue', {
    p_room_id: roomId,
  })

  if (advanceError) {
    return NextResponse.json({ error: advanceError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
