'use client'

import { useState } from 'react'
import Avatar from './Avatar'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

interface AvatarCustomizerProps {
  userId: string
  initialSeed: string
}

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

export default function AvatarCustomizer({ userId, initialSeed }: AvatarCustomizerProps) {
  const [seed, setSeed] = useState(initialSeed)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_seed: seed })
      .eq('id', userId)

    setSaving(false)
    if (error) {
      setSaveError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Live preview */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-3 p-6 bg-bg-secondary rounded-2xl border border-border">
          <Avatar seed={seed} size="xl" />
          <p className="text-xs text-text-muted tracking-wider uppercase">Preview</p>
        </div>
      </div>

      {/* Randomize */}
      <Button variant="secondary" size="lg" onClick={() => setSeed(randomSeed())}>
        Randomize Avatar
      </Button>

      {saveError && (
        <p className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
          {saveError}
        </p>
      )}
      <Button onClick={handleSave} loading={saving} size="lg">
        {saved ? '✓ Saved!' : 'Save Avatar'}
      </Button>
    </div>
  )
}
