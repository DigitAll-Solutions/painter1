// node --test: the cabinet page works before and after its Sanity slug changes
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { publicServiceSlug, storedServiceSlugs } from './service-slugs.ts'

test('cabinet: public slug is cabinet-painting whichever slug the document has', () => {
  assert.equal(publicServiceSlug('cabinet-refinishing'), 'cabinet-painting')
  assert.equal(publicServiceSlug('cabinet-painting'), 'cabinet-painting')
  assert.equal(publicServiceSlug('interior-painting'), 'interior-painting')
  // The page looks the document up by the new slug first, then the old one
  assert.deepEqual(storedServiceSlugs('cabinet-painting'), ['cabinet-painting', 'cabinet-refinishing'])
  assert.deepEqual(storedServiceSlugs('exterior-painting'), ['exterior-painting'])
})
