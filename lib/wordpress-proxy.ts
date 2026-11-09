// painter1.com behind Vercel, WordPress behind it (docs/go-live-plan.md, option (a)). On the painter1.com
// hosts, this site serves the live locations (LIVE_LOCATIONS) and its own paths; every other request (the
// WordPress home, corporate pages, the other locations, the blog, /wp-admin, /wp-json, uploads…) is
// proxied, invisibly, to the same WordPress install at wp.painter1.com, path and query unchanged.
// painter1.vercel.app, previews and localhost don't proxy: there every Sanity location keeps rendering,
// so Rick can still preview the ones he is filling in. Tested in wordpress-proxy.test.ts.
import { LIVE_LOCATIONS } from './legacy-redirects.ts'

/** The WordPress origin (wp-config.php trusts X-P1-Host only with the right X-P1-Proxy-Key; docs/cloudways-wp-config.md) */
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

/** True when this path goes to WordPress on the proxy hosts: the same rule as wordpressSource */
export function isWordpressPath(pathname: string, slugs: readonly string[] = LIVE_LOCATIONS) {
  const first = (pathname.split('/')[1] ?? '').toLowerCase()
  return !([...slugs, ...OWN_PATHS] as string[]).includes(first)
}

/**
 * Cloudways' nginx overwrites X-Forwarded-Host/-For/X-Real-IP with its own values, so WordPress can't see the
 * visitor's host or IP in them. proxy.ts adds these to every proxied request instead; wp-config.php trusts
 * X-P1-Host only with the right X-P1-Proxy-Key (docs/cloudways-wp-config.md). The visitor's IP reaches
 * WordPress in Vercel's own X-Vercel-Forwarded-For.
 */
export const PROXY_KEY_HEADER = 'x-p1-proxy-key'
export const PROXY_HOST_HEADER = 'x-p1-host'
/** The P1_PROXY_KEY format: 64 hex characters (`openssl rand -hex 32`); wp-config.php checks the same */
export const PROXY_KEY_FORMAT = /^[0-9a-f]{64}$/i

/**
 * The request headers WordPress gets: the visitor's own, minus any X-P1-* they sent, plus the key (from the
 * P1_PROXY_KEY env var; none when it is unset or not 64 hex characters, and WordPress then answers 403)
 * and the host the visitor asked for.
 */
export function wordpressRequestHeaders(incoming: Headers, host: string, key = process.env.P1_PROXY_KEY) {
  const headers = new Headers(incoming)
  headers.delete(PROXY_KEY_HEADER)
  headers.delete(PROXY_HOST_HEADER)
  const proxyKey = key?.trim()
  if (proxyKey && PROXY_KEY_FORMAT.test(proxyKey)) headers.set(PROXY_KEY_HEADER, proxyKey)
  headers.set(PROXY_HOST_HEADER, host.trim().toLowerCase().replace(/:\d+$/, ''))
  return headers
}

/** Never cache WordPress responses on Vercel's CDN: a WordPress edit shows exactly as today (its own page cache still works) */
export function wordpressHeaders(slugs: readonly string[] = LIVE_LOCATIONS) {
  return [{ source: wordpressSource(slugs), has: onProxyHosts, headers: [{ key: 'x-vercel-enable-rewrite-caching', value: '0' }] }]
}
