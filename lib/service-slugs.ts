// Public URL slug of each service page. Cabinet moved from /cabinet-refinishing to /cabinet-painting
// (Oct 9: "painting" describes the work better). Its Sanity service document keeps the old slug until
// the post-merge step (scripts/seed-oct9.ts --cabinet-slug), so the site maps both: links, sitemap and
// canonical always use the new slug, and the page is found whichever slug the document has.
// The old URL 308s to the new one (next.config.ts).

/** Old slug (may still be stored in Sanity) → public slug */
export const SERVICE_SLUG_RENAMES: Record<string, string> = { 'cabinet-refinishing': 'cabinet-painting' }

export const publicServiceSlug = (slug: string) => SERVICE_SLUG_RENAMES[slug] ?? slug

/** Slugs a service document may have for this public slug (the new one first) */
export const storedServiceSlugs = (slug: string) => [slug, ...Object.keys(SERVICE_SLUG_RENAMES).filter((old) => SERVICE_SLUG_RENAMES[old] === slug)]
