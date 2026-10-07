// node --test: Our Work cards — hidden photos, before/after pairing, filters and chips
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { GalleryImage } from '../sanity/lib/types.ts'
import { activeFilter, workCards, workChips } from './work-cards.ts'

const SERVICE_KEYS = { 'service-interior-painting': 'interior', 'service-exterior-painting': 'exterior', 'service-cabinet-refinishing': 'cabinet' }

let n = 0
const photo = (fields: Partial<GalleryImage> = {}): GalleryImage => ({ _key: `p${n++}`, asset: { _id: `image-${n}` }, ...fields })

test('"Hide: not a local project" photos never become cards', () => {
  const cards = workCards({ galleryImages: [photo({ notLocalProject: true }), photo({ projectType: 'Deck Staining' })] }, SERVICE_KEYS)
  assert.equal(cards.length, 1)
  assert.equal(cards[0].title, 'Deck Staining')
})

test('a before and an after with the same projectId become one card at the first photo\'s position', () => {
  const single = photo({ projectType: 'Cabin' })
  const before = photo({ projectId: 'brick', role: 'before', services: ['service-exterior-painting'] })
  const other = photo({ projectType: 'Deck' })
  const after = photo({ projectId: 'brick', role: 'after', projectType: 'Brick Painting', services: ['service-exterior-painting'] })
  const cards = workCards({ galleryImages: [single, before, other, after] }, SERVICE_KEYS)
  assert.deepEqual(cards.map((c) => c.key), [single._key, 'project-brick', other._key])
  assert.equal(cards[1].before, before)
  assert.equal(cards[1].image, after)
  assert.equal(cards[1].title, 'Brick Painting')
  assert.deepEqual(cards[1].filters, ['exterior'])
})

test('an incomplete or hidden pair falls back to separate photos', () => {
  const twoAfters = workCards({ galleryImages: [photo({ projectId: 'x', role: 'after' }), photo({ projectId: 'x', role: 'after' })] }, SERVICE_KEYS)
  assert.equal(twoAfters.length, 2)
  assert.ok(twoAfters.every((c) => !c.before))
  const hiddenHalf = workCards({ galleryImages: [photo({ projectId: 'y', role: 'before', notLocalProject: true }), photo({ projectId: 'y', role: 'after' })] }, SERVICE_KEYS)
  assert.equal(hiddenHalf.length, 1)
  assert.equal(hiddenHalf[0].before, undefined)
})

test('filters come from service tags and the Commercial checkbox, in chip order', () => {
  const [card] = workCards({ galleryImages: [photo({ commercial: true, services: ['service-exterior-painting', 'unknown-service'] })] }, SERVICE_KEYS)
  assert.deepEqual(card.filters, ['exterior', 'commercial'])
})

test('chips: All first, then only filters with cards; activeFilter falls back to All', () => {
  const cards = workCards(
    { galleryImages: [photo({ services: ['service-interior-painting'] }), photo({ commercial: true }), photo({ services: ['service-interior-painting'] })] },
    SERVICE_KEYS,
  )
  const chips = workChips({ slug: 'knoxville' }, cards)
  assert.deepEqual(
    chips.map((c) => [c.label, c.count, c.href]),
    [
      ['All', 3, '/knoxville/our-work'],
      ['Interior', 2, '/knoxville/our-work?service=interior'],
      ['Commercial', 1, '/knoxville/our-work?service=commercial'],
    ],
  )
  assert.equal(activeFilter('interior', cards), 'interior')
  assert.equal(activeFilter('cabinet', cards), null) // no cabinet cards
  assert.equal(activeFilter('nonsense', cards), null)
})
