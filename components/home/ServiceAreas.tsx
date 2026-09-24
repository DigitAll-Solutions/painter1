import { MapPin } from 'lucide-react'

import Section, { Accent } from '../Section'
import type { Location } from '@/sanity/lib/types'

export default function ServiceAreas({ location }: { location: Location }) {
  const home = location.address?.city
  // The home city is already in the heading, so list the surrounding cities.
  const cities = (location.serviceCities ?? []).filter((city) => !home || !city.startsWith(`${home},`))
  if (!cities.length) return null

  return (
    <Section
      title={
        <>
          Serving <Accent>{home ?? location.name}</Accent> and Surrounding Areas
        </>
      }
    >
      <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
        {cities.map((city) => (
          <li
            key={city}
            className="flex items-center gap-2 rounded-full bg-mist px-5 py-3 font-bold text-ink ring-1 ring-slate-200 transition-colors hover:bg-brand-blue hover:text-white hover:ring-brand-blue"
          >
            <MapPin className="size-4 shrink-0" aria-hidden />
            {city}
          </li>
        ))}
      </ul>
    </Section>
  )
}
