/**
 * Clears the old service field ownerCardVariant (featured | compact). Every service page now shows the
 * same owner card (Rick, Oct 14) and the code no longer reads the field, so this only tidies stored data;
 * the site looks the same before and after. Run after the owner-card-match PR is merged.
 *
 *   node --env-file=.env.local scripts/clear-owner-card-variant.ts --dry-run
 *   node --env-file=.env.local scripts/clear-owner-card-variant.ts
 *
 * Published and draft service documents are both cleared. Re-running is a no-op.
 * Writes go through scripts/lib/safe-write.ts: content already in Sanity is never overwritten or removed
 * unless it is exactly what this step replaces; anything else is kept and listed (--force asks first).
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

async function main() {
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token: env('SANITY_API_WRITE_TOKEN'), useCdn: false, perspective: 'raw' })
  const docs = await client.fetch<{ _id: string; _rev: string; slug?: string; ownerCardVariant?: string }[]>(
    `*[_type == "service" && defined(ownerCardVariant)] | order(_id){_id, _rev, "slug": slug.current, ownerCardVariant}`,
  )

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  for (const doc of docs) console.log(`  ${doc._id} (/[location]/${doc.slug}) ownerCardVariant: ${JSON.stringify(doc.ownerCardVariant)} → (unset)`)
  const guard = new SafeWrite('clear-owner-card-variant')
  const tx = client.transaction()
  // Hidden in Studio and no longer read: only its two old values are removed
  const expect = { ownerCardVariant: { test: (v: unknown) => v === 'featured' || v === 'compact', label: 'featured or compact' } }
  for (const doc of docs) {
    const allowed = guard.plan(doc._id, doc, { unset: ['ownerCardVariant'], expect })
    if (allowed.any) tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).unset(allowed.unset))
  }
  guard.report()
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
