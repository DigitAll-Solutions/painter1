import type { Location, Review, ServiceTag } from '@/sanity/lib/types'

const newestFirst = (a: Review, b: Review) => (b.reviewDate ?? '').localeCompare(a.reviewDate ?? '')

/** Most recent reviews for the homepage */
export const homepageReviews = (location: Location, count = 4) => [...(location.reviews ?? [])].sort(newestFirst).slice(0, count)

/** Most recent reviews tagged for one service page; empty when none match */
export const serviceReviews = (location: Location, tag: Exclude<ServiceTag, 'general'>, count = 3) =>
  (location.reviews ?? []).filter((review) => review.serviceTag === tag).sort(newestFirst).slice(0, count)

/** schema.org Review for JSON-LD */
export const reviewSchema = (review: Review) => ({
  '@type': 'Review',
  author: { '@type': 'Person', name: review.reviewerName },
  datePublished: review.reviewDate,
  reviewBody: review.reviewText,
  reviewRating: { '@type': 'Rating', ratingValue: review.rating ?? 5, bestRating: 5, worstRating: 1 },
  ...(review.source ? { publisher: { '@type': 'Organization', name: review.source } } : {}),
})
