/**
 * "Owner background" is now shown exactly as written (Rick, Nov 26, 2026). Before, the owner card wrapped
 * it in a template: "{first name} opened {location name} in {year} after {ownerBackground}." This script
 * replaces every set ownerBackground with that full sentence, so the owner card reads the same after the
 * code change. Published documents and drafts are migrated separately: a draft stays a draft (nothing is
 * published), and its sentence is built from the draft's own name, owner and year.
 *
 *   node --env-file=.env.local scripts/backup-sanity.ts
 *   node --env-file=.env.local scripts/migrate-owner-background.ts --dry-run
 *   node --env-file=.env.local scripts/migrate-owner-background.ts
 *
 * --only=knoxville,tulsa limits it to those location slugs (published and draft).
 *
 * Run it right after the code change is live: with the old code, a migrated value would read
 * "…after Keith opened…". A value that is already a full sentence ("{first} opened {name}…") is skipped,
 * so a re-run changes nothing. Without an owner name there is no owner card, so there is no sentence to
 * keep: those are reported and left as they are.
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',').map((s) => s.trim()).filter(Boolean)

export type OwnerDoc = { name?: string; ownerName?: string; ownerSinceYear?: string; ownerBackground?: string }

const firstName = (doc: OwnerDoc) => doc.ownerName?.trim().split(/\s+/)[0]

/** The sentence the owner card showed before the change (lib/owner-copy.ts, up to Nov 26), or null without an owner name */
export function legacySentence(doc: OwnerDoc): string | null {
  const first = firstName(doc)
  if (!first || !doc.ownerBackground) return null
  const since = doc.ownerSinceYear
  return `${first} opened ${doc.name}${since ? ` in ${since}` : ''} after ${doc.ownerBackground}.`
}

/** Already migrated (or written as a full sentence by the editor): starts with "{first} opened {name}" */
export const isFullSentence = (doc: OwnerDoc) => {
  const first = firstName(doc)
  return !!first && !!doc.ownerBackground?.trim().startsWith(`${first} opened ${doc.name}`)
}

/** The new ownerBackground for a document, or null when it stays as it is */
export function migratedBackground(doc: OwnerDoc): string | null {
  if (!doc.ownerBackground || isFullSentence(doc)) return null
  return legacySentence(doc)
}

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Doc = OwnerDoc & { _id: string; _rev: string; slug?: string }

async function main() {
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  const all = await client.fetch<Doc[]>(
    `*[_type == "location" && defined(ownerBackground) && ownerBackground != ""]{_id, _rev, "slug": slug.current, name, ownerName, ownerSinceYear, ownerBackground} | order(slug asc, _id asc)`,
  )
  const docs = ONLY ? all.filter((d) => ONLY.includes(d.slug ?? '')) : all
  if (ONLY) console.log(`--only: ${ONLY.join(', ')}`)
  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  console.log(`${docs.length} location document(s) have an Owner background (published and drafts)\n`)

  const guard = new SafeWrite('migrate-owner-background')
  const tx = client.transaction()
  for (const doc of docs) {
    const kind = doc._id.startsWith('drafts.') ? 'DRAFT' : 'published'
    console.log(`${doc.slug ?? doc._id} (${kind}, ${doc._id})`)
    console.log(`  before: ${JSON.stringify(doc.ownerBackground)}`)
    const next = migratedBackground(doc)
    if (next === null) {
      console.log(`  skip:   ${isFullSentence(doc) ? 'already a full sentence' : 'no owner name: no owner card, nothing shown today'}\n`)
      continue
    }
    console.log(`  after:  ${JSON.stringify(next)}\n`)
    const { set, any } = guard.plan(doc._id, doc, { set: { ownerBackground: next }, expect: { ownerBackground: { value: doc.ownerBackground } } })
    if (any) tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set))
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
