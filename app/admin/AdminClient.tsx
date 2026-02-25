'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Trash2, RefreshCw, ShieldCheck, Users, Home } from 'lucide-react'
import Button from '@/components/ui/Button'

interface RoomRow {
  id: string
  name: string
  slug: string
  is_active: boolean
  listener_count: number
  created_at: string
  current_dj_id: string | null
}

interface UserRow {
  id: string
  username: string
  display_name: string | null
  is_admin: boolean
  avatar_seed: string | null
  avatar_bg_color: string
  created_at: string
}

interface AdminClientProps {
  initialRooms: RoomRow[]
  initialUsers: UserRow[]
}

export default function AdminClient({ initialRooms, initialUsers }: AdminClientProps) {
  const supabase = createClient()
  const [rooms, setRooms] = useState(initialRooms)
  const [users, setUsers] = useState(initialUsers)
  const [tab, setTab] = useState<'rooms' | 'users'>('rooms')
  const [busy, setBusy] = useState<string | null>(null)

  async function deleteRoom(id: string) {
    if (!confirm('Delete this room? Cannot be undone.')) return
    setBusy(id)
    await supabase.from('rooms').delete().eq('id', id)
    setRooms((prev) => prev.filter((r) => r.id !== id))
    setBusy(null)
  }

  async function resetAvatar(userId: string) {
    setBusy(userId)
    await supabase
      .from('profiles')
      .update({ avatar_seed: null, avatar_bg_color: 'b6e3f4' })
      .eq('id', userId)
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, avatar_seed: null, avatar_bg_color: 'b6e3f4' } : u)
    )
    setBusy(null)
  }

  async function toggleAdmin(userId: string, current: boolean) {
    setBusy(userId)
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId)
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, is_admin: !current } : u)
    )
    setBusy(null)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="bg-bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent-purple" size={22} />
          <h1 className="text-lg font-bold text-text-primary">Admin Panel</h1>
        </div>
        <Link href="/rooms" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <Home size={14} /> Back to Rooms
        </Link>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('rooms')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${tab === 'rooms' ? 'border-accent-purple text-accent-purple' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          Rooms ({rooms.length})
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${tab === 'users' ? 'border-accent-purple text-accent-purple' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
        >
          Users ({users.length})
        </button>
      </div>

      <div className="p-6">
        {tab === 'rooms' && (
          <div className="flex flex-col gap-2">
            {rooms.length === 0 && <p className="text-text-muted text-sm">No rooms.</p>}
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center gap-3 p-3 bg-bg-card border border-border rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary truncate">{room.name}</span>
                    {!room.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-red/20 text-accent-red">Inactive</span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-xs text-text-muted">/{room.slug}</span>
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Users size={10} /> {room.listener_count}
                    </span>
                    <span className="text-xs text-text-muted">
                      {new Date(room.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/rooms/${room.id}`}
                  className="text-xs text-accent-cyan hover:underline shrink-0"
                >
                  Enter
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteRoom(room.id)}
                  loading={busy === room.id}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="flex flex-col gap-2">
            {users.length === 0 && <p className="text-text-muted text-sm">No users.</p>}
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 bg-bg-card border border-border rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary truncate">
                      {user.display_name || user.username}
                    </span>
                    <span className="text-xs text-text-muted">@{user.username}</span>
                    {user.is_admin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-purple/20 text-accent-purple flex items-center gap-1">
                        ⚡ Admin
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => resetAvatar(user.id)}
                  loading={busy === user.id}
                  title="Reset avatar to default"
                >
                  <RefreshCw size={13} />
                </Button>
                <Button
                  variant={user.is_admin ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => toggleAdmin(user.id, user.is_admin)}
                  loading={busy === user.id}
                  title={user.is_admin ? 'Remove admin' : 'Make admin'}
                >
                  <ShieldCheck size={13} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
