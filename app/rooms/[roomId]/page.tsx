import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RoomClient from './RoomClient'

interface PageProps {
  params: { roomId: string }
}

export default async function RoomPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', params.roomId)
    .single()

  if (!room) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  return <RoomClient roomId={params.roomId} initialUser={user} />
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('name, description')
    .eq('id', params.roomId)
    .single()

  return {
    title: room ? `${room.name} — Turntable Revival` : 'Room — Turntable Revival',
    description: room?.description ?? 'Join the music room',
  }
}
