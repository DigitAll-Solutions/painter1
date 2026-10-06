import type { ReactNode } from 'react'

import BeforeAfterSlider from './BeforeAfterSlider'
import CtaButton from './CtaButton'
import SanityImage from './SanityImage'
import type { SanityImage as SanityImageType } from '@/sanity/lib/types'

type Props = {
  before?: SanityImageType
  after?: SanityImageType
  heading: ReactNode
  body: string
  cta?: { href: string; label: ReactNode }
}

// "See The Transformation": before/after slider beside the copy, or the copy alone when the
// pair is missing, so there is never an empty slider.
export default function TransformationBlock({ before, after, heading, body, cta }: Props) {
  const sizes = '(min-width: 1024px) 640px, 100vw'
  const slider = before && after

  const copy = (
    <div>
      <p className="text-sm font-bold tracking-[0.2em] text-cta uppercase">See The Transformation</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl">{heading}</h2>
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
              <SanityImage image={before} fill sizes={sizes} className="object-cover" draggable={false} />
            }
            after={<SanityImage image={after} fill sizes={sizes} className="object-cover" draggable={false} />}
          />
          {copy}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-4">{copy}</div>
      )}
    </section>
  )
}
