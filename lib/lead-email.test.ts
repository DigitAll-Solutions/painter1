// node --test: the lead email must match Fluent Forms #73 character for character, with only the
// Message block ({inputs.description}) carrying the survey answers.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { composeDescription, emptyAnswers, OTHER_AREA, type SurveyContent } from './estimate-survey.ts'
import { buildLeadEmail } from './lead-email.ts'

const survey: SurveyContent = JSON.parse(readFileSync(new URL('./estimate-survey-defaults.json', import.meta.url), 'utf-8'))

// Knoxville-contact-form (#73) notification body, exactly as exported (note the trailing space)
const TEMPLATE_73 =
  'Url:\n{submission.source_url}\n\nGa Gclid: {inputs.gclid}\n\nGa Source: {inputs.utm_source}\n\nGa Medium: {inputs.utm_medium}\n\nGa Campaign: {inputs.utm_campaign}\n\nFirst Name: {inputs.names.first_name}\n\nLast Name: {inputs.names.last_name}\n\nEmail: {inputs.email}\n\nPhone: {inputs.phone}\n\nAddress: {inputs.input_text}\n\nState: {inputs.input_text_2}\n\nCity: {inputs.input_text_1}\n\nZip Code: {inputs.input_text_3}\n\nMessage:\n{inputs.description}\n\n\n\nClient Tether Parsing Data:\nPARSER: {inputs.channel}, {inputs.channeldrilldown1}, {inputs.channeldrilldown2} '

// Bozeman-contact-form (#119): one extra blank line before PARSER
const TEMPLATE_119 = TEMPLATE_73.replace('Client Tether Parsing Data:\nPARSER:', 'Client Tether Parsing Data:\n\nPARSER:')

const answers = {
  ...emptyAnswers('Knoxville'),
  service: 'exterior' as const,
  areas: ['Siding', 'Trim & Doors', OTHER_AREA],
  areasOther: 'garage door',
  timeline: 'Within 30 days',
  message: "The north side is peeling and we'd like it done before winter.",
  street: '123 Main St',
  zip: '37919',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '(865) 555-0123',
}

const inputsFor = (a: typeof answers, extra: Record<string, unknown> = {}) => ({
  names: { first_name: a.firstName, last_name: a.lastName },
  email: a.email,
  phone: a.phone,
  input_text: a.street,
  input_text_1: a.city,
  input_text_2: 'TN',
  input_text_3: a.zip,
  description: composeDescription(a, survey),
  utm_source: 'google',
  utm_medium: 'cpc',
  utm_campaign: 'knoxville-exterior',
  gclid: 'Cj0KCQ-test',
  channel: 'Paid Search',
  channeldrilldown1: 'Google',
  channeldrilldown2: 'knoxville-exterior',
  ...extra,
})

const submission = { source_url: 'https://www.painter1.com/knoxville/free-estimate?service=exterior' }

test('Knoxville #73 template: full email, character for character', () => {
  const expected = `Url:
https://www.painter1.com/knoxville/free-estimate?service=exterior

Ga Gclid: Cj0KCQ-test

Ga Source: google

Ga Medium: cpc

Ga Campaign: knoxville-exterior

First Name: Jane

Last Name: Doe

Email: jane@example.com

Phone: (865) 555-0123

Address: 123 Main St

State: TN

City: Knoxville

Zip Code: 37919

Message:
Service: Exterior Painting
Areas: Siding, Trim & Doors, Other (garage door)
Timeline: Within 30 days

The north side is peeling and we'd like it done before winter.



Client Tether Parsing Data:
PARSER: Paid Search, Google, knoxville-exterior `
  assert.equal(buildLeadEmail(TEMPLATE_73, { inputs: inputsFor(answers), submission }), expected)
})

test('only the Message block differs from the plain template output', () => {
  const withSurvey = buildLeadEmail(TEMPLATE_73, { inputs: inputsFor(answers), submission })
  const plain = buildLeadEmail(TEMPLATE_73, { inputs: inputsFor(answers, { description: 'X' }), submission })
  const [beforeA, afterA] = withSurvey.split(composeDescription(answers, survey))
  const [beforeB, afterB] = plain.split('Message:\nX')
  assert.equal(beforeA, beforeB + 'Message:\n')
  assert.equal(afterA, afterB)
})

test('"Not sure": no Areas line; no customer message: block ends after Timeline', () => {
  const a = { ...answers, service: 'notSure' as const, areas: ['Siding'], message: '' }
  assert.equal(composeDescription(a, survey), 'Service: Not sure\nTimeline: Within 30 days')
})

test('customer text that looks like a label or placeholder is copied as typed', () => {
  const a = { ...answers, message: 'Timeline: whenever\n{inputs.email} is fine' }
  const out = buildLeadEmail(TEMPLATE_73, { inputs: inputsFor(a), submission })
  assert.ok(out.includes('Timeline: Within 30 days\n\nTimeline: whenever\n{inputs.email} is fine\n\n\n\nClient Tether'))
})

test('empty optional values and unknown placeholders become empty strings', () => {
  const a = { ...answers, zip: '' }
  const out = buildLeadEmail(TEMPLATE_73 + '{inputs.nope}{submission.nope}', {
    inputs: inputsFor(a, { utm_source: '', utm_medium: undefined, utm_campaign: null, gclid: '', channel: '', channeldrilldown1: '', channeldrilldown2: '' }),
    submission,
  })
  assert.ok(out.includes('Ga Gclid: \n\nGa Source: \n\nGa Medium: \n\nGa Campaign: \n\n'))
  assert.ok(out.includes('Zip Code: \n\n'))
  assert.ok(out.endsWith('PARSER: , ,  '))
})

test('#119 template keeps its extra blank line', () => {
  const out = buildLeadEmail(TEMPLATE_119, { inputs: inputsFor(answers), submission })
  assert.ok(out.endsWith('Client Tether Parsing Data:\n\nPARSER: Paid Search, Google, knoxville-exterior '))
})
