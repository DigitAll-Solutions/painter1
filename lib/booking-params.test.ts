// node --test: booking links carry the visitor's UTM tags and ad click IDs (current page first, else the
// ones the session landed with), without touching the rest of the booking URL.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { pickAttribution, withAttribution } from './booking-params.ts'

const BOOK = 'https://appointment.painter1.com/knoxville'

test('the current page\'s UTMs and click IDs are added; other params are not', () => {
  const search = '?utm_source=google&utm_medium=cpc&utm_campaign=fall+sale&gclid=abc123&service=exterior&fbclid='
  assert.deepEqual(pickAttribution(search), { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'fall sale', gclid: 'abc123' })
  assert.equal(withAttribution(BOOK, search), `${BOOK}?utm_source=google&utm_medium=cpc&utm_campaign=fall+sale&gclid=abc123`)
})

test('no params on this page: the ones the session landed with', () => {
  assert.equal(withAttribution(BOOK, '', { utm_source: 'facebook', fbclid: 'x1' }), `${BOOK}?utm_source=facebook&fbclid=x1`)
  // The current page wins over the stored landing params
  assert.equal(withAttribution(BOOK, '?utm_source=bing&msclkid=m1', { utm_source: 'facebook' }), `${BOOK}?utm_source=bing&msclkid=m1`)
})

test('nothing to add: the booking URL unchanged; its own params and hash are kept', () => {
  assert.equal(withAttribution(BOOK, ''), BOOK)
  assert.equal(withAttribution(`${BOOK}?location=7#top`, '?utm_source=google'), `${BOOK}?location=7&utm_source=google#top`)
  assert.equal(withAttribution(`${BOOK}?utm_source=old`, '?utm_source=google'), `${BOOK}?utm_source=google`)
})
