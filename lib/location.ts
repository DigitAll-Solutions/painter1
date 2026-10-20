import type { Location } from '@/sanity/lib/types'

import { withAttribution } from './booking-params.ts'
import { cityOrPlace } from './place.ts'

export type NavLink = { label: string; href: string }

type CtaLocation = Pick<Location, 'slug' | 'schedulingUrl' | 'bookingTarget'>

/**
 * The location's online booking page: only when Studio's "Main buttons go to" is "Booking page" and
 * the URL is a valid https address. Otherwise undefined, and every button falls back to the survey,
 * so nothing ever links to an empty or broken URL.
 */
export function bookingUrl(location: CtaLocation): string | undefined {
  return location.bookingTarget === 'booking' ? httpsUrl(location.schedulingUrl) : undefined
}

/** The value when it's a valid https URL, else undefined */
function httpsUrl(value?: string | null): string | undefined {
  const raw = value?.trim()
  if (!raw) return undefined
  try {
    return new URL(raw).protocol === 'https:' ? raw : undefined
  } catch {
    return undefined
  }
}

/** The free-estimate survey; `service` (interior | exterior | cabinet) preselects its first question */
export const estimateHref = (location: Pick<Location, 'slug'>, service?: string) =>
  `/${location.slug}/free-estimate${service ? `?service=${encodeURIComponent(service)}` : ''}`

/**
 * Where the old WordPress URL /<location>/schedule/ goes (app/[location]/schedule/route.ts): the
 * location's booking page whenever one is set (valid https), else the survey. The visitor's UTM tags
 * and click IDs come along; the survey also keeps the rest of the query string.
 */
export function scheduleTarget(location: Pick<Location, 'slug' | 'schedulingUrl'>, search = ''): string {
  const booking = httpsUrl(location.schedulingUrl)
  return booking ? withAttribution(booking, search) : `${estimateHref(location)}${search}`
}

export type Cta = { label: string; href: string; booking: boolean }

// The main CTAs (header, hero, section buttons, service pages, About, warranty, final band) go straight
// to the booking page when the location books online, else to the survey. The floating side tab and the
// phone bar always go to the survey (estimateHref). Booking links carry the visitor's UTM / click IDs
// (components/BookingParams.tsx).
export function getCta(location: CtaLocation, service?: string): Cta {
  const booking = bookingUrl(location)
  return booking
    ? { label: 'Schedule Your FREE Estimate', href: booking, booking: true }
    : { label: 'Get Your FREE Estimate', href: estimateHref(location, service), booking: false }
}

// Anchor on the free-estimate section (CTASection) at the bottom of the location homepage
export const ESTIMATE_ANCHOR = 'estimate'

// Warranty "See What's Covered" link: the per-location Sanity override, else the warranty page.
// Locations on the basic tier (locationType "maintenance": home + free estimate, per the client's list)
// have no warranty page; everyone else links to /<slug>/warranty (or the per-location override)
export const hasWarrantyPage = (location: Pick<Location, 'locationType'>) => location.locationType !== 'maintenance'

// The About page is full tier only too (client's list: "About Page" blank for basic locations)
export const hasAboutPage = (location: Pick<Location, 'locationType'>) => location.locationType !== 'maintenance'

export const getWarrantyHref = (location: Pick<Location, 'slug' | 'warrantyCtaHref' | 'locationType'>) =>
  hasWarrantyPage(location) ? location.warrantyCtaHref?.trim() || `/${location.slug}/warranty` : undefined

export const telHref = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined)

export const servicePages = [
  { key: 'interior', path: 'interior-painting' },
  { key: 'exterior', path: 'exterior-painting' },
  { key: 'cabinet', path: 'cabinet-painting' },
] as const

export function getNavLinks(location: Pick<Location, 'slug' | 'locationType' | 'services'>): NavLink[] {
  const base = `/${location.slug}`
  // Basic tier (client's list): home and free estimate only
  if (location.locationType === 'maintenance') {
    return [
      { label: 'Home', href: base },
      { label: 'Free Estimate', href: `${base}/free-estimate` },
    ]
  }
  return [
    { label: 'Home', href: base },
    ...servicePages.map(({ key, path }) => ({
      label: location.services?.[key]?.title ?? key,
      href: `${base}/${path}`,
    })),
    { label: 'Our Work', href: `${base}/our-work` },
    { label: 'Warranty', href: `${base}/warranty` },
    { label: 'About Us', href: `${base}/about-us` },
  ]
}

/** Footer "Our Services" column: service pages, Our Work, Warranty and About for full tier; Free Estimate for all */
export function footerLinks(location: Pick<Location, 'slug' | 'locationType' | 'services'>): NavLink[] {
  const base = `/${location.slug}`
  const full = location.locationType !== 'maintenance'
  const services = full
    ? servicePages.flatMap(({ key, path }) => {
        const title = location.services?.[key]?.title
        return title ? [{ label: title, href: `${base}/${path}` }] : []
      })
    : []
  return [
    ...services,
    ...(full
      ? [
          { label: 'Our Work', href: `${base}/our-work` },
          ...(hasWarrantyPage(location) ? [{ label: 'Warranty', href: `${base}/warranty` }] : []),
          ...(hasAboutPage(location) ? [{ label: 'About Us', href: `${base}/about-us` }] : []),
        ]
      : []),
    { label: 'Free Estimate', href: estimateHref(location) },
  ]
}

export const formatAddress = (address: Location['address']) =>
  address
    ? [address.street, [[address.city, address.state].filter(Boolean).join(', '), address.zip].filter(Boolean).join(' ')].filter(
        (line): line is string => Boolean(line),
      )
    : []

// Hero subtitle: the "established" line needs both a project count and an opening year;
// until both exist (or when forced to standard) we fall back to the locally-owned line.
export function heroSubtitle(location: Pick<Location, 'address' | 'name' | 'ownerName' | 'projectsCount' | 'ownerSinceYear' | 'heroSubtitleVariant'>) {
  const variant = location.heroSubtitleVariant ?? 'auto'
  const { projectsCount, ownerSinceYear } = location
  if (variant !== 'standard' && projectsCount && ownerSinceYear) {
    const city = cityOrPlace(location)
    return `${city} homeowners have trusted us with ${projectsCount.toLocaleString('en-US')}+ projects since ${ownerSinceYear}.`
  }
  const owner = location.ownerName ? ` by ${location.ownerName}` : ''
  return `Locally owned${owner}, with Sherwin-Williams paints and a 2-year workmanship warranty on every job.`
}
