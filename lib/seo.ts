import { absoluteUrl } from './site'
import { urlFor } from '@/sanity/lib/image'
import type { Location } from '@/sanity/lib/types'

export const cityName = (location: Location) =>
  [location.address?.city, location.address?.state].filter(Boolean).join(', ') || location.name

/** "[Service] in [City] | Painter1" */
export const pageTitle = (service: string, location: Location) => `${service} in ${cityName(location)} | Painter1`

export function localBusinessSchema(location: Location) {
  const url = absoluteUrl(`/${location.slug}`)
  const social = Object.values(location.socialLinks ?? {}).filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'HousePainter',
    '@id': `${url}#business`,
    name: location.name,
    url,
    telephone: location.phone,
    email: location.email,
    image: location.heroImage ? urlFor(location.heroImage).width(1200).url() : undefined,
    logo: absoluteUrl('/painter1-logo.svg'),
    slogan: location.tagline,
    founder: location.ownerName ? { '@type': 'Person', name: location.ownerName } : undefined,
    address: location.address && {
      '@type': 'PostalAddress',
      streetAddress: location.address.street,
      addressLocality: location.address.city,
      addressRegion: location.address.state,
      postalCode: location.address.zip,
      addressCountry: 'US',
    },
    areaServed: location.serviceCities?.map((name) => ({ '@type': 'City', name })),
    aggregateRating:
      location.rating && location.reviewsCount
        ? { '@type': 'AggregateRating', ratingValue: location.rating, reviewCount: location.reviewsCount, bestRating: 5 }
        : undefined,
    sameAs: social.length ? social : undefined,
  }
}
