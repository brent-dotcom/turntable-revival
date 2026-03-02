// Pure utility functions — safe to import in both server and client components.
// Uses @multiavatar/multiavatar for client-side SVG generation (no external API).

// eslint-disable-next-line @typescript-eslint/no-require-imports
const multiavatar = require('@multiavatar/multiavatar').default ?? require('@multiavatar/multiavatar')

const PALETTE = ['b6e3f4','c0aede','d1d4f9','ffd5dc','ffdfbf','d4edda','aed6f1','f9e4b7']

export function seedToColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function generateAvatarSvg(seed: string): string {
  return multiavatar((seed || 'default').trim()) as string
}

export function generateAvatarDataUrl(seed: string): string {
  const svg = generateAvatarSvg(seed)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** @deprecated use generateAvatarDataUrl */
export const buildAvatarUrl = generateAvatarDataUrl
/** @deprecated use generateAvatarDataUrl */
export const buildDiceBearUrl = generateAvatarDataUrl
