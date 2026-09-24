import { MapPin } from 'lucide-react'

import Section from '../Section'
import type { Location } from '@/sanity/lib/types'

export default function ServiceAreas({ location }: { location: Location }) {
  const home = location.address?.city
  // The home city is already in the heading, so list the surrounding cities.
  const cities = (location.serviceCities ?? []).filter((city) => !home || !city.startsWith(`${home},`))
  if (!cities.length) return null

  return (
    <Section
      className="bg-slate-50"
      eyebrow="Areas we serve"
      title={`Serving ${home ?? location.name} and Surrounding Areas`}
    >
      <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cities.map((city) => (
          <li key={city} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3.5 font-semibold shadow-sm ring-1 ring-slate-200">
            <MapPin className="size-4 shrink-0 text-brand-orange" aria-hidden />
            {city}
          </li>
        ))}
      </ul>
    </Section>
  )
}
