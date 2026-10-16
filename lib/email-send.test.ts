// node --test: the SMTP relay gets the lead email as one text/plain part, byte for byte as built (Client
// Tether parses it), and the delivery guard still decides who may receive it.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { afterEach, test } from 'node:test'

import nodemailer from 'nodemailer'

import { checkLeadEml } from './eml.ts'
import { BREVO_SMTP_HOST, emailConfigured, sendEmail, smtpMessage } from './email-send.ts'
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
const realCreateTransport = nodemailer.createTransport
afterEach(() => {
  globalThis.fetch = realFetch
  nodemailer.createTransport = realCreateTransport
})
const SMTP = { BREVO_SMTP_USER: 'user@smtp-brevo.com', BREVO_SMTP_KEY: 'xsmtpsib-test' }

test('SMTP relay: the message nodemailer writes is one text/plain part, identical to buildLeadEmail', async () => {
  // Build the exact bytes that would go to smtp-relay.brevo.com, then read them back like a received .eml
  const info = await nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'windows' }).sendMail(smtpMessage(message))
  const raw = info.message as Buffer
  assert.ok(body.endsWith('knoxville-exterior '), 'template output keeps its trailing space')
  const check = checkLeadEml(raw, body, TEMPLATE_73)
  assert.deepEqual(check.problems, [])
  assert.equal(check.text, body)
  const wire = raw.toString('latin1')
  assert.ok(wire.includes('\r\nContent-Type: text/plain; charset=utf-8\r\n'), 'one text/plain part')
  assert.doesNotMatch(wire, /text\/html|multipart/i)
  assert.ok(wire.includes('\r\nReply-To: jane@example.com\r\n'))
})

test('sendEmail uses the SMTP relay when BREVO_SMTP_USER and BREVO_SMTP_KEY are set', async () => {
  let options: Record<string, unknown> | undefined
  let mail: ReturnType<typeof smtpMessage> | undefined
  let fetched = false
  globalThis.fetch = (async () => ((fetched = true), new Response('{}'))) as typeof fetch
  nodemailer.createTransport = ((opts: Record<string, unknown>) => {
    options = opts
    return { sendMail: async (m: ReturnType<typeof smtpMessage>) => ((mail = m), { messageId: '<id@painter1.com>' }) }
  }) as unknown as typeof nodemailer.createTransport
  const result = await sendEmail(message, SMTP)
  assert.equal(result.status, 'sent')
  assert.equal(result.messageId, '<id@painter1.com>')
  assert.deepEqual(options, { host: BREVO_SMTP_HOST, port: 587, secure: false, requireTLS: true, auth: { user: SMTP.BREVO_SMTP_USER, pass: SMTP.BREVO_SMTP_KEY } })
  assert.equal(mail?.text, body)
  assert.ok(!('html' in (mail ?? {})), 'no HTML alternative')
  assert.equal(fetched, false, 'the Brevo API is never called')
})

test('SMTP errors are recorded without the key', async () => {
  nodemailer.createTransport = (() => ({ sendMail: async () => Promise.reject(new Error('Invalid login: 535 5.7.8 Authentication failed')) })) as unknown as typeof nodemailer.createTransport
  const result = await sendEmail(message, SMTP)
  assert.deepEqual(result, { status: 'failed', error: 'Invalid login: 535 5.7.8 Authentication failed' })
  assert.ok(!JSON.stringify(result).includes(SMTP.BREVO_SMTP_KEY))
})

test('no SMTP credentials (an API key alone is not enough) or no sender: skipped, nothing sent', async () => {
  let created = 0
  nodemailer.createTransport = (() => (created++, { sendMail: async () => ({}) })) as unknown as typeof nodemailer.createTransport
  assert.deepEqual(await sendEmail(message, {}), { status: 'skipped (no BREVO_SMTP_USER/BREVO_SMTP_KEY)' })
  assert.deepEqual(await sendEmail(message, { BREVO_API_KEY: 'xkeysib-test' }), { status: 'skipped (no BREVO_SMTP_USER/BREVO_SMTP_KEY)' })
  assert.deepEqual(await sendEmail(message, { BREVO_SMTP_USER: 'user@smtp-brevo.com' }), { status: 'skipped (no BREVO_SMTP_USER/BREVO_SMTP_KEY)' })
  assert.deepEqual(await sendEmail({ ...message, from: { email: '', name: 'Painter1' } }, SMTP), { status: 'skipped (LEAD_FROM_EMAIL is not set)' })
  assert.equal(created, 0)
  assert.equal(emailConfigured({ BREVO_API_KEY: 'xkeysib-test' }), false)
  assert.equal(emailConfigured({ BREVO_SMTP_KEY: 'k' }), false)
  assert.equal(emailConfigured(SMTP), true)
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
