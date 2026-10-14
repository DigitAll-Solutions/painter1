// node --test: which cache tags a published Sanity document expires
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { tagsFor } from './revalidate.ts'

test('a location expires only its own pages, plus the location lists', () => {
  assert.deepEqual(tagsFor({ _type: 'location', slug: 'knoxville' }), ['location:knoxville', 'locations'])
})

test('a renamed location also expires its pages under the old slug', () => {
  assert.deepEqual(tagsFor({ _type: 'location', slug: 'knoxville-tn', previousSlug: 'knoxville' }), ['location:knoxville-tn', 'location:knoxville', 'locations'])
  // Created (no old slug) or deleted (no new slug)
  assert.deepEqual(tagsFor({ _type: 'location', slug: 'maryville', previousSlug: null }), ['location:maryville', 'locations'])
  assert.deepEqual(tagsFor({ _type: 'location', slug: null, previousSlug: 'maryville' }), ['location:maryville', 'locations'])
})

test('shared documents expire their tag, which every location’s pages use', () => {
  assert.deepEqual(tagsFor({ _type: 'service' }), ['service'])
  assert.deepEqual(tagsFor({ _type: 'warrantyTerms' }), ['warrantyTerms'])
  assert.deepEqual(tagsFor({ _type: 'privacyPolicy' }), ['privacyPolicy'])
  assert.deepEqual(tagsFor({ _type: 'estimateSurvey' }), ['estimateSurvey'])
})

test('documents the site does not render expire nothing', () => {
  assert.deepEqual(tagsFor({ _type: 'lead' }), [])
  assert.deepEqual(tagsFor({ _type: 'leadSettings' }), [])
  assert.deepEqual(tagsFor({}), [])
})
