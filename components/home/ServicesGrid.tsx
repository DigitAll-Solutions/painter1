import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import Section from '../Section'
import SanityImage from '../SanityImage'
import { servicePages } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

export default function ServicesGrid({ location }: { location: Location }) {
  const linkable = location.locationType !== 'maintenance'
  const services = servicePages.flatMap(({ key, path }) => {
    const service = location.services?.[key]
    return service ? [{ ...service, href: `/${location.slug}/${path}` }] : []
  })

  return (
    <Section className="bg-slate-50" eyebrow="Our services" title={`Painting Services in ${location.address?.city ?? location.name}`}>
      <ul className="grid gap-6 md:grid-cols-3">
        {services.map((service) => {
          const image = service.images?.[0]
          return (
            <li key={service.href} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-lg">
              {image && (
                <div className="overflow-hidden">
                  <SanityImage
                    image={image}
                    aspect={4 / 3}
                    sizes="(min-width: 768px) 400px, 100vw"
                    className="aspect-4/3 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl font-bold">{service.title}</h3>
                {service.summary && <p className="mt-2 flex-1 text-slate-600">{service.summary}</p>}
                {linkable && (
                  <Link href={service.href} className="mt-5 inline-flex items-center justify-center gap-1.5 self-start rounded-lg border-2 border-brand-blue px-4 py-2 font-bold text-brand-blue-text transition-colors group-hover:bg-brand-blue group-hover:text-white after:absolute after:inset-0">
                    Learn More <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    <span className="sr-only">about {service.title}</span>
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
