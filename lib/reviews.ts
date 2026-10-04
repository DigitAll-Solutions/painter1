import type { Location, Review } from '@/sanity/lib/types'

const newestFirst = (a: Review, b: Review) => (b.reviewDate ?? '').localeCompare(a.reviewDate ?? '')

/** Most recent reviews for the homepage */
export const homepageReviews = (location: Location, count = 4) => [...(location.reviews ?? [])].sort(newestFirst).slice(0, count)

/** True when a review isn't tied to any specific service (no service refs, and no legacy tag other than "general") */
const isGeneralReview = (review: Review) =>
  !review.services?.length && (!review.serviceTag || review.serviceTag === 'general')

/**
 * Reviews for a service page: the newest ones tagged with the service. When fewer than `count`
 * are tagged, the rest are filled only with general reviews, never with reviews about a different
 * service, and `tagged` is false (the page then uses a general heading). Can return fewer than
 * `count`, or none, in which case the section hides.
 */
export function serviceReviews(location: Location, serviceId: string, count = 3) {
  const all = [...(location.reviews ?? [])].sort(newestFirst)
  const tagged = all.filter((review) => review.services?.includes(serviceId))
  if (tagged.length >= count) return { reviews: tagged.slice(0, count), tagged: true }
  const general = all.filter(isGeneralReview)
  return { reviews: [...tagged, ...general].slice(0, count), tagged: false }
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
