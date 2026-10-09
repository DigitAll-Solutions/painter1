// node --test: the owner card heading on service pages (interior, exterior, cabinet alike)
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ownerHeading } from './owner-heading.ts'

test('owner card heading: city and first name, with fallbacks', () => {
  assert.deepEqual(ownerHeading({ name: 'Painter1 of Knoxville', ownerName: 'Keith Lane', address: { city: 'Knoxville' } }), { city: 'Knoxville', first: 'Keith' })
  // Owner-with-team uses the same heading (franchiseStructure doesn't change it)
  assert.deepEqual(ownerHeading({ name: 'Painter1 of Maryville', ownerName: '  Ana  Ruiz ', address: { city: 'Maryville' } }), { city: 'Maryville', first: 'Ana' })
  // No city: the location name
  assert.deepEqual(ownerHeading({ name: 'Painter1 of Bozeman', ownerName: 'Sam', address: {} }), { city: 'Painter1 of Bozeman', first: 'Sam' })
  // No owner name: no card, no heading
  assert.equal(ownerHeading({ name: 'Painter1 of Miami', ownerName: ' ', address: { city: 'Miami' } }), null)
  assert.equal(ownerHeading({ name: 'Painter1 of Miami' }), null)
})
