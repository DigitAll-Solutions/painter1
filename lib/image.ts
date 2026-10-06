import type { SanityImage } from '@/sanity/lib/types'

// Keep the editor's hotspot in view when a photo is cropped by object-fit: cover.
// Hotspot coordinates are relative to the original image, so map them into the cropped one.
export function hotspotPosition({ hotspot, crop }: SanityImage) {
  if (!hotspot) return undefined
  const c = { top: 0, bottom: 0, left: 0, right: 0, ...crop }
  const x = (hotspot.x - c.left) / (1 - c.left - c.right)
  const y = (hotspot.y - c.top) / (1 - c.top - c.bottom)
  return `${Math.round(x * 100)}% ${Math.round(y * 100)}%`
}
