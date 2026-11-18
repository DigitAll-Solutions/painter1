// Name, address and service area as the site shows them (footer, search data, descriptions). Studio
// "Show the address as" → "City and state only" (home-based owners whose Google Business Profile hides
// the address): the street and ZIP never appear. LOCATION_QUERY already leaves them out; this is the
// second guard. Tested in nap.test.ts.
import type { Location } from '@/sanity/lib/types'

type Address = NonNullable<Location['address']>

/** The address the site may show: city and state only when the location hides its street */
export function publicAddress(location: Pick<Location, 'address' | 'addressDisplay'>): Address | undefined {
  const address = location.address
  if (!address) return undefined
  return location.addressDisplay === 'cityState' ? { city: address.city, state: address.state } : address
}

/** Service cities for search data, each "City, ST": a city without a state gets the office state */
export function areaServedCities(location: Pick<Location, 'serviceCities' | 'address'>): string[] {
  const state = location.address?.state?.trim()
  return (location.serviceCities ?? [])
    .map((city) => city.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((city) => (city.includes(',') || !state ? city : `${city}, ${state}`))
}

/** "Greenville, SC" → "Greenville" */
export const cityOnly = (city: string) => city.split(',')[0].trim()
