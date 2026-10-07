// Our Work grid cards: pairing, filters and chips. Pure functions (tested in work-cards.test.ts).
import { localPhotos, photoTitle } from './gallery.ts'
import { isWorkFilter, WORK_FILTERS, type WorkFilter } from './our-work-filters.ts'
import type { GalleryImage, Location } from '@/sanity/lib/types'

export const ourWorkPath = (location: Pick<Location, 'slug'>) => `/${location.slug}/our-work`

/** One grid card: a single photo, or a before/after pair (`before` set, `image` = the after photo) */
export type WorkCard = {
  key: string
  image: GalleryImage
  before?: GalleryImage
  title: string
  filters: WorkFilter[]
}

const filtersOf = (photos: GalleryImage[], serviceKeys: Record<string, string>) => {
  const keys = new Set<string>()
  for (const photo of photos) {
    for (const id of photo.services ?? []) if (serviceKeys[id]) keys.add(serviceKeys[id])
    if (photo.commercial) keys.add('commercial')
  }
  return WORK_FILTERS.map((filter) => filter.key).filter((key) => keys.has(key))
}

/**
 * The location's local photos as cards, in Studio order (newest first). Two photos with the same
 * projectId, one "before" and one "after", become one card at the position of the first of them;
 * any other projectId group stays as separate photos.
 */
export function workCards(location: Pick<Location, 'galleryImages'>, serviceKeys: Record<string, string>): WorkCard[] {
  const photos = localPhotos(location)
  const groups = new Map<string, GalleryImage[]>()
  for (const photo of photos) if (photo.projectId) groups.set(photo.projectId, [...(groups.get(photo.projectId) ?? []), photo])

  const pairOf = (projectId?: string) => {
    const group = projectId ? groups.get(projectId) : undefined
    if (group?.length !== 2) return undefined
    const before = group.find((photo) => photo.role === 'before')
    const after = group.find((photo) => photo.role === 'after')
    return before && after ? { before, after } : undefined
  }

  const cards: WorkCard[] = []
  const placed = new Set<string>()
  for (const photo of photos) {
    const pair = pairOf(photo.projectId)
    if (pair) {
      if (placed.has(photo.projectId!)) continue
      placed.add(photo.projectId!)
      cards.push({
        key: `project-${photo.projectId}`,
        image: pair.after,
        before: pair.before,
        title: photoTitle(pair.after) || photoTitle(pair.before),
        filters: filtersOf([pair.before, pair.after], serviceKeys),
      })
    } else {
      cards.push({ key: photo._key, image: photo, title: photoTitle(photo), filters: filtersOf([photo], serviceKeys) })
    }
  }
  return cards
}

/** Chip list: All, then each filter with at least one card */
export function workChips(location: Pick<Location, 'slug'>, cards: WorkCard[]) {
  const path = ourWorkPath(location)
  return [
    { key: null, label: 'All', href: path, count: cards.length },
    ...WORK_FILTERS.map((filter) => ({
      key: filter.key,
      label: filter.label,
      href: `${path}?service=${filter.key}`,
      count: cards.filter((card) => card.filters.includes(filter.key)).length,
    })).filter((chip) => chip.count > 0),
  ]
}

/** A filter that has no cards falls back to All */
export const activeFilter = (filter: unknown, cards: WorkCard[]): WorkFilter | null =>
  isWorkFilter(filter) && cards.some((card) => card.filters.includes(filter)) ? filter : null
