/**
 * Owner name for the three Utah locations Davidson Ativos owns (Rick, Nov 2026): Greater SLC
 * (greater-salt-lake), Salt Lake City (slc) and Park City (park-city).
 * Sets ownerName = "Davidson Ativos" only where it is empty. A name already set is kept (--force is
 * refused), and no other field is touched. Published documents and their drafts (if any) are both updated.
 *
 *   node --env-file=.env.local --no-warnings scripts/set-slc-owner.ts --dry-run   # print what would change
 *   node --env-file=.env.local --no-warnings scripts/set-slc-owner.ts             # apply (SANITY_API_WRITE_TOKEN)
 *
 * Safe to re-run (scripts/lib/safe-write.ts): a second run changes nothing.
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const OWNER = 'Davidson Ativos'
const IDS = ['location-greater-salt-lake', 'location-slc', 'location-park-city']

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Doc = { _id: string; _rev: string; ownerName?: string | null }

async function main() {
  if (process.argv.includes('--force')) throw new Error('--force is not allowed: an owner name already set is never replaced')
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  const docs = await client.fetch<Doc[]>(`*[_id in $ids] | order(_id){_id, _rev, ownerName}`, { ids: [...IDS, ...IDS.map((id) => `drafts.${id}`)] })
  const missing = IDS.filter((id) => !docs.some((doc) => doc._id === id))
  if (missing.length) throw new Error(`Not found: ${missing.join(', ')}`)

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  const guard = new SafeWrite('set-slc-owner')
  const tx = client.transaction()
  for (const doc of docs) {
    // Whitespace-only counts as empty
    const current = doc.ownerName?.trim() ? doc.ownerName : undefined
    const { set, any } = guard.plan(doc._id, { ownerName: current }, { set: { ownerName: OWNER } })
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
