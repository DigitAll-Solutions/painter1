import CtaButton from '../CtaButton'
import SanityImage from '../SanityImage'
import { hotspotPosition } from '@/lib/image'
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
  const photo = location.warrantyImage

  // Background matches the fan-deck SVG so they blend; #047bc0 keeps white text at 4.57:1 (WCAG AA)
  return (
    <section className="relative flex flex-col overflow-hidden bg-[#047bc0] text-white lg:block">
      {/* Photo: on top with a curved bottom on mobile, a band with a curved top on tablet,
          and on desktop the right-hand column masked by a large ellipse */}
      {photo && (
        <div className="relative aspect-4/3 [clip-path:ellipse(150%_100%_at_50%_0%)] md:order-last md:aspect-12/5 md:[clip-path:ellipse(150%_100%_at_50%_100%)] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[36%] lg:[clip-path:ellipse(95%_120%_at_100%_50%)] xl:w-[42%]">
          <SanityImage
            image={photo}
            fill
            // object-cover in a tall column draws a 3:2 photo at ~1.5x the section height (~600px), not the column width
            sizes="(min-width: 2140px) 42vw, (min-width: 1024px) 900px, (min-width: 768px) 100vw, 113vw"
            className="object-cover"
            style={{ objectPosition: hotspotPosition(photo) }}
          />
        </div>
      )}

      <div className="relative isolate">
        {/* Decorative fan-deck, pivoting from below the bottom-left corner and bleeding off the left edge.
            Hidden on mobile, where it would run under the copy. */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 -z-10 hidden aspect-2/1 w-[59vw] -translate-x-[10%] md:block lg:w-[42vw] xl:w-[61vw]"
          aria-hidden
        >
          {location.warrantyGraphic ? (
            <SanityImage image={location.warrantyGraphic} alt="" fill sizes="61vw" className="object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimize
            <img src={DEFAULT_GRAPHIC} alt="" width={800} height={400} loading="lazy" decoding="async" className="absolute inset-0 size-full" />
          )}
        </div>

        <div
          className={`mx-auto w-full max-w-xl px-4 py-16 md:mr-0 md:ml-[32%] md:max-w-lg md:px-8 md:py-24 ${
            photo ? 'lg:ml-[21%] lg:w-[42%] lg:max-w-none xl:ml-[30%] xl:w-[30%]' : 'lg:mx-auto lg:max-w-xl'
          }`}
        >
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
    </section>
  )
}
