import JsonLd from './JsonLd'
import ReviewCards from './ReviewCards'
import Section from './Section'
import { reviewSchema, serviceReviews } from '@/lib/reviews'
import { absoluteUrl } from '@/lib/site'
import type { Location, ServiceTag } from '@/sanity/lib/types'

type Props = {
  location: Location
  tag: Exclude<ServiceTag, 'general'>
  serviceName: string
  path: string
}

// Reviews tagged for one service page, with Service + Review schema. Hidden when none match.
export default function ServiceReviews({ location, tag, serviceName, path }: Props) {
  const reviews = serviceReviews(location, tag)
  if (!reviews.length) return null

  return (
    <Section eyebrow="Real Google Reviews" title={`What ${location.address?.city ?? ''} Homeowners Say`}>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: serviceName,
          url: absoluteUrl(path),
          provider: { '@id': `${absoluteUrl(`/${location.slug}`)}#business` },
          areaServed: location.address?.city,
          review: reviews.map(reviewSchema),
        }}
      />
      <ReviewCards reviews={reviews} />
    </Section>
  )
}
