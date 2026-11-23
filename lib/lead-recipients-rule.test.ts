// node --test: Lead recipients validation level (error only for live locations)
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { locationIdOf, recipientsProblem } from './lead-recipients-rule.ts'

test('no recipients is an error for a live location (knoxville)', () => {
  assert.equal(recipientsProblem([], 'knoxville'), 'error')
  assert.equal(recipientsProblem(undefined, 'knoxville'), 'error')
  assert.equal(recipientsProblem([''], 'knoxville'), 'error')
})

test('no recipients is a warning for any other location, or when the slug is unknown', () => {
  assert.equal(recipientsProblem([], 'bozeman'), 'warning')
  assert.equal(recipientsProblem(undefined, undefined), 'warning')
  assert.equal(recipientsProblem([], null), 'warning')
})

test('at least one recipient: no problem anywhere', () => {
  assert.equal(recipientsProblem(['a@example.com'], 'knoxville'), null)
  assert.equal(recipientsProblem(['a@example.com'], 'bozeman'), null)
})

test('the location id comes from the leads document id, draft or published', () => {
  assert.equal(locationIdOf('leads.location-knoxville'), 'location-knoxville')
  assert.equal(locationIdOf('drafts.leads.location-knoxville'), 'location-knoxville')
  assert.equal(locationIdOf(undefined), '')
})
