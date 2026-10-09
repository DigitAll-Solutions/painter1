import SanityImage from '../SanityImage'
import { ownerHeading } from '@/lib/owner-heading'
import type { Location } from '@/sanity/lib/types'

type Props = { location: Location; variant?: 'featured' | 'compact' }

// Owner card on service pages: H2 "Why {city} Homeowners Call {owner} First" (every variant), then the
// owner's name line (H3). The quote is only ever the owner's own recorded words (location.ownerQuote);
// without one the card shows just the name line. Compact: no photo, "Guaranteed by the owner".
export default function OwnerCard({ location, variant = 'featured' }: Props) {
  const heading = ownerHeading(location)
  if (!heading) return null

  const fullName = location.ownerName!.trim()
  const featured = variant === 'featured'
  const photo = featured ? (location.ownerPhoto ?? location.ownerActionPhoto) : undefined

  return (
    <section className="bg-mist py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-cta-dark uppercase">Why choose us</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl">
            Why {heading.city} Homeowners Call {heading.first} First
          </h2>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border-l-4 border-brand-orange bg-white p-6 shadow-[0_20px_50px_-24px_rgb(11_27_51/0.3)] sm:flex-row sm:items-center md:p-8">
          {photo && (
            <SanityImage
              image={photo}
              aspect={6 / 5}
              width={240}
              sizes="(min-width: 640px) 192px, calc(100vw - 5rem)"
              className="aspect-6/5 w-full shrink-0 rounded-xl object-cover sm:w-48"
            />
          )}
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
              {fullName} — Owner, {location.name}
            </h3>
            {!featured && <p className="mt-1 text-sm font-bold tracking-[0.12em] text-cta uppercase">Guaranteed by the owner</p>}
            {location.ownerQuote && (
              <blockquote className="mt-4 text-lg leading-relaxed text-slate-600 italic">&ldquo;{location.ownerQuote}&rdquo;</blockquote>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
