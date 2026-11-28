import CtaButton from '../CtaButton'
import SanityImage from '../SanityImage'
import { hotspotPosition } from '@/lib/image'
import { getWarrantyHref } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

// Defaults for every location; each can be overridden in Sanity (Warranty & privacy group)
const DEFAULT_COPY = {
  eyebrow: '2 Year Workmanship Warranty',
  heading: 'Coverage You Get in Writing',
  body: "If paint we applied peels, blisters, or flakes within two years, we'll come back and fix it at no labor charge. Every residential and commercial job gets the same written warranty, backed by the local Painter1 owner who did your job.",
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
  const graphic = location.warrantyGraphic

  // Background matches the fan-deck SVG so they blend; #047bc0 keeps white text at 4.57:1 (WCAG AA)
  const warrantyHref = getWarrantyHref(location)
  const copy = (
    <>
      <p className="text-sm font-bold tracking-[0.2em] uppercase">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-balance md:text-5xl">{heading}</h2>
      <p className="mt-6 text-lg leading-relaxed">{body}</p>
      {/* Basic-tier locations have no warranty page: no button */}
      {warrantyHref && (
        <CtaButton href={warrantyHref} size="md" className="mt-9 text-sm tracking-[0.15em] uppercase focus-visible:outline-white">
          {button}
        </CtaButton>
      )}
    </>
  )
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

      {graphic ? (
        // An uploaded graphic (Studio "Homepage warranty: graphic", any size or shape): its own box, never under
        // the copy. Stacked above the copy on phones; beside it from tablet up, left of the photo on desktop.
        <div
          className={`relative mx-auto flex w-full max-w-xl flex-col items-center gap-10 px-4 py-16 md:max-w-none md:flex-row md:gap-12 md:px-8 md:py-24 ${
            photo ? 'lg:ml-0 lg:w-[64%] xl:w-[58%]' : 'lg:max-w-5xl'
          }`}
        >
          <div className="relative h-56 w-full max-w-xs shrink-0 md:h-72 md:w-2/5 md:max-w-sm" aria-hidden>
            <SanityImage image={graphic} alt="" fill sizes="(min-width: 768px) 384px, 320px" className="object-contain" />
          </div>
          <div className="w-full min-w-0 md:max-w-lg md:flex-1">{copy}</div>
        </div>
      ) : (
        <div className="relative isolate">
          {/* Decorative fan-deck, pivoting from below the bottom-left corner and bleeding off the left edge.
              Hidden on mobile, where it would run under the copy. */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 -z-10 hidden aspect-2/1 w-[59vw] -translate-x-[10%] md:block lg:w-[42vw] xl:w-[61vw]"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimize */}
            <img src={DEFAULT_GRAPHIC} alt="" width={800} height={400} loading="lazy" decoding="async" className="absolute inset-0 size-full" />
          </div>

          <div
            className={`mx-auto w-full max-w-xl px-4 py-16 md:mr-0 md:ml-[32%] md:max-w-lg md:px-8 md:py-24 ${
              photo ? 'lg:ml-[21%] lg:w-[42%] lg:max-w-none xl:ml-[30%] xl:w-[30%]' : 'lg:mx-auto lg:max-w-xl'
            }`}
          >
            {copy}
          </div>
        </div>
      )}
    </section>
  )
}
