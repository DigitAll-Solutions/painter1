import type { ReactNode } from 'react'

import BeforeAfterSlider from './BeforeAfterSlider'
import CtaButton from './CtaButton'
import GallerySlider from './GallerySlider'
import SanityImage from './SanityImage'
import { TITLE_BAND, type TransformationPair } from '@/lib/gallery'
import { hotspotPosition } from '@/lib/image'
import type { SanityImage as SanityImageType } from '@/sanity/lib/types'

type Props = {
  /** A single pair (homepage) … */
  before?: SanityImageType
  after?: SanityImageType
  /** … or a service's pairs; takes precedence over before/after */
  pairs?: TransformationPair[]
  /** Load the first pair eagerly (it sits right under the hero) */
  eagerFirst?: boolean
  /** Accessible name of the row of pairs, e.g. "Cabinet transformations in Knoxville" */
  rowLabel?: string
  heading: ReactNode
  body: string
  cta?: { href: string; label: ReactNode }
}

const ROW_SIZES = '(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw'

// "See The Transformation". One pair: slider beside the copy (or the copy alone when there's no pair,
// so there is never an empty slider). Two or more: the copy on top, then a row of before/after cards
// (4 / 2 / 1 per view) with manual arrows; only each card's handle drags, so swiping scrolls the row.
export default function TransformationBlock({ before, after, pairs, eagerFirst, rowLabel, heading, body, cta }: Props) {
  const sizes = '(min-width: 1024px) 640px, 100vw'
  const all = pairs ?? (before && after ? [{ key: 'pair', before, after, title: '' }] : [])
  const loading = eagerFirst ? 'eager' : undefined

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

  if (all.length > 1) {
    const cards = all.map((pair, i) => (
      <div key={pair.key} className="relative">
        <BeforeAfterSlider
          handleOnly
          label={pair.title || `Project ${i + 1}`}
          className="aspect-4/3"
          before={<SanityImage image={pair.before} fill sizes={ROW_SIZES} loading={i === 0 ? loading : undefined} className="object-cover" style={{ objectPosition: hotspotPosition(pair.before) }} draggable={false} />}
          after={<SanityImage image={pair.after} fill sizes={ROW_SIZES} loading={i === 0 ? loading : undefined} className="object-cover" style={{ objectPosition: hotspotPosition(pair.after) }} draggable={false} />}
        />
        {pair.title && (
          <p className={`pointer-events-none absolute inset-x-0 bottom-0 rounded-b-3xl px-4 pt-10 pb-3 text-sm font-semibold text-white ${TITLE_BAND}`}>{pair.title}</p>
        )}
      </div>
    ))
    return (
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="max-w-3xl">{copy}</div>
          <div className="mt-10 md:mt-12">
            <GallerySlider label={rowLabel ?? 'Before and after projects'} slides={cards} perView={4} noun={['before/after pair', 'before/after pairs']} />
          </div>
        </div>
      </section>
    )
  }

  const [pair] = all
  return (
    <section className="bg-white py-16 md:py-24">
      {pair ? (
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
          <BeforeAfterSlider
            className="aspect-4/3"
            label={pair.title || undefined}
            before={<SanityImage image={pair.before} fill sizes={sizes} loading={loading} className="object-cover" draggable={false} />}
            after={<SanityImage image={pair.after} fill sizes={sizes} loading={loading} className="object-cover" draggable={false} />}
          />
          {copy}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-4">{copy}</div>
      )}
    </section>
  )
}
