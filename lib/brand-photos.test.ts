// node --test: shared brand photos fill only empty general fields; work photos never fall back
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { evaluate, parse } from 'groq-js'

import { LOCATION_QUERY } from '../sanity/lib/queries.ts'

const pic = (ref: string) => ({ _type: 'image', asset: { _type: 'reference', _ref: ref } })
const asset = (id: string) => ({ _id: id, _type: 'sanity.imageAsset' })

type Img = { asset: { _id: string } } | null
type Result = Record<'heroImage' | 'warrantyImage' | 'warrantyPageImage' | 'warrantyGraphic', Img> & {
  ownerPhoto?: Img
  galleryImages?: unknown[]
  services: { interior: { sharedHeroImage: Img; images: { asset: { _id: string } }[] } }
}

const run = async (docs: object[]) =>
  (await (await evaluate(parse(LOCATION_QUERY), { dataset: docs, params: { slug: 'demo' } })).get()) as Result

const assets = ['own-hero', 'brand-hero', 'brand-warranty', 'shared-int-hero', 'own-int'].map(asset)
const brand = { _id: 'brand-photos', _type: 'brandPhotos', heroImage: pic('brand-hero'), warrantyImage: pic('brand-warranty') }
const sharedInterior = { _id: 'svc-int', _type: 'service', locationKey: 'interior', heroImage: pic('shared-int-hero') }

test('own photo wins; empty field uses Brand photos; neither gives null', async () => {
  const loc = { _id: 'l1', _type: 'location', slug: { current: 'demo' }, heroImage: pic('own-hero'), warrantyPageImage: { _type: 'image', alt: 'kept alt, file removed' } }
  const r = await run([...assets, brand, sharedInterior, loc])
  assert.equal(r.heroImage?.asset._id, 'own-hero')
  assert.equal(r.warrantyImage?.asset._id, 'brand-warranty')
  assert.equal(r.warrantyPageImage, null)
  assert.equal(r.warrantyGraphic, null)
  // never people or projects
  assert.equal(r.ownerPhoto ?? null, null)
  assert.deepEqual(r.galleryImages ?? [], [])
})

test('no Brand photos document: general fields stay empty', async () => {
  const r = await run([...assets, { _id: 'l1', _type: 'location', slug: { current: 'demo' } }])
  assert.equal(r.heroImage, null)
  assert.equal(r.warrantyImage, null)
})

test('service: shared Services hero is returned for the card fallback; drafts ignored', async () => {
  const loc = { _id: 'l1', _type: 'location', slug: { current: 'demo' }, services: { interior: { images: [pic('own-int')] } } }
  const draft = { _id: 'drafts.svc-int', _type: 'service', locationKey: 'interior', heroImage: pic('own-hero') }
  const r = await run([...assets, draft, sharedInterior, loc])
  assert.equal(r.services.interior.sharedHeroImage?.asset._id, 'shared-int-hero')
  assert.equal(r.services.interior.images[0].asset._id, 'own-int')
})
