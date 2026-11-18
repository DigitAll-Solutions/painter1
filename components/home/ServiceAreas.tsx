import { MapPin } from 'lucide-react'

import Section from '../Section'
import { cityOnly } from '@/lib/nap'
import { marketName } from '@/lib/place'
import type { Location } from '@/sanity/lib/types'

export default function ServiceAreas({ location }: { location: Location }) {
  const home = location.address?.city?.trim()
  // The home city is already in the eyebrow, so list the surrounding cities ("Mauldin" or "Mauldin, SC")
  const cities = (location.serviceCities ?? []).filter((city) => !home || cityOnly(city) !== home)
  if (!cities.length) return null
  const half = Math.ceil(cities.length / 2)
  const rows = [cities.slice(0, half), cities.slice(half)].filter((row) => row.length)

  return (
    <Section
      eyebrow={home ? `Based in ${home}` : undefined}
      eyebrowClassName="text-brand-blue-text"
      title={`Proudly Painting Homes Across ${location.serviceArea ?? marketName(location) ?? home ?? location.name}`}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        {rows.map((row) => (
          <ul key={row[0]} className="flex flex-wrap justify-center gap-3">
            {row.map((city) => (
              <li
                key={city}
                className="group flex items-center gap-2 rounded-full bg-mist px-5 py-3 font-bold text-ink ring-1 ring-slate-200 transition-colors hover:bg-brand-blue hover:text-white hover:ring-brand-blue"
              >
                <MapPin className="size-4 shrink-0 text-brand-blue group-hover:text-white" aria-hidden />
                {city}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </Section>
  )
}
