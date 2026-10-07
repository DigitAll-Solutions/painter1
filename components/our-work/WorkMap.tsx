import type { WorkFilter } from '@/lib/our-work-filters'

/** One project pin. Pairs share a pin: the page builds one entry per card. */
export type WorkMapProject = {
  key: string
  title: string
  /** Neighborhood (gallery photo "area") */
  area?: string
  /** Municipality: the photo's city, else the location's */
  city?: string
  geo?: { lat: number; lng: number }
  filters: WorkFilter[]
}

// Reserved slot above the Our Work gallery. The page already passes every project with its area,
// city and position; a map can be rendered here later without changing the page, query or schema.
export default function WorkMap({ projects }: { projects: WorkMapProject[] }) {
  void projects
  return null
}
