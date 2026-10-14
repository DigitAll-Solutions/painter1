// The warranty page's contact block (it replaced the repair request form, Oct 14). Every location's
// main business line accepts texts (Rick, Oct 14), so Call and Text both use the main phone.
// Tested in warranty-contact.test.ts.
import type { Location, WarrantyTerms } from '@/sanity/lib/types'

export const CONTACT_ANCHOR = 'warranty-contact'
const DEFAULT_HEADING = 'Questions About Your Warranty?'
const DEFAULT_TEXT = 'Reach out to {ownerTeam} by phone, text or email and we’ll help.'

export type ContactLink = { kind: 'call' | 'text' | 'email'; href: string; verb: string; value: string; label: string }

export function warrantyContact(location: Pick<Location, 'name' | 'phone' | 'email' | 'ownerName'>, terms: Pick<WarrantyTerms, 'contactHeading' | 'contactText'>) {
  const first = location.ownerName?.trim().split(/\s+/)[0]
  const ownerTeam = first ? `${first}’s team` : 'our team'
  const digits = location.phone?.replace(/[^\d+]/g, '') ?? ''
  const email = location.email?.trim()
  // Visible: "Call (865) 345-5800"; screen readers: "Call Painter1 of Knoxville at (865) 345-5800"
  const link = (kind: ContactLink['kind'], href: string, verb: string, value: string): ContactLink => ({ kind, href, verb, value, label: `${verb} ${location.name} at ${value}` })
  const links: ContactLink[] = [
    ...(digits ? [link('call', `tel:${digits}`, 'Call', location.phone!.trim()), link('text', `sms:${digits}`, 'Text', location.phone!.trim())] : []),
    ...(email ? [link('email', `mailto:${email}`, 'Email', email)] : []),
  ]
  return {
    heading: terms.contactHeading?.trim() || DEFAULT_HEADING,
    text: (terms.contactText?.trim() || DEFAULT_TEXT).replace(/\{ownerTeam\}/g, ownerTeam),
    links,
  }
}
