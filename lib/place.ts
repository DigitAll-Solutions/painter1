// The place a location serves, for titles and copy ("Painters in {place}"). Its market name when set
// ("Upstate SC", for an owner whose office is in a small town at the edge of the area); else its city;
// until the city is filled in (new locations), the place part of its name ("Upstate SC" from
// "Painter1 of Upstate SC"), never the full name, so nothing reads "Painters in Painter1 of …" or
// "Painter1 of Painter1 of …". Tested in place.test.ts.
import type { Location } from '@/sanity/lib/types'

/** "Painter1 of Upstate SC" → "Upstate SC"; "Painter1 Inland Northwest" → "Inland Northwest"; others as is */
export function placeFromName(name?: string | null): string {
  const trimmed = (name ?? '').replace(/\s+/g, ' ').trim()
  return trimmed.replace(/^Painter1(?:\s+of)?\s+(?=\S)/i, '').trim() || trimmed
}

type Place = Pick<Location, 'address' | 'name' | 'marketName'>

/** The market name, when the location has one */
export const marketName = (location: Pick<Location, 'marketName'>) => location.marketName?.replace(/\s+/g, ' ').trim() || undefined

/** The market name, else the city, else the place part of the name */
export const cityOrPlace = (location: Place) => marketName(location) || location.address?.city?.trim() || placeFromName(location.name)

/** The market name, else "City, ST" when the address has them, else the place part of the name */
export const cityStateOrPlace = (location: Place) =>
  marketName(location) || [location.address?.city?.trim(), location.address?.state?.trim()].filter(Boolean).join(', ') || placeFromName(location.name)
