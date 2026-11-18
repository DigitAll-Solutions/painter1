// node --test: before/after pairs on service pages
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { SanityImage } from '@/sanity/lib/types'

import { cardFallback, hasWorkPhotos, pairImages, sliderAssets, transformationPairs } from './gallery.ts'

const img = (id: string): SanityImage => ({ asset: { _id: `image-${id}` } })

test('pairs keep their order, skip incomplete ones, and title falls back to type + area', () => {
  const pairs = transformationPairs({
    transformations: [
      { _key: 'k1', before: img('b1'), after: img('a1'), title: ' Kitchen cabinets ' },
      { _key: 'k2', before: img('b2') },
      { _key: 'k3', before: img('b3'), after: img('a3'), projectType: 'Exterior', area: 'Farragut' },
    ],
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

test('no pairs: nothing to show', () => {
  assert.deepEqual(transformationPairs({ transformations: [] }), [])
  assert.deepEqual(transformationPairs(undefined), [])
})

test('service card photo: widest own photo, then the service hero, then the shared Services hero', () => {
  const wide = (id: string, width: number): SanityImage => ({ asset: { _id: `image-${id}`, metadata: { dimensions: { width, height: 1, aspectRatio: width } } } })
  const images = [{ _key: 'a', ...wide('small', 800) }, { _key: 'b', ...wide('big', 2000) }]
  assert.equal(cardFallback({ images, heroImage: img('hero'), sharedHeroImage: img('shared') })?.asset._id, 'image-big')
  assert.equal(cardFallback({ images: [], heroImage: img('hero'), sharedHeroImage: img('shared') })?.asset._id, 'image-hero')
  assert.equal(cardFallback({ sharedHeroImage: img('shared') })?.asset._id, 'image-shared')
  assert.equal(cardFallback({}), undefined)
})

test('work photos: only local gallery photos count', () => {
  assert.equal(hasWorkPhotos({}), false)
  assert.equal(hasWorkPhotos({ galleryImages: [{ _key: 'x', notLocalProject: true, ...img('x') }] }), false)
  assert.equal(hasWorkPhotos({ galleryImages: [{ _key: 'y', ...img('y') }] }), true)
})
