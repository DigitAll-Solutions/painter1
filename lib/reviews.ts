import type { Location, Review } from '@/sanity/lib/types'

const newestFirst = (a: Review, b: Review) => (b.reviewDate ?? '').localeCompare(a.reviewDate ?? '')

/** Most recent reviews for the homepage */
export const homepageReviews = (location: Location, count = 4) => [...(location.reviews ?? [])].sort(newestFirst).slice(0, count)

/**
 * Reviews for a service page: the newest ones tagged with the service. When fewer than `count`
 * are tagged, the rest are filled with the location's latest reviews and `tagged` is false
 * (the page then uses a general heading instead of claiming they are all about this service).
 */
export function serviceReviews(location: Location, serviceId: string, count = 3) {
  const all = [...(location.reviews ?? [])].sort(newestFirst)
  const tagged = all.filter((review) => review.services?.includes(serviceId))
  if (tagged.length >= count) return { reviews: tagged.slice(0, count), tagged: true }
  const rest = all.filter((review) => !tagged.includes(review))
  return { reviews: [...tagged, ...rest].slice(0, count), tagged: false }
}

/** schema.org Review for JSON-LD */
export const reviewSchema = (review: Review) => ({
  '@type': 'Review',
  author: { '@type': 'Person', name: review.reviewerName },
  datePublished: review.reviewDate,
  reviewBody: review.reviewText,
  reviewRating: { '@type': 'Rating', ratingValue: review.rating ?? 5, bestRating: 5, worstRating: 1 },
  ...(review.source ? { publisher: { '@type': 'Organization', name: review.source } } : {}),
})
