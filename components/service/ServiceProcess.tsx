import Link from 'next/link'
import { PortableText, type PortableTextComponents } from 'next-sanity'
import { Hammer, Palette, ShieldCheck } from 'lucide-react'

import Section from '../Section'
import { getWarrantyHref } from '@/lib/location'
import { fillTokens } from '@/lib/tokens'
import type { Location, Service } from '@/sanity/lib/types'

const DEFAULT_WARRANTY_BODY =
  "Every job gets the same written warranty: if paint we applied peels, blisters, or flakes within two years, we'll come back and fix it, labor and materials included."

const text: PortableTextComponents = {
  block: { normal: ({ children }) => <p className="mt-3 leading-relaxed text-slate-600">{children}</p> },
  marks: { strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong> },
}

const card = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8'
const cardTitle = 'flex items-center gap-2.5 text-lg font-extrabold text-ink'

export default function ServiceProcess({ location, service }: { location: Location; service: Service }) {
  const fill = (value: string) => fillTokens(value, location)
  const bullets = service.prepBullets ?? []

  return (
    <Section
      eyebrow="What's Included"
      title={`Our ${service.title} Process`}
      intro={service.processIntro ? fill(service.processIntro) : undefined}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className={card}>
          <h3 className={cardTitle}>
            <Hammer className="size-5 text-brand-orange" aria-hidden /> Prep Work
          </h3>
          {service.prepIntro && <p className="mt-3 leading-relaxed text-slate-600">{fill(service.prepIntro)}</p>}
          {bullets.length > 0 && (
            <ul className="mt-4 space-y-2 pl-5 text-slate-600 marker:text-brand-orange [list-style-type:disc]">
              {bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>

        <div className={card}>
          <h3 className={cardTitle}>
            <Palette className="size-5 text-brand-orange" aria-hidden /> Paint &amp; Materials
          </h3>
          {service.materialsBody && <PortableText value={service.materialsBody} components={text} />}
          {service.materialsBlocks?.map((block) => (
            <div key={block._key} className="mt-5">
              <h4 className="font-bold text-ink">{block.title}</h4>
              {block.body && (
                <div className="-mt-2">
                  <PortableText value={block.body} components={text} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navy warranty banner. Link orange-300 on navy is about 8:1; the button orange (#B9520A) would only reach 2.9:1 here. */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-navy p-6 text-white sm:flex-row sm:items-start sm:gap-5 md:p-8">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cta">
          <ShieldCheck className="size-6 text-white" aria-hidden />
        </span>
        <div>
          <h3 className="text-lg font-extrabold">Backed by Our 2-Year Workmanship Warranty</h3>
          <p className="mt-2 leading-relaxed text-slate-300">
            {fill(service.warrantyBannerBody || DEFAULT_WARRANTY_BODY)}{' '}
            <Link href={getWarrantyHref(location)} className="font-bold whitespace-nowrap text-orange-300 underline-offset-4 hover:underline">
              See full warranty details →
            </Link>
          </p>
        </div>
      </div>
    </Section>
  )
}
