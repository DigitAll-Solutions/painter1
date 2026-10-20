// node --test: only the production domain is indexable, and on it only live locations; every other host
// (painter1.vercel.app, previews, staging, localhost) is noindex.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isLiveLocation, isProductionHost, PRODUCTION_HOST_PATTERN } from './indexing.ts'

const production = ['www.painter1.com', 'painter1.com', 'WWW.Painter1.com', 'www.painter1.com:443']
const others = ['painter1.vercel.app', 'painter1-git-seed-locations-digitall.vercel.app', 'staging.painter1.com', 'wp.painter1.com', 'localhost:3000', 'www.painter1.com.evil.com', 'painter1.com.vercel.app', '', null, undefined]

test('robots.txt: only the production hosts are crawlable', () => {
  for (const host of production) assert.equal(isProductionHost(host), true, String(host))
  for (const host of others) assert.equal(isProductionHost(host), false, String(host))
})

test('X-Robots-Tag: the next.config `missing` host pattern spares exactly the production hosts', () => {
  // Next.js matches host conditions as ^value$ against the lowercased host without its port
  const matcher = new RegExp(`^${PRODUCTION_HOST_PATTERN}$`)
  const hostname = (host: string) => host.split(':', 1)[0].toLowerCase()
  for (const host of production) assert.equal(matcher.test(hostname(host)), true, host)
  for (const host of others.filter((h): h is string => Boolean(h))) assert.equal(matcher.test(hostname(host)), false, host)
})

test('only LIVE_LOCATIONS are live: sitemap and indexing', () => {
  assert.equal(isLiveLocation('knoxville'), true)
  for (const slug of ['upstate', 'north-georgia', 'portland', 'knoxville-north', '']) assert.equal(isLiveLocation(slug), false, slug)
})
