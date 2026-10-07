'use server'

import { createHash, randomUUID } from 'node:crypto'
import { headers } from 'next/headers'

import {
  composeDescription,
  formatUsPhone,
  OTHER_AREA,
  SERVICE_KEYS,
  validateAll,
  type Answers,
  type FieldErrors,
  type ServiceKey,
  type StepKey,
} from '@/lib/estimate-survey'
import { consentPlainText, fillConsentBlocks } from '@/lib/consent'
import { ATTRIBUTION_FIELDS, HONEYPOT_FIELD } from '@/lib/estimate-form'
import { deliveryLabel, resolveDelivery, type Delivery } from '@/lib/lead-delivery'
import { buildLeadEmail } from '@/lib/lead-email'
import { absoluteUrl, siteUrl } from '@/lib/site'
import { verifyTurnstile } from '@/lib/turnstile'
import { getEstimateSurvey, getLocation } from '@/sanity/lib/fetch'
import { leadReadClient, leadWriteClient } from '@/sanity/lib/private-client'

export type EstimateState =
  | { status: 'idle' }
  | { status: 'invalid'; errors: FieldErrors; step: StepKey }
  | { status: 'call-us' }
  | { status: 'success'; firstName: string }

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

/** The page the form was submitted from ({submission.source_url}); only accepted for this site */
function sourceUrl(raw: string, slug: string, host: string | null) {
  try {
    const url = new URL(raw)
    if ((url.protocol === 'https:' || url.protocol === 'http:') && (url.host === host || url.host === new URL(siteUrl).host)) return url.toString()
  } catch {
    // fall through
  }
  return absoluteUrl(`/${slug}/free-estimate`)
}

type EmailResult = { status: string; resendId?: string; error?: string; sentAt?: string }

async function sendLeadEmail(delivery: Delivery, body: string, replyTo: string, locationId: string): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { status: 'skipped (no RESEND_API_KEY)' }
  if (delivery.kind === 'refused') return { status: `skipped (${delivery.reason})` }
  if (!body) return { status: 'skipped (location has no lead email template)' }

  let to: string[]
  if (delivery.kind === 'test') {
    to = delivery.to
  } else {
    const reader = leadReadClient()
    if (!reader) return { status: 'failed', error: 'SANITY_API_READ_TOKEN is not set (needed to read recipients)' }
    const doc = await reader.fetch<{ leadRecipients?: string[] } | null>(`*[_id == $id][0]{leadRecipients}`, { id: `leads.${locationId}` })
    to = (doc?.leadRecipients ?? []).filter(Boolean)
    if (!to.length) return { status: 'failed', error: `No recipients in leads.${locationId}` }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: delivery.from, to, subject: delivery.subject, text: body, reply_to: replyTo }),
      cache: 'no-store',
    })
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!res.ok) return { status: 'failed', error: `Resend ${res.status}: ${data.message ?? 'unknown error'}` }
    return { status: 'sent', resendId: data.id, sentAt: new Date().toISOString() }
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Free-estimate submission. Order: honeypot → Turnstile → validation → save the lead → send → record
 * the email result. Success is returned only when the lead document was saved; otherwise the visitor
 * is asked to call.
 */
export async function submitEstimate(_previous: EstimateState, formData: FormData): Promise<EstimateState> {
  const field = (key: string) => String(formData.get(key) ?? '').trim()

  const slug = field('location')
  const location = slug ? await getLocation(slug) : null
  if (!location) return { status: 'call-us' }

  // Honeypot: never filled by people (hidden, unusual name, no autofill). Nothing is stored or sent.
  if (field(HONEYPOT_FIELD)) return { status: 'call-us' }

  const requestHeaders = await headers()
  const ip = (requestHeaders.get('x-forwarded-for') ?? '').split(',')[0].trim() || requestHeaders.get('x-real-ip') || ''
  const userAgent = requestHeaders.get('user-agent') ?? ''

  if (!(await verifyTurnstile(field('cf-turnstile-response'), ip))) return { status: 'call-us' }

  const survey = await getEstimateSurvey(slug)
  // Filled exactly as on the page, so the stored consent record is the text the visitor read
  const consentBlocks = fillConsentBlocks(location.consentBlocks ?? [], location.name)
  const consentNames = consentBlocks.map((block) => block.name)
  const service = field('service') as ServiceKey

  const answers: Answers = {
    service: SERVICE_KEYS.includes(service) ? service : undefined,
    areas: service === 'notSure' ? [] : formData.getAll('areas').map(String),
    areasOther: field('areas_other'),
    timeline: field('timeline') || undefined,
    message: field('message'),
    street: field('input_text'),
    city: field('input_text_1'),
    zip: field('input_text_3'),
    firstName: field('first_name'),
    lastName: field('last_name'),
    email: field('email'),
    phone: field('phone'), // validated raw, formatted below
    consents: Object.fromEntries(consentNames.map((name) => [name, formData.get(`consent:${name}`) === 'yes'])),
  }

  const { errors, step } = validateAll(answers, survey, consentNames)
  if (step) return { status: 'invalid', errors, step }
  answers.phone = formatUsPhone(answers.phone)

  const leadId = `lead.${randomUUID()}`
  const submittedAt = new Date().toISOString()
  const pageUrl = sourceUrl(field('page_url'), slug, requestHeaders.get('host'))
  const state = location.address?.state ?? ''
  const description = composeDescription(answers, survey)
  const attribution = Object.fromEntries(ATTRIBUTION_FIELDS.map((key) => [key, field(key)]))

  // The email exactly as Client Tether will receive it (stored on the lead whatever happens next)
  const template = location.leadEmailTemplate ?? ''
  const body = template
    ? buildLeadEmail(template, {
        inputs: {
          names: { first_name: answers.firstName, last_name: answers.lastName },
          email: answers.email,
          phone: answers.phone,
          input_text: answers.street,
          input_text_1: answers.city,
          input_text_2: state,
          input_text_3: answers.zip,
          description,
          ...attribution,
        },
        submission: { source_url: pageUrl, id: leadId, created_at: submittedAt },
      })
    : ''
  const delivery = resolveDelivery(process.env, location.leadEmailSubject?.trim() ?? '')

  const writer = leadWriteClient()
  if (!writer) {
    console.error('[estimate] SANITY_API_WRITE_TOKEN is not set: lead not saved; visitor asked to call')
    return { status: 'call-us' }
  }

  try {
    await writer.create({
      _id: leadId,
      _type: 'lead',
      location: { _type: 'reference', _ref: location._id },
      submittedAt,
      pageUrl,
      testMode: delivery.kind === 'test',
      answers: {
        service: answers.service ? survey.serviceOptions[answers.service] : '',
        areas: answers.areas.map((area) => (area === OTHER_AREA ? survey.otherLabel : area)),
        areasOther: answers.areasOther,
        timeline: answers.timeline,
      },
      message: answers.message,
      description,
      contact: { firstName: answers.firstName, lastName: answers.lastName, email: answers.email, phone: answers.phone },
      address: { street: answers.street, city: answers.city, state, zip: answers.zip },
      attribution,
      consents: consentBlocks.map((block) => {
        const text = consentPlainText(block.body)
        return { _key: block._key || block.name, _type: 'consent', name: block.name, checked: true, text, textHash: sha256(text) }
      }),
      ip,
      userAgent,
      email: { status: 'pending', mode: deliveryLabel(delivery), subject: delivery.subject, body },
    })
  } catch (error) {
    console.error('[estimate] Saving the lead failed; visitor asked to call', error)
    return { status: 'call-us' }
  }

  // The lead is safe from here on: an email failure is recorded on it, never lost
  const result = await sendLeadEmail(delivery, body, answers.email, location._id)
  if (result.status !== 'sent') console.warn(`[estimate] ${leadId} email ${result.status}${result.error ? `: ${result.error}` : ''}`)
  try {
    await writer
      .patch(leadId)
      .set(Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined).map(([key, value]) => [`email.${key}`, value])))
      .commit()
  } catch (error) {
    console.error(`[estimate] ${leadId} saved, but recording the email result failed`, error)
  }

  return { status: 'success', firstName: answers.firstName }
}
