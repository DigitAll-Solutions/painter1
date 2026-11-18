// node --test: "City and state only" hides the street and ZIP; service cities in search data are "City, ST"
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Location } from '@/sanity/lib/types'

import { areaServedCities, cityOnly, publicAddress } from './nap.ts'

const address = { street: '1 Main St', city: 'Mauldin', state: 'SC', zip: '29662' }

test('publicAddress: full by default, city and state only when hidden', () => {
  assert.deepEqual(publicAddress({ address }), address)
  assert.deepEqual(publicAddress({ address, addressDisplay: 'full' }), address)
  const hidden = publicAddress({ address, addressDisplay: 'cityState' })
  assert.deepEqual(hidden, { city: 'Mauldin', state: 'SC' })
  assert.doesNotMatch(JSON.stringify(hidden), /Main St|29662/)
  assert.equal(publicAddress({ addressDisplay: 'cityState' }), undefined)
})

test('areaServedCities: adds the office state to a city without one, keeps "City, ST" as is', () => {
  const location = { address, serviceCities: ['Greenville', ' Greer,  SC ', 'Spartanburg, SC', '', 'Charlotte, NC'] } as Location
  assert.deepEqual(areaServedCities(location), ['Greenville, SC', 'Greer, SC', 'Spartanburg, SC', 'Charlotte, NC'])
  assert.deepEqual(areaServedCities({ serviceCities: ['Greenville'] } as Location), ['Greenville'])
  assert.deepEqual(areaServedCities({} as Location), [])
})

test('cityOnly', () => {
  assert.equal(cityOnly('Greenville, SC'), 'Greenville')
  assert.equal(cityOnly('Mauldin'), 'Mauldin')
})
