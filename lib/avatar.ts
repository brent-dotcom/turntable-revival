// Pure utility functions — safe to import in both server and client components.

const PALETTE = ['b6e3f4','c0aede','d1d4f9','ffd5dc','ffdfbf','d4edda','aed6f1','f9e4b7']

export function seedToColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function buildDiceBearUrl(
  seed: string,
  bgColor = 'b6e3f4',
  accessory = 'none',
  hair = 'short01'
): string {
  const safeSeed = seed || 'default'
  const safeColor = (bgColor || 'b6e3f4').replace('#', '')
  const safeHair = hair || 'short01'
  const parts = [
    `seed=${encodeURIComponent(safeSeed)}`,
    `backgroundColor=${safeColor}`,
    `hair=${safeHair}`,
    accessory && accessory !== 'none'
      ? `accessories=${accessory}&accessoriesProbability=100`
      : 'accessoriesProbability=0',
  ]
  return `https://api.dicebear.com/7.x/pixel-art/svg?${parts.join('&')}`
}
