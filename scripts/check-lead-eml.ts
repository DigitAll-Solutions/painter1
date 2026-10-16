/**
 * Checks a received lead email against what the site built. Save the message from the inbox as a raw
 * .eml (Gmail: ⋮ → "Download message", or "Show original" → "Download original"; don't copy from the
 * screen, which can drop the trailing space), then:
 *
 *   node --env-file=.env.local scripts/check-lead-eml.ts <message.eml> [--lead <lead id>]
 *
 * Finds the lead by --lead, else by Message-ID, else by subject (newest). Then it compares the
 * text/plain part byte for byte with the lead's stored email body, which is the buildLeadEmail
 * output, and checks it against the location's lead email template. It also reports any HTML part,
 * tracking pixel, rewritten link, List-Unsubscribe header and SPF/DKIM/DMARC result. Exits 1 on a
 * failure. Reads only; needs SANITY_API_READ_TOKEN.
 */
import { readFileSync } from 'node:fs'

import { createClient } from '@sanity/client'

import { checkLeadEml, decodeWords, parseEml } from '../lib/eml.ts'

const args = process.argv.slice(2)
const file = args.find((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--lead')
const leadArg = args[args.indexOf('--lead') + 1]
if (!file) {
  console.error('Usage: node --env-file=.env.local scripts/check-lead-eml.ts <message.eml> [--lead <lead id>]')
  process.exit(2)
}
const token = process.env.SANITY_API_READ_TOKEN
if (!token) {
  console.error('SANITY_API_READ_TOKEN is not set (leads are private)')
  process.exit(2)
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token,
  perspective: 'raw',
})

type Lead = { _id: string; submittedAt?: string; email?: { body?: string; subject?: string; messageId?: string; status?: string }; template?: string; location?: string }
const projection = `{_id, submittedAt, email, "template": location->leadEmailTemplate, "location": location->name}`

const raw = readFileSync(file)
const { headers } = parseEml(raw)
const get = (name: string) => headers.find((h) => h.name.toLowerCase() === name)?.value
const messageId = get('message-id')
const subject = decodeWords(get('subject') ?? '')

let lead: Lead | null = null
let foundBy = ''
if (leadArg && !leadArg.startsWith('--')) {
  lead = await client.fetch<Lead | null>(`*[_type == "lead" && _id == $id][0]${projection}`, { id: leadArg })
  foundBy = '--lead'
}
if (!lead && messageId) {
  lead = await client.fetch<Lead | null>(`*[_type == "lead" && email.messageId == $id][0]${projection}`, { id: messageId })
  foundBy = 'Message-ID'
}
if (!lead && subject) {
  lead = await client.fetch<Lead | null>(`*[_type == "lead" && email.subject == $subject] | order(submittedAt desc)[0]${projection}`, { subject })
  foundBy = 'subject (newest)'
}
if (!lead?.email?.body) {
  console.error(`No lead with a stored email body found for ${leadArg ? `--lead ${leadArg}` : `Message-ID ${messageId ?? '?'} / subject "${subject}"`}`)
  process.exit(2)
}

const check = checkLeadEml(raw, lead.email.body, lead.template)
console.log(`Message: ${subject}`)
console.log(`Lead:    ${lead._id} (${lead.location ?? '?'}, ${lead.submittedAt ?? '?'}; found by ${foundBy})`)
console.log(`Expected body: ${lead.email.body.length} characters${lead.email.body.endsWith(' ') ? ', ends with a space' : ''}; template: ${lead.template?.length ?? 0} characters${lead.template?.endsWith(' ') ? ', ends with a space' : ''}`)
for (const note of check.notes) console.log(`  · ${note}`)
if (check.ok) console.log('PASS: one text/plain part, identical to the lead email as built; no HTML, pixel or rewritten link')
else {
  for (const problem of check.problems) console.log(`  ✗ ${problem}`)
  console.log('FAIL')
  process.exitCode = 1
}
