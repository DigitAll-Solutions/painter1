import { Quote, Star } from 'lucide-react'

import GoogleIcon from './GoogleIcon'
import type { Testimonial } from '@/sanity/lib/types'

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : undefined

// Swipeable row on phones, grid from tablet up.
export default function ReviewsCarousel({ reviews }: { reviews: Testimonial[] }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
      {reviews.map((review) => (
        <li
          key={review._key}
          className="flex w-[85%] shrink-0 snap-center flex-col rounded-3xl bg-mist p-7 shadow-[0_8px_24px_-12px_rgb(11_27_51/0.25)] md:w-auto"
        >
          <Quote className="size-8 fill-brand-blue/15 text-brand-blue/40" aria-hidden />
          <blockquote className="mt-4 flex-1 text-slate-600">
            <p className="line-clamp-6">&ldquo;{review.text}&rdquo;</p>
          </blockquote>
          <footer className="mt-6 flex items-end justify-between gap-3">
            <div>
              <div className="flex text-yellow-400" role="img" aria-label={`${review.rating ?? 5} out of 5 stars`}>
                {Array.from({ length: review.rating ?? 5 }, (_, i) => (
                  <Star key={i} className="size-4 fill-current" aria-hidden />
                ))}
              </div>
              <p className="mt-1.5 font-bold">{review.name}</p>
              {review.date && <p className="text-sm text-slate-500">{formatDate(review.date)}</p>}
            </div>
            {review.source === 'Google' && <GoogleIcon className="size-7 shrink-0" />}
          </footer>
        </li>
      ))}
    </ul>
  )
}
