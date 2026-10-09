// node --test: before/after pairs on service pages
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { SanityImage } from '@/sanity/lib/types'

import { pairImages, sliderAssets, transformationPairs } from './gallery.ts'

const img = (id: string): SanityImage => ({ asset: { _id: `image-${id}` } })

test('pairs keep their order, skip incomplete ones, and title falls back to type + area', () => {
  const pairs = transformationPairs({
    transformations: [
      { _key: 'k1', before: img('b1'), after: img('a1'), title: ' Kitchen cabinets ' },
      { _key: 'k2', before: img('b2') },
      { _key: 'k3', before: img('b3'), after: img('a3'), projectType: 'Exterior', area: 'Farragut' },
    ],
    beforeImage: img('old-b'),
    afterImage: img('old-a'),
  })
  assert.deepEqual(
    pairs.map((p) => [p.key, p.title]),
    [
      ['k1', 'Kitchen cabinets'],
      ['k3', 'Exterior, Farragut'],
    ],
  )
  assert.deepEqual([...sliderAssets(...pairImages(pairs))], ['image-b1', 'image-a1', 'image-b3', 'image-a3'])
})

test('until migrated, the legacy single pair is read', () => {
  assert.deepEqual(
    transformationPairs({ beforeImage: img('b'), afterImage: img('a') }).map((p) => p.key),
    ['legacy'],
  )
  assert.deepEqual(transformationPairs({ beforeImage: img('b') }), [])
  assert.deepEqual(transformationPairs(undefined), [])
})
