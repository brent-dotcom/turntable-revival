import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/rooms/[roomId]/skip
// Called by the DJ manually or auto-triggered by lame vote threshold
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

  // Verify room exists and user is either the current DJ or voting threshold triggered
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  }

  // Check if user is DJ or if lame threshold was reached
  const isDJ = room.current_dj_id === user.id
  if (!isDJ) {
    // Verify lame threshold
    const { data: votes } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('room_id', roomId)
      .eq('video_id', room.current_video_id ?? '')

    const { data: members } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)

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

  // Advance the queue using our DB function
  const { error: advanceError } = await supabase.rpc('advance_dj_queue', {
    p_room_id: roomId,
  })

  if (advanceError) {
    return NextResponse.json({ error: advanceError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
