import type { MetadataRoute } from 'next'

import { absoluteUrl } from '@/lib/site'
import { getLocationPages, getServiceSlugs } from '@/sanity/lib/fetch'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [locations, services] = await Promise.all([getLocationPages(), getServiceSlugs()])
  return locations.flatMap(({ slug, locationType }) => [
    { url: absoluteUrl(`/${slug}`), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: absoluteUrl(`/${slug}/free-estimate`), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: absoluteUrl(`/${slug}/privacy-policy`), changeFrequency: 'yearly' as const, priority: 0.2 },
    // Service pages and Our Work exist for every location except maintenance ones (filter views aren't listed)
    ...(locationType === 'maintenance'
      ? []
      : [
          ...services.map((service) => ({ url: absoluteUrl(`/${slug}/${service}`), changeFrequency: 'monthly' as const, priority: 0.8 })),
          { url: absoluteUrl(`/${slug}/our-work`), changeFrequency: 'monthly' as const, priority: 0.7 },
        ]),
  ])
}
