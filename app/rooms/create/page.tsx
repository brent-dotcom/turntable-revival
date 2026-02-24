'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Disc3 } from 'lucide-react'
import Link from 'next/link'

export default function CreateRoomPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, genre }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to create room')
      setLoading(false)
      return
    }

    router.push(`/rooms/${data.room.id}`)
  }

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/rooms" className="text-text-muted hover:text-text-primary transition-colors">
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <Disc3 size={20} className="text-accent-purple" />
            <h1 className="text-lg font-bold text-text-primary">Create a Room</h1>
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Room Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Late Night Vibes, Lo-Fi Study Hall..."
              required
              maxLength={60}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Genre <span className="text-text-muted">(optional)</span>
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition-colors text-sm"
              >
                <option value="">Pick a genre...</option>
                {['Electronic', 'Hip-Hop', 'Indie', 'Rock', 'Pop', 'R&B / Soul', 'Jazz', 'Lo-Fi', 'Metal', 'Latin', 'Everything'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                Description <span className="text-text-muted">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What kind of music? Vibes? Rules?"
                rows={3}
                maxLength={200}
                className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple focus:border-transparent transition-colors resize-none text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} size="lg" className="mt-2">
              🎵 Open the Room
            </Button>
          </form>
        </div>

        <p className="text-xs text-text-muted text-center mt-4">
          You&apos;ll be the room creator. Join the DJ queue to start spinning!
        </p>
      </div>
    </div>
  )
}
