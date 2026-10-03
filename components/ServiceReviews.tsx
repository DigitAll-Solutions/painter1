import ReviewCards from './ReviewCards'
import Section from './Section'
import type { Review } from '@/sanity/lib/types'

type Props = { reviews: Review[]; title: string }

// Review cards for a service page; the page picks the reviews and puts them in its Service JSON-LD.
export default function ServiceReviews({ reviews, title }: Props) {
  if (!reviews.length) return null
  return (
    <Section eyebrow="Real Google Reviews" title={title}>
      <ReviewCards reviews={reviews} />
    </Section>
  )
}
