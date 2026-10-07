// Location slug rules, shared by the Studio validator and the tests. No imports: plain data + functions.
import { KNOWN_LOCATION_SLUGS } from './known-location-slugs.ts'

/** Lowercase letters/numbers in dash-separated words, e.g. "knoxville", "inland-northwest" */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Top-level paths used (or planned) by corporate pages, the app and the Studio: never a location */
export const RESERVED_SLUGS = new Set([
  'studio', 'api', '_next', 'sitemap.xml', 'robots.txt', 'favicon.ico',
  'locations', 'franchise-opportunities', 'low-cost-franchise-opportunities',
  'about', 'about-us', 'contact', 'privacy-policy', 'terms-and-conditions', 'warranty', 'testimonials',
  'painting-blog', 'blog', 'why-choose-us', 'residential-painting', 'commercial-painting', 'careers',
])

/** "Painter1 of Maryville" / "Maryville" → "maryville" (what the Generate button produces) */
export const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/^painter\s*1\s+of\s+/, '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

/** Blocking problems with a slug, or undefined when it's valid */
export function slugError(slug: string | undefined): string | undefined {
  if (!slug) return 'Required: this is the location URL, e.g. painter1.com/knoxville'
  if (!SLUG_PATTERN.test(slug)) return 'Use lowercase letters, numbers and single dashes only (e.g. "inland-northwest")'
  if (RESERVED_SLUGS.has(slug)) return `"${slug}" is reserved for a corporate page`
  return undefined
}

/** Non-blocking: the slug isn't on the client's list of live location URLs (skipped while the list is empty) */
export function slugWarning(slug: string | undefined, known: readonly string[] = KNOWN_LOCATION_SLUGS): string | undefined {
  if (!slug || !known.length || known.includes(slug)) return undefined
  return `"${slug}" isn't in the client's location list (docs/reference/locations.csv). Check it matches the live URL.`
}
