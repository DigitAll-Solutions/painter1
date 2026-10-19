/**
 * Post-merge step for "Main buttons go to" (Oct 16): one setting, bookingTarget, now drives every main
 * CTA, and the old hasScheduling switch is gone from the schema. For Knoxville:
 *   - bookingTarget → "booking" (Rick: Knoxville books online)
 *   - hasScheduling removed (it only changed the button label; the field no longer exists)
 *   - schedulingUrl left as it is (empty until schedule.painter1.com/knoxville is live), so every
 *     button keeps going to the survey until Rick fills it in
 * The published document and its draft (if any) are both updated.
 *
 *   node --env-file=.env.local scripts/set-booking-target.ts --dry-run   # print what would change
 *   node --env-file=.env.local scripts/set-booking-target.ts             # apply (SANITY_API_WRITE_TOKEN)
 *
 * Safe to re-run (scripts/lib/safe-write.ts): bookingTarget is written only while empty, and
 * hasScheduling is removed only while it is still true.
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const ID = 'location-knoxville'

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Doc = { _id: string; _rev: string; bookingTarget?: string; hasScheduling?: boolean; schedulingUrl?: string }

async function main() {
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  const docs = await client.fetch<Doc[]>(`*[_id in $ids]{_id, _rev, bookingTarget, hasScheduling, schedulingUrl}`, { ids: [ID, `drafts.${ID}`] })
  if (!docs.some((doc) => doc._id === ID)) throw new Error(`${ID} not found`)

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  const guard = new SafeWrite('set-booking-target')
  const tx = client.transaction()
  for (const doc of docs) {
    console.log(`${doc._id}: bookingTarget ${JSON.stringify(doc.bookingTarget ?? null)} · hasScheduling ${JSON.stringify(doc.hasScheduling ?? null)} · schedulingUrl ${JSON.stringify(doc.schedulingUrl ?? null)} (left as is)`)
    const { set, unset, any } = guard.plan(doc._id, doc, { set: { bookingTarget: 'booking' }, unset: ['hasScheduling'], expect: { hasScheduling: { value: true } } })
    for (const path of Object.keys(set)) console.log(`  set   ${path} = ${JSON.stringify(set[path])}`)
    for (const path of unset) console.log(`  unset ${path}`)
    if (any) tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set).unset(unset))
  }
  if (!docs.find((doc) => doc._id === ID)?.schedulingUrl) console.log('\nBooking page is empty: every button keeps going to the survey until it is set in Studio.')
  guard.report()
  if (DRY_RUN || !guard.changes.length) {
    console.log(DRY_RUN ? '\nDry run complete. No changes written.' : '\nNothing to do.')
    return
  }
  await guard.confirm(DRY_RUN)
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`\nCommitted transaction ${result.transactionId}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
