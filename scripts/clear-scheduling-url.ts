/**
 * Booking is off for launch (Rick, Nov 12, 2026): every location's "Get your FREE estimate" button goes to
 * the survey, with no booking links, until Painter1 corp decides on scheduling after its Jan 15
 * conference. Clears schedulingUrl on every location that has one (published and draft) and puts
 * "Main buttons go to" back on the survey. To turn booking back on: scripts/set-booking-target.ts.
 *
 *   node --env-file=.env.local scripts/backup-sanity.ts
 *   node --env-file=.env.local scripts/clear-scheduling-url.ts --dry-run
 *   node --env-file=.env.local scripts/clear-scheduling-url.ts
 *
 * Only a booking URL on schedule.painter1.com is cleared; any other value is reported and kept (--force
 * clears it too, after confirmation).
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite } from './lib/safe-write.ts'
import { SCHEDULE_HOST } from './set-booking-target.ts'

const DRY_RUN = process.argv.includes('--dry-run')

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Doc = { _id: string; _rev: string; slug?: string; bookingTarget?: string; schedulingUrl?: string }

const isScheduleUrl = (value: unknown) => typeof value === 'string' && value.trim().startsWith(`${SCHEDULE_HOST}/`)

async function main() {
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  const docs = await client.fetch<Doc[]>(
    `*[_type == "location" && (defined(schedulingUrl) || bookingTarget == "booking")]{_id, _rev, "slug": slug.current, bookingTarget, schedulingUrl} | order(_id asc)`,
  )
  const total = await client.fetch<number>(`count(*[_type == "location"])`)
  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  console.log(`${docs.length} of ${total} location document(s) have a schedulingUrl or bookingTarget "booking"\n`)

  const guard = new SafeWrite('clear-scheduling-url')
  const tx = client.transaction()
  for (const doc of docs) {
    console.log(`${doc._id} (${doc.slug ?? 'no slug'}): bookingTarget ${JSON.stringify(doc.bookingTarget ?? null)} · schedulingUrl ${JSON.stringify(doc.schedulingUrl ?? null)}`)
    const { set, unset, any } = guard.plan(doc._id, doc, {
      set: doc.bookingTarget === 'booking' ? { bookingTarget: 'survey' } : {},
      unset: ['schedulingUrl'],
      expect: {
        bookingTarget: { value: 'booking' },
        schedulingUrl: { test: isScheduleUrl, label: `a ${SCHEDULE_HOST}/… URL` },
      },
    })
    for (const path of Object.keys(set)) console.log(`  set   ${path} = ${JSON.stringify(set[path])}`)
    for (const path of unset) console.log(`  unset ${path}`)
    if (any) tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set).unset(unset))
  }
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
