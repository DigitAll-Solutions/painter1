// node --test: warranty page contact block (Call / Text on the main line, Email when the location has one)
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { warrantyContact, warrantyDescription } from './warranty-contact.ts'

const knoxville = { name: 'Painter1 of Knoxville', phone: '(865) 345-5800', email: 'office@example.com', ownerName: 'Keith Lane' }

test('call and text use the main phone; names say who and where', () => {
  const c = warrantyContact(knoxville, {})
  assert.equal(c.heading, 'Questions About Your Warranty?')
  assert.equal(c.text, 'Reach out to Keith’s team by phone, text or email and we’ll help.')
  assert.deepEqual(
    c.links.map((l) => [l.href, l.label]),
    [
      ['tel:8653455800', 'Call Painter1 of Knoxville at (865) 345-5800'],
      ['sms:8653455800', 'Text Painter1 of Knoxville at (865) 345-5800'],
      ['mailto:office@example.com', 'Email Painter1 of Knoxville at office@example.com'],
    ],
  )
})

test('no email: no Email link; no owner: "our team"; no phone: no Call or Text; Studio text wins', () => {
  assert.deepEqual(warrantyContact({ ...knoxville, email: ' ' }, {}).links.map((l) => l.kind), ['call', 'text'])
  assert.equal(warrantyContact({ ...knoxville, ownerName: undefined }, {}).text, 'Reach out to our team by phone, text or email and we’ll help.')
  assert.deepEqual(warrantyContact({ ...knoxville, phone: undefined }, {}).links.map((l) => l.kind), ['email'])
  const custom = warrantyContact(knoxville, { contactHeading: 'Need help?', contactText: 'Call {ownerTeam} any time.' })
  assert.deepEqual([custom.heading, custom.text], ['Need help?', 'Call Keith’s team any time.'])
})

test('meta description: names the local warranty, never Painter1 as the warrantor, ≤ 160 characters', () => {
  const knox = { name: 'Painter1 of Knoxville', address: { city: 'Knoxville', state: 'TN' } }
  assert.equal(
    warrantyDescription(knox),
    'What the two-year workmanship warranty from Painter1 of Knoxville covers, what it requires, and how to reach Painter1 of Knoxville with questions.',
  )
  const short = { name: 'Painter1 of Ada', address: { city: 'Ada', state: 'OK' } }
  assert.equal(warrantyDescription(short), 'What the two-year workmanship warranty from Painter1 of Ada covers in Ada, OK, what it requires, and how to reach Painter1 of Ada with questions.')
  const long = { name: 'Painter1 of Carmel Fisher and the Greater Northern Suburbs', address: { city: 'Carmel Fisher and the Greater Northern Suburbs', state: 'IN' } }
  for (const loc of [knox, short, long, { name: 'Painter1 of Knoxville' }]) {
    const d = warrantyDescription(loc)
    assert.ok(d.length <= 160, d)
    assert.ok(!/Painter1 two-year|undefined/.test(d), d)
  }
})
