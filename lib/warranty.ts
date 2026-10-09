// Warranty repair request: field rules, photo limits, the plain-text email and the recipient filter.
// Pure functions shared by the form (browser) and the server action. Tested in warranty.test.ts.
import { formatUsPhone, isValidUsPhone } from './estimate-survey.ts'

export const WARRANTY_AREAS = ['Interior', 'Exterior', 'Cabinets', 'Other'] as const

export const PHOTO_LIMITS = {
  count: 5,
  /** Before resizing in the browser */
  maxBytes: 10 * 1024 * 1024,
  types: ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'],
  accept: '.jpg,.jpeg,.png,.heic,.heif,.webp,image/jpeg,image/png,image/heic,image/heif,image/webp',
  /** Resized to fit this many pixels on the long side, JPEG */
  maxSide: 1600,
  /** What the server accepts per photo after resizing (the request itself is capped at 4 MB) */
  maxUploadBytes: 3 * 1024 * 1024,
} as const

export type WarrantyFields = {
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
  projectDate: string
  area: string
  issue: string
  hasContract: boolean
}

export type WarrantyErrors = Partial<Record<keyof WarrantyFields | 'photos', string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const WARRANTY_MESSAGES = {
  firstName: 'Please enter your first name.',
  lastName: 'Please enter your last name.',
  phone: 'Please enter a 10-digit phone number.',
  email: 'Please enter a valid email address.',
  address: 'Please enter the address of the painted property.',
  area: 'Please choose an area.',
  issue: 'Please tell us what you’re seeing.',
}

/** Field errors (empty object = valid). Lengths are capped so nobody can post a novel. */
export function validateWarranty(f: WarrantyFields): WarrantyErrors {
  const e: WarrantyErrors = {}
  if (!f.firstName.trim() || f.firstName.length > 80) e.firstName = WARRANTY_MESSAGES.firstName
  if (!f.lastName.trim() || f.lastName.length > 80) e.lastName = WARRANTY_MESSAGES.lastName
  if (!isValidUsPhone(f.phone)) e.phone = WARRANTY_MESSAGES.phone
  if (!EMAIL.test(f.email.trim()) || f.email.length > 200) e.email = WARRANTY_MESSAGES.email
  if (!f.address.trim() || f.address.length > 300) e.address = WARRANTY_MESSAGES.address
  if (!(WARRANTY_AREAS as readonly string[]).includes(f.area)) e.area = WARRANTY_MESSAGES.area
  if (!f.issue.trim() || f.issue.length > 4000) e.issue = WARRANTY_MESSAGES.issue
  if (f.projectDate.length > 40) e.projectDate = 'Please enter a month and year, e.g. March 2024.'
  return e
}

/** "2024-03" (month input) → "March 2024"; anything else is kept as typed */
export function formatProjectDate(value: string) {
  const m = value.trim().match(/^(\d{4})-(\d{2})$/)
  if (!m) return value.trim()
  const month = Number(m[2])
  if (month < 1 || month > 12) return value.trim()
  return `${new Date(Date.UTC(2000, month - 1, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })} ${m[1]}`
}

/** Client Tether turns every email it receives into a new lead: never send it a warranty request */
export const CLIENT_TETHER = /@parse\.clienttether\.com$/i
export const warrantyRecipients = (addresses: string[] | undefined) => (addresses ?? []).map((a) => a.trim()).filter((a) => a && !CLIENT_TETHER.test(a))

export const warrantySubject = (city: string) => `Painter1.com - Warranty Request - ${city}`

export type WarrantyEmailData = WarrantyFields & {
  locationName: string
  requestId: string
  submittedAt: string
  pageUrl: string
  photoUrls: string[]
}

/** Plain-text notification: every field, then links to the photos */
export function buildWarrantyEmail(d: WarrantyEmailData) {
  const when = new Date(d.submittedAt).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'long', timeStyle: 'short' })
  const lines = [
    `Warranty repair request for ${d.locationName}`,
    '',
    `Name: ${d.firstName.trim()} ${d.lastName.trim()}`,
    `Phone: ${formatUsPhone(d.phone)}`,
    `Email: ${d.email.trim()}`,
    `Address of the painted property: ${d.address.trim()}`,
    `Approx. date of original project: ${formatProjectDate(d.projectDate) || 'Not given'}`,
    `Area: ${d.area}`,
    `Has the original signed contract: ${d.hasContract ? 'Yes' : 'No'}`,
    '',
    'What are you seeing?',
    d.issue.trim(),
    '',
    d.photoUrls.length ? `Photos (${d.photoUrls.length}):` : 'Photos: none',
    ...d.photoUrls,
    '',
    `Submitted: ${when} (Eastern)`,
    `Page: ${d.pageUrl}`,
    `Request ID: ${d.requestId} (Sanity Studio → the location → Warranty requests)`,
  ]
  return lines.join('\n')
}
