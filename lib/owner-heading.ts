import type { Location } from '@/sanity/lib/types'

import { cityOrPlace } from './place.ts'

/**
 * "Why {city} Homeowners Call {first name} First": the owner section heading on the homepage and every
 * service page. Same for owner-led and owner-with-team locations. City falls back to the place part of the
 * location's name (lib/place.ts); without an owner name there is no owner card, so no heading (null).
 */
export function ownerHeading(location: Pick<Location, 'ownerName' | 'address' | 'name'>) {
  const first = location.ownerName?.trim().split(/\s+/)[0]
  if (!first) return null
  return { city: cityOrPlace(location), first }
}
