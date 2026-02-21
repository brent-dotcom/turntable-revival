'use client'

import { cn } from '@/lib/utils'
import type { AvatarAccessory, AvatarType } from '@/types'

interface AvatarProps {
  type: AvatarType
  color: string
  accessory: AvatarAccessory
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  bouncing?: boolean
  label?: string
  className?: string
}

// Pixel art SVG paths for each character type
const AVATAR_BODIES: Record<AvatarType, (color: string) => string> = {
  human: (color) => `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <!-- Head -->
      <rect x="10" y="4" width="12" height="12" fill="${color}"/>
      <!-- Eyes -->
      <rect x="12" y="7" width="3" height="3" fill="#0a0a0f"/>
      <rect x="17" y="7" width="3" height="3" fill="#0a0a0f"/>
      <!-- Smile -->
      <rect x="12" y="12" width="2" height="2" fill="#0a0a0f"/>
      <rect x="18" y="12" width="2" height="2" fill="#0a0a0f"/>
      <rect x="14" y="13" width="4" height="2" fill="#0a0a0f"/>
      <!-- Neck -->
      <rect x="14" y="16" width="4" height="2" fill="${color}"/>
      <!-- Body -->
      <rect x="9" y="18" width="14" height="10" fill="${color}"/>
      <!-- Arms -->
      <rect x="4" y="18" width="5" height="8" fill="${color}"/>
      <rect x="23" y="18" width="5" height="8" fill="${color}"/>
      <!-- Legs -->
      <rect x="9" y="28" width="6" height="4" fill="${color}"/>
      <rect x="17" y="28" width="6" height="4" fill="${color}"/>
    </svg>
  `,
  robot: (color) => `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <!-- Antenna -->
      <rect x="15" y="1" width="2" height="4" fill="${color}"/>
      <rect x="13" y="1" width="6" height="2" fill="${color}"/>
      <!-- Head (square) -->
      <rect x="8" y="5" width="16" height="12" fill="${color}"/>
      <!-- Head border -->
      <rect x="8" y="5" width="16" height="1" fill="#ffffff33"/>
      <!-- Eye screens -->
      <rect x="10" y="7" width="5" height="4" fill="#0a0a0f"/>
      <rect x="11" y="8" width="3" height="2" fill="#06b6d4"/>
      <rect x="17" y="7" width="5" height="4" fill="#0a0a0f"/>
      <rect x="18" y="8" width="3" height="2" fill="#06b6d4"/>
      <!-- Mouth grid -->
      <rect x="10" y="13" width="12" height="3" fill="#0a0a0f"/>
      <rect x="10" y="13" width="2" height="1" fill="${color}"/>
      <rect x="14" y="13" width="2" height="1" fill="${color}"/>
      <rect x="18" y="13" width="2" height="1" fill="${color}"/>
      <!-- Neck -->
      <rect x="13" y="17" width="6" height="2" fill="${color}"/>
      <!-- Body -->
      <rect x="7" y="19" width="18" height="10" fill="${color}"/>
      <!-- Chest panel -->
      <rect x="11" y="21" width="10" height="6" fill="#0a0a0f"/>
      <rect x="12" y="22" width="3" height="2" fill="${color}"/>
      <rect x="17" y="22" width="3" height="2" fill="${color}"/>
      <!-- Arms -->
      <rect x="3" y="19" width="4" height="8" fill="${color}"/>
      <rect x="25" y="19" width="4" height="8" fill="${color}"/>
      <!-- Legs -->
      <rect x="8" y="29" width="6" height="3" fill="${color}"/>
      <rect x="18" y="29" width="6" height="3" fill="${color}"/>
    </svg>
  `,
  cat: (color) => `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <!-- Ears -->
      <rect x="8" y="2" width="5" height="6" fill="${color}"/>
      <rect x="9" y="3" width="3" height="4" fill="#ff69b4"/>
      <rect x="19" y="2" width="5" height="6" fill="${color}"/>
      <rect x="20" y="3" width="3" height="4" fill="#ff69b4"/>
      <!-- Head -->
      <rect x="8" y="6" width="16" height="11" fill="${color}"/>
      <!-- Eyes (slitted) -->
      <rect x="11" y="8" width="4" height="3" fill="#0a0a0f"/>
      <rect x="12" y="8" width="2" height="3" fill="#7cfc00"/>
      <rect x="17" y="8" width="4" height="3" fill="#0a0a0f"/>
      <rect x="18" y="8" width="2" height="3" fill="#7cfc00"/>
      <!-- Nose + whiskers -->
      <rect x="15" y="12" width="2" height="2" fill="#ff69b4"/>
      <rect x="6" y="12" width="5" height="1" fill="#cccccc88"/>
      <rect x="21" y="12" width="5" height="1" fill="#cccccc88"/>
      <!-- Mouth -->
      <rect x="14" y="14" width="1" height="1" fill="#0a0a0f"/>
      <rect x="17" y="14" width="1" height="1" fill="#0a0a0f"/>
      <!-- Neck -->
      <rect x="13" y="17" width="6" height="2" fill="${color}"/>
      <!-- Body -->
      <rect x="8" y="19" width="16" height="10" fill="${color}"/>
      <!-- Arms -->
      <rect x="3" y="19" width="5" height="7" fill="${color}"/>
      <rect x="24" y="19" width="5" height="7" fill="${color}"/>
      <!-- Tail -->
      <rect x="24" y="26" width="3" height="2" fill="${color}"/>
      <rect x="27" y="24" width="2" height="4" fill="${color}"/>
      <rect x="27" y="22" width="2" height="2" fill="${color}"/>
      <!-- Legs -->
      <rect x="9" y="29" width="5" height="3" fill="${color}"/>
      <rect x="18" y="29" width="5" height="3" fill="${color}"/>
    </svg>
  `,
  alien: (color) => `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      <!-- Head (wide oval-ish) -->
      <rect x="6" y="3" width="20" height="14" fill="${color}"/>
      <!-- Head sides tapered -->
      <rect x="7" y="2" width="18" height="1" fill="${color}"/>
      <rect x="8" y="1" width="16" height="1" fill="${color}"/>
      <!-- Big eyes -->
      <rect x="7" y="5" width="8" height="7" fill="#0a0a0f"/>
      <rect x="8" y="6" width="6" height="5" fill="#a855f7"/>
      <rect x="9" y="7" width="4" height="3" fill="#e879f9"/>
      <rect x="17" y="5" width="8" height="7" fill="#0a0a0f"/>
      <rect x="18" y="6" width="6" height="5" fill="#a855f7"/>
      <rect x="19" y="7" width="4" height="3" fill="#e879f9"/>
      <!-- Tiny mouth -->
      <rect x="13" y="14" width="6" height="1" fill="#0a0a0f"/>
      <!-- Neck thin -->
      <rect x="14" y="17" width="4" height="3" fill="${color}"/>
      <!-- Body (slim) -->
      <rect x="9" y="20" width="14" height="9" fill="${color}"/>
      <!-- Long arms -->
      <rect x="2" y="20" width="7" height="4" fill="${color}"/>
      <rect x="2" y="24" width="4" height="3" fill="${color}"/>
      <rect x="23" y="20" width="7" height="4" fill="${color}"/>
      <rect x="26" y="24" width="4" height="3" fill="${color}"/>
      <!-- Legs -->
      <rect x="10" y="29" width="5" height="3" fill="${color}"/>
      <rect x="17" y="29" width="5" height="3" fill="${color}"/>
    </svg>
  `,
}

const ACCESSORY_SVGS: Record<AvatarAccessory, string> = {
  none: '',
  headphones: `
    <rect x="7" y="4" width="3" height="8" fill="#1a1a26"/>
    <rect x="8" y="3" width="16" height="3" fill="#1a1a26"/>
    <rect x="22" y="4" width="3" height="8" fill="#1a1a26"/>
    <rect x="7" y="7" width="4" height="5" fill="#7c3aed"/>
    <rect x="21" y="7" width="4" height="5" fill="#7c3aed"/>
  `,
  hat: `
    <rect x="9" y="1" width="14" height="3" fill="#1a1a26"/>
    <rect x="7" y="4" width="18" height="2" fill="#1a1a26"/>
    <rect x="11" y="1" width="10" height="1" fill="#7c3aed"/>
  `,
  glasses: `
    <rect x="9" y="8" width="5" height="3" fill="none" stroke="#f59e0b" stroke-width="1"/>
    <rect x="18" y="8" width="5" height="3" fill="none" stroke="#f59e0b" stroke-width="1"/>
    <rect x="14" y="9" width="4" height="1" fill="#f59e0b"/>
    <rect x="8" y="9" width="1" height="1" fill="#f59e0b"/>
    <rect x="23" y="9" width="1" height="1" fill="#f59e0b"/>
  `,
}

const SIZE_MAP = {
  xs: 24,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
}

export default function Avatar({
  type,
  color,
  accessory,
  size = 'md',
  bouncing = false,
  label,
  className,
}: AvatarProps) {
  const px = SIZE_MAP[size]
  const bodySvg = AVATAR_BODIES[type](color)
  const accessorySvg = ACCESSORY_SVGS[accessory]

  // Combine into a single SVG with accessory overlay
  const combinedSvg = `
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
      ${bodySvg.replace(/<\/?svg[^>]*>/g, '')}
      ${accessorySvg}
    </svg>
  `

  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(combinedSvg)}`

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'relative',
          bouncing && 'animate-bounce'
        )}
        style={{ width: px, height: px }}
      >
        {/* Glow ring when bouncing */}
        {bouncing && (
          <div
            className="absolute inset-0 rounded-full opacity-60 blur-sm"
            style={{ backgroundColor: color }}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUri}
          alt={label || type}
          width={px}
          height={px}
          className="relative z-10"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
      {label && (
        <span className="text-text-secondary truncate max-w-[80px]" style={{ fontSize: Math.max(8, px / 5) }}>
          {label}
        </span>
      )}
    </div>
  )
}
