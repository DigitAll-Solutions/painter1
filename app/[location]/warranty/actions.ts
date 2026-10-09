'use server'

import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'

import { sendEmail, type EmailResult } from '@/lib/email-send'
import { HONEYPOT_FIELD } from '@/lib/estimate-form'
import { formatUsPhone } from '@/lib/estimate-survey'
import { deliveryLabel, resolveDelivery } from '@/lib/lead-delivery'
import { hasWarrantyPage } from '@/lib/location'
import { tooManyRequests } from '@/lib/rate-limit'
import { absoluteUrl, siteUrl } from '@/lib/site'
import { verifyTurnstile } from '@/lib/turnstile'
import {
  buildWarrantyEmail,
  formatProjectDate,
  PHOTO_LIMITS,
  validateWarranty,
  warrantyRecipients,
  warrantySubject,
  type WarrantyErrors,
  type WarrantyFields,
} from '@/lib/warranty'
import { getLocation } from '@/sanity/lib/fetch'
import { leadReadClient, leadWriteClient } from '@/sanity/lib/private-client'

export type WarrantyState =
  | { status: 'idle' }
  | { status: 'invalid'; errors: WarrantyErrors }
  | { status: 'call-us' }
  | { status: 'success'; firstName: string }

/** The page the form was submitted from; only accepted for this site */
function sourceUrl(raw: string, slug: string, host: string | null) {
  try {
    const url = new URL(raw)
    if ((url.protocol === 'https:' || url.protocol === 'http:') && (url.host === host || url.host === new URL(siteUrl).host)) return url.toString()
  } catch {
    // fall through
  }
  return absoluteUrl(`/${slug}/warranty`)
}

/**
 * Warranty repair request. Order: honeypot → Turnstile → rate limit → validation → upload photos and
 * save the request → email the location's WARRANTY recipients (never Client Tether) → record the result.
 * Success is returned only when the request was saved; otherwise the customer is asked to call.
 */
export async function submitWarranty(_previous: WarrantyState, formData: FormData): Promise<WarrantyState> {
  const field = (key: string) => String(formData.get(key) ?? '').trim()

  const slug = field('location')
  const location = slug ? await getLocation(slug) : null
  if (!location || !hasWarrantyPage(location)) return { status: 'call-us' }
  if (field(HONEYPOT_FIELD)) return { status: 'call-us' }

  const requestHeaders = await headers()
  const ip = (requestHeaders.get('x-forwarded-for') ?? '').split(',')[0].trim() || requestHeaders.get('x-real-ip') || ''
  const userAgent = requestHeaders.get('user-agent') ?? ''
  if (!(await verifyTurnstile(field('cf-turnstile-response'), ip))) return { status: 'call-us' }
  if (await tooManyRequests('warrantyRequest', ip)) return { status: 'call-us' }

  const fields: WarrantyFields = {
    firstName: field('first_name'),
    lastName: field('last_name'),
    phone: field('phone'),
    email: field('email'),
    address: field('address'),
    projectDate: field('project_date'),
    area: field('area'),
    issue: field('issue'),
    hasContract: formData.get('has_contract') === 'yes',
  }
  const errors = validateWarranty(fields)

  const photos = formData.getAll('photos').filter((value): value is File => value instanceof File && value.size > 0)
  if (photos.length > PHOTO_LIMITS.count) errors.photos = `Please attach up to ${PHOTO_LIMITS.count} photos.`
  else if (photos.some((photo) => !(PHOTO_LIMITS.types as readonly string[]).includes(photo.type) || photo.size > PHOTO_LIMITS.maxUploadBytes))
    errors.photos = 'Photos must be JPG, PNG, HEIC or WebP images under 10 MB.'
  if (Object.keys(errors).length) return { status: 'invalid', errors }

  const writer = leadWriteClient()
  if (!writer) {
    console.error('[warranty] SANITY_API_WRITE_TOKEN is not set: request not saved; customer asked to call')
    return { status: 'call-us' }
  }

  const requestId = `warrantyRequest.${randomUUID()}`
  const submittedAt = new Date().toISOString()
  const pageUrl = sourceUrl(field('page_url'), slug, requestHeaders.get('host'))
  const city = location.address?.city ?? location.name
  const delivery = resolveDelivery(process.env, warrantySubject(city))

  // Who would receive it (stored on the request): warranty recipients only, Client Tether removed
  let recipients: string[] = []
  let recipientsError: string | undefined
  if (delivery.kind === 'test') recipients = warrantyRecipients(delivery.to)
  else {
    const reader = leadReadClient()
    if (!reader) recipientsError = 'SANITY_API_READ_TOKEN is not set (needed to read recipients)'
    else {
      const doc = await reader.fetch<{ warrantyRecipients?: string[] } | null>(`*[_id == $id][0]{warrantyRecipients}`, { id: `leads.${location._id}` })
      recipients = warrantyRecipients(doc?.warrantyRecipients)
      if (!recipients.length) recipientsError = `No warranty recipients in leads.${location._id}`
    }
  }

  let photoUrls: string[] = []
  try {
    // Photos first, so the saved request links to them
    const uploaded = await Promise.all(
      photos.map(async (photo, i) =>
        writer.assets.upload('image', Buffer.from(await photo.arrayBuffer()), {
          filename: `warranty-${slug}-${submittedAt.slice(0, 10)}-${i + 1}.${photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : photo.type.includes('hei') ? 'heic' : 'jpg'}`,
          contentType: photo.type,
        }),
      ),
    )
    photoUrls = uploaded.map((asset) => asset.url)
    const body = buildWarrantyEmail({ ...fields, locationName: location.name, requestId, submittedAt, pageUrl, photoUrls })

    await writer.create({
      _id: requestId,
      _type: 'warrantyRequest',
      location: { _type: 'reference', _ref: location._id },
      submittedAt,
      pageUrl,
      testMode: delivery.kind === 'test',
      contact: { firstName: fields.firstName, lastName: fields.lastName, email: fields.email, phone: formatUsPhone(fields.phone) },
      propertyAddress: fields.address,
      projectDate: formatProjectDate(fields.projectDate),
      area: fields.area,
      issue: fields.issue,
      hasContract: fields.hasContract,
      photos: uploaded.map((asset, i) => ({ _type: 'image', _key: `photo${i + 1}`, asset: { _type: 'reference', _ref: asset._id } })),
      ip,
      userAgent,
      email: { status: 'pending', mode: deliveryLabel(delivery), subject: delivery.subject, body, recipients },
    })

    // The request is safe from here on: an email failure is recorded on it, never lost
    const result: EmailResult =
      delivery.kind === 'refused'
        ? { status: `skipped (${delivery.reason})` }
        : !process.env.RESEND_API_KEY
          ? { status: 'skipped (no RESEND_API_KEY)' }
          : recipientsError
            ? { status: 'failed', error: recipientsError }
            : await sendEmail({ from: delivery.from, to: recipients, subject: delivery.subject, text: body, replyTo: fields.email })
    if (result.status !== 'sent') console.warn(`[warranty] ${requestId} email ${result.status}${result.error ? `: ${result.error}` : ''}`)
    await writer
      .patch(requestId)
      .set(Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined).map(([key, value]) => [`email.${key}`, value])))
      .commit()
      .catch((error) => console.error(`[warranty] ${requestId} saved, but recording the email result failed`, error))
  } catch (error) {
    console.error('[warranty] Saving the request failed; customer asked to call', error)
    return { status: 'call-us' }
  }

  return { status: 'success', firstName: fields.firstName }
}
