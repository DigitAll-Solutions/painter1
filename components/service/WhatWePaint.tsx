import { createElement } from 'react'
import { PortableText, type PortableTextComponents } from 'next-sanity'

import SanityImage from '../SanityImage'
import { hotspotPosition } from '@/lib/image'
import type { SurfaceSection } from '@/lib/paint-surfaces'
import { serviceIcon } from '@/lib/service-icons'
import { fillTokenBlocks, fillTokens } from '@/lib/tokens'
import type { Location, Service } from '@/sanity/lib/types'

// 4 items → one row of 4, 6 → two rows of 3, anything else fills the row; 2 columns on tablet, 1 on small phones.
const gridFor = (count: number) =>
  count === 4 ? 'lg:grid-cols-4' : count === 6 ? 'lg:grid-cols-3' : 'lg:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]'

const HEADING_ID = 'what-we-paint'

const sectionText: PortableTextComponents = {
  block: { normal: ({ children }) => <p className="mt-4 text-lg leading-relaxed text-slate-600 first:mt-0">{children}</p> },
  list: { bullet: ({ children }) => <ul className="mt-4 space-y-3 pl-5 text-lg leading-relaxed text-slate-600 marker:text-brand-orange [list-style-type:disc] first:mt-0">{children}</ul> },
  marks: { strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong> },
}

/**
 * One section: H2 "What We Paint", the surface cards as a clickable overview, then one block per
 * surface with an H3 that is just its name (#siding, #trim-doors…). No other H2 in between.
 */
export default function WhatWePaint({ service, location, surfaces }: { service: Service; location: Location; surfaces: SurfaceSection[] }) {
  if (!surfaces.length) return null
  const cards = surfaces.filter((surface) => surface.card)

  return (
    <section aria-labelledby={HEADING_ID}>
      <div className="bg-mist py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
            <p className="text-sm font-bold tracking-[0.2em] text-cta-dark uppercase">{service.shortName} Services</p>
            <h2 id={HEADING_ID} className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl">
              {service.whatWePaintTitle || 'What We Paint'}
            </h2>
          </div>
          {cards.length > 0 && (
            <ul className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${gridFor(cards.length)}`}>
              {cards.map((surface) => (
                <SurfaceCard key={surface.key} surface={surface} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {surfaces.map((surface, i) => (
        <SurfaceBlock key={surface.key} surface={surface} location={location} flip={i % 2 === 1} tint={i % 2 === 1} />
      ))}
    </section>
  )
}

function SurfaceCard({ surface }: { surface: SurfaceSection }) {
  return (
    // The whole card is clickable (the link stretches over it); its name stays short: "Siding, see details"
    <li className="relative flex flex-col rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70 has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-brand-blue motion-safe:transition hover:shadow-md hover:ring-slate-300">
      <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-navy">
        {createElement(serviceIcon(surface.icon), { className: 'size-6 text-white', 'aria-hidden': true })}
      </span>
      <p className="mt-4 font-extrabold text-ink">{surface.title}</p>
      {surface.description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{surface.description}</p>}
      <a
        href={`#${surface.slug}`}
        className="mt-auto inline-flex items-center justify-center gap-1 pt-4 text-sm font-bold text-brand-blue-text after:absolute after:inset-0 after:rounded-2xl hover:underline focus-visible:outline-none"
      >
        <span className="sr-only">{surface.title}, </span>
        See details
        <span aria-hidden>↓</span>
      </a>
    </li>
  )
}

function SurfaceBlock({ surface, location, flip, tint }: { surface: SurfaceSection; location: Location; flip: boolean; tint: boolean }) {
  const copy = (
    <div>
      {/* Link target: clears the sticky header (h-16 / md:h-20) and takes focus after the jump */}
      <h3 id={surface.slug} tabIndex={-1} className="scroll-mt-24 text-3xl font-extrabold tracking-tight text-balance focus:outline-none md:scroll-mt-28 md:text-4xl">
        {surface.title}
      </h3>
      <span className="mt-5 block h-1.5 w-24 rounded-full bg-brand-orange" aria-hidden />
      <div className="mt-6">
        {surface.body ? (
          <PortableText value={fillTokenBlocks(surface.body, location)} components={sectionText} />
        ) : (
          surface.text
            ?.split(/\n\s*\n/)
            .map((paragraph, i) => (
              <p key={i} className="mt-4 text-lg leading-relaxed text-slate-600 first:mt-0">
                {fillTokens(paragraph.trim(), location)}
              </p>
            ))
        )}
      </div>
    </div>
  )

  return (
    <div className={`py-16 md:py-20 ${tint ? 'bg-mist' : 'bg-white'}`}>
      {surface.image ? (
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
          <div className={`relative aspect-4/3 overflow-hidden rounded-3xl bg-mist shadow-[0_20px_50px_-20px_rgb(11_27_51/0.35)] ${flip ? 'lg:order-last' : ''}`}>
            <SanityImage image={surface.image} fill sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" style={{ objectPosition: hotspotPosition(surface.image) }} />
          </div>
          {copy}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-4">{copy}</div>
      )}
    </div>
  )
}
