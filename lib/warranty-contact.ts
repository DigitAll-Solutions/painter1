// The warranty page's contact block (it replaced the repair request form, Oct 14). Warranty claims go by
// email (Rick, Nov 24), so Email comes first, then Call on the main phone; there is no Text link.
// Tested in warranty-contact.test.ts.
import type { Location, WarrantyTerms } from '@/sanity/lib/types'

import { cityStateOrPlace } from './place.ts'

export const CONTACT_ANCHOR = 'warranty-contact'
const DEFAULT_HEADING = 'Questions About Your Warranty?'
const DEFAULT_TEXT = 'Reach out to {ownerTeam} by email or phone and we’ll help.'

/** Meta description (≤ 160 characters): drops the repeated place, then the location name, when names are long */
export function warrantyDescription(location: Pick<Location, 'name' | 'address' | 'marketName'>) {
  const place = cityStateOrPlace(location)
  const what = `What the two-year workmanship warranty from ${location.name} covers`
  const options = [
    `${what} in ${place}, what it requires, and how to reach ${location.name} with questions.`,
    `${what}, what it requires, and how to reach ${location.name} with questions.`,
    `${what}, what it requires, and how to reach us with questions.`,
  ]
  return options.find((o) => o.length <= 160) ?? options[options.length - 1].slice(0, 160)
}

export type ContactLink = { kind: 'call' | 'email'; href: string; verb: string; value: string; label: string }

export function warrantyContact(location: Pick<Location, 'name' | 'phone' | 'email' | 'ownerName'>, terms: Pick<WarrantyTerms, 'contactHeading' | 'contactText'>) {
  const first = location.ownerName?.trim().split(/\s+/)[0]
  const ownerTeam = first ? `${first}’s team` : 'our team'
  const digits = location.phone?.replace(/[^\d+]/g, '') ?? ''
  const email = location.email?.trim()
  // Visible: "Call (865) 345-5800"; screen readers: "Call Painter1 of Knoxville at (865) 345-5800"
  const link = (kind: ContactLink['kind'], href: string, verb: string, value: string): ContactLink => ({ kind, href, verb, value, label: `${verb} ${location.name} at ${value}` })
  const links: ContactLink[] = [
    ...(email ? [link('email', `mailto:${email}`, 'Email', email)] : []),
    ...(digits ? [link('call', `tel:${digits}`, 'Call', location.phone!.trim())] : []),
  ]
  return {
    heading: terms.contactHeading?.trim() || DEFAULT_HEADING,
    text: (terms.contactText?.trim() || DEFAULT_TEXT).replace(/\{ownerTeam\}/g, ownerTeam),
    links,
  }
}
