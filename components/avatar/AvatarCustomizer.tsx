'use client'

import { useState } from 'react'
import Avatar from './Avatar'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import {
  AVATAR_ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_TYPES,
  type AvatarAccessory,
  type AvatarConfig,
  type AvatarType,
} from '@/types'
import { cn } from '@/lib/utils'

interface AvatarCustomizerProps {
  userId: string
  initial: AvatarConfig
  onSave?: (config: AvatarConfig) => void
}

export default function AvatarCustomizer({ userId, initial, onSave }: AvatarCustomizerProps) {
  const [config, setConfig] = useState<AvatarConfig>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_type: config.type,
        avatar_color: config.color,
        avatar_accessory: config.accessory,
      })
      .eq('id', userId)

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSave?.(config)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Preview */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-3 p-6 bg-bg-secondary rounded-xl border border-border">
          <Avatar
            type={config.type}
            color={config.color}
            accessory={config.accessory}
            size="xl"
          />
          <p className="text-sm text-text-muted">Preview</p>
        </div>
      </div>

      {/* Character Type */}
      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">Character</p>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setConfig((c) => ({ ...c, type: t.value }))}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                config.type === t.value
                  ? 'border-accent-purple bg-accent-purple/20 text-text-primary'
                  : 'border-border text-text-muted hover:border-border-bright hover:bg-bg-hover'
              )}
            >
              <Avatar
                type={t.value}
                color={config.color}
                accessory="none"
                size="sm"
              />
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">Color</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((col) => (
            <button
              key={col}
              onClick={() => setConfig((c) => ({ ...c, color: col }))}
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                config.color === col ? 'border-white scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: col }}
              title={col}
            />
          ))}
        </div>
      </div>

      {/* Accessory */}
      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">Accessory</p>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_ACCESSORIES.map((acc) => (
            <button
              key={acc.value}
              onClick={() => setConfig((c) => ({ ...c, accessory: acc.value }))}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs',
                config.accessory === acc.value
                  ? 'border-accent-purple bg-accent-purple/20 text-text-primary'
                  : 'border-border text-text-muted hover:border-border-bright hover:bg-bg-hover'
              )}
            >
              <span className="text-lg">{acc.emoji}</span>
              <span>{acc.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} loading={saving} size="lg">
        {saved ? '✓ Saved!' : 'Save Avatar'}
      </Button>
    </div>
  )
}
