import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import { isProductionHost } from '@/lib/indexing'
import { absoluteUrl } from '@/lib/site'

// WordPress's own rules (Yoast block of www.painter1.com/robots.txt, Oct 30, 2026): kept, since every
// painter1.com path except ours is still WordPress (lib/wordpress-proxy.ts) and this file replaces its
// robots.txt. Its `/*?*` would also block our query-string images; the longer Allow rules win for those.
const WORDPRESS_DISALLOW = ['/*?*', '/?*', '*/page/*']

// Keyed on the host: the production domain is crawlable; painter1.vercel.app, previews and staging
// hosts disallow everything (lib/indexing.ts), so the staging copy never gets indexed.
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (!isProductionHost((await headers()).get('host'))) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: ['/', '/_next/', '/sanity-img/'], disallow: ['/studio', ...WORDPRESS_DISALLOW] },
    // Ours (live locations) and WordPress's (Yoast; everything still on WordPress)
    sitemap: [absoluteUrl('/sitemap.xml'), absoluteUrl('/sitemap_index.xml')],
  }
}
