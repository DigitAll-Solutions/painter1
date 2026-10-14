/**
 * Removes the data of fields the site no longer reads, so their schema fields can be deleted afterwards
 * (follow-up PR). One-off, post-merge. In this order:
 *
 *   1. node --env-file=.env.local scripts/backup-sanity.ts
 *   2. node --env-file=.env.local scripts/unset-legacy-fields.ts --export
 *        writes docs/reference/knoxville-imported-copy.json (gitignored): every location's imported
 *        old-site copy, readable (rich text as plain paragraphs) and raw
 *   3. node --env-file=.env.local scripts/unset-legacy-fields.ts --dry-run
 *   4. node --env-file=.env.local scripts/unset-legacy-fields.ts
 *
 * Unsets:
 *   location   intro, whyChooseUs, aboutSections, warranty, privacyPolicy (imported old-site copy);
 *              services.<interior|exterior|cabinet>.description / highlights / process (imported);
 *              reviews[].serviceTag and galleryImages[].serviceType (old tags, replaced by Services)
 *   leads.*    warrantyRecipients (the warranty request form was removed)
 *   warranty-terms  requestEyebrow, requestHeading, requestIntro, steps (old request form)
 *
 * Refuses to write unless today's backup exists (docs/backups/<today>*) and the export file holds
 * exactly the copy that would be removed (once everything is removed, neither is needed). A review tag is removed only when it's "general" or the
 * review has Services; a photo type only when the photo has Services or is ticked Commercial.
 * Writes go through scripts/lib/safe-write.ts. Re-running is a no-op.
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite, type Expect } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const EXPORT = process.argv.includes('--export')
const EXPORT_FILE = 'docs/reference/knoxville-imported-copy.json'

const SERVICE_KEYS = ['interior', 'exterior', 'cabinet'] as const
const LOCATION_COPY = ['intro', 'whyChooseUs', 'aboutSections', 'warranty', 'privacyPolicy'] as const
const SERVICE_COPY = ['description', 'highlights', 'process'] as const
const TERMS_FIELDS = ['requestEyebrow', 'requestHeading', 'requestIntro', 'steps'] as const

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Doc = Record<string, unknown> & { _id: string; _rev: string }
type Block = { _type?: string; style?: string; listItem?: string; children?: { text?: string }[] }

/** Rich text → readable paragraphs ("## " for headings, "• " for list items) */
const readable = (value: unknown): unknown =>
  Array.isArray(value) && value.some((b) => (b as Block)?._type === 'block')
    ? (value as Block[]).map((b) => {
        const text = (b.children ?? []).map((c) => c.text ?? '').join('')
        return b.listItem ? `• ${text}` : b.style && /^h\d$/.test(b.style) ? `## ${text}` : text
      })
    : value

/** The imported copy of one location: what --export writes and what the unset checks against */
function importedCopy(location: Doc) {
  const raw: Record<string, unknown> = {}
  for (const field of LOCATION_COPY) if (location[field] != null) raw[field] = location[field]
  const services = (location.services ?? {}) as Record<string, Record<string, unknown> | undefined>
  for (const key of SERVICE_KEYS) for (const field of SERVICE_COPY) if (services[key]?.[field] != null) raw[`services.${key}.${field}`] = services[key]![field]
  return raw
}
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

async function main() {
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token: env('SANITY_API_WRITE_TOKEN'), useCdn: false, perspective: 'raw' })
  const drafts = await client.fetch<string[]>(`*[_id in path("drafts.**") && _type in ["location", "leadSettings", "warrantyTerms"]]._id`)
  if (drafts.length) throw new Error(`Unpublished drafts exist (${drafts.join(', ')}): publish or discard them in Studio first`)
  const locations = await client.fetch<Doc[]>(`*[_type == "location" && !(_id in path("drafts.**"))] | order(_id)`)
  const settings = await client.fetch<Doc[]>(`*[_type == "leadSettings" && !(_id in path("drafts.**"))]`)
  const terms = await client.fetch<Doc | null>(`*[_id == "warranty-terms"][0]`)

  if (EXPORT) {
    const out = {
      exportedAt: new Date().toISOString(),
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      note: 'Imported old-site copy, removed from Sanity in the Oct 2026 cleanup (the site never showed it). "readable" has rich text as plain paragraphs; "raw" is exactly what Sanity held.',
      locations: locations
        .map((l) => ({ _id: l._id, name: l.name, slug: (l.slug as { current?: string } | undefined)?.current, raw: importedCopy(l) }))
        .filter((l) => Object.keys(l.raw).length)
        .map((l) => ({ ...l, sha256: hash(l.raw), readable: Object.fromEntries(Object.entries(l.raw).map(([k, v]) => [k, readable(v)])) })),
    }
    writeFileSync(EXPORT_FILE, JSON.stringify(out, null, 2) + '\n')
    console.log(`Exported ${out.locations.length} location(s) to ${EXPORT_FILE}:`)
    for (const l of out.locations) console.log(`  ${l.name} (${l._id}): ${Object.keys(l.raw).join(', ')}`)
    return
  }

  // Safety: today's backup, and the export of exactly what's about to go
  const today = new Date().toISOString().slice(0, 10)
  const backups = existsSync('docs/backups') ? readdirSync('docs/backups').filter((d) => d.startsWith(today)) : []
  const exported = existsSync(EXPORT_FILE) ? (JSON.parse(readFileSync(EXPORT_FILE, 'utf-8')) as { locations: { _id: string; sha256: string }[] }) : null

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")`)
  console.log(`Backup from today: ${backups.length ? `docs/backups/${backups.at(-1)}/` : '(none)'}   Export: ${exported ? EXPORT_FILE : '(none)'}\n`)

  const guard = new SafeWrite('unset-legacy-fields')
  const tx = client.transaction()
  const remove = (label: string): Expect => ({ test: () => true, label })

  for (const location of locations) {
    const unset: string[] = []
    const expect: Record<string, Expect> = {}
    const copy = importedCopy(location)
    if (Object.keys(copy).length) {
      const saved = exported?.locations.find((l) => l._id === location._id)
      if (!saved || saved.sha256 !== hash(copy)) throw new Error(`${location._id}: its imported copy isn't in ${EXPORT_FILE} (or changed since): run --export first`)
      for (const path of Object.keys(copy)) {
        unset.push(path)
        expect[path] = remove(`imported copy, saved in ${EXPORT_FILE}`)
      }
      console.log(`${location._id} imported copy (exported): ${Object.keys(copy).join(', ')}`)
    }
    const reviews = (location.reviews ?? []) as { _key: string; serviceTag?: string; services?: unknown[] }[]
    const tags = reviews.filter((r) => r.serviceTag != null)
    for (const review of tags) {
      if (review.serviceTag !== 'general' && !review.services?.length) {
        console.log(`  review ${review._key}: tag "${review.serviceTag}" but no Services: kept (tag it in Studio first)`)
        continue
      }
      const path = `reviews[_key=="${review._key}"].serviceTag`
      unset.push(path)
      expect[path] = remove('old review tag, replaced by Services')
    }
    const photos = ((location.galleryImages ?? []) as { _key: string; serviceType?: string; services?: unknown[]; commercial?: boolean }[]).filter((g) => g.serviceType != null)
    for (const photo of photos) {
      const covered = photo.services?.length || (photo.serviceType === 'commercial' && photo.commercial)
      if (!covered) {
        console.log(`  photo ${photo._key}: type "${photo.serviceType}" not covered by Services or Commercial: kept`)
        continue
      }
      const path = `galleryImages[_key=="${photo._key}"].serviceType`
      unset.push(path)
      expect[path] = remove('old photo type, replaced by Services / Commercial')
    }
    if (tags.length || photos.length) console.log(`${location._id}: ${tags.length} review tag(s), ${photos.length} photo type(s)`)
    const allowed = guard.plan(location._id, location, { unset, expect })
    if (allowed.any) tx.patch(location._id, (p) => p.ifRevisionId(location._rev).unset(allowed.unset))
  }

  for (const doc of settings) {
    const allowed = guard.plan(doc._id, doc, { unset: ['warrantyRecipients'], expect: { warrantyRecipients: remove('warranty form recipients (form removed)') } })
    if (allowed.any) {
      console.log(`${doc._id}: warrantyRecipients (${(doc.warrantyRecipients as unknown[]).length} addresses; also in today's backup)`)
      tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).unset(allowed.unset))
    }
  }

  if (terms) {
    const allowed = guard.plan(terms._id, terms, { unset: [...TERMS_FIELDS], expect: Object.fromEntries(TERMS_FIELDS.map((f) => [f, remove('old request form text')])) })
    if (allowed.any) {
      console.log(`${terms._id}: ${allowed.unset.join(', ')}`)
      tx.patch(terms._id, (p) => p.ifRevisionId(terms._rev).unset(allowed.unset))
    }
  }

  guard.report()
  // Removing data needs a backup from today (nothing to remove: no backup needed, so re-runs stay no-ops)
  if (guard.changes.length && !backups.length) {
    if (!DRY_RUN) throw new Error('No backup from today in docs/backups/: run scripts/backup-sanity.ts first. Nothing written.')
    console.log('NOTE: no backup from today yet: run scripts/backup-sanity.ts before applying.')
  }
  if (DRY_RUN || !guard.changes.length) {
    console.log(DRY_RUN ? 'Dry run complete. No changes written.' : 'Nothing to do.')
    return
  }
  await guard.confirm(DRY_RUN)
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`Committed transaction ${result.transactionId} (${result.results.length} mutations).`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
