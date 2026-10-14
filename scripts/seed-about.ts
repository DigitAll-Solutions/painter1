/**
 * About page data for Knoxville (post-merge; --dry-run first).
 *
 * Knoxville's About content already comes from its live About page (imported earlier): the owner story
 * (ownerBio, Keith's first-person text), quote, "owner since", owner photos, rating and review count.
 * This sets what the new template adds: each team member's role, read from the live page and reviews
 * (Jarrod Davenport: Project Manager). Nothing is invented: missing items are listed for Rick.
 *
 *   node --env-file=.env.local scripts/seed-about.ts --dry-run
 *   node --env-file=.env.local scripts/seed-about.ts
 *
 * Re-running is a no-op.
 * Writes go through scripts/lib/safe-write.ts: content already in Sanity is never overwritten or removed
 * unless it is exactly what this step replaces; anything else is kept and listed (--force asks first).
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite } from './lib/safe-write.ts'

import { memberRole } from '../lib/about.ts'

const DRY_RUN = process.argv.includes('--dry-run')

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Member = { _key: string; name?: string; jobTitle?: string; role?: string; photo?: unknown; withOwnerSince?: string; bio?: string }
type Doc = {
  _id: string
  _rev: string
  franchiseStructure?: string
  ownerName?: string
  ownerBio?: string
  ownerQuote?: string
  ownerSinceYear?: string
  ownerPhoto?: unknown
  licenseNumber?: string
  teamPhoto?: unknown
  teamMembers?: Member[]
}

async function main() {
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token: env('SANITY_API_WRITE_TOKEN'), useCdn: false, perspective: 'raw' })
  const drafts = await client.fetch<string[]>(`*[_id == "drafts.location-knoxville"]._id`)
  if (drafts.length) throw new Error('Knoxville has an unpublished draft: publish or discard it in Studio first')
  const doc = await client.fetch<Doc>(`*[_id == "location-knoxville"][0]{_id, _rev, franchiseStructure, ownerName, ownerBio, ownerQuote, ownerSinceYear, ownerPhoto, licenseNumber, teamPhoto, teamMembers}`)

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  console.log(`${doc._id} (rev ${doc._rev}) · variant: ${doc.franchiseStructure === 'owner-with-team' ? 'team' : 'owner'}`)
  console.log('Already in place (from the live About page):')
  console.log(`  owner story (ownerBio): ${doc.ownerBio ? `${doc.ownerBio.split(/\n\s*\n/).length} paragraphs, first person` : 'MISSING'}`)
  console.log(`  quote: ${doc.ownerQuote ? `"${doc.ownerQuote}"` : 'MISSING'} · owner since: ${doc.ownerSinceYear ?? 'MISSING'} · owner photo: ${doc.ownerPhoto ? 'yes' : 'MISSING'}`)

  const set: Record<string, string> = {}
  for (const member of doc.teamMembers ?? []) {
    const role = memberRole({ jobTitle: member.jobTitle ?? '', role: undefined })
    if (member.role) console.log(`  ${member.name}: role already "${member.role}"; kept`)
    else {
      set[`teamMembers[_key=="${member._key}"].role`] = role
      console.log(`\nteamMembers "${member.name}" (${member.jobTitle}): role (empty) → "${role}"`)
    }
  }

  console.log('\nStill needed from Rick / Keith (the page hides these until they exist):')
  if (!doc.licenseNumber) console.log('  - contractor license number (if Tennessee requires one for this work)')
  if (!doc.teamPhoto) console.log('  - team photo: Keith with the estimators and project managers, faces visible')
  for (const member of doc.teamMembers ?? []) {
    if (!member.photo) console.log(`  - headshot of ${member.name}`)
    if (!member.withOwnerSince) console.log(`  - year ${member.name} joined (for "N years with the company")`)
  }
  console.log('  - other team members customers meet (reviews name "Charlie", who seems to handle estimates and sales): name, role, headshot')
  console.log('  - for "Why I built a team": a paragraph from Keith on why he added a project manager, and what he still checks himself')

  const guard = new SafeWrite('seed-about')
  const allowed = guard.plan(doc._id, doc, { set })
  guard.report()
  if (DRY_RUN || !allowed.any) {
    console.log(DRY_RUN ? 'Dry run complete. No changes written.' : 'Nothing to do.')
    return
  }
  await guard.confirm(DRY_RUN)
  const result = await client.patch(doc._id).ifRevisionId(doc._rev).set(allowed.set).commit({ visibility: 'sync' })
  console.log(`Committed: ${doc._id} now rev ${result._rev}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
