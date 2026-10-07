import Section from '../Section'
import { serviceIcon } from '@/lib/service-icons'
import type { Service } from '@/sanity/lib/types'

// 4 items → one row of 4, 6 → two rows of 3, anything else fills the row; 2 columns on tablet, 1 on small phones.
const gridFor = (count: number) =>
  count === 4 ? 'lg:grid-cols-4' : count === 6 ? 'lg:grid-cols-3' : 'lg:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]'

export default function WhatWePaint({ service }: { service: Service }) {
  const items = service.whatWePaint ?? []
  if (!items.length) return null

  return (
    <Section eyebrow={`${service.shortName} Services`} eyebrowClassName="text-cta-dark" title={service.whatWePaintTitle || 'What We Paint'} className="bg-mist">
      <ul className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${gridFor(items.length)}`}>
        {items.map((item) => {
          const Icon = serviceIcon(item.icon)
          return (
            <li key={item._key} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200/70">
              <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-navy">
                <Icon className="size-6 text-white" aria-hidden />
              </span>
              <h3 className="mt-4 font-extrabold text-ink">{item.title}</h3>
              {item.description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
