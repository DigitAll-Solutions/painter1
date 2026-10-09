// Which live pages a document feeds, as site paths. One source for the "Open page" action, the
// "Pages" view and the location folder's "Live pages" pane. Links open on the Studio's own origin, so
// the Studio on painter1.vercel.app opens Vercel pages and on www.painter1.com opens production.

export type SiteLocation = { _id: string; name?: string; slug?: string; locationType?: string; surveyRef?: string }
export type SiteService = { _id: string; title?: string; slug?: string; locationKey?: string }
export type LivePage = { label: string; path: string; group?: string }

export const DEFAULT_SURVEY_ID = 'estimate-survey-default'
const SERVICE_ORDER = ['interior', 'exterior', 'cabinet']

const servicesInOrder = (services: SiteService[]) =>
  [...services].filter((s) => s.slug).sort((a, b) => SERVICE_ORDER.indexOf(a.locationKey ?? '') - SERVICE_ORDER.indexOf(b.locationKey ?? ''))

/** Every page of one location (growth: home, service pages, Our Work, warranty, free estimate, privacy) */
export function locationPages(location: SiteLocation, services: SiteService[]): LivePage[] {
  if (!location.slug) return []
  const base = `/${location.slug}`
  const growth = location.locationType !== 'maintenance'
  return [
    { label: 'Home', path: base },
    ...(growth ? servicesInOrder(services).map((s) => ({ label: s.title ?? s.slug!, path: `${base}/${s.slug}` })) : []),
    ...(growth
      ? [
          { label: 'Our Work', path: `${base}/our-work` },
          { label: 'Warranty', path: `${base}/warranty` },
        ]
      : []),
    { label: 'Free estimate', path: `${base}/free-estimate` },
    { label: 'Privacy policy', path: `${base}/privacy-policy` },
  ]
}

/** Pages for any document type; corporate singletons have none yet */
export function pagesForDocument(
  type: string,
  doc: { _id?: string; slug?: { current?: string }; locationType?: string; estimateSurvey?: { _ref?: string } } | null | undefined,
  locations: SiteLocation[],
  services: SiteService[],
): LivePage[] {
  if (!doc) return []
  const live = locations.filter((l) => l.slug)
  const growth = live.filter((l) => l.locationType !== 'maintenance')
  const id = (doc._id ?? '').replace(/^drafts\./, '')
  switch (type) {
    case 'location':
      return locationPages({ _id: id, slug: doc.slug?.current, locationType: doc.locationType }, services)
    case 'service':
      return doc.slug?.current ? growth.map((l) => ({ label: l.name ?? l.slug!, path: `/${l.slug}/${doc.slug!.current}` })) : []
    case 'warrantyTerms':
      return growth.map((l) => ({ label: l.name ?? l.slug!, path: `/${l.slug}/warranty` }))
    case 'privacyPolicy':
      return live.map((l) => ({ label: l.name ?? l.slug!, path: `/${l.slug}/privacy-policy` }))
    case 'estimateSurvey':
      return live
        .filter((l) => (l.surveyRef ? l.surveyRef === id : id === DEFAULT_SURVEY_ID))
        .map((l) => ({ label: l.name ?? l.slug!, path: `/${l.slug}/free-estimate` }))
    default:
      return []
  }
}

export const SITE_DATA_QUERY = `{
  "locations": *[_type == "location" && defined(slug.current) && !(_id in path("drafts.**"))] | order(name asc) {
    _id, name, "slug": slug.current, locationType, "surveyRef": estimateSurvey._ref
  },
  "services": *[_type == "service" && defined(slug.current) && !(_id in path("drafts.**"))] {_id, title, "slug": slug.current, locationKey}
}`
