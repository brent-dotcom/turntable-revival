'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  seed: string | null | undefined
  bgColor?: string
  accessory?: string
  hair?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  bouncing?: boolean
  shaking?: boolean
  label?: string
  className?: string
}

const SIZE_MAP = {
  xs: 28,
  sm: 40,
  md: 52,
  lg: 68,
  xl: 100,
}

import { buildDiceBearUrl, seedToColor } from '@/lib/avatar'
export { buildDiceBearUrl, seedToColor }

export default function Avatar({
  seed,
  bgColor = 'b6e3f4',
  accessory = 'none',
  hair = 'short01',
  size = 'md',
  bouncing = false,
  shaking = false,
  label,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const px = SIZE_MAP[size]
  const isEmpty = !seed || !seed.trim()
  const url = isEmpty ? '' : buildDiceBearUrl(seed, bgColor, accessory, hair)
  const initial = (label || seed || '?')[0].toUpperCase()
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'relative rounded-xl overflow-hidden ring-1 ring-white/10 transition-all duration-200',
          bouncing && 'animate-avatar-bounce ring-accent-green/70 shadow-[0_0_14px_rgba(16,185,129,0.65)]',
          shaking && 'animate-avatar-shake ring-accent-red/70 shadow-[0_0_14px_rgba(239,68,68,0.65)]',
        )}
        style={{ width: px, height: px }}
      >
        {isEmpty || imgError ? (
          <div
            className="w-full h-full flex items-center justify-center font-bold text-white/80"
            style={{ backgroundColor: `#${(bgColor || 'b6e3f4').replace('#', '')}`, fontSize: Math.round(px * 0.4) }}
          >
            {isEmpty ? '♪' : initial}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label || seed || 'avatar'}
            width={px}
            height={px}
            className="w-full h-full object-cover"
            style={{ imageRendering: 'pixelated' }}
            onError={() => setImgError(true)}
          />
        )}
      </div>
      {label && (
        <span
          className="text-text-secondary truncate text-center leading-tight"
          style={{ fontSize: Math.max(9, px / 5.5), maxWidth: px + 12 }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
