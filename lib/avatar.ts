// Pure utility functions — safe to import in both server and client components.

const PALETTE = ['b6e3f4','c0aede','d1d4f9','ffd5dc','ffdfbf','d4edda','aed6f1','f9e4b7']

export function seedToColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/** Build a Multiavatar URL for a given seed (username or avatar_seed). */
export function buildAvatarUrl(seed: string): string {
  const safeSeed = (seed || 'default').trim()
  return `https://api.multiavatar.com/${encodeURIComponent(safeSeed)}.svg`
}

/** @deprecated alias kept for import compatibility — use buildAvatarUrl */
export const buildDiceBearUrl = buildAvatarUrl
