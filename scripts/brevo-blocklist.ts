/**
 * Brevo's transactional blocklist vs. a location's lead recipients. Brevo stops sending to an address
 * that unsubscribed (the List-Unsubscribe header it adds to every send), hard-bounced or complained,
 * and the API still answers "sent". A blocked staff member, or the Client Tether parse address, would
 * silently stop getting leads. Addresses are printed masked.
 *
 *   node --env-file=.env.local scripts/brevo-blocklist.ts [location-slug]          # check (default knoxville)
 *   node --env-file=.env.local scripts/brevo-blocklist.ts --unblock <email>        # dry run: what would change
 *   node --env-file=.env.local scripts/brevo-blocklist.ts --unblock <email> --apply
 *
 * Needs BREVO_API_KEY and SANITY_API_READ_TOKEN (recipients live in the private leads.<location id> doc).
 * Docs: docs/email-setup.md, "List-Unsubscribe and the blocklist".
 */
import { createClient } from '@sanity/client'

const API = 'https://api.brevo.com/v3/smtp/blockedContacts'
const args = process.argv.slice(2)
const unblock = args.includes('--unblock') ? args[args.indexOf('--unblock') + 1] : undefined
const apply = args.includes('--apply')
const slug = args.find((arg, i) => !arg.startsWith('--') && args[i - 1] !== '--unblock') ?? 'knoxville'

const apiKey = process.env.BREVO_API_KEY
if (!apiKey) {
  console.error('BREVO_API_KEY is not set')
  process.exit(2)
}
const headers = { 'api-key': apiKey, accept: 'application/json' }
const mask = (email: string) => email.replace(/^(.)[^@]*@(.+)$/, (_, first: string, domain: string) => `${first}***@${domain}`)

type Blocked = { email: string; senderEmail?: string; reason?: { code?: string; message?: string }; blockedAt?: string }

async function blocklist(): Promise<Blocked[]> {
  const all: Blocked[] = []
  for (let offset = 0; ; offset += 100) {
    const res = await fetch(`${API}?limit=100&offset=${offset}&sort=desc`, { headers })
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as { contacts?: Blocked[]; count?: number }
    all.push(...(data.contacts ?? []))
    if (!data.contacts?.length || all.length >= (data.count ?? 0)) return all
  }
}

if (unblock) {
  const entry = (await blocklist()).find((c) => c.email.toLowerCase() === unblock.toLowerCase())
  if (!entry) {
    console.log(`${mask(unblock)} is not on the transactional blocklist; nothing to do`)
    process.exit(0)
  }
  console.log(`${mask(unblock)}: blocked ${entry.blockedAt ?? '?'} (${entry.reason?.code ?? '?'}: ${entry.reason?.message ?? ''})`)
  if (!apply) {
    console.log('Dry run: add --apply to remove it from the blocklist')
    process.exit(0)
  }
  const res = await fetch(`${API}/${encodeURIComponent(unblock)}`, { method: 'DELETE', headers })
  console.log(res.status === 204 ? 'Removed from the blocklist' : `Brevo ${res.status}: ${await res.text()}`)
  process.exit(res.status === 204 ? 0 : 1)
}

const token = process.env.SANITY_API_READ_TOKEN
if (!token) {
  console.error('SANITY_API_READ_TOKEN is not set (recipients are private)')
  process.exit(2)
}
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token,
  perspective: 'raw',
})
const doc = await sanity.fetch<{ name?: string; recipients?: string[] } | null>(
  `*[_type == "location" && slug.current == $slug][0]{name, "recipients": *[_id == "leads." + ^._id][0].leadRecipients}`,
  { slug },
)
if (!doc) {
  console.error(`No location with slug "${slug}"`)
  process.exit(2)
}
const recipients = (doc.recipients ?? []).filter(Boolean)
const blocked = await blocklist()
const byEmail = new Map(blocked.map((c) => [c.email.toLowerCase(), c]))

console.log(`Brevo transactional blocklist: ${blocked.length} address(es) in total`)
console.log(`${doc.name ?? slug}: ${recipients.length} lead recipient(s)`)
let hits = 0
for (const email of recipients) {
  const entry = byEmail.get(email.toLowerCase())
  if (entry) hits++
  console.log(`  ${entry ? '✗ BLOCKED' : '✓ ok     '} ${mask(email)}${entry ? ` since ${entry.blockedAt ?? '?'} (${entry.reason?.code ?? '?'}: ${entry.reason?.message ?? ''})` : ''}`)
}
if (hits) {
  console.log(`${hits} recipient(s) blocked: they get no leads. Remove each with --unblock <email> --apply (see docs/email-setup.md)`)
  process.exitCode = 1
} else console.log('No lead recipient is blocked')
