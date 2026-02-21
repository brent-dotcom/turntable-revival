import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/profile — update profile
export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { username, display_name, avatar_type, avatar_color, avatar_accessory } = body

  // Validate username if changing
  if (username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }
  }

  const updates: Record<string, string> = {}
  if (username) updates.username = username
  if (display_name !== undefined) updates.display_name = display_name
  if (avatar_type) updates.avatar_type = avatar_type
  if (avatar_color) updates.avatar_color = avatar_color
  if (avatar_accessory) updates.avatar_accessory = avatar_accessory

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
