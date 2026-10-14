// "What We Paint": one entry per surface, shown as a card at the top and as its own section (#slug)
// below. Card, link name and section text come from the shared service. Photo: THIS location's own
// (its surfacePhotos, keyed to the surface's _key) when it has one, otherwise the surface's default
// photo on the shared service (Rick, Oct 14). Never another location's own photo.
// Tested in paint-surfaces.test.ts.
import type { PortableTextBlock } from 'next-sanity'

import type { PaintSurface, SanityImage, ServiceDetail } from '@/sanity/lib/types'

export type SurfaceSection = {
  key: string
  /** Anchor id, unique on the page */
  slug: string
  title: string
  icon?: string
  /** Card text */
  description?: string
  /** Section text from Sanity (Portable Text), or the card text when there is none */
  body?: PortableTextBlock[]
  text?: string
  image?: SanityImage
}

/** "Trim & Doors" → "trim-doors" */
export const surfaceSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const hasText = (blocks?: PortableTextBlock[]) =>
  (blocks ?? []).some((block) => ((block.children as { text?: string }[] | undefined) ?? []).some((child) => child.text?.trim()))

export function paintSurfaces(items: PaintSurface[] | undefined, photos?: ServiceDetail['surfacePhotos']): SurfaceSection[] {
  const used = new Set<string>()
  const unique = (base: string) => {
    let slug = base || 'surface'
    for (let n = 2; used.has(slug); n++) slug = `${base || 'surface'}-${n}`
    used.add(slug)
    return slug
  }
  return (items ?? [])
    .filter((item) => item.title?.trim())
    .map((item) => {
      const body = hasText(item.body) ? item.body : undefined
      const photo = photos?.find((p) => p.surface === item._key && p.image?.asset)?.image
      return {
        key: item._key,
        slug: unique(item.slug?.trim() || surfaceSlug(item.title)),
        title: item.title.trim(),
        icon: item.icon,
        description: item.description?.trim() || undefined,
        body,
        text: body ? undefined : item.description?.trim() || undefined,
        image: photo ?? (item.defaultImage?.asset ? item.defaultImage : undefined),
      }
    })
}
