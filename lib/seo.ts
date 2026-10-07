import { homepageReviews, reviewSchema } from './reviews'
import { absoluteUrl } from './site'
import { urlFor } from '@/sanity/lib/image'
import type { Location, Review } from '@/sanity/lib/types'

export const cityName = (location: Location) =>
  [location.address?.city, location.address?.state].filter(Boolean).join(', ') || location.name

const MAX_DESCRIPTION = 160

/**
 * Homepage meta description from location data, used when the location has no metaDescription.
 * Drops the owner clause, then the phone, if needed to stay within 160 characters.
 */
export function autoHomeDescription(location: Location) {
  const place = cityName(location)
  const services = location.locationType === 'maintenance' ? 'residential painting' : 'interior, exterior and cabinet painting'
  const owner = location.ownerName ? ` Locally owned by ${location.ownerName}.` : ''
  const phone = location.phone ? ` Free estimate: ${location.phone}.` : ' Free estimates.'
  const base = `${location.name}: ${services} in ${place}.`
  const candidates = [`${base}${owner}${phone}`, `${base}${phone}`, base]
  return candidates.find((text) => text.length <= MAX_DESCRIPTION) ?? base.slice(0, MAX_DESCRIPTION)
}

/** "[Service] in [City] | Painter1" */
export const pageTitle = (service: string, location: Location) => `${service} in ${cityName(location)} | Painter1`

/** The location's LocalBusiness (HousePainter) node, without reviews; also used as a Service provider */
export function businessNode(location: Location) {
  const url = absoluteUrl(`/${location.slug}`)
  const social = Object.values(location.socialLinks ?? {}).filter(Boolean)

  return {
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

export function localBusinessSchema(location: Location) {
  const reviews = homepageReviews(location)
  return {
    '@context': 'https://schema.org',
    ...businessNode(location),
    review: reviews.length ? reviews.map(reviewSchema) : undefined,
  }
}

/** schema.org Service offered by the location, with the reviews tagged for it */
export function serviceSchema({ location, name, path, description, reviews }: { location: Location; name: string; path: string; description?: string; reviews: Review[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType: name,
    url: absoluteUrl(path),
    description,
    areaServed: { '@type': 'City', name: location.address?.city ?? location.name },
    provider: businessNode(location),
    review: reviews.length ? reviews.map(reviewSchema) : undefined,
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
  }
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
  }
}
