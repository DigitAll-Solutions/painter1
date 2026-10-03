import type { ReactNode } from 'react'

import BeforeAfterSlider from './BeforeAfterSlider'
import CtaButton from './CtaButton'
import SanityImage from './SanityImage'
import type { SanityImage as SanityImageType } from '@/sanity/lib/types'

type Props = {
  before?: SanityImageType
  after?: SanityImageType
  heading: ReactNode
  /** h1 when the page has no other H1 (service page with the page header hidden) */
  headingLevel?: 'h1' | 'h2'
  body: string
  cta?: { href: string; label: ReactNode }
  /** First image on the page: fetch the slider photos eagerly, preloading the one underneath */
  priority?: boolean
}

// "See The Transformation": before/after slider beside the copy, or the copy alone when the
// pair is missing, so there is never an empty slider.
export default function TransformationBlock({ before, after, heading, headingLevel = 'h2', body, cta, priority }: Props) {
  const Heading = headingLevel
  const sizes = '(min-width: 1024px) 640px, 100vw'
  const slider = before && after

  const copy = (
    <div>
      <p className="text-sm font-bold tracking-[0.2em] text-cta uppercase">See The Transformation</p>
      <Heading className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl">{heading}</Heading>
      <span className="mt-5 block h-1.5 w-24 rounded-full bg-brand-orange" aria-hidden />
      <p className="mt-6 text-lg leading-relaxed text-slate-600">{body}</p>
      {cta && (
        <CtaButton href={cta.href} className="mt-8">
          {cta.label}
        </CtaButton>
      )}
    </div>
  )

  return (
    <section className="bg-white py-16 md:py-24">
      {slider ? (
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
          <BeforeAfterSlider
            className="aspect-4/3"
            before={
              <SanityImage image={before} fill sizes={sizes} loading={priority ? 'eager' : undefined} className="object-cover" draggable={false} />
            }
            after={<SanityImage image={after} fill sizes={sizes} preload={priority} className="object-cover" draggable={false} />}
          />
          {copy}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-4">{copy}</div>
      )}
    </section>
  )
}
