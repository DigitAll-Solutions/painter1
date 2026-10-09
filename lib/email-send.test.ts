// node --test: the Brevo request carries the lead email as text only, byte for byte as built (Client
// Tether parses it), and the delivery guard still decides who may receive it.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { afterEach, test } from 'node:test'

import { BREVO_ENDPOINT, brevoPayload, sendEmail } from './email-send.ts'
import { composeDescription, emptyAnswers, type SurveyContent } from './estimate-survey.ts'
import { resolveDelivery } from './lead-delivery.ts'
import { buildLeadEmail } from './lead-email.ts'

const survey: SurveyContent = JSON.parse(readFileSync(new URL('./estimate-survey-defaults.json', import.meta.url), 'utf-8'))

// Knoxville-contact-form (#73) notification body, exactly as exported (note the trailing space)
const TEMPLATE_73 =
  'Url:\n{submission.source_url}\n\nGa Gclid: {inputs.gclid}\n\nGa Source: {inputs.utm_source}\n\nGa Medium: {inputs.utm_medium}\n\nGa Campaign: {inputs.utm_campaign}\n\nFirst Name: {inputs.names.first_name}\n\nLast Name: {inputs.names.last_name}\n\nEmail: {inputs.email}\n\nPhone: {inputs.phone}\n\nAddress: {inputs.input_text}\n\nState: {inputs.input_text_2}\n\nCity: {inputs.input_text_1}\n\nZip Code: {inputs.input_text_3}\n\nMessage:\n{inputs.description}\n\n\n\nClient Tether Parsing Data:\nPARSER: {inputs.channel}, {inputs.channeldrilldown1}, {inputs.channeldrilldown2} '

const answers = { ...emptyAnswers('Knoxville'), service: 'exterior' as const, areas: ['Siding'], message: 'Peeling on the north side — “soon”, please.', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '(865) 555-0123', street: '123 Main St', zip: '37919' }
const body = buildLeadEmail(TEMPLATE_73, {
  inputs: {
    names: { first_name: answers.firstName, last_name: answers.lastName },
    email: answers.email,
    phone: answers.phone,
    input_text: answers.street,
    input_text_1: answers.city,
    input_text_2: 'TN',
    input_text_3: answers.zip,
    description: composeDescription(answers, survey),
    channel: 'Paid Search',
    channeldrilldown1: 'Google',
    channeldrilldown2: 'knoxville-exterior',
  },
  submission: { source_url: 'https://www.painter1.com/knoxville/free-estimate' },
})
const message = { from: { email: 'leads@painter1.com', name: 'Painter1' }, to: ['staff@example.com', 'x@parse.clienttether.com'], subject: 'New lead', text: body, replyTo: 'jane@example.com' }

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

test('Client Tether lead email: textContent is buildLeadEmail output byte for byte, text only', () => {
  assert.ok(body.endsWith('knoxville-exterior '), 'template output keeps its trailing space')
  const payload = brevoPayload(message)
  assert.equal(payload.textContent, body)
  assert.ok(!('htmlContent' in payload) && !('templateId' in payload), 'no HTML part: Brevo sends text/plain')
  // What actually goes over the wire: the JSON body decodes to the same bytes
  const wire = JSON.parse(JSON.stringify(payload)) as typeof payload
  assert.deepEqual(Buffer.from(wire.textContent, 'utf8'), Buffer.from(body, 'utf8'))
  assert.deepEqual(wire.to, [{ email: 'staff@example.com' }, { email: 'x@parse.clienttether.com' }])
  assert.deepEqual(wire.sender, { name: 'Painter1', email: 'leads@painter1.com' })
  assert.deepEqual(wire.replyTo, { email: 'jane@example.com' })
})

test('sendEmail posts to Brevo with the api-key header and records the messageId', async () => {
  let seen: { url: string; init: RequestInit } | undefined
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    seen = { url, init }
    return new Response(JSON.stringify({ messageId: '<abc@smtp-relay.mailin.fr>' }), { status: 201 })
  }) as typeof fetch
  const result = await sendEmail(message, 'xkeysib-test')
  assert.equal(seen?.url, BREVO_ENDPOINT)
  assert.equal(seen?.init.method, 'POST')
  assert.equal((seen?.init.headers as Record<string, string>)['api-key'], 'xkeysib-test')
  assert.equal((JSON.parse(String(seen?.init.body)) as { textContent: string }).textContent, body)
  assert.equal(result.status, 'sent')
  assert.equal(result.messageId, '<abc@smtp-relay.mailin.fr>')
})

test('sendEmail: Brevo errors are recorded; no key or no sender skips without a request', async () => {
  let calls = 0
  globalThis.fetch = (async () => {
    calls++
    return new Response(JSON.stringify({ code: 'unauthorized', message: 'Key not found' }), { status: 401 })
  }) as typeof fetch
  assert.deepEqual(await sendEmail(message, 'bad-key'), { status: 'failed', error: 'Brevo 401: unauthorized Key not found' })
  assert.deepEqual(await sendEmail(message, ''), { status: 'skipped (no BREVO_API_KEY)' })
  assert.deepEqual(await sendEmail({ ...message, from: { email: '', name: 'Painter1' } }, 'xkeysib-test'), { status: 'skipped (LEAD_FROM_EMAIL is not set)' })
  assert.equal(calls, 1)
})

test('delivery guard unchanged: test address only, live needs LEAD_SEND_LIVE=true and a sender', () => {
  const test = resolveDelivery({ LEAD_TEST_RECIPIENT: 'me@example.com', LEAD_SEND_LIVE: 'true', LEAD_FROM_EMAIL: 'leads@painter1.com' }, 'S')
  assert.deepEqual(test, { kind: 'test', to: ['me@example.com'], subject: '[TEST] S', from: { email: 'leads@painter1.com', name: 'Painter1' } })
  assert.equal(resolveDelivery({ LEAD_FROM_EMAIL: 'leads@painter1.com' }, 'S').kind, 'refused')
  assert.equal(resolveDelivery({ LEAD_SEND_LIVE: 'yes', LEAD_FROM_EMAIL: 'leads@painter1.com' }, 'S').kind, 'refused')
  assert.deepEqual(resolveDelivery({ LEAD_SEND_LIVE: 'true' }, 'S'), { kind: 'refused', subject: 'S', reason: 'LEAD_FROM_EMAIL is not set' })
  assert.deepEqual(resolveDelivery({ LEAD_SEND_LIVE: 'true', LEAD_FROM_EMAIL: 'leads@painter1.com', LEAD_FROM_NAME: 'Painter1 of Knoxville' }, 'S'), {
    kind: 'live',
    subject: 'S',
    from: { email: 'leads@painter1.com', name: 'Painter1 of Knoxville' },
  })
})
