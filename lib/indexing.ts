// What search engines may index. Only the production domain is indexable, and on it only the live
// locations (LIVE_LOCATIONS). painter1.vercel.app, any *.vercel.app preview, staging hosts and localhost
// get noindex (robots.txt Disallow + X-Robots-Tag), so the staging copy and locations Rick is still
// filling in never reach Google, while Rick can still preview them. Tested in indexing.test.ts.
import { LIVE_LOCATIONS } from './legacy-redirects.ts'

/** Hosts that may be indexed (the apex redirects to www on Vercel) */
export const PRODUCTION_HOSTS = ['www.painter1.com', 'painter1.com'] as const

/** next.config `missing` host value: matches the production hosts only (Next anchors it) */
export const PRODUCTION_HOST_PATTERN = '(?:www\\.)?painter1\\.com'

/** The Host header (port and case ignored) is the production domain */
export function isProductionHost(host: string | null | undefined): boolean {
  const name = host?.trim().toLowerCase().replace(/:\d+$/, '')
  return Boolean(name && (PRODUCTION_HOSTS as readonly string[]).includes(name))
}

/** The location is live on the production domain: in the sitemap and indexable */
export const isLiveLocation = (slug: string) => (LIVE_LOCATIONS as readonly string[]).includes(slug)
