// node --test: launch checklist rules and slug rules
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { slugError, slugify, slugWarning } from '../sanity/lib/location-slugs.ts'
import { locationChecklist, missing, type LocationDoc } from './location-checklist.ts'

const KEYS = { 'service-interior-painting': 'interior', 'service-exterior-painting': 'exterior', 'service-cabinet-refinishing': 'cabinet' }
const img = (id: string) => ({ asset: { _ref: `image-${id}` } })
const block = (text: string) => [{ children: [{ text }] }]
const byId = (items: ReturnType<typeof locationChecklist>, id: string) => items.find((i) => i.id === id)!

test('a new, empty growth location: every required item is listed', () => {
  const items = locationChecklist({ locationType: 'growth' }, 0, KEYS)
  assert.deepEqual(
    missing(items, 'required').map((i) => i.id),
    ['name', 'slug', 'city', 'state', 'phone', 'title-interior', 'title-exterior', 'title-cabinet', 'recipients', 'warrantyRecipients', 'consent', 'subject', 'template'],
  )
})

test('maintenance locations skip services, per-service photos and warranty recipients', () => {
  const items = locationChecklist({ locationType: 'maintenance' }, 0, KEYS)
  assert.ok(!items.some((i) => i.area === 'Services' || i.id.startsWith('photos-') || i.id === 'warrantyRecipients'))
})

test('before/after pairs: every pair counts, and all of their photos leave Recent Work', () => {
  const ext = [{ _ref: 'service-exterior-painting' }]
  const doc: LocationDoc = {
    services: {
      exterior: {
        title: 'Exterior Painting',
        transformations: [{ before: img('b1'), after: img('a1') }, { before: img('b2'), after: img('a2') }, { before: img('b3') }],
        // Legacy pair is ignored once transformations exist
        beforeImage: img('old-b'),
        afterImage: img('old-a'),
      },
    },
    galleryImages: ['b1', 'a1', 'b2', 'a2', 'old-b', '1', '2'].map((id) => ({ asset: { _ref: `image-${id}` }, services: ext })),
  }
  const items = locationChecklist(doc, 1, KEYS)
  assert.equal(byId(items, 'pair-exterior').detail, '2 pairs')
  assert.equal(byId(items, 'photos-exterior').detail, '7 tagged, 3 for Recent Work (shows from 3)')
  // What We Paint photos are on the page too, so they leave Recent Work as well
  const withSurface = locationChecklist({ ...doc, services: { exterior: { ...doc.services!.exterior, surfacePhotos: [{ image: img('1') }] } } }, 1, KEYS)
  assert.equal(byId(withSurface, 'photos-exterior').detail, '7 tagged, 2 for Recent Work (shows from 3)')
  // Not migrated yet: the legacy pair still counts
  const legacy = locationChecklist({ services: { interior: { beforeImage: img('b'), afterImage: img('a') } } }, 1, KEYS)
  assert.equal(byId(legacy, 'pair-interior').detail, '1 pair')
  assert.equal(byId(legacy, 'pair-exterior').ok, false)
})

test('booking page: warned only while online scheduling is on without a URL', () => {
  assert.equal(locationChecklist({}, 1, KEYS).some((i) => i.id === 'booking'), false)
  assert.equal(byId(locationChecklist({ hasScheduling: true }, 1, KEYS), 'booking').ok, false)
  assert.equal(byId(locationChecklist({ hasScheduling: true, schedulingUrl: 'https://appointment.painter1.com/knoxville' }, 1, KEYS), 'booking').ok, true)
})

test('Recent Work count excludes hidden photos and the page\'s own slider pair', () => {
  const ext = [{ _ref: 'service-exterior-painting' }]
  const doc: LocationDoc = {
    services: { exterior: { title: 'Exterior Painting', beforeImage: img('b'), afterImage: img('a') } },
    galleryImages: [
      { asset: { _ref: 'image-b' }, services: ext },
      { asset: { _ref: 'image-a' }, services: ext },
      { asset: { _ref: 'image-1' }, services: ext },
      { asset: { _ref: 'image-2' }, services: ext, notLocalProject: true },
      { asset: { _ref: 'image-3' }, services: ext },
    ],
  }
  const item = byId(locationChecklist(doc, 1, KEYS), 'photos-exterior')
  assert.equal(item.ok, false)
  assert.equal(item.detail, '4 tagged, 2 for Recent Work (shows from 3)')
})

test('consent must name this business: placeholder or own name pass, another location fails', () => {
  const check = (name: string, text: string) => byId(locationChecklist({ name, consentBlocks: [{ name: 'c', body: block(text) }] }, 1, KEYS), 'consentName')
  assert.equal(check('Painter1 of Maryville', 'Calls from {locationName} regarding my estimate.').ok, true)
  assert.equal(check('Painter1 of Knoxville', 'Texts from Painter1 of Knoxville at the number provided.').ok, true)
  const wrong = check('Painter1 of Maryville', 'Texts from Painter1 of Knoxville at the number provided.')
  assert.equal(wrong.ok, false)
  assert.equal(wrong.detail, 'Mentions "Painter1 of Knoxville": use {locationName}')
})

test('recipients: only the count is shown', () => {
  assert.equal(byId(locationChecklist({}, 2, KEYS), 'recipients').detail, '2 recipients (in the private Email recipients document)')
  assert.equal(byId(locationChecklist({}, null, KEYS), 'recipients').ok, false)
  assert.equal(byId(locationChecklist({}, 2, KEYS, 1), 'warrantyRecipients').detail, '1 recipient (in the private Email recipients document)')
  assert.equal(byId(locationChecklist({}, 2, KEYS), 'warrantyRecipients').detail, 'Not checked')
})

test('slug rules', () => {
  assert.equal(slugify('Painter1 of Maryville'), 'maryville')
  assert.equal(slugify('Inland Northwest'), 'inland-northwest')
  assert.equal(slugify('Coeur d’Alène & Spokane'), 'coeur-d-alene-and-spokane')
  assert.equal(slugError('knoxville'), undefined)
  assert.match(slugError('Knoxville')!, /lowercase/)
  assert.match(slugError('painter1--of')!, /lowercase/)
  assert.match(slugError('studio')!, /reserved/)
  assert.match(slugError(undefined)!, /Required/)
  assert.equal(slugWarning('knoxville', []), undefined) // no list imported: no warning
  assert.equal(slugWarning('knoxville', ['knoxville', 'maryville']), undefined)
  assert.match(slugWarning('painter1-of-maryville', ['knoxville', 'maryville'])!, /isn't in the client's location list/)
})
