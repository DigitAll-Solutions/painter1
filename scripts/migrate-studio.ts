/**
 * Studio restructure data migration:
 * 1. Consent placeholder: in every location's consent blocks, the business name ("Painter1 of <City>",
 *    i.e. the location's own name) becomes {locationName}. Verified per location: filling the
 *    placeholder gives back the original blocks exactly, so the form and the stored consent text (and
 *    its SHA-256) are unchanged.
 * 2. Lead → location reference: leads stored the location slug as a string; they now reference the
 *    location document (survives a URL change).
 * 3. Preview fields: reports locations without city/state (needed for the Studio list and grouping).
 *
 *   node --env-file=.env.local scripts/migrate-studio.ts --dry-run
 *   node --env-file=.env.local scripts/migrate-studio.ts            # apply (needs SANITY_API_WRITE_TOKEN)
 *   … --only=leads | --only=consent                                    # one part only
 *
 * Order: the site code that fills {locationName} must be deployed BEFORE the consent part is applied
 * (older code would show the placeholder literally). Leads written by older code still store the slug:
 * re-run after deploying; it only touches what still needs changing.
 *
 * Re-running is a no-op. Lead contact details are never printed.
 */
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { consentPlainText, fillConsentBlocks, LOCATION_NAME_TOKEN } from '../lib/consent.ts'
import type { ConsentBlock } from '../sanity/lib/types.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const ONLY = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length)
const run = (part: 'consent' | 'leads') => !ONLY || ONLY === part
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Loc = { _id: string; _rev: string; name?: string; slug?: string; city?: string; state?: string; consentBlocks?: ConsentBlock[] }
type Lead = { _id: string; _rev: string; location?: string | { _ref?: string }; testMode?: boolean; submittedAt?: string }

/** Replace the location's own name with the placeholder inside each span */
function tokenize(blocks: ConsentBlock[], name: string) {
  let count = 0
  const out = blocks.map((block) => ({
    ...block,
    body: block.body.map((part) => {
      const children = (part as { children?: { text?: string }[] }).children
      if (!children) return part
      return {
        ...part,
        children: children.map((child) => {
          if (typeof child.text !== 'string' || !child.text.includes(name)) return child
          count += child.text.split(name).length - 1
          return { ...child, text: child.text.split(name).join(LOCATION_NAME_TOKEN) }
        }),
      }
    }) as ConsentBlock['body'],
  }))
  return { blocks: out, count }
}

async function main() {
  const token = env('SANITY_API_WRITE_TOKEN') // leads are private: even the dry run needs a token to read them
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })

  const { locations, leads, drafts } = await client.fetch<{ locations: Loc[]; leads: Lead[]; drafts: string[] }>(`{
    "locations": *[_type == "location" && !(_id in path("drafts.**"))]{_id, _rev, name, "slug": slug.current, "city": address.city, "state": address.state, consentBlocks},
    "leads": *[_type == "lead"]{_id, _rev, location, testMode, submittedAt},
    "drafts": *[_type in ["location", "lead"] && _id in path("drafts.**")]._id
  }`)
  if (drafts.length) throw new Error(`Unpublished drafts exist (${drafts.join(', ')}): publish or discard them in Studio first`)

  const tx = client.transaction()
  let changes = 0
  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)

  // 1. Consent placeholder
  console.log(`1. Consent text: business name → {locationName}${run('consent') ? '' : '  (skipped: --only=leads)'}`)
  for (const loc of run('consent') ? locations : []) {
    const blocks = loc.consentBlocks ?? []
    if (!blocks.length || !loc.name) {
      console.log(`   ${loc.name ?? loc._id}: no consent blocks, nothing to do`)
      continue
    }
    const { blocks: tokenized, count } = tokenize(blocks, loc.name)
    if (!count) {
      const hasToken = blocks.some((b) => consentPlainText(b.body).includes(LOCATION_NAME_TOKEN))
      console.log(`   ${loc.name}: ${hasToken ? 'already uses {locationName}' : `doesn't mention "${loc.name}"`}, no change`)
      continue
    }
    // Verify: filling the placeholder must give back the original exactly (structure, marks, keys, text)
    const refilled = fillConsentBlocks(tokenized, loc.name)
    const identical = isDeepStrictEqual(refilled, blocks)
    for (const [i, block] of blocks.entries()) {
      const before = consentPlainText(block.body)
      const after = consentPlainText(refilled[i].body)
      console.log(`   ${loc.name} · "${block.name}": ${tokenize([block], loc.name).count} replacement(s)`)
      console.log(`     stored text now:  ${consentPlainText(tokenized[i].body).replace(/\n/g, ' ⏎ ').slice(0, 150)}…`)
      console.log(`     filled = original: ${before === after ? 'yes' : 'NO'} · SHA-256 ${sha256(before).slice(0, 16)}… → ${sha256(after).slice(0, 16)}… ${sha256(before) === sha256(after) ? '(same)' : '(DIFFERENT)'}`)
    }
    console.log(`     whole blocks identical after filling (marks, links, keys): ${identical ? 'yes' : 'NO'}`)
    if (!identical) throw new Error(`${loc.name}: filled consent differs from the original; not migrating`)
    tx.patch(loc._id, (p) => p.ifRevisionId(loc._rev).set({ consentBlocks: tokenized }))
    changes++
  }

  // 2. Lead → location reference
  console.log(`\n2. Leads: location slug → location reference${run('leads') ? '' : '  (skipped: --only=consent)'}`)
  const bySlug = new Map(locations.filter((l) => l.slug).map((l) => [l.slug!, l]))
  for (const lead of run('leads') ? leads : []) {
    const label = `${lead._id.slice(0, 13)}… ${lead.testMode ? '[test] ' : ''}${lead.submittedAt?.slice(0, 10) ?? ''}`
    if (typeof lead.location !== 'string') {
      console.log(`   ${label}: already a reference (${lead.location?._ref ?? 'none'}), no change`)
      continue
    }
    const target = bySlug.get(lead.location)
    if (!target) throw new Error(`${label}: no location with slug "${lead.location}"`)
    console.log(`   ${label}: "${lead.location}" → reference ${target._id}`)
    tx.patch(lead._id, (p) => p.ifRevisionId(lead._rev).set({ location: { _type: 'reference', _ref: target._id } }))
    changes++
  }

  // 3. Preview fields
  console.log('\n3. Studio list preview and state grouping (city, state)')
  for (const loc of locations) {
    const ok = Boolean(loc.city && loc.state)
    console.log(`   ${loc.name}: ${ok ? `"${loc.city}, ${loc.state}" — no change needed` : 'MISSING city or state: fill it in Studio (shows under "No state set")'}`)
  }

  console.log(`\n${changes} document(s) to change.`)
  if (DRY_RUN || !changes) {
    console.log(DRY_RUN ? 'Dry run complete. No changes written.' : 'Nothing to do.')
    return
  }
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`Committed transaction ${result.transactionId}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
