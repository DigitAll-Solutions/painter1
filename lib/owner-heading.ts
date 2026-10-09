import type { Location } from '@/sanity/lib/types'

/**
 * "Why {city} Homeowners Call {first name} First": the owner section heading on the homepage and every
 * service page. Same for owner-led and owner-with-team locations. City falls back to the location's
 * name; without an owner name there is no owner card, so no heading (null).
 */
export function ownerHeading(location: Pick<Location, 'ownerName' | 'address' | 'name'>) {
  const first = location.ownerName?.trim().split(/\s+/)[0]
  if (!first) return null
  return { city: location.address?.city?.trim() || location.name, first }
}
