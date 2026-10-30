// painter1.com behind Vercel, WordPress behind it (docs/go-live-plan.md, option (a)). On the painter1.com
// hosts, this site serves the live locations (LIVE_LOCATIONS) and its own paths; every other request (the
// WordPress home, corporate pages, the other locations, the blog, /wp-admin, /wp-json, uploads…) is
// proxied, invisibly, to the same WordPress install at wp.painter1.com, path and query unchanged.
// painter1.vercel.app, previews and localhost don't proxy: there every Sanity location keeps rendering,
// so Rick can still preview the ones he is filling in. Tested in wordpress-proxy.test.ts.
import { LIVE_LOCATIONS } from './legacy-redirects.ts'

/** The WordPress origin (wp-config trusts X-Forwarded-Host from Vercel; docs/launch-rehearsal.md) */
export const WORDPRESS_ORIGIN = (process.env.WORDPRESS_ORIGIN?.trim() || 'https://wp.painter1.com').replace(/\/$/, '')

/** next.config `has` host value: www, the apex (Vercel redirects it to www) and the staging rehearsal host */
export const WORDPRESS_PROXY_HOST_PATTERN = '(?:www\\.|staging\\.)?painter1\\.com'

/** First path segments this app serves besides the live locations (robots.txt, sitemap.xml and public/ files are served before the proxy) */
export const OWN_PATHS = ['studio', 'api', '_next', '_vercel', 'sanity-img'] as const

/** `/:path(…)`: every path whose first segment isn't a live location or one of OWN_PATHS, `/` included */
export const wordpressSource = (slugs: readonly string[] = LIVE_LOCATIONS) => `/:path((?!(?:${[...slugs, ...OWN_PATHS].join('|')})(?:/|$)).*)`

const onProxyHosts = [{ type: 'host' as const, value: WORDPRESS_PROXY_HOST_PATTERN }]

/**
 * afterFiles rewrite, so it runs after our files (public/, robots.txt, sitemap.xml) and before the dynamic
 * [location] route, which would otherwise answer /atlanta/… with our 404 (`fallback` runs too late).
 */
export function wordpressRewrites(slugs: readonly string[] = LIVE_LOCATIONS) {
  return [{ source: wordpressSource(slugs), has: onProxyHosts, destination: `${WORDPRESS_ORIGIN}/:path` }]
}

/** Never cache WordPress responses on Vercel's CDN: a WordPress edit shows exactly as today (its own page cache still works) */
export function wordpressHeaders(slugs: readonly string[] = LIVE_LOCATIONS) {
  return [{ source: wordpressSource(slugs), has: onProxyHosts, headers: [{ key: 'x-vercel-enable-rewrite-caching', value: '0' }] }]
}
