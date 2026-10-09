// "What We Paint": one entry per surface, shown as a card at the top and as its own section (#slug)
// below. Works with both data shapes:
//   new: the service's surface item carries its section text (body) and photo
//   old: a location's subServices (e.g. Knoxville's "Home Siding Painting", anchor "siding") supply
//        the section text and photo for the card with the same link name, until the post-merge step
//        removes them. Sub-services that match no card still get a section (no card).
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
  /** Section text from Sanity (Portable Text), or plain text from older data / the card */
  body?: PortableTextBlock[]
  text?: string
  image?: SanityImage
  /** false: an older location section with no matching card */
  card: boolean
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

export function paintSurfaces(items: PaintSurface[] | undefined, legacy?: ServiceDetail['subServices']): SurfaceSection[] {
  const used = new Set<string>()
  const unique = (base: string) => {
    let slug = base || 'surface'
    for (let n = 2; used.has(slug); n++) slug = `${base || 'surface'}-${n}`
    used.add(slug)
    return slug
  }
  const older = new Map((legacy ?? []).map((item) => [item.anchor?.trim() || surfaceSlug(item.title), item]))

  const sections: SurfaceSection[] = (items ?? [])
    .filter((item) => item.title?.trim())
    .map((item) => {
      const base = item.slug?.trim() || surfaceSlug(item.title)
      const old = older.get(base)
      older.delete(base)
      const body = hasText(item.body) ? item.body : undefined
      return {
        key: item._key,
        slug: unique(base),
        title: item.title.trim(),
        icon: item.icon,
        description: item.description?.trim() || undefined,
        body,
        text: body ? undefined : old?.description?.trim() || item.description?.trim() || undefined,
        image: item.image?.asset ? item.image : old?.image?.asset ? old.image : undefined,
        card: true,
      }
    })

  for (const old of older.values()) {
    sections.push({ key: old._key, slug: unique(old.anchor?.trim() || surfaceSlug(old.title)), title: old.title, text: old.description?.trim() || undefined, image: old.image?.asset ? old.image : undefined, card: false })
  }
  return sections
}
