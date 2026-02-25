import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/rooms')

  const [{ data: rooms }, { data: users }] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, name, slug, is_active, listener_count, created_at, current_dj_id')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, username, display_name, is_admin, avatar_seed, avatar_bg_color, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return <AdminClient initialRooms={rooms ?? []} initialUsers={users ?? []} />
}
