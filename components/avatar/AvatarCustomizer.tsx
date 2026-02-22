'use client'

import { useState } from 'react'
import Avatar from './Avatar'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import {
  AVATAR_BG_COLORS,
  AVATAR_ACCESSORIES,
  AVATAR_HAIR_STYLES,
  type AvatarAccessory,
  type AvatarConfig,
  type AvatarHair,
} from '@/types'
import { cn } from '@/lib/utils'

interface AvatarCustomizerProps {
  userId: string
  seed: string
  initial: AvatarConfig
  onSave?: (config: AvatarConfig) => void
}

export default function AvatarCustomizer({ userId, seed, initial, onSave }: AvatarCustomizerProps) {
  const [config, setConfig] = useState<AvatarConfig>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_seed: seed,
        avatar_bg_color: config.bgColor,
        avatar_accessory: config.accessory,
        avatar_hair: config.hair,
      })
      .eq('id', userId)

    setSaving(false)
    if (error) {
      console.error('Avatar save failed:', error)
      setSaveError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSave?.(config)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Live preview */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-3 p-6 bg-bg-secondary rounded-2xl border border-border">
          <Avatar
            seed={seed}
            bgColor={config.bgColor}
            accessory={config.accessory}
            hair={config.hair}
            size="xl"
          />
          <p className="text-xs text-text-muted tracking-wider uppercase">Preview</p>
        </div>
      </div>

      {/* Background color */}
      <div>
        <p className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Background</p>
        <div className="flex flex-wrap gap-2.5">
          {AVATAR_BG_COLORS.map((col) => (
            <button
              key={col}
              onClick={() => setConfig((c) => ({ ...c, bgColor: col }))}
              className={cn(
                'w-9 h-9 rounded-full border-2 transition-all duration-150 hover:scale-110',
                config.bgColor === col
                  ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.35)]'
                  : 'border-transparent'
              )}
              style={{ backgroundColor: `#${col}` }}
              title={`#${col}`}
            />
          ))}
        </div>
      </div>

      {/* Hair style */}
      <div>
        <p className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Hair Style</p>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_HAIR_STYLES.map((h) => (
            <button
              key={h.value}
              onClick={() => setConfig((c) => ({ ...c, hair: h.value as AvatarHair }))}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-150',
                config.hair === h.value
                  ? 'border-accent-purple bg-accent-purple/20 shadow-[0_0_8px_rgba(124,58,237,0.3)]'
                  : 'border-border hover:border-border-bright hover:bg-bg-hover'
              )}
            >
              <Avatar
                seed={seed}
                bgColor={config.bgColor}
                accessory="none"
                hair={h.value}
                size="xs"
              />
              <span className="text-[10px] text-text-muted">{h.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Accessory */}
      <div>
        <p className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Accessory</p>
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_ACCESSORIES.map((acc) => (
            <button
              key={acc.value}
              onClick={() => setConfig((c) => ({ ...c, accessory: acc.value as AvatarAccessory }))}
              className={cn(
                'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-150',
                config.accessory === acc.value
                  ? 'border-accent-cyan bg-accent-cyan/10 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'border-border hover:border-border-bright hover:bg-bg-hover'
              )}
            >
              <Avatar
                seed={seed}
                bgColor={config.bgColor}
                accessory={acc.value}
                hair={config.hair}
                size="xs"
              />
              <span className="text-[10px] text-text-muted">{acc.label}</span>
            </button>
          ))}
        </div>
      </div>

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
