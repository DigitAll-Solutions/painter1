// node --test: GTM container per location: only a bare container ID loads, one container per page
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { corpGtmId, gtmId, locationGtmId, pageGtmId } from './gtm.ts'

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

const CORP = 'GTM-5LG3XH7S'

test("a location page loads only the location's own container", () => {
  assert.equal(locationGtmId('GTM-PVDK2ZFJ'), 'GTM-PVDK2ZFJ')
  assert.equal(pageGtmId({ gtmId: 'GTM-PVDK2ZFJ' }, CORP), 'GTM-PVDK2ZFJ')
})

test('a location page without its own container loads no GTM: never the corp one (Bozeman, Marietta)', () => {
  for (const own of [undefined, null, '', '   ']) {
    assert.equal(locationGtmId(own), undefined, String(own))
    assert.equal(pageGtmId({ gtmId: own }, CORP), undefined, String(own))
  }
  assert.equal(pageGtmId({}, CORP), undefined)
  // An invalid value saved through the API (Studio validation bypassed) loads nothing either
  assert.equal(pageGtmId({ gtmId: '<script>' }, CORP), undefined)
  assert.equal(pageGtmId({ gtmId: 'gtm-pvdk2zfj' }, CORP), undefined)
})

test('a corp page (no location) loads NEXT_PUBLIC_GTM_ID, if it is a valid ID', () => {
  assert.equal(pageGtmId(null, CORP), CORP)
  assert.equal(pageGtmId(undefined, CORP), CORP)
  assert.equal(corpGtmId(CORP), CORP)
  assert.equal(pageGtmId(null, undefined), undefined)
  assert.equal(pageGtmId(null, ''), undefined)
  assert.equal(pageGtmId(null, 'not-an-id'), undefined)
})

test('every page gets at most one container ID', () => {
  for (const location of [null, undefined, {}, { gtmId: 'GTM-PVDK2ZFJ' }, { gtmId: '' }]) {
    for (const corp of [CORP, undefined]) {
      const id = pageGtmId(location, corp)
      assert.ok(id === undefined || (typeof id === 'string' && gtmId(id) === id), JSON.stringify({ location, corp }))
    }
  }
})
