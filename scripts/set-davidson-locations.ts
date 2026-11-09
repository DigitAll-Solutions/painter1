/**
 * Rick's answers on the three Davidson Ativos locations (Nov 9, 2026). Greater SLC (greater-salt-lake),
 * Salt Lake City (slc) and Park City (park-city) are separate businesses, each with its own NAP:
 *   - phone: each one's current number (the live site's footer)
 *   - address: from the saved live pages (docs/reference/live-site/locations), only where Sanity has none
 *   - lead recipients (private leads.<id> document): davidson@painter1.com
 * Each field is written only while it is empty, except the one slc phone migration below (exact old value
 * only). The public email fields are not touched. --force is refused.
 *
 *   node --env-file=.env.local --no-warnings scripts/set-davidson-locations.ts --dry-run   # print what would change
 *   node --env-file=.env.local --no-warnings scripts/set-davidson-locations.ts             # apply (SANITY_API_WRITE_TOKEN)
 *
 * Safe to re-run (scripts/lib/safe-write.ts): a second run changes nothing.
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite, type Expect } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const RECIPIENTS = ['davidson@painter1.com']

type Ops = { set: Record<string, unknown>; expect?: Record<string, Expect> }
const LOCATIONS: Record<string, Ops> = {
  'location-greater-salt-lake': {
    set: {
      phone: '(801) 212-9945',
      // The footer's address (the page's structured data has a different one: see the PR)
      address: { street: '2601 S Constitution Blvd, Suite 100', city: 'West Valley City', state: 'UT', zip: '84119' },
    },
  },
  // Same number, missing dash
  'location-slc': { set: { phone: '(801) 509-9121' }, expect: { phone: { value: '(801) 509 9121' } } },
  // The live page shows no address
  'location-park-city': { set: { phone: '(435) 246-1003' } },
}

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Doc = { _id: string; _rev: string; _type: string; phone?: string; address?: unknown; leadRecipients?: string[] }

async function main() {
  if (process.argv.includes('--force')) throw new Error('--force is not allowed: only empty fields are filled')
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN : env('SANITY_API_WRITE_TOKEN')
  if (!token) throw new Error('Missing SANITY_API_WRITE_TOKEN (the leads documents are private)')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  const ids = Object.keys(LOCATIONS)
  const leadIds = ids.map((id) => `leads.${id}`)
  const docs = await client.fetch<Doc[]>(`*[_id in $ids] | order(_id){_id, _rev, _type, phone, address, leadRecipients}`, {
    ids: [...ids, ...ids.map((id) => `drafts.${id}`), ...leadIds],
  })
  const missing = [...ids, ...leadIds].filter((id) => !docs.some((doc) => doc._id === id))
  if (missing.length) throw new Error(`Not found: ${missing.join(', ')}`)

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  const guard = new SafeWrite('set-davidson-locations')
  const tx = client.transaction()
  for (const doc of docs) {
    const ops: Ops = doc._id.startsWith('leads.') ? { set: { leadRecipients: RECIPIENTS } } : LOCATIONS[doc._id.replace(/^drafts\./, '')]
    const { set, any } = guard.plan(doc._id, doc, ops)
    for (const path of Object.keys(set)) console.log(`${doc._id}: set ${path} = ${JSON.stringify(set[path])}`)
    if (any) tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set))
  }
  guard.report()
  if (DRY_RUN || !guard.changes.length) {
    console.log(DRY_RUN ? '\nDry run complete. No changes written.' : '\nNothing to do.')
    return
  }
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`\nCommitted transaction ${result.transactionId}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
