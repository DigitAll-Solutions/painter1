import { cache } from 'react'

import { client } from './client'
import { LOCATION_PAGES_QUERY, LOCATION_QUERY, LOCATION_SLUGS_QUERY, SERVICE_QUERY, SERVICE_SLUGS_QUERY } from './queries'
import type { Location, Service } from './types'

const revalidate = 60

export const getLocation = cache(async (slug: string) =>
  client.fetch<Location | null>(LOCATION_QUERY, { slug }, { next: { revalidate, tags: ['location'] } }),
)

export const getLocationSlugs = () =>
  client.fetch<string[]>(LOCATION_SLUGS_QUERY, {}, { next: { revalidate, tags: ['location'] } })

/** Slug and type of every location, for the sitemap */
export const getLocationPages = () =>
  client.fetch<{ slug: string; locationType?: Location['locationType'] }[]>(LOCATION_PAGES_QUERY, {}, { next: { revalidate, tags: ['location'] } })

export const getService = cache(async (slug: string) =>
  client.fetch<Service | null>(SERVICE_QUERY, { slug }, { next: { revalidate, tags: ['service'] } }),
)

export const getServiceSlugs = () =>
  client.fetch<string[]>(SERVICE_SLUGS_QUERY, {}, { next: { revalidate, tags: ['service'] } })
