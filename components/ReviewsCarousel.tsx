import { Star } from 'lucide-react'

import type { Testimonial } from '@/sanity/lib/types'

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : undefined

// Swipeable row on phones, grid from tablet up.
export default function ReviewsCarousel({ reviews }: { reviews: Testimonial[] }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
      {reviews.map((review) => (
        <li
          key={review._key}
          className="flex w-[85%] shrink-0 snap-center flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:w-auto"
        >
          <div className="flex text-yellow-400" role="img" aria-label={`${review.rating ?? 5} out of 5 stars`}>
            {Array.from({ length: review.rating ?? 5 }, (_, i) => (
              <Star key={i} className="size-5 fill-current" aria-hidden />
            ))}
          </div>
          <blockquote className="mt-4 flex-1 text-slate-700">
            <p className="line-clamp-7">&ldquo;{review.text}&rdquo;</p>
          </blockquote>
          <footer className="mt-5 border-t border-slate-100 pt-4">
            <p className="font-bold">{review.name}</p>
            <p className="text-sm text-slate-500">
              {[review.source && `${review.source} review`, review.location, formatDate(review.date)].filter(Boolean).join(' · ')}
            </p>
          </footer>
        </li>
      ))}
    </ul>
  )
}
