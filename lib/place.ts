// The place a location serves, for titles and copy ("Painters in {place}"). A location's city when it
// has one; until the city is filled in (new locations), the place part of its name ("Upstate SC" from
// "Painter1 of Upstate SC"), never the full name, so nothing reads "Painters in Painter1 of …" or
// "Painter1 of Painter1 of …". Tested in place.test.ts.
import type { Location } from '@/sanity/lib/types'

/** "Painter1 of Upstate SC" → "Upstate SC"; "Painter1 Inland Northwest" → "Inland Northwest"; others as is */
export function placeFromName(name?: string | null): string {
  const trimmed = (name ?? '').replace(/\s+/g, ' ').trim()
  return trimmed.replace(/^Painter1(?:\s+of)?\s+(?=\S)/i, '').trim() || trimmed
}

/** The city, or the place part of the name when there's no city yet */
export const cityOrPlace = (location: Pick<Location, 'address' | 'name'>) => location.address?.city?.trim() || placeFromName(location.name)

/** "City, ST" when the address has them, else the place part of the name */
export const cityStateOrPlace = (location: Pick<Location, 'address' | 'name'>) =>
  [location.address?.city?.trim(), location.address?.state?.trim()].filter(Boolean).join(', ') || placeFromName(location.name)
