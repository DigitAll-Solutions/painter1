/**
 * Proposed fix for Sanity text that implies Painter1 corporate or a network backs the work or the
 * warranty (Rick, Oct 2026: each location is independently owned and operated; corp doesn't stand
 * behind local warranties). PROPOSAL ONLY: run with --dry-run and check every line with Rick first.
 *
 * Shown on the site today:
 *   warranty-terms  heroIntro / heroIntroNoOwner  "the Painter1 two-year workmanship warranty" → "our …"
 *   warranty-terms  covered, repairs, requirements "Painter1 …" as the warrantor → "we" / "us"
 *   warranty-terms  sameEverywhere                 "These terms are the same at every Painter1 location." → removed
 *   location-knoxville yearsInBusiness 20          homepage "Years Experience 20+" (Painter1's history, not
 *                                                  Knoxville's since 2020) → removed (stat hides); or pass
 *                                                  --years=23 if Rick wants Keith's 23 years instead
 *
 *   node --env-file=.env.local scripts/fix-network-claims.ts --dry-run
 *   node --env-file=.env.local scripts/fix-network-claims.ts            # only after Rick confirms
 *
 * These lists render without {tokens}, so the wording uses "we" / "us", not the location name.
 * Re-running is a no-op.
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

const DRY_RUN = process.argv.includes('--dry-run')
const YEARS = process.argv.find((arg) => arg.startsWith('--years='))?.slice('--years='.length)

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

// Exact current text → proposed text (an entry that no longer matches is reported and skipped)
const TERMS: { field: string; from: string; to: string | null }[] = [
  {
    field: 'heroIntro',
    from: "Every {city} project we complete is covered by the Painter1 two-year workmanship warranty, and {ownerFull} stands behind it personally. Here's exactly what's covered and how to request a repair.",
    to: "Every {city} project we complete is covered by our two-year workmanship warranty, and {ownerFull} stands behind it personally. Here's exactly what's covered and how to request a repair.",
  },
  {
    field: 'heroIntroNoOwner',
    from: "Every {city} project we complete is covered by the Painter1 two-year workmanship warranty. Here's exactly what's covered and how to request a repair.",
    to: "Every {city} project we complete is covered by our two-year workmanship warranty. Here's exactly what's covered and how to request a repair.",
  },
  {
    field: 'covered[0]',
    from: 'The warranty offered at Painter1 is for a period of **2 years, or 24 months**, from the date that the original agreement was signed and dated.',
    to: 'Our warranty is for a period of **2 years, or 24 months**, from the date that the original agreement was signed and dated.',
  },
  { field: 'covered[1]', from: 'Painter1 warrants against **peeling and blistering due to defective workmanship.**', to: 'We warrant against **peeling and blistering due to defective workmanship.**' },
  { field: 'repairs[0]', from: 'Painter1 will perform repairs only for the original customer.', to: 'We will perform repairs only for the original customer.' },
  { field: 'repairs[1]', from: 'Painter1 will repair only areas where peeling and blistering occurred.', to: 'We will repair only areas where peeling and blistering occurred.' },
  { field: 'repairs[2]', from: 'Painter1 will not exceed repairs mentioned on the original estimate sheet.', to: 'We will not exceed repairs mentioned on the original estimate sheet.' },
  { field: 'requirements[0]', from: 'Pays Painter1 in full', to: 'Pays us in full' },
  { field: 'sameEverywhere', from: 'These terms are the same at every Painter1 location.', to: null },
]

const get = (doc: Record<string, unknown>, field: string) => {
  const m = field.match(/^(\w+)(?:\[(\d+)\])?$/)!
  const value = doc[m[1]]
  return m[2] === undefined ? value : (value as unknown[] | undefined)?.[Number(m[2])]
}

async function main() {
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token: env('SANITY_API_WRITE_TOKEN'), useCdn: false, perspective: 'raw' })
  const drafts = await client.fetch<string[]>(`*[_id in ["drafts.warranty-terms", "drafts.location-knoxville"]]._id`)
  if (drafts.length) throw new Error(`Unpublished drafts exist (${drafts.join(', ')}): publish or discard them in Studio first`)
  const terms = await client.getDocument<Record<string, unknown> & { _rev: string }>('warranty-terms')
  const knox = await client.fetch<{ _rev: string; yearsInBusiness?: number }>(`*[_id == "location-knoxville"][0]{_rev, yearsInBusiness}`)
  if (!terms) throw new Error('warranty-terms not found')

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")`)
  console.log('PROPOSAL: confirm each line with Rick before applying.\n')

  const set: Record<string, string> = {}
  const unset: string[] = []
  console.log(`warranty-terms (rev ${terms._rev}), shown on every location's /warranty page`)
  for (const { field, from, to } of TERMS) {
    const current = get(terms, field)
    if (current === from) {
      if (to === null) unset.push(field)
      else set[field] = to
      console.log(`  ${field}\n    - ${from}\n    + ${to ?? '(removed: the line is hidden)'}`)
    } else console.log(`  ${field}: ${current === (to ?? undefined) ? 'already changed' : `differs from the expected text, skipped (now: ${JSON.stringify(current)})`}`)
  }

  const years = YEARS && /^\d{1,2}$/.test(YEARS) ? Number(YEARS) : undefined
  console.log(`\nlocation-knoxville (rev ${knox._rev}) yearsInBusiness, the homepage stat "Years Experience ${knox.yearsInBusiness ?? '—'}+"`)
  const yearsChange = years !== undefined ? knox.yearsInBusiness !== years : knox.yearsInBusiness !== undefined && knox.yearsInBusiness !== null
  if (yearsChange) console.log(`    - ${knox.yearsInBusiness}\n    + ${years ?? '(removed: the stat hides)'}`)
  else console.log('    already as proposed')

  const changes = Object.keys(set).length + unset.length + (yearsChange ? 1 : 0)
  console.log(`\n${changes} field(s) to change.`)
  if (DRY_RUN || !changes) {
    console.log(DRY_RUN ? 'Dry run complete. No changes written.' : 'Nothing to do.')
    return
  }
  const tx = client.transaction()
  if (Object.keys(set).length || unset.length) tx.patch('warranty-terms', (p) => p.ifRevisionId(terms._rev).set(set).unset(unset))
  if (yearsChange) tx.patch('location-knoxville', (p) => (years !== undefined ? p.ifRevisionId(knox._rev).set({ yearsInBusiness: years }) : p.ifRevisionId(knox._rev).unset(['yearsInBusiness'])))
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`Committed transaction ${result.transactionId} (${result.results.length} mutations).`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
