// node --test: What We Paint surfaces from the new (service item) and old (location subServices) data
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { PaintSurface, SanityImage } from '@/sanity/lib/types'

import { paintSurfaces, surfaceSlug } from './paint-surfaces.ts'

const img = (id: string): SanityImage => ({ asset: { _id: `image-${id}` } })
const block = (text: string) => ({ _type: 'block', _key: text.slice(0, 4), children: [{ _type: 'span', text }] })
const cards: PaintSurface[] = [
  { _key: 'a', title: 'Siding', description: 'Wood, vinyl, and aluminum siding.' },
  { _key: 'b', title: 'Trim & Doors', description: 'Eaves, fascia and doors.' },
  { _key: 'c', title: 'Decks', description: 'Deck staining.' },
]
const knoxville = [
  { _key: 's1', title: 'Home Siding Painting', anchor: 'siding', description: 'Revitalize the exterior…', image: img('siding') },
  { _key: 's2', title: 'Stucco Painting', anchor: 'stucco', description: 'Stucco copy' },
]

test('link names: from the title when missing, unique on the page', () => {
  assert.equal(surfaceSlug('Trim & Doors'), 'trim-doors')
  assert.equal(surfaceSlug(' Hardware & upgrades '), 'hardware-upgrades')
  const twice = paintSurfaces([cards[0], { ...cards[0], _key: 'x' }])
  assert.deepEqual(twice.map((s) => s.slug), ['siding', 'siding-2'])
})

test('old data: the location section with the same link name fills the card’s section; others get the card text', () => {
  const sections = paintSurfaces(cards, knoxville)
  assert.deepEqual(
    sections.map((s) => [s.slug, s.title, s.text, s.image?.asset._id, s.card]),
    [
      ['siding', 'Siding', 'Revitalize the exterior…', 'image-siding', true],
      ['trim-doors', 'Trim & Doors', 'Eaves, fascia and doors.', undefined, true],
      ['decks', 'Decks', 'Deck staining.', undefined, true],
      // No Stucco card here: the old section still shows, without a card
      ['stucco', 'Stucco Painting', 'Stucco copy', undefined, false],
    ],
  )
})

test('new data: the surface’s own text wins; an empty text falls back; photo from this location only', () => {
  const sections = paintSurfaces(
    [
      { ...cards[0], slug: 'siding', body: [block('New siding copy')] as never },
      { ...cards[2], slug: 'decks', body: [block('  ')] as never },
    ],
    knoxville,
    [{ _key: 'p1', surface: 'a', image: img('knox-siding-photo') }],
  )
  assert.equal(sections[0].body?.length, 1)
  assert.equal(sections[0].text, undefined)
  assert.equal(sections[0].image?.asset._id, 'image-knox-siding-photo')
  assert.equal(sections[1].body, undefined)
  assert.equal(sections[1].text, 'Deck staining.')
  assert.equal(sections[1].image, undefined)
})

test('photos are per location, matched by the surface key (not the title); a shared photo is never used', () => {
  // A leftover photo on the shared service item (older data) must not appear anywhere
  const shared = [{ ...cards[0], image: img('shared') } as PaintSurface, cards[2]]
  const knox = paintSurfaces(shared, undefined, [
    { _key: 'k1', surface: 'a', image: img('knox-siding') },
    { _key: 'k2', surface: 'c', image: img('knox-deck') },
  ])
  const maryville = paintSurfaces(shared, undefined, [{ _key: 'm1', surface: 'c', image: img('maryville-deck') }])
  const other = paintSurfaces(shared)
  assert.deepEqual(knox.map((s) => s.image?.asset._id), ['image-knox-siding', 'image-knox-deck'])
  assert.deepEqual(maryville.map((s) => s.image?.asset._id), [undefined, 'image-maryville-deck'])
  assert.deepEqual(other.map((s) => s.image?.asset._id), [undefined, undefined])
  // Renaming a surface keeps its photo: the key matches, the title doesn't matter
  const renamed = paintSurfaces([{ ...cards[0], title: 'House Siding' }], undefined, [{ _key: 'k1', surface: 'a', image: img('knox-siding') }])
  assert.equal(renamed[0].image?.asset._id, 'image-knox-siding')
})
