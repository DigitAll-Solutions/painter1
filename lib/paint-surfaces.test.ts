// node --test: What We Paint surfaces: shared text, this location's photo or the default photo
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

test('link names: from the title when missing, unique on the page', () => {
  assert.equal(surfaceSlug('Trim & Doors'), 'trim-doors')
  assert.equal(surfaceSlug(' Hardware & upgrades '), 'hardware-upgrades')
  const twice = paintSurfaces([cards[0], { ...cards[0], _key: 'x' }])
  assert.deepEqual(twice.map((s) => s.slug), ['siding', 'siding-2'])
})

test('the surface’s own text wins; an empty text falls back to the card text; photo from this location only', () => {
  const sections = paintSurfaces(
    [
      { ...cards[0], slug: 'siding', body: [block('New siding copy')] as never },
      { ...cards[2], slug: 'decks', body: [block('  ')] as never },
    ],
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
  const knox = paintSurfaces(shared, [
    { _key: 'k1', surface: 'a', image: img('knox-siding') },
    { _key: 'k2', surface: 'c', image: img('knox-deck') },
  ])
  const maryville = paintSurfaces(shared, [{ _key: 'm1', surface: 'c', image: img('maryville-deck') }])
  const other = paintSurfaces(shared)
  assert.deepEqual(knox.map((s) => s.image?.asset._id), ['image-knox-siding', 'image-knox-deck'])
  assert.deepEqual(maryville.map((s) => s.image?.asset._id), [undefined, 'image-maryville-deck'])
  assert.deepEqual(other.map((s) => s.image?.asset._id), [undefined, undefined])
  // Renaming a surface keeps its photo: the key matches, the title doesn't matter
  const renamed = paintSurfaces([{ ...cards[0], title: 'House Siding' }], [{ _key: 'k1', surface: 'a', image: img('knox-siding') }])
  assert.equal(renamed[0].image?.asset._id, 'image-knox-siding')
})

test('default photo: shown when the location has none of its own; the location’s own photo always wins', () => {
  const items: PaintSurface[] = [
    { ...cards[0], defaultImage: img('default-siding') },
    { ...cards[1], defaultImage: img('default-trim') },
    cards[2],
  ]
  // Knoxville has its own Siding photo; Maryville has none
  const knox = paintSurfaces(items, [{ _key: 'k1', surface: 'a', image: img('knox-siding') }])
  const maryville = paintSurfaces(items)
  assert.deepEqual(knox.map((s) => s.image?.asset._id), ['image-knox-siding', 'image-default-trim', undefined])
  assert.deepEqual(maryville.map((s) => s.image?.asset._id), ['image-default-siding', 'image-default-trim', undefined])
  // A default without an uploaded file is ignored
  assert.equal(paintSurfaces([{ ...cards[2], defaultImage: { asset: undefined } as never }])[0].image, undefined)
})
