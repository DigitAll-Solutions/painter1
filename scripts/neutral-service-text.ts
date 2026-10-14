/**
 * Neutral service-page wording (Oct 14): details that vary by location (spraying, soft-close and other
 * upgrades, day counts, prices, temperature ranges, specific product lines) are left to the estimate,
 * the same rule as Rick's cabinet copy. Sherwin-Williams stays.
 *
 * Post-merge (changes what production shows; --dry-run first):
 *   node --env-file=.env.local scripts/neutral-service-text.ts --dry-run
 *   node --env-file=.env.local scripts/neutral-service-text.ts
 *
 * Default: the What We Paint cards, the Paint & Materials cards and the FAQ answers.
 * --outside-cards (only if wanted): the same kind of promise in text that isn't a card or an FAQ:
 *   the cabinet and exterior "Paint & Materials" paragraph and the cabinet meta description.
 *
 * Each change replaces only the exact text below; anything edited since is kept and listed
 * (scripts/lib/safe-write.ts). Re-running is a no-op.
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { getPath, SafeWrite } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const OUTSIDE = process.argv.includes('--outside-cards')

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

/** One paragraph of rich text; **x** is bold (the Paint & Materials fields are bold-only rich text) */
export function richText(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return [
    {
      _type: 'block',
      _key: 'p0',
      style: 'normal',
      markDefs: [],
      children: parts
        .map((part, i) => ({ part, bold: i % 2 === 1 }))
        .filter(({ part }) => part)
        .map(({ part, bold }, i) => ({ _type: 'span', _key: `p0s${i}`, text: part, marks: bold ? ['strong'] : [] })),
    },
  ]
}
const plain = (value: unknown) =>
  typeof value === 'string' ? value : ((value as { children?: { text?: string }[] }[] | undefined) ?? []).map((b) => (b.children ?? []).map((c) => c.text).join('')).join('\n')

type Change = { doc: string; path: string; label: string; from: string; to: string; rich?: boolean; outside?: boolean }
const CABINET = 'service-cabinet-refinishing'
const EXTERIOR = 'service-exterior-painting'

// from: the exact text on the site today (bold markers only matter in `to`)
export const CHANGES: Change[] = [
  // What We Paint cards
  {
    doc: CABINET,
    path: 'whatWePaint[_key=="kitchen-cabinets"].description',
    label: 'Cabinet card: Kitchen Cabinets',
    from: 'Doors, drawers and frames, sprayed with Sherwin-Williams cabinet enamel.',
    to: 'Doors, drawers and frames, finished with Sherwin-Williams cabinet enamel.',
  },
  {
    doc: CABINET,
    path: 'whatWePaint[_key=="hardware-upgrades"].description',
    label: 'Cabinet card: Cabinet Hardware',
    from: 'Hardware reattached or upgraded, with optional soft-close hardware or glass door inserts.',
    to: 'New knobs and pulls, set straight and level.',
  },
  // Paint & Materials cards
  {
    doc: CABINET,
    path: 'materialsBlocks[_key=="color-finish"].body',
    label: 'Cabinet Paint & Materials card: Color & Finish',
    rich: true,
    from: 'Choose from hundreds of Sherwin-Williams shades and the right finish for durability and looks (e.g., satin enamel for kitchens), with optional upgrades like soft-close hardware or glass door inserts.',
    to: 'Choose from **hundreds of Sherwin-Williams shades** and the right finish for durability and looks.',
  },
  {
    doc: CABINET,
    path: 'materialsBlocks[_key=="typical-timeline"].body',
    label: 'Cabinet Paint & Materials card: Typical Timeline',
    rich: true,
    from: 'Most kitchens are done in 3–5 days, instead of the weeks a full cabinet replacement takes.',
    to: 'Your estimate will include **how long your kitchen will be out of service**, usually far shorter than a full cabinet replacement.',
  },
  {
    doc: CABINET,
    path: 'materialsBlocks[_key=="cost"].body',
    label: 'Cabinet Paint & Materials card: Cost',
    rich: true,
    from: 'Cabinet painting typically costs 60–80% less than complete cabinet replacement: new custom cabinets range from $15,000–$40,000 or more, while professional painting generally costs $3,000–$8,000.',
    to: 'Cabinet painting typically costs **far less** than complete cabinet replacement. Your free estimate gives you a written price for your kitchen.',
  },
  {
    doc: EXTERIOR,
    path: 'materialsBlocks[_key=="typical-timeline"].body',
    label: 'Exterior Paint & Materials card: Typical Timeline',
    rich: true,
    from: 'Most exterior projects take 3–4 days from start to finish, weather permitting.',
    to: 'Your estimate will include **how long the job will take**, which depends on the size of the home and the weather.',
  },
  {
    doc: EXTERIOR,
    path: 'materialsBlocks[_key=="weather-window"].body',
    label: 'Exterior Paint & Materials card: Weather Window',
    rich: true,
    from: "We paint in temperatures from 35°F to 95°F — Sherwin-Williams' exterior lines are formulated to cure properly across that range, so we're not limited to just the peak summer months.",
    to: "Sherwin-Williams' exterior lines are formulated to cure properly across **a wide temperature range**, so we're not limited to just the peak summer months.",
  },
  // FAQ answers
  {
    doc: CABINET,
    path: 'faqs[_key=="how-much-does-cabinet-painting-cost"].answer',
    label: 'Cabinet FAQ: How much does cabinet painting cost?',
    from: 'Cabinet painting typically costs 60–80% less than replacing your cabinets: new custom cabinets range from $15,000–$40,000 or more, while professional painting generally costs $3,000–$8,000. Your free in-home estimate gives you a written price with a detailed breakdown, with no hidden fees.',
    to: 'Cabinet painting typically costs far less than replacing your cabinets. Your free in-home estimate gives you a written price with a detailed breakdown, with no hidden fees.',
  },
  {
    doc: CABINET,
    path: 'faqs[_key=="how-long-does-cabinet-refinishing-take"].answer',
    label: 'Cabinet FAQ: How long does cabinet painting take?',
    from: 'Most kitchens are done in 3–5 days.',
    to: 'It depends on the size of your kitchen and the work involved. Your estimate will include how long your kitchen will be out of service.',
  },
  {
    doc: CABINET,
    path: 'faqs[_key=="what-do-you-use-on-cabinets"].answer',
    label: 'Cabinet FAQ: What do you use on cabinets?',
    from: 'Two coats of primer (shellac or water-based, depending on your cabinet material) and 2–3 topcoats of Sherwin-Williams cabinet enamel, applied with professional-grade HVLP sprayers, or brushes if you prefer.',
    to: "A bonding, stain-blocking primer, then Sherwin-Williams cabinet enamel made for the wear cabinets take. Your estimate will name the exact products and how they're applied.",
  },
  {
    doc: EXTERIOR,
    path: 'faqs[_key=="how-long-does-an-exterior-repaint-take"].answer',
    label: 'Exterior FAQ: How long does an exterior repaint take?',
    from: 'Most exterior projects take 3–4 days from start to finish, depending on the size of the home and weather conditions.',
    to: 'It depends on the size of the home and weather conditions. Your estimate will include how long the job will take.',
  },
  {
    doc: EXTERIOR,
    path: 'faqs[_key=="what-temperature-do-you-need-for-exterio"].answer',
    label: 'Exterior FAQ: What temperature do you need for exterior painting?',
    from: "We paint in temperatures ranging from 35°F to 95°F, using Sherwin-Williams exterior lines formulated to cure properly across that range — so we're not limited to just summer.",
    to: "It depends on the paint: Sherwin-Williams exterior lines are formulated to cure properly across a wide temperature range, so we're not limited to just summer.",
  },
  // Only with --outside-cards
  {
    doc: CABINET,
    path: 'materialsBody',
    label: 'Cabinet Paint & Materials paragraph',
    rich: true,
    outside: true,
    from: 'We use professional-grade HVLP sprayers (or brushes if preferred) to apply 2 coats of primer (shellac or water-based, depending on your cabinet material) and 2–3 topcoats of Sherwin-Williams cabinet enamel.',
    to: 'We use a **bonding, stain-blocking primer** and **Sherwin-Williams cabinet enamel**. Your estimate will name the exact products and how they’re applied.',
  },
  {
    doc: EXTERIOR,
    path: 'materialsBody',
    label: 'Exterior Paint & Materials paragraph',
    rich: true,
    outside: true,
    from: 'We paint exclusively with Sherwin-Williams exterior lines — Resilience, Duration, and Emerald, matched to your project and budget during your estimate.',
    to: 'We paint exclusively with **Sherwin-Williams** exterior lines, matched to your project and budget during your estimate.',
  },
  {
    doc: CABINET,
    path: 'metaDescription',
    label: 'Cabinet meta description',
    outside: true,
    from: 'Cabinet painting in {city}, {state} by Painter1: Sherwin-Williams cabinet enamel, most kitchens done in 3–5 days, and a 2-year warranty. Free estimate.',
    to: 'Cabinet painting in {city}, {state} by Painter1: Sherwin-Williams cabinet enamel, a written estimate, and a 2-year warranty. Free estimate.',
  },
]

async function main() {
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token: env('SANITY_API_WRITE_TOKEN'), useCdn: false, perspective: 'raw' })
  const drafts = await client.fetch<string[]>(`*[_id in ["drafts.${CABINET}", "drafts.${EXTERIOR}"]]._id`)
  if (drafts.length) throw new Error(`Unpublished drafts exist (${drafts.join(', ')}): publish or discard them in Studio first`)
  const docs = await client.fetch<(Record<string, unknown> & { _id: string; _rev: string })[]>(`*[_id in [$a, $b]]`, { a: CABINET, b: EXTERIOR })

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")`)
  console.log(`Mode: cards + FAQs${OUTSIDE ? ' + text outside cards and FAQs' : ''} (post-merge)\n`)

  const guard = new SafeWrite(`neutral-service-text${OUTSIDE ? ' --outside-cards' : ''}`)
  const tx = client.transaction()
  for (const doc of docs) {
    const set: Record<string, unknown> = {}
    const expect: Record<string, { test: (v: unknown) => boolean; label: string }> = {}
    for (const change of CHANGES.filter((c) => c.doc === doc._id && (OUTSIDE || !c.outside))) {
      const next = change.rich ? richText(change.to) : change.to
      set[change.path] = next
      expect[change.path] = { test: (v) => plain(v) === change.from, label: 'the old wording' }
      const current = plain(getPath(doc, change.path))
      const status = current === plain(next) ? 'already neutral' : current === change.from ? 'change' : 'edited since: kept'
      console.log(`${change.label}  [${status}]\n  - ${change.from}\n  + ${change.to.replace(/\*\*/g, '')}\n`)
    }
    const allowed = guard.plan(doc._id, doc, { set, expect })
    if (allowed.any) tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(allowed.set))
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
