import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import Section, { Accent } from '../Section'
import SanityImage from '../SanityImage'
import { servicePages } from '@/lib/location'
import type { Location, ServiceDetail } from '@/sanity/lib/types'

// Tall cards need the sharpest photo the service has
const bestImage = (images: ServiceDetail['images']) =>
  images?.reduce((best, img) =>
    (img.asset.metadata?.dimensions?.width ?? 0) > (best.asset.metadata?.dimensions?.width ?? 0) ? img : best,
  )

export default function ServicesGrid({ location }: { location: Location }) {
  const linkable = location.locationType !== 'maintenance'
  const city = location.address?.city ?? location.name
  const services = servicePages.flatMap(({ key, path }) => {
    const service = location.services?.[key]
    return service ? [{ ...service, href: `/${location.slug}/${path}`, image: bestImage(service.images) }] : []
  })

  return (
    <Section
      title={
        <>
          Painting Services in <Accent>{city}</Accent>
        </>
      }
    >
      <ul className="service-cards grid gap-4 md:grid-cols-3 lg:flex lg:h-136">
        {services.map((service) => (
          <li
            key={service.href}
            className="group relative isolate flex min-h-104 flex-col justify-end overflow-hidden rounded-3xl bg-ink text-white shadow-lg lg:min-h-0"
          >
            {service.image && (
              <SanityImage
                image={service.image}
                fill
                sizes="(min-width: 1024px) 720px, (min-width: 768px) 33vw, 100vw"
                className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink/90 via-ink/35 to-ink/0" aria-hidden />
            <div className="p-6 md:p-7">
              <h3 className="text-2xl font-extrabold tracking-tight md:text-3xl">{service.title}</h3>
              {service.summary && <p className="mt-2 line-clamp-3 max-w-md text-white/85">{service.summary}</p>}
              {linkable && (
                <Link
                  href={service.href}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 font-bold text-ink transition-colors after:absolute after:inset-0 hover:bg-brand-blue hover:text-white"
                >
                  Learn More <ArrowRight className="size-4" aria-hidden />
                  <span className="sr-only">about {service.title}</span>
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}
