import { Quote, Star } from 'lucide-react'

import GoogleIcon from './GoogleIcon'
import type { Review } from '@/sanity/lib/types'

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

// Server-rendered so the full review text is in the page source. Long reviews are
// clamped with CSS only; the text itself is never cut.
export default function ReviewCards({ reviews }: { reviews: Review[] }) {
  const cols = reviews.length >= 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'

  return (
    // Swipeable row on phones: focusable so keyboard users can scroll it too (WCAG scrollable-region-focusable)
    <ul
      tabIndex={0}
      aria-label="Customer reviews"
      className={`-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:gap-6 md:overflow-visible md:px-0 md:pb-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${cols}`}
    >
      {reviews.map((review) => {
        const rating = review.rating ?? 5
        return (
          <li
            key={review._key}
            className="flex w-[85%] shrink-0 snap-center flex-col rounded-3xl bg-mist p-7 shadow-[0_8px_24px_-12px_rgb(11_27_51/0.25)] md:w-auto"
          >
            <article className="flex h-full flex-col">
              <Quote className="size-8 fill-brand-blue/15 text-brand-blue/40" aria-hidden />
              <blockquote className="mt-4 flex-1 text-slate-600">
                <p className="line-clamp-6">&ldquo;{review.reviewText}&rdquo;</p>
              </blockquote>
              <footer className="mt-6 flex items-end justify-between gap-3">
                <div>
                  <div className="flex text-yellow-400" role="img" aria-label={`${rating} out of 5 stars`}>
                    {Array.from({ length: rating }, (_, i) => (
                      <Star key={i} className="size-4 fill-current" aria-hidden />
                    ))}
                  </div>
                  <p className="mt-1.5 font-bold">{review.reviewerName}</p>
                  <p className="text-sm text-slate-600">
                    {review.neighborhoodTag}
                    {review.neighborhoodTag && review.reviewDate && ' · '}
                    {review.reviewDate && <time dateTime={review.reviewDate}>{formatDate(review.reviewDate)}</time>}
                  </p>
                </div>
                {review.source === 'Google' && (
                  <span title="Google review">
                    <GoogleIcon className="size-7 shrink-0" />
                  </span>
                )}
              </footer>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
