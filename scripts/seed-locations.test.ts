// node --test: the client's list maps to slug, name and tier exactly as the live URLs; North Georgia's
// wrong URL is corrected; rows that can't be mapped cleanly are reported, not created.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { readList } from './seed-locations.ts'

const HEADER = 'Location,URL,Home Page,Free Estimate,Service Pages,About Page,Our Work,Warranty'
const csv = (...rows: string[]) => [HEADER, ...rows].join('\r\n')

test('slug from the live URL (any host form), trimmed name, full or basic tier', () => {
  const { rows, unmapped } = readList(
    csv(
      'Painter1 of Raleigh ,https://www.painter1.com/raleigh/,X,X,X,X,X,X',
      'Painter1 of Scottsdale,painter1.com/scottsdale,X,X,X,X,X,X',
      'Painter1 of Columbus,https://www.painter1.com/columbus,X,X,X,X,X,X',
      'Painter1 of Portland,https://www.painter1.com/portland/,X,X,,,,',
    ),
  )
  assert.deepEqual(unmapped, [])
  assert.deepEqual(
    rows.map((r) => [r.slug, r.name, r.tier]),
    [
      ['raleigh', 'Painter1 of Raleigh', 'full'],
      ['scottsdale', 'Painter1 of Scottsdale', 'full'],
      ['columbus', 'Painter1 of Columbus', 'full'],
      ['portland', 'Painter1 of Portland', 'basic'],
    ],
  )
})

test("North Georgia's row (Main Line's URL) becomes /north-georgia/, as on the live site", () => {
  const { rows, unmapped } = readList(
    csv('Painter1 of Main Line,https://www.painter1.com/main-line/,X,X,X,X,X,X', 'Painter1 of North Georgia,https://www.painter1.com/main-line/,X,X,X,X,X,X'),
  )
  assert.deepEqual(unmapped, [])
  assert.deepEqual(rows.map((r) => r.slug), ['main-line', 'north-georgia'])
})

test('rows that can\'t be mapped cleanly are listed and left out', () => {
  const { rows, unmapped } = readList(
    csv(
      'Painter1 of A,https://www.painter1.com/a-town/,X,X,X,X,X,X',
      'Painter1 of B,https://www.painter1.com/a-town/,X,X,X,X,X,X',
      'Painter1 of C,https://www.example.com/c-town/,X,X,X,X,X,X',
      'Painter1 of D,https://www.painter1.com/d-town/,X,,X,,,',
      ',https://www.painter1.com/e-town/,X,X,X,X,X,X',
    ),
  )
  assert.deepEqual(rows.map((r) => r.slug), ['a-town'])
  assert.equal(unmapped.length, 4)
  assert.match(unmapped[0], /same URL \/a-town\//)
  assert.match(unmapped[1], /isn't a painter1\.com/)
  assert.match(unmapped[2], /neither every page/)
  assert.match(unmapped[3], /no location name/)
})
