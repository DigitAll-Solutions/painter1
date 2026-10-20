import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { isProductionHost } from '@/lib/indexing'
import { absoluteUrl } from '@/lib/site'

// Keyed on the host: the production domain is crawlable; painter1.vercel.app, previews and staging
// hosts disallow everything (lib/indexing.ts), so the staging copy never gets indexed.
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!isProductionHost((await headers()).get('host'))) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/studio' },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
