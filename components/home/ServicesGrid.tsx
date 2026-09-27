import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import Section, { Accent } from '../Section'
import SanityImage from '../SanityImage'
import { servicePages } from '@/lib/location'
import type { Location, SanityImage as SanityImageType, ServiceDetail } from '@/sanity/lib/types'

// Without a before/after pair, use the sharpest photo the service has
const bestImage = (images: ServiceDetail['images']) =>
  images?.reduce((best, img) =>
    (img.asset.metadata?.dimensions?.width ?? 0) > (best.asset.metadata?.dimensions?.width ?? 0) ? img : best,
  )

const chip = 'absolute top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-white uppercase backdrop-blur'

function CardMedia({ before, after, fallback }: { before?: SanityImageType; after?: SanityImageType; fallback?: SanityImageType }) {
  const sizes = '(min-width: 1024px) 360px, (min-width: 768px) 17vw, 50vw'
  if (before && after) {
    return (
      <div className="grid h-full grid-cols-2 gap-0.5 bg-white">
        <div className="relative">
          <SanityImage image={before} fill sizes={sizes} className="object-cover" />
          <span className={`${chip} left-3`}>Before</span>
        </div>
        <div className="relative">
          <SanityImage image={after} fill sizes={sizes} className="object-cover" />
          <span className={`${chip} right-3`}>After</span>
        </div>
      </div>
    )
  }
  const image = after ?? fallback
  return image ? (
    <SanityImage
      image={image}
      fill
      sizes="(min-width: 1024px) 720px, (min-width: 768px) 33vw, 100vw"
      className="object-cover transition-transform duration-700 group-hover:scale-105"
    />
  ) : null
}

export default function ServicesGrid({ location }: { location: Location }) {
  const linkable = location.locationType !== 'maintenance'
  const city = location.address?.city ?? location.name
  const estimates = location.franchiseStructure === 'owner-led' ? 'owner-led' : 'local'
  const services = servicePages.flatMap(({ key, path }) => {
    const service = location.services?.[key]
    return service ? [{ ...service, href: `/${location.slug}/${path}` }] : []
  })

  return (
    <Section
      title={
        <>
          Painting Services in <Accent>{city}</Accent>
        </>
      }
      intro={`Interior, exterior, and cabinet painting for ${city} homes — Sherwin-Williams paints, ${estimates} estimates, and a 2-year workmanship warranty on every job.`}
    >
      <ul className="service-cards grid gap-5 md:grid-cols-3 lg:flex">
        {services.map((service) => (
          <li
            key={service.href}
            className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_16px_40px_-18px_rgb(11_27_51/0.3)] ring-1 ring-slate-200/70"
          >
            <div className="relative h-56 overflow-hidden bg-mist lg:h-64">
              <CardMedia before={service.beforeImage} after={service.afterImage} fallback={bestImage(service.images)} />
            </div>
            <div className="flex flex-1 flex-col p-6 md:p-7">
              <h3 className="text-2xl font-extrabold tracking-tight">{service.title}</h3>
              {service.summary && <p className="mt-2 text-slate-600">{service.summary}</p>}
              {service.cardBullets?.length ? (
                <ul className="mt-4 space-y-2">
                  {service.cardBullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2.5 font-medium text-ink">
                      <Check className="mt-0.5 size-5 shrink-0 text-brand-orange" strokeWidth={3} aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
              {linkable && (
                <Link
                  href={service.href}
                  className="mt-6 inline-block self-start rounded-xl border-2 border-cta px-4 py-2.5 font-bold text-cta transition-colors after:absolute after:inset-0 hover:bg-cta hover:text-white"
                >
                  {service.title} in {city}
                  <ArrowRight className="ml-1.5 inline size-4 align-[-2px]" aria-hidden />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
