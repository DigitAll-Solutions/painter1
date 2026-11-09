/**
 * Switches locations to online booking as their pages on schedule.painter1.com go live (Nov 3).
 * For every location, it requests https://schedule.painter1.com/<slug>/ (no redirects followed):
 *   - 200: "Main buttons go to" (bookingTarget) → "booking", and "Booking page" (schedulingUrl) →
 *     https://schedule.painter1.com/<slug>/. The old hasScheduling switch is removed if still there.
 *   - anything else (404 until the page is up): the location isn't touched and stays on the survey.
 *   - SURVEY_ONLY locations (Raleigh, Marietta, and the three Davidson locations: Greater SLC, Salt Lake City, Park City) aren't checked at all and stay on the survey.
 * The published document and its draft (if any) are both updated. Run it again whenever more booking
 * pages go up.
 *
 *   node --env-file=.env.local scripts/set-booking-target.ts --dry-run   # print what would change
 *   node --env-file=.env.local scripts/set-booking-target.ts             # apply (SANITY_API_WRITE_TOKEN)
 *
 * Safe to re-run (scripts/lib/safe-write.ts): bookingTarget is written while empty or "survey";
 * schedulingUrl while empty or the same page without the trailing slash. A different booking URL set
 * in Studio is kept (reported as KEPT).
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
export const SCHEDULE_HOST = 'https://schedule.painter1.com'

export const bookingPageUrl = (slug: string) => `${SCHEDULE_HOST}/${slug}/`

// Stay on the survey even if a booking page answers 200: Raleigh isn't on Rick's booking list ("Painter1
// w/ SSA" sheet, Nov 3), though an earlier list had it; Marietta has a new owner, no booking (Nov 7);
// Davidson Ativos's three locations (Greater SLC, Salt Lake City, Park City) use the quote request form only, no scheduling (Rick, Nov 9)
const SURVEY_ONLY = new Set(['raleigh', 'marietta', 'greater-salt-lake', 'slc', 'park-city'])

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Doc = { _id: string; _rev: string; slug?: string; bookingTarget?: string; hasScheduling?: boolean; schedulingUrl?: string }

/** HTTP status of the location's booking page; 0 when the request fails */
async function bookingStatus(slug: string): Promise<number> {
  try {
    const res = await fetch(bookingPageUrl(slug), { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(20_000), headers: { 'user-agent': 'painter1-set-booking-target' } })
    await res.body?.cancel()
    return res.status
  } catch {
    return 0
  }
}

/** Runs fn over items, a few at a time */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i])
      }
    }),
  )
  return out
}

const publishedId = (id: string) => id.replace(/^drafts\./, '')

async function main() {
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  const docs = await client.fetch<Doc[]>(`*[_type == "location"]{_id, _rev, "slug": slug.current, bookingTarget, hasScheduling, schedulingUrl} | order(slug asc)`)

  // One check per location, by the published document's slug (a draft-only location isn't live)
  const slugs = [...new Set(docs.filter((doc) => !doc._id.startsWith('drafts.') && doc.slug && !SURVEY_ONLY.has(doc.slug)).map((doc) => doc.slug as string))]
  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  console.log(`Survey only, not checked: ${[...SURVEY_ONLY].join(', ')}`)
  console.log(`Checking ${slugs.length} booking pages on ${SCHEDULE_HOST} …`)
  const results = await mapLimit(slugs, 6, bookingStatus)
  const statuses = new Map(slugs.map((slug, i) => [slug, results[i]]))

  const live = slugs.filter((slug) => statuses.get(slug) === 200)
  const other = slugs.filter((slug) => statuses.get(slug) !== 200)
  const byStatus = new Map<number, string[]>()
  for (const slug of other) byStatus.set(statuses.get(slug)!, [...(byStatus.get(statuses.get(slug)!) ?? []), slug])
  console.log(`  200 (booking page live): ${live.length ? live.join(', ') : 'none'}`)
  for (const [status, list] of byStatus) console.log(`  ${status || 'request failed'}: ${list.length} location(s), not touched${list.length <= 10 ? ` (${list.join(', ')})` : ''}`)
  console.log('')

  const guard = new SafeWrite('set-booking-target')
  const tx = client.transaction()
  const liveIds = new Set(docs.filter((doc) => !doc._id.startsWith('drafts.') && live.includes(doc.slug ?? '')).map((doc) => doc._id))
  for (const doc of docs.filter((d) => liveIds.has(publishedId(d._id)))) {
    // The draft follows its published document's slug
    const slug = docs.find((d) => d._id === publishedId(doc._id))!.slug!
    const url = bookingPageUrl(slug)
    console.log(`${doc._id}: bookingTarget ${JSON.stringify(doc.bookingTarget ?? null)} · schedulingUrl ${JSON.stringify(doc.schedulingUrl ?? null)}`)
    const { set, unset, any } = guard.plan(doc._id, doc, {
      set: { bookingTarget: 'booking', schedulingUrl: url },
      unset: ['hasScheduling'],
      expect: {
        bookingTarget: { value: 'survey' },
        schedulingUrl: { value: url.replace(/\/$/, '') },
        hasScheduling: { value: true },
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
