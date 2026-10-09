/**
 * Oct 8 feedback data changes:
 * 1. Warranty terms: creates the shared "warranty-terms" document with the mockup copy, word for word
 *    (only if it doesn't exist yet; editors own it after that).
 * 2. Knoxville warranty recipients: its lead recipients minus Client Tether (*@parse.clienttether.com),
 *    only while warrantyRecipients is empty. Addresses are printed masked.
 * 3. Before/after pairs: every location's services.<key>.beforeImage/afterImage is copied into
 *    transformations[0]. The old fields stay: the site version before this one reads only them.
 *
 *   node --env-file=.env.local scripts/seed-oct8.ts --dry-run
 *   node --env-file=.env.local scripts/seed-oct8.ts            # apply (needs SANITY_API_WRITE_TOKEN)
 *
 * After this site version is deployed (post-merge), remove the old fields where pair 1 holds the same photos:
 *   node --env-file=.env.local scripts/seed-oct8.ts --remove-legacy --dry-run
 *   node --env-file=.env.local scripts/seed-oct8.ts --remove-legacy
 *
 * Re-running is a no-op.
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { CLIENT_TETHER, warrantyRecipients } from '../lib/warranty.ts'

const DRY_RUN = process.argv.includes('--dry-run')
/** Post-merge only: drop the old single-pair fields once the deployed site reads transformations */
const REMOVE_LEGACY = process.argv.includes('--remove-legacy')
const TERMS_ID = 'warranty-terms'
const KNOXVILLE = 'knoxville'
const SERVICE_KEYS = ['interior', 'exterior', 'cabinet'] as const

const mask = (email: string) => email.replace(/^(.)[^@]*@(.+)$/, (_, first: string, domain: string) => `${first}***@${domain}`)

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

const key = (i: number, prefix: string) => `${prefix}${String(i + 1).padStart(2, '0')}`

// Mockup copy, word for word. ** = bold (accent color in headings); headings are uppercased by CSS.
export const WARRANTY_TERMS = {
  _id: TERMS_ID,
  _type: 'warrantyTerms',
  title: 'Our 2-Year **Workmanship** Warranty',
  heroIntro:
    "Every {city} project we complete is covered by the Painter1 two-year workmanship warranty, and {ownerFull} stands behind it personally. Here's exactly what's covered and how to request a repair.",
  // Not in the mockup: used only when a location has no owner name
  heroIntroNoOwner: "Every {city} project we complete is covered by the Painter1 two-year workmanship warranty. Here's exactly what's covered and how to request a repair.",
  stats: [
    { icon: 'calendar', title: '24 months', body: 'From the date your original agreement was signed and dated.' },
    { icon: 'shield', title: 'Peeling & blistering', body: 'Covered when caused by defective workmanship.' },
    { icon: 'wrench', title: 'No labor charge', body: 'For covered repairs, when the warranty requirements are met.' },
    { icon: 'user', title: 'Original customer', body: 'The warranty is not transferable.' },
  ].map((stat, i) => ({ _key: key(i, 'stat'), _type: 'stat', ...stat })),
  coveredHeading: "What's covered",
  covered: [
    'The warranty offered at Painter1 is for a period of **2 years, or 24 months**, from the date that the original agreement was signed and dated.',
    'Painter1 warrants against **peeling and blistering due to defective workmanship.**',
    'This warranty is **not transferable.**',
  ],
  requirementsHeading: 'Warranty requirements',
  requirementsIntro: 'The warranty will be effective if, and only if, the customer:',
  requirements: ['Pays Painter1 in full', 'Signs the original contract', 'Retains the original contract'],
  repairsEyebrow: 'How covered repairs work',
  repairsHeading: 'If the conditions are met, we perform repairs with **no labor charge**.',
  repairs: [
    'Painter1 will perform repairs only for the original customer.',
    'Painter1 will repair only areas where peeling and blistering occurred.',
    'Painter1 will not exceed repairs mentioned on the original estimate sheet.',
    'If additional work is needed, a new estimate and contract will need to be presented and signed.',
  ],
  exclusionsEyebrow: 'Clear expectations',
  exclusionsHeading: 'Warranty **exclusions**',
  exclusionsIntro: 'The following items are not covered under the 2-Year Workmanship Warranty.',
  exclusions: [
    'Any horizontal surface',
    'Cracks in plaster and/or drywall',
    'Paint supplied by customer',
    'Galvanized metal',
    'Bleeding knots',
    'Moisture damage, rust',
    'Exterior varnished/stained surfaces',
    'Peeling of previous paint layers',
    'Cracks or tape tears due to a shifting building',
    'Paint cost',
    'Matching of the paint: the paint can be matched closely, but rarely perfectly',
    'Mildew, caused by moisture accumulation',
    'Rotten wood',
    'Rusted or disintegrating metals',
    'Nail pops',
  ].map((text, i) => ({ _key: key(i, 'excl'), _type: 'exclusion', text, ...(text === 'Nail pops' ? { editorNote: 'Confirm for network' } : {}) })),
  sameEverywhere: 'These terms are the same at every Painter1 location.',
  requestEyebrow: 'Past customers',
  requestHeading: 'Request a **warranty repair**',
  requestIntro: "Tell us what you're seeing and we'll follow up to schedule an inspection. Have your original signed contract handy.",
  steps: [
    '**Send the request** with photos of the affected area.',
    '**We inspect** and confirm coverage against your contract.',
    '**We repair** covered areas at no labor charge.',
  ],
  disclaimer: '{locationName} is independently owned and operated.',
  contractNote: 'The terms of your signed contract govern your warranty coverage.',
  contractNoteConfirmed: false,
}

type Img = { _type?: string; asset?: { _ref?: string }; alt?: string; hotspot?: unknown; crop?: unknown }
type Detail = { beforeImage?: Img; afterImage?: Img; transformations?: { before?: Img; after?: Img }[] }
type Loc = { _id: string; _rev: string; name?: string; slug?: string; services?: Partial<Record<(typeof SERVICE_KEYS)[number], Detail>> }
type Tx = ReturnType<ReturnType<typeof createClient>['transaction']>

function printTerms() {
  for (const [field, value] of Object.entries(WARRANTY_TERMS)) {
    if (field.startsWith('_')) continue
    if (!Array.isArray(value)) {
      console.log(`   ${field}: ${JSON.stringify(value)}`)
      continue
    }
    console.log(`   ${field}:`)
    for (const item of value as unknown[]) {
      const shown = typeof item === 'string' ? [['', item]] : Object.entries(item as Record<string, string>).filter(([k]) => !k.startsWith('_'))
      console.log(`     - ${shown.map(([k, v]) => `${k ? `${k}: ` : ''}${JSON.stringify(v)}`).join(' | ')}`)
    }
  }
}

const sameAsset = (a?: Img, b?: Img) => Boolean(a?.asset?._ref) && a?.asset?._ref === b?.asset?._ref

/** Part 3 for one location: lines to print, and the patch (or none) */
function pairChanges(location: Loc) {
  const set: Record<string, unknown> = {}
  const unset: string[] = []
  const lines: string[] = []
  for (const service of SERVICE_KEYS) {
    const detail = location.services?.[service]
    if (!detail?.beforeImage && !detail?.afterImage) continue
    const base = `services.${service}`
    const first = detail.transformations?.[0]
    if (REMOVE_LEGACY) {
      if (first && sameAsset(first.before, detail.beforeImage) && sameAsset(first.after, detail.afterImage)) {
        unset.push(`${base}.beforeImage`, `${base}.afterImage`)
        lines.push(`${service}: pair 1 holds the same photos; old fields removed`)
      } else lines.push(`${service}: pair 1 ${first ? 'differs from' : 'missing for'} the old pair; old fields KEPT (check in Studio)`)
    } else if (detail.transformations?.length) lines.push(`${service}: already has ${detail.transformations.length} pair(s); nothing copied`)
    else if (!detail.beforeImage?.asset?._ref || !detail.afterImage?.asset?._ref)
      lines.push(`${service}: incomplete old pair (${detail.beforeImage ? 'before' : 'no before'}, ${detail.afterImage ? 'after' : 'no after'}); not copied`)
    else {
      set[`${base}.transformations`] = [{ _key: `pair-${service}`, _type: 'transformation', before: detail.beforeImage, after: detail.afterImage }]
      const alts = [detail.beforeImage.alt ? 'before alt ✓' : 'before alt missing', detail.afterImage.alt ? 'after alt ✓' : 'after alt MISSING (required)']
      lines.push(`${service}: ${detail.beforeImage.asset._ref} / ${detail.afterImage.asset._ref} → pair 1 (${alts.join(', ')}); old fields kept`)
    }
  }
  return { lines, set, unset }
}

async function main() {
  const token = env('SANITY_API_WRITE_TOKEN') // leads.<id> is private: even the dry run needs a token
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })

  const { terms, locations, drafts } = await client.fetch<{ terms: { _id: string } | null; locations: Loc[]; drafts: string[] }>(
    `{
    "terms": *[_id == $terms][0]{_id},
    "locations": *[_type == "location" && !(_id in path("drafts.**"))] | order(name asc){_id, _rev, name, "slug": slug.current, services},
    "drafts": *[_type == "location" && _id in path("drafts.**")]._id
  }`,
    { terms: TERMS_ID },
  )
  if (drafts.length) throw new Error(`Unpublished location drafts exist (${drafts.join(', ')}): publish or discard them in Studio first`)

  const tx: Tx = client.transaction()
  let changes = 0
  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)

  if (REMOVE_LEGACY) console.log('1–2. Skipped (--remove-legacy)')
  else {
    // 1. Warranty terms
    if (terms) console.log(`1. WARRANTY TERMS ${TERMS_ID}: exists, left as is`)
    else {
      changes++
      tx.createIfNotExists(WARRANTY_TERMS)
      console.log(`1. WARRANTY TERMS: CREATE ${TERMS_ID} (public, one for every location)`)
      printTerms()
    }

    // 2. Knoxville warranty recipients
    const knoxville = locations.find((l) => l.slug === KNOXVILLE)
    if (!knoxville) throw new Error(`Location "${KNOXVILLE}" not found`)
    const settingsId = `leads.${knoxville._id}`
    const settings = await client.fetch<{ _rev: string; leadRecipients?: string[]; warrantyRecipients?: string[] } | null>(`*[_id == $id][0]{_rev, leadRecipients, warrantyRecipients}`, { id: settingsId })
    const leadList = settings?.leadRecipients ?? []
    console.log(`\n2. KNOXVILLE WARRANTY RECIPIENTS (private ${settingsId})`)
    console.log(`   leadRecipients (${leadList.length}): ${leadList.map((e) => `${mask(e)}${CLIENT_TETHER.test(e) ? '  ← Client Tether, excluded' : ''}`).join(', ') || '(none)'}`)
    if (settings?.warrantyRecipients?.length) console.log(`   warrantyRecipients already set (${settings.warrantyRecipients.length}): ${settings.warrantyRecipients.map(mask).join(', ')}; left as is`)
    else {
      const list = warrantyRecipients(leadList)
      if (!settings || !list.length) console.log('   Nothing to copy: set warranty recipients in Studio')
      else {
        changes++
        tx.patch(settingsId, (p) => p.ifRevisionId(settings._rev).set({ warrantyRecipients: list }))
        console.log(`   warrantyRecipients: (empty) → ${list.length}: ${list.map(mask).join(', ')}`)
      }
    }
  }

  // 3. Before/after pairs
  console.log(
    REMOVE_LEGACY
      ? '\n3. OLD beforeImage/afterImage → removed where transformations[0] holds the same photos'
      : '\n3. BEFORE/AFTER PAIRS → copied into transformations[0] (old fields kept for the live site)',
  )
  let touched = 0
  for (const location of locations) {
    const { lines, set, unset } = pairChanges(location)
    if (!lines.length) continue
    console.log(`   ${location.name} (${location._id}, rev ${location._rev})`)
    for (const line of lines) console.log(`     ${line}`)
    if (!Object.keys(set).length && !unset.length) continue
    changes++
    touched++
    tx.patch(location._id, (p) => (unset.length ? p.ifRevisionId(location._rev).unset(unset) : p.ifRevisionId(location._rev).set(set)))
  }
  if (!touched) console.log('   Nothing to change')

  console.log(`\n${changes} document(s) to change.`)
  if (DRY_RUN || !changes) {
    console.log(DRY_RUN ? 'Dry run complete. No changes written.' : 'Nothing to do.')
    return
  }
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`Committed transaction ${result.transactionId} (${result.results.length} mutations).`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
