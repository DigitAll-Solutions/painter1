// node --test: old WordPress URLs of live locations 308 to the right page, and no rule ever matches a URL
// of a location that is still on WordPress (or our own pages). Uses Next's own path matcher.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'

import { LIVE_LOCATIONS, legacyRedirects } from './legacy-redirects.ts'

const { pathToRegexp } = createRequire(import.meta.url)('next/dist/compiled/path-to-regexp') as {
  pathToRegexp: (path: string, keys: { name: string | number }[], options: object) => RegExp
}

/** Where `path` is redirected (first matching rule, like Next.js), or undefined */
function resolve(path: string, rules = legacyRedirects()) {
  for (const rule of rules) {
    const keys: { name: string | number }[] = []
    // Next.js matches custom routes with these options (strict, case-insensitive, '/' delimiter)
    const match = pathToRegexp(rule.source, keys, { strict: true, sensitive: false, delimiter: '/' }).exec(path)
    if (!match) continue
    const params = Object.fromEntries(keys.map((key, i) => [key.name, match[i + 1]]))
    return { status: rule.permanent ? 308 : 307, to: rule.destination.replace(/:(\w+)\*?/g, (_, name: string) => params[name] ?? '') }
  }
  return undefined
}

test('Knoxville: every confirmed old URL goes to its new page, permanently', () => {
  const cases: [string, string][] = [
    ['/knoxville/cabinet-refinishing', '/knoxville/cabinet-painting'],
    ['/knoxville/cabinet-painting-and-refinishing', '/knoxville/cabinet-painting'],
    ['/knoxville/home-siding-painting', '/knoxville/exterior-painting#siding'],
    ['/knoxville/stucco-painting', '/knoxville/exterior-painting#stucco'],
    ['/knoxville/brick-painting', '/knoxville/exterior-painting#brick'],
    ['/knoxville/deck-painting-and-staining', '/knoxville/exterior-painting#decks'],
    ['/knoxville/fence-painting-and-staining', '/knoxville/exterior-painting#fences'],
    ['/knoxville/residential-painting', '/knoxville'],
    ['/knoxville/painters-alcoa-tn', '/knoxville'],
    ['/knoxville/painters-oliver-springs-tn', '/knoxville'],
    ['/knoxville/cities-we-serve', '/knoxville'],
    ['/knoxville/cities-we-serve/farragut', '/knoxville'],
    ['/knoxville/maryville', '/knoxville'],
    ['/knoxville/pigeon-forge', '/knoxville'],
    ['/knoxville/contact', '/knoxville/free-estimate'],
    ['/knoxville/estimate', '/knoxville/free-estimate'],
    ['/knoxville/services', '/knoxville'],
    ['/knoxville/services/business', '/knoxville'],
    ['/knoxville/blog', '/knoxville'],
    ['/knoxville/blog/how-to-pick-paint', '/knoxville'],
    ['/knoxville/locations', '/knoxville'],
    ['/knoxville/professional-painting-services-gaw-1', '/knoxville/free-estimate'],
    ['/knoxville/professional-painting-services-gaw-1/thank-you', '/knoxville/free-estimate'],
    ['/knoxville/reviews', '/knoxville#reviews'],
    ['/knoxville/reviews/page/2', '/knoxville#reviews'],
  ]
  for (const [from, to] of cases) assert.deepEqual(resolve(from), { status: 308, to }, from)
})

test('never matches the other locations still on WordPress', () => {
  for (const slug of ['atlanta', 'miami', 'north-georgia', 'knoxville-north', 'knox']) {
    for (const page of ['home-siding-painting', 'brick-painting', 'cabinet-refinishing', 'reviews', 'reviews/x', 'contact', 'estimate', 'services', 'blog', 'painters-alcoa-ga', 'cities-we-serve', 'residential-painting', 'professional-painting-services-gaw-1', 'maryville', 'locations']) {
      assert.equal(resolve(`/${slug}/${page}`), undefined, `/${slug}/${page}`)
    }
  }
})

test('never matches our own pages, the Studio, the API, /schedule (a route) or #4 items still to confirm', () => {
  const ours = ['/knoxville', '/knoxville/exterior-painting', '/knoxville/interior-painting', '/knoxville/cabinet-painting', '/knoxville/free-estimate', '/knoxville/our-work', '/knoxville/about-us', '/knoxville/warranty', '/knoxville/privacy-policy', '/studio', '/studio/structure', '/api/revalidate', '/sitemap.xml']
  const later = ['/knoxville/commercial-painting', '/knoxville/masonry-coating-and-waterproofing', '/knoxville/concrete-staining', '/knoxville/popcorn-ceiling-removal', '/knoxville/wallpaper-removal', '/knoxville/schedule']
  for (const path of [...ours, ...later]) assert.equal(resolve(path), undefined, path)
})

test('every rule is permanent and scoped to the live locations; none when no location is live', () => {
  const rules = legacyRedirects()
  assert.equal(rules.length, 18)
  for (const rule of rules) {
    assert.equal(rule.permanent, true)
    assert.ok(rule.source.startsWith(`/:location(${LIVE_LOCATIONS.join('|')})/`) || rule.source.startsWith('/knoxville/'), rule.source)
  }
  assert.deepEqual(legacyRedirects([]), [])
  // A second live location gets the generic rules, not Knoxville's city names
  const two = legacyRedirects(['knoxville', 'miami'])
  assert.deepEqual(resolve('/miami/brick-painting', two), { status: 308, to: '/miami/exterior-painting#brick' })
  assert.equal(resolve('/miami/maryville', two), undefined)
})
