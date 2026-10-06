import { cache } from 'react'

import { client } from './client'
import { ESTIMATE_SURVEY_QUERY, LOCATION_PAGES_QUERY, LOCATION_QUERY, LOCATION_SLUGS_QUERY, SERVICE_QUERY, SERVICE_SLUGS_QUERY } from './queries'
import type { Location, Service } from './types'
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
