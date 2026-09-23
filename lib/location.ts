import type { Location } from '@/sanity/lib/types'

export type NavLink = { label: string; href: string }

// Every CTA on a location site points at its free-estimate page, which embeds the
// scheduler when the location has one and shows the contact form otherwise.
export function getCta(location: Pick<Location, 'slug' | 'hasScheduling'>) {
  return {
    label: location.hasScheduling ? 'Schedule Your FREE Estimate' : 'Get Your FREE Estimate',
    href: `/${location.slug}/free-estimate`,
  }
}

export const telHref = (phone?: string) => (phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined)

export const servicePages = [
  { key: 'interior', path: 'interior-painting' },
  { key: 'exterior', path: 'exterior-painting' },
  { key: 'cabinet', path: 'cabinet-refinishing' },
] as const

export function getNavLinks(location: Pick<Location, 'slug' | 'locationType' | 'services'>): NavLink[] {
  const base = `/${location.slug}`
  if (location.locationType === 'maintenance') {
    return [
      { label: 'Home', href: base },
      { label: 'About Us', href: `${base}/about-us` },
    ]
  }
  return [
    { label: 'Home', href: base },
    ...servicePages.map(({ key, path }) => ({
      label: location.services?.[key]?.title ?? key,
      href: `${base}/${path}`,
    })),
    { label: 'Our Work', href: `${base}/our-work` },
    { label: 'About Us', href: `${base}/about-us` },
    { label: 'Reviews', href: `${base}/reviews` },
    { label: 'Warranty', href: `${base}/warranty` },
  ]
}

export const formatAddress = (address: Location['address']) =>
  address
    ? [address.street, [[address.city, address.state].filter(Boolean).join(', '), address.zip].filter(Boolean).join(' ')].filter(
        (line): line is string => Boolean(line),
      )
    : []
