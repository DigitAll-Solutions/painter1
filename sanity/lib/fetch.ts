import { cache } from 'react'

import { client } from './client'
import { LOCATION_QUERY, LOCATION_SLUGS_QUERY } from './queries'
import type { Location } from './types'

const revalidate = 60

export const getLocation = cache(async (slug: string) =>
  client.fetch<Location | null>(LOCATION_QUERY, { slug }, { next: { revalidate, tags: ['location'] } }),
)

export const getLocationSlugs = () =>
  client.fetch<string[]>(LOCATION_SLUGS_QUERY, {}, { next: { revalidate, tags: ['location'] } })
