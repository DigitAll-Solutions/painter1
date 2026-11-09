// node --test: on painter1.com, everything but the live locations and our own paths goes to WordPress,
// path, trailing slash and query unchanged; elsewhere (painter1.vercel.app, previews) nothing does.
// Uses Next's own path matcher, with the options Next.js matches custom routes with.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'

import { config } from '../proxy.ts'
import { LIVE_LOCATIONS } from './legacy-redirects.ts'
import {
  OWN_PATHS,
  PROXY_HOST_HEADER,
  PROXY_KEY_HEADER,
  WORDPRESS_ORIGIN,
  WORDPRESS_PROXY_HOST_PATTERN,
  isWordpressPath,
  wordpressHeaders,
  wordpressRequestHeaders,
  wordpressRewrites,
  wordpressSource,
} from './wordpress-proxy.ts'

const { pathToRegexp } = createRequire(import.meta.url)('next/dist/compiled/path-to-regexp') as {
  pathToRegexp: (path: string, keys: { name: string | number }[], options: object) => RegExp
}

/** The WordPress URL `path` is proxied to on `host`, or undefined when this app serves it */
function proxied(path: string, host = 'www.painter1.com', rules = wordpressRewrites()) {
  // Next.js matches host conditions as ^value$ against the hostname
  const [rule] = rules
  if (!new RegExp(`^${rule.has[0].value}$`).test(host)) return undefined
  const keys: { name: string | number }[] = []
  const match = pathToRegexp(rule.source, keys, { strict: true, sensitive: false, delimiter: '/' }).exec(path)
  return match ? rule.destination.replace(':path', match[1]) : undefined
}

test('WordPress: the home, corporate pages, other locations, blog, admin and API, slash kept', () => {
  const cases = [
    '/',
    '/atlanta/',
    '/atlanta',
    '/atlanta/interior-painting/',
    '/atlanta/our-work',
    '/knoxville-north/',
    '/knox/',
    '/franchise-opportunities/',
    '/blog/how-to-pick-paint/',
    '/wp-admin/',
    '/wp-admin/post.php',
    '/wp-login.php',
    '/wp-json/wp/v2/pages',
    '/wp-admin/admin-ajax.php',
    '/wp-content/uploads/2024/05/photo.jpg',
    '/sitemap-xag.xml',
    '/sitemap-xag-page.xml',
    '/sitemap-xag-post.xml?p=2',
    '/page-sitemap.xml',
    '/favicon.ico',
    '/studios/',
    '/apis',
  ]
  for (const path of cases) assert.equal(proxied(path), `${WORDPRESS_ORIGIN}${path}`, path)
})

test('ours: the live locations (any case, any depth, with or without slash) and our own paths', () => {
  const ours = [
    '/knoxville',
    '/knoxville/',
    '/Knoxville/interior-painting',
    '/knoxville/free-estimate',
    '/knoxville/brick-painting/',
    '/knoxville/schedule',
    '/studio',
    '/studio/structure/locations',
    '/api/revalidate',
    '/_next/static/chunks/main.js',
    '/_vercel/insights/script.js',
    '/sanity-img/abc/image.jpg',
  ]
  for (const path of ours) assert.equal(proxied(path), undefined, path)
})

test('only on www, the apex and staging; never on painter1.vercel.app, previews or localhost', () => {
  for (const host of ['www.painter1.com', 'painter1.com', 'staging.painter1.com']) assert.ok(proxied('/atlanta/', host), host)
  for (const host of ['painter1.vercel.app', 'painter1-git-launch-knoxville-digitall.vercel.app', 'wp.painter1.com', 'localhost', 'www.painter1.com.evil.com', 'evilpainter1.com']) {
    assert.equal(proxied('/atlanta/', host), undefined, host)
  }
  assert.equal(WORDPRESS_PROXY_HOST_PATTERN, wordpressHeaders()[0].has[0].value)
})

test('a second live location is served here, the rest stays WordPress', () => {
  const two = wordpressRewrites(['knoxville', 'miami'])
  assert.equal(proxied('/miami/', 'www.painter1.com', two), undefined)
  assert.equal(proxied('/atlanta/', 'www.painter1.com', two), `${WORDPRESS_ORIGIN}/atlanta/`)
})

test('the CDN never caches WordPress responses, on exactly the proxied paths', () => {
  const [rule] = wordpressHeaders()
  assert.equal(rule.source, wordpressRewrites()[0].source)
  assert.deepEqual(rule.headers, [{ key: 'x-vercel-enable-rewrite-caching', value: '0' }])
})

test("proxy.ts removes the slash on every live location and the Studio (its matcher is literal)", () => {
  for (const slug of LIVE_LOCATIONS) assert.ok(config.matcher.includes(`/${slug}/:path*`), slug)
  assert.ok(config.matcher.includes('/studio/:path*'))
  assert.ok(OWN_PATHS.includes('studio'))
})

test('proxy.ts runs on exactly the proxied paths and hosts (its matcher repeats wordpressSource)', () => {
  const rule = config.matcher.find((m) => typeof m !== 'string')
  assert.deepEqual(rule, { source: wordpressSource(), has: [{ type: 'host', value: WORDPRESS_PROXY_HOST_PATTERN }] })
  for (const path of ['/', '/atlanta/', '/blog/x/?a=1', '/wp-admin/', '/Studio', '/knoxvillex/', '/knoxville', '/knoxville/x/', '/studio/', '/api/estimate', '/_next/x']) {
    assert.equal(isWordpressPath(path.split('?')[0]), proxied(path, 'www.painter1.com') !== undefined, path)
  }
})

test('WordPress gets the proxy key and the visitor host, never ones the visitor sent', () => {
  const key = 'a1'.repeat(32)
  const incoming = new Headers({ [PROXY_KEY_HEADER]: 'forged', [PROXY_HOST_HEADER]: 'evil.com', accept: 'text/html' })
  const sent = wordpressRequestHeaders(incoming, 'Staging.Painter1.com:443', ` ${key} `)
  assert.equal(sent.get(PROXY_KEY_HEADER), key)
  assert.equal(sent.get(PROXY_HOST_HEADER), 'staging.painter1.com')
  assert.equal(sent.get('accept'), 'text/html')
  assert.equal(incoming.get(PROXY_KEY_HEADER), 'forged')
  for (const missing of [undefined, '', 'short', 'k'.repeat(64), 'PASTE_P1_PROXY_KEY_HERE']) {
    const without = wordpressRequestHeaders(incoming, 'www.painter1.com', missing)
    assert.equal(without.get(PROXY_KEY_HEADER), null)
    assert.equal(without.get(PROXY_HOST_HEADER), 'www.painter1.com')
  }
})
