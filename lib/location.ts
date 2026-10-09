import type { Location } from '@/sanity/lib/types'

export type NavLink = { label: string; href: string }

type CtaLocation = Pick<Location, 'slug' | 'hasScheduling' | 'schedulingUrl' | 'bookingTarget'>

/** The location's online booking page, when scheduling is on and the URL is set (https only) */
export const bookingUrl = (location: CtaLocation) =>
  location.hasScheduling && location.schedulingUrl?.startsWith('https://') ? location.schedulingUrl : undefined

// Every CTA on a location site points at its free-estimate survey, or straight at the booking page
// when the location has scheduling, chose "Booking page directly" and the booking URL is set.
// `service` (interior | exterior | cabinet) preselects the survey's first question.
export function getCta(location: CtaLocation, service?: string) {
  const booking = location.bookingTarget === 'booking' ? bookingUrl(location) : undefined
  return {
    label: location.hasScheduling ? 'Schedule Your FREE Estimate' : 'Get Your FREE Estimate',
    href: booking ?? `/${location.slug}/free-estimate${service ? `?service=${encodeURIComponent(service)}` : ''}`,
  }
}

// Anchor on the free-estimate section (CTASection) at the bottom of the location homepage
export const ESTIMATE_ANCHOR = 'estimate'

// Warranty "See What's Covered" link: the per-location Sanity override, else the warranty page.
// Locations on the basic tier (locationType "maintenance": home + free estimate, per the client's list)
// have no warranty page; everyone else links to /<slug>/warranty (or the per-location override)
export const hasWarrantyPage = (location: Pick<Location, 'locationType'>) => location.locationType !== 'maintenance'

export const getWarrantyHref = (location: Pick<Location, 'slug' | 'warrantyCtaHref' | 'locationType'>) =>
  hasWarrantyPage(location) ? location.warrantyCtaHref?.trim() || `/${location.slug}/warranty` : undefined

export const telHref = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined)

export const servicePages = [
  { key: 'interior', path: 'interior-painting' },
  { key: 'exterior', path: 'exterior-painting' },
  { key: 'cabinet', path: 'cabinet-refinishing' },
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
    // About Us (full tier in the client's list) returns once /<slug>/about-us exists: it would 404 today
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
    const city = location.address?.city ?? location.name
    return `${city} homeowners have trusted us with ${projectsCount.toLocaleString('en-US')}+ projects since ${ownerSinceYear}.`
  }
  const owner = location.ownerName ? ` by ${location.ownerName}` : ''
  return `Locally owned${owner}, with Sherwin-Williams paints and a 2-year workmanship warranty on every job.`
}
