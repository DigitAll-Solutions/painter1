// Permanent (308) redirects from the old WordPress URLs of locations that now live on this site.
// Every rule names its locations explicitly (LIVE_LOCATIONS): while painter1.com still serves the other
// WordPress locations (docs/go-live-plan.md), a rule like /:location/brick-painting would otherwise also
// catch /atlanta/brick-painting/ and send it to a page that doesn't exist. Add a slug here only on the
// day that location moves. URL tables: docs/scope-audit.md §4a; list: docs/studio-plan.md §7.
// Tested in legacy-redirects.test.ts (with Next's own path matcher) and on a local server.
import { SERVICE_SLUG_RENAMES } from './service-slugs.ts'

/** Locations served by this site at painter1.com/<slug>; everything else is still WordPress */
export const LIVE_LOCATIONS = ['knoxville'] as const

type Redirect = { source: string; destination: string; permanent: true }

/** `/:location(knoxville|…)`: matches only the live locations */
export const liveLocationParam = (slugs: readonly string[] = LIVE_LOCATIONS) => `/:location(${slugs.join('|')})`

// Old page (every live location) → new page. Source paths without a trailing slash: Next.js first
// redirects /x/ to /x, then the rule below applies (2 hops, both permanent).
const PAGE_MOVES: [from: string, to: string][] = [
  // Service pages merged into the three new ones (Oct 9); surfaces became sections of Exterior Painting
  ['cabinet-painting-and-refinishing', '/cabinet-painting'],
  ['home-siding-painting', '/exterior-painting#siding'],
  ['stucco-painting', '/exterior-painting#stucco'],
  ['brick-painting', '/exterior-painting#brick'],
  ['deck-painting-and-staining', '/exterior-painting#decks'],
  ['fence-painting-and-staining', '/exterior-painting#fences'],
  // Hub of interior + exterior → the location homepage
  ['residential-painting', ''],
  // City landing pages (painters-alcoa-tn …) and the 2021 "cities we serve" pages → the location homepage
  [':page(painters-[a-z0-9-]+)', ''],
  ['cities-we-serve/:rest*', ''],
  // 2021 site
  ['contact', '/free-estimate'],
  ['estimate', '/free-estimate'],
  ['services/:rest*', ''],
  ['blog/:rest*', ''],
  // Google Ads landing page and its thank-you page (update the Ads final URLs before the switch)
  ['professional-painting-services-gaw-1/:rest*', '/free-estimate'],
]

// Knoxville's 2024 city pages (/knoxville/maryville/ …): city names, so for Knoxville only
const KNOXVILLE_2024_CITIES = ['alcoa', 'clinton', 'farragut', 'gatlinburg', 'lenoir-city', 'maryville', 'oak-ridge', 'pigeon-forge']

export function legacyRedirects(slugs: readonly string[] = LIVE_LOCATIONS): Redirect[] {
  if (!slugs.length) return []
  const at = liveLocationParam(slugs)
  return [
    // Renamed service slug (Oct 9): /knoxville/cabinet-refinishing → /knoxville/cabinet-painting
    ...Object.entries(SERVICE_SLUG_RENAMES).map(([from, to]) => ({ source: `${at}/${from}`, destination: `/:location/${to}`, permanent: true as const })),
    // No reviews page (Rick, Oct 14): old /knoxville/reviews(/…) URLs land on the homepage reviews section
    { source: `${at}/reviews/:rest*`, destination: '/:location#reviews', permanent: true },
    ...PAGE_MOVES.map(([from, to]) => ({ source: `${at}/${from}`, destination: `/:location${to}`, permanent: true as const })),
    ...(slugs.includes('knoxville') ? [{ source: `/knoxville/:city(${KNOXVILLE_2024_CITIES.join('|')})`, destination: '/knoxville', permanent: true as const }] : []),
  ]
}
