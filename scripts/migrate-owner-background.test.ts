// node --test: the migration rebuilds exactly the sentence the owner card showed before Nov 26, and a re-run changes nothing
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { migratedBackground } from './migrate-owner-background.ts'

const knoxville = { name: 'Painter1 of Knoxville', ownerName: 'Keith Lane', ownerSinceYear: '2020', ownerBackground: '23 years in home improvement and remodeling' }

test('fragment → the full sentence the page showed', () => {
  assert.equal(migratedBackground(knoxville), 'Keith opened Painter1 of Knoxville in 2020 after 23 years in home improvement and remodeling.')
  assert.equal(migratedBackground({ ...knoxville, ownerSinceYear: undefined }), 'Keith opened Painter1 of Knoxville after 23 years in home improvement and remodeling.')
})

test('re-run, empty field or no owner name: unchanged', () => {
  const once = migratedBackground(knoxville)!
  assert.equal(migratedBackground({ ...knoxville, ownerBackground: once }), null)
  assert.equal(migratedBackground({ ...knoxville, ownerBackground: undefined }), null)
  assert.equal(migratedBackground({ ...knoxville, ownerName: ' ' }), null)
})
