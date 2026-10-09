import { cache } from 'react'

import { client } from './client'
import { ESTIMATE_SURVEY_QUERY, LOCATION_PAGES_QUERY, PRIVACY_POLICY_QUERY, LOCATION_QUERY, LOCATION_SLUGS_QUERY, SERVICE_KEYS_QUERY, SERVICE_QUERY, SERVICE_SLUGS_QUERY, WARRANTY_TERMS_QUERY } from './queries'
import type { Location, Service, WarrantyTerms } from './types'
import type { PortableTextBlock } from 'next-sanity'
import defaults from '@/lib/estimate-survey-defaults.json'
import type { SurveyContent } from '@/lib/estimate-survey'

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

/** Service document _id → its locationKey (interior | exterior | cabinet) */
export const getServiceKeys = cache(async () => {
  const rows = await client.fetch<{ _id: string; locationKey: string }[]>(SERVICE_KEYS_QUERY, {}, { next: { revalidate, tags: ['service'] } })
  return Object.fromEntries(rows.map((row) => [row._id, row.locationKey])) as Record<string, string>
})

/** Fill every empty field of a survey document from the built-in default copy */
function mergeSurvey(doc: unknown, fallback: unknown): unknown {
  if (Array.isArray(fallback)) return Array.isArray(doc) && doc.length ? doc : fallback
  if (fallback && typeof fallback === 'object') {
    const source = (doc && typeof doc === 'object' ? doc : {}) as Record<string, unknown>
    return Object.fromEntries(Object.entries(fallback).map(([key, value]) => [key, mergeSurvey(source[key], value)]))
  }
  return typeof doc === 'string' && doc.trim() ? doc : fallback
}

export const getEstimateSurvey = cache(async (slug: string) => {
  const doc = await client.fetch<Record<string, unknown> | null>(ESTIMATE_SURVEY_QUERY, { slug }, { next: { revalidate, tags: ['estimateSurvey', 'location'] } })
  return mergeSurvey(doc, defaults) as SurveyContent
})

export const getPrivacyPolicy = cache(async () =>
  client.fetch<{ title?: string; body?: PortableTextBlock[] } | null>(PRIVACY_POLICY_QUERY, {}, { next: { revalidate, tags: ['privacyPolicy'] } }),
)

export const getWarrantyTerms = cache(async () =>
  client.fetch<WarrantyTerms | null>(WARRANTY_TERMS_QUERY, {}, { next: { revalidate, tags: ['warrantyTerms'] } }),
)
