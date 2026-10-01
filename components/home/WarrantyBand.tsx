import CtaButton from '../CtaButton'
import SanityImage from '../SanityImage'
import { getWarrantyHref } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

// Defaults for every location; each can be overridden in Sanity (Warranty & privacy group)
const DEFAULT_COPY = {
  eyebrow: '2 Year Workmanship Warranty',
  heading: 'Coverage You Get in Writing',
  body: "If paint we applied peels, blisters, or flakes within two years, we'll come back and fix it, labor and materials included. Every residential and commercial job gets the same written warranty, backed by the local Painter1 owner who did your job.",
  button: "See What's Covered",
}
const DEFAULT_GRAPHIC = '/warranty-graphic-B-fandeck.svg'

export default function WarrantyBand({ location }: { location: Location }) {
  if (location.locationType === 'maintenance') return null

  const eyebrow = location.warrantyEyebrow || DEFAULT_COPY.eyebrow
  const heading = location.warrantyHeading || DEFAULT_COPY.heading
  const body = location.warrantyBody || DEFAULT_COPY.body
  const button = location.warrantyButtonLabel || DEFAULT_COPY.button

  return (
    <section className="relative overflow-hidden bg-[#0587cf] text-white">
      <div className="lg:grid lg:grid-cols-2">
        {/* Copy comes first so it stays on top when stacked; the darker panel keeps white text at AA */}
        <div className="relative z-10 bg-brand-blue-dark lg:col-start-2 lg:[clip-path:ellipse(95%_120%_at_100%_50%)]">
          <div className="mx-auto w-full max-w-xl px-4 py-16 md:py-24 lg:mr-auto lg:ml-0 lg:pr-20 lg:pl-20">
            <p className="text-sm font-bold tracking-[0.2em] uppercase">{eyebrow}</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-balance md:text-5xl">{heading}</h2>
            <p className="mt-6 text-lg leading-relaxed">{body}</p>
            <CtaButton
              href={getWarrantyHref(location)}
              size="md"
              className="mt-9 text-sm tracking-[0.15em] uppercase focus-visible:outline-white"
            >
              {button}
            </CtaButton>
          </div>
        </div>
      </div>

      {/* Fan-deck pivots from the bottom-left corner, so crop from there; on desktop it runs under the curve */}
      <div className="relative aspect-2/1 lg:absolute lg:inset-y-0 lg:left-0 lg:aspect-auto lg:w-[60%]">
        {location.warrantyGraphic ? (
          <SanityImage
            image={location.warrantyGraphic}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover object-bottom-left"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimize
          <img
            src={DEFAULT_GRAPHIC}
            alt=""
            width={800}
            height={400}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover object-bottom-left"
          />
        )}
      </div>
    </section>
  )
}
