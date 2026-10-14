// Cache tags for Sanity data. Page fetches are tagged with these (sanity/lib/fetch.ts) and the publish
// webhook (app/api/revalidate) expires the tags a published document affects, so a Studio change shows
// on the next visit instead of after the 60-second fallback. Tested in revalidate.test.ts.

export const TAGS = {
  /** Every page of one location */
  location: (slug: string) => `location:${slug}`,
  /** Lists of locations (static params, sitemap) */
  locations: 'locations',
  service: 'service',
  warrantyTerms: 'warrantyTerms',
  privacyPolicy: 'privacyPolicy',
  estimateSurvey: 'estimateSurvey',
} as const

/** What the webhook sends (its projection): {_type, "slug": slug.current, "previousSlug": before().slug.current} */
export type RevalidateBody = { _type?: string; slug?: string | null; previousSlug?: string | null }

/**
 * Tags to expire for one published (or deleted) document: a location's own pages (under its old slug
 * too, if it changed) and the location lists; for a shared document, its tag, used on every location's
 * pages. Types the site doesn't render (leads, lead settings) need nothing.
 */
export function tagsFor(body: RevalidateBody): string[] {
  switch (body._type) {
    case 'location': {
      const slugs = [...new Set([body.slug, body.previousSlug].filter((slug): slug is string => Boolean(slug)))]
      return [...slugs.map(TAGS.location), TAGS.locations]
    }
    case 'service':
      return [TAGS.service]
    case 'warrantyTerms':
      return [TAGS.warrantyTerms]
    case 'privacyPolicy':
      return [TAGS.privacyPolicy]
    case 'estimateSurvey':
      return [TAGS.estimateSurvey]
    default:
      return []
  }
}
