// node --test: without a city, titles and copy use the place part of the location name, never the full
// name ("Painter1 of Painter1 of …", "Painters in Painter1 of …"); with a city, nothing changes.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Location } from '@/sanity/lib/types'

import { aboutMeta } from './about.ts'
import { ownerHeading } from './owner-heading.ts'
import { cityOrPlace, cityStateOrPlace, placeFromName } from './place.ts'
import { fillTokens, tokenValues } from './tokens.ts'
import { warrantyDescription } from './warranty-contact.ts'

const sparse = { name: 'Painter1 of Upstate SC', slug: 'upstate' } as Location
const knoxville = { name: 'Painter1 of Knoxville', slug: 'knoxville', address: { city: 'Knoxville', state: 'TN' }, ownerName: 'Keith Lane' } as Location
const BAD = /Painter1 of Painter1|Painters in Painter1|in Painter1 of|,\s+by|,\s*,/

test('placeFromName: the place part of "Painter1 of …" (and "Painter1 …")', () => {
  assert.equal(placeFromName('Painter1 of Upstate SC'), 'Upstate SC')
  assert.equal(placeFromName('Painter1 of Bryn Mawr/Main Line'), 'Bryn Mawr/Main Line')
  assert.equal(placeFromName('Painter1 Inland Northwest'), 'Inland Northwest')
  assert.equal(placeFromName('  painter1 of   St. George '), 'St. George')
  assert.equal(placeFromName('Upstate'), 'Upstate')
  assert.equal(placeFromName('Painter1'), 'Painter1')
  assert.equal(placeFromName(undefined), '')
})

test('no city: the place; a city (Knoxville): unchanged', () => {
  assert.equal(cityOrPlace(sparse), 'Upstate SC')
  assert.equal(cityStateOrPlace(sparse), 'Upstate SC')
  assert.equal(cityOrPlace({ ...sparse, address: { city: '  ' } } as Location), 'Upstate SC')
  assert.equal(cityOrPlace(knoxville), 'Knoxville')
  assert.equal(cityStateOrPlace(knoxville), 'Knoxville, TN')
})

test('tokens: {city} is the place; an empty {state} takes its comma with it', () => {
  const service = 'Interior painting in {city}, {state} by Painter1. Sherwin-Williams paints.'
  assert.equal(fillTokens(service, sparse), 'Interior painting in Upstate SC by Painter1. Sherwin-Williams paints.')
  assert.equal(fillTokens(service, knoxville), 'Interior painting in Knoxville, TN by Painter1. Sherwin-Williams paints.')
  assert.deepEqual(tokenValues(sparse), { city: 'Upstate SC', state: '', owner: 'our owner' })
})

test('meta descriptions and the owner heading read cleanly without a city or owner', () => {
  const texts = [warrantyDescription(sparse), aboutMeta(sparse, 'owner').description, aboutMeta(sparse, 'owner').title, aboutMeta(sparse, 'team').description]
  for (const text of texts) assert.doesNotMatch(text, BAD, text)
  assert.equal(warrantyDescription(sparse), 'What the two-year workmanship warranty from Painter1 of Upstate SC covers, what it requires, and how to reach Painter1 of Upstate SC with questions.')
  assert.equal(aboutMeta(sparse, 'owner').description, 'Meet the owner of Painter1 of Upstate SC, who gives every estimate, checks every finished job and stands behind the 2-year workmanship warranty.')
  assert.deepEqual(ownerHeading({ ...sparse, ownerName: 'Ann Smith' }), { city: 'Upstate SC', first: 'Ann' })
  // Knoxville unchanged
  assert.equal(aboutMeta(knoxville, 'owner').description, 'Meet Keith Lane, owner of Painter1 of Knoxville, who gives every estimate, checks every finished job and stands behind the 2-year workmanship warranty.')
})
