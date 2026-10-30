// node --test: GTM container per location: only a bare container ID loads, one container per page
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { gtmId, locationGtmId } from './gtm.ts'

test('only a bare GTM-XXXXXXX ID is accepted; scripts, URLs and junk are ignored', () => {
  assert.equal(gtmId('GTM-PVDK2ZFJ'), 'GTM-PVDK2ZFJ')
  assert.equal(gtmId('  GTM-ABC1234 '), 'GTM-ABC1234')
  for (const bad of [
    '',
    '   ',
    null,
    undefined,
    'gtm-pvdk2zfj',
    'PVDK2ZFJ',
    'G-1234567890',
    'GTM-',
    'GTM-PVDK2ZFJ\'); alert(1); //',
    '<script>(function(w,d,s,l,i){})(window,document,"script","dataLayer","GTM-PVDK2ZFJ");</script>',
    'https://www.googletagmanager.com/gtm.js?id=GTM-PVDK2ZFJ',
  ]) {
    assert.equal(gtmId(bad), undefined, String(bad))
  }
})

test("a location's own container replaces the site-wide one, never adds to it", () => {
  assert.equal(locationGtmId('GTM-KNOX123', 'GTM-PVDK2ZFJ'), 'GTM-KNOX123')
  assert.equal(locationGtmId(undefined, 'GTM-PVDK2ZFJ'), 'GTM-PVDK2ZFJ')
  assert.equal(locationGtmId('', 'GTM-PVDK2ZFJ'), 'GTM-PVDK2ZFJ')
  // An invalid value saved through the API (Studio validation bypassed) falls back, it never loads
  assert.equal(locationGtmId('<script>', 'GTM-PVDK2ZFJ'), 'GTM-PVDK2ZFJ')
  assert.equal(locationGtmId(undefined, undefined), undefined)
  assert.equal(locationGtmId(undefined, 'not-an-id'), undefined)
})
