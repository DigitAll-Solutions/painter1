import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/site'
import { getLocationSlugs } from '@/sanity/lib/fetch'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getLocationSlugs()
  return slugs.map((slug) => ({
    url: absoluteUrl(`/${slug}`),
    changeFrequency: 'weekly',
    priority: 0.9,
  }))
}
