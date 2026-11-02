/**
 * Fills phone, Google review count, rating and one featured review for the locations in Rick's
 * "Painter1 w/ SSA" sheet (Nov 3), the locations getting a booking page on schedule.painter1.com.
 * Knoxville is skipped: it already has all of this.
 *
 * Data: docs/reference/ssa-locations.json (gitignored), exported from docs/reference/Painter1 w_ SSA.xlsx:
 *   [{ slug, name, phone, reviewsCount, rating, reviewerName, reviewText }]
 * The review is added word for word: 5 stars, source Google, reviewer name as given, no date.
 *
 *   node --env-file=.env.local scripts/seed-ssa-locations.ts --dry-run   # print what would change
 *   node --env-file=.env.local scripts/seed-ssa-locations.ts             # apply (SANITY_API_WRITE_TOKEN)
 *
 * Safe to re-run (scripts/lib/safe-write.ts): each field is written only while empty, and the review only
 * while the location has no reviews. Anything already set is kept and reported.
 * The published document and its draft (if any) are both updated.
 */
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const DATA = 'docs/reference/ssa-locations.json'
const SKIP = new Set(['knoxville'])

type Row = { slug: string; name: string; phone: string; reviewsCount: number; rating: number; reviewerName: string; reviewText: string }
type Doc = { _id: string; _rev: string; slug?: string; phone?: string; reviewsCount?: number; rating?: number; reviews?: unknown[] }

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

/** The row as Sanity fields; the review gets a fixed key, so a re-run finds the same item */
export function fieldsFor(row: Row) {
  return {
    phone: row.phone,
    reviewsCount: row.reviewsCount,
    rating: row.rating,
    reviews: [{ _key: 'ssa-featured', _type: 'review', reviewText: row.reviewText, reviewerName: row.reviewerName, rating: 5, source: 'Google' }],
  }
}

const publishedId = (id: string) => id.replace(/^drafts\./, '')

async function main() {
  const rows = (JSON.parse(readFileSync(DATA, 'utf8')) as Row[]).filter((row) => !SKIP.has(row.slug))
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  const docs = await client.fetch<Doc[]>(`*[_type == "location"]{_id, _rev, "slug": slug.current, phone, reviewsCount, rating, reviews}`)

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  const guard = new SafeWrite('seed-ssa-locations')
  const tx = client.transaction()
  const missing: string[] = []
  for (const row of rows) {
    const published = docs.find((doc) => !doc._id.startsWith('drafts.') && doc.slug === row.slug)
    if (!published) {
      missing.push(row.slug)
      continue
    }
    const fields = fieldsFor(row)
    for (const doc of docs.filter((d) => publishedId(d._id) === published._id)) {
      console.log(`${doc._id}  (${row.name})`)
      const { set, any } = guard.plan(doc._id, doc, { set: fields })
      for (const [path, value] of Object.entries(set)) {
        const shown = path === 'reviews' ? `[${row.reviewerName}, 5★ Google: ${JSON.stringify(row.reviewText)}]` : JSON.stringify(value)
        console.log(`  set   ${path} = ${shown}`)
      }
      if (any) tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set))
    }
  }
  if (missing.length) console.log(`\nNot in Sanity (skipped): ${missing.join(', ')}`)
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
