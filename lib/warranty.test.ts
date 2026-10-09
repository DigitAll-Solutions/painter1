// node --test: warranty request rules, email and recipient filter
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildWarrantyEmail, formatProjectDate, validateWarranty, warrantyRecipients, warrantySubject, type WarrantyFields } from './warranty.ts'

const valid: WarrantyFields = {
  firstName: 'Jane',
  lastName: 'Sample',
  phone: '865-555-0123',
  email: 'jane@example.com',
  address: '123 Sample St, Knoxville, TN 37919',
  projectDate: '2025-04',
  area: 'Exterior',
  issue: 'Peeling on the north side trim, about 3 feet.',
  hasContract: true,
}

test('valid request has no errors; every required field is checked', () => {
  assert.deepEqual(validateWarranty(valid), {})
  const empty = validateWarranty({ ...valid, firstName: ' ', lastName: '', phone: '123', email: 'x@', address: '', area: 'Roof', issue: '' })
  assert.deepEqual(Object.keys(empty).sort(), ['address', 'area', 'email', 'firstName', 'issue', 'lastName', 'phone'])
  assert.deepEqual(validateWarranty({ ...valid, projectDate: '' }), {}) // optional
})

test('project date: month input becomes "Month YYYY", free text is kept', () => {
  assert.equal(formatProjectDate('2025-04'), 'April 2025')
  assert.equal(formatProjectDate('spring 2024'), 'spring 2024')
  assert.equal(formatProjectDate('2025-13'), '2025-13')
})

test('Client Tether is never a warranty recipient', () => {
  assert.deepEqual(warrantyRecipients(['owner@example.com', 'abc123@parse.clienttether.com', ' office@example.com ', 'X@PARSE.CLIENTTETHER.COM', '']), ['owner@example.com', 'office@example.com'])
  assert.deepEqual(warrantyRecipients(undefined), [])
})

test('email: subject and every field, photo links', () => {
  assert.equal(warrantySubject('Knoxville'), 'Painter1.com - Warranty Request - Knoxville')
  const body = buildWarrantyEmail({
    ...valid,
    locationName: 'Painter1 of Knoxville',
    requestId: 'warrantyRequest.abc',
    submittedAt: '2026-10-09T15:00:00Z',
    pageUrl: 'https://www.painter1.com/knoxville/warranty',
    photoUrls: ['https://cdn.sanity.io/images/p/d/a.jpg', 'https://cdn.sanity.io/images/p/d/b.jpg'],
  })
  for (const expected of [
    'Warranty repair request for Painter1 of Knoxville',
    'Name: Jane Sample',
    'Phone: (865) 555-0123',
    'Email: jane@example.com',
    'Address of the painted property: 123 Sample St, Knoxville, TN 37919',
    'Approx. date of original project: April 2025',
    'Area: Exterior',
    'Has the original signed contract: Yes',
    'What are you seeing?\nPeeling on the north side trim, about 3 feet.',
    'Photos (2):\nhttps://cdn.sanity.io/images/p/d/a.jpg\nhttps://cdn.sanity.io/images/p/d/b.jpg',
    'Request ID: warrantyRequest.abc',
  ])
    assert.ok(body.includes(expected), `missing: ${expected}`)
  assert.ok(buildWarrantyEmail({ ...valid, hasContract: false, projectDate: '', locationName: 'X', requestId: 'r', submittedAt: '2026-10-09T15:00:00Z', pageUrl: 'u', photoUrls: [] }).includes('Photos: none'))
})
