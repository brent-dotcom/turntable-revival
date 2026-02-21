import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { NextResponse } from 'next/server'

// POST /api/rooms — create a room
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Room name is required' }, { status: 400 })
  }

  const baseSlug = slugify(name)
  let slug = baseSlug
  let attempt = 0

  // Ensure unique slug
  while (true) {
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ room }, { status: 201 })
}
