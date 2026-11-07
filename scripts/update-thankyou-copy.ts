/**
 * Post-merge step for the estimate success screen (Rick, Nov 2026):
 *   - estimate-survey-default → nextSteps: the two steps, with the new {ownerOrTeam} token
 *     ("Keith or the team" / "Keith" when the location has no team members / "Our team" with no owner name)
 *   - every location → leadConfirmationMessage (the text under "Thanks, {firstName}!"):
 *     "We received your information. We will get in touch with you shortly."
 * Each field is replaced only while it still holds the exact old text; anything edited in Studio is kept.
 * Published documents and their drafts (if any) are both updated.
 *
 *   node --env-file=.env.local --no-warnings scripts/update-thankyou-copy.ts --dry-run   # print what would change
 *   node --env-file=.env.local --no-warnings scripts/update-thankyou-copy.ts             # apply (SANITY_API_WRITE_TOKEN)
 *
 * Safe to re-run (scripts/lib/safe-write.ts): a second run changes nothing.
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SafeWrite, type Expect } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const SURVEY_ID = 'estimate-survey-default'

const OLD_STEPS = ['{owner} or the team calls to schedule your free estimate', 'We visit your home, free, no obligation']
const NEW_STEPS = ['{ownerOrTeam} calls to schedule your free estimate', 'We visit your home or business, free, no obligation']
const OLD_CONFIRMATION = 'Thank you for your message. We will get in touch with you shortly'
const NEW_CONFIRMATION = 'We received your information. We will get in touch with you shortly.'

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Doc = { _id: string; _rev: string; _type: string; nextSteps?: string[]; leadConfirmationMessage?: string }

async function main() {
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  const docs = await client.fetch<Doc[]>(
    `*[_id in $survey || _type == "location"] | order(_id){_id, _rev, _type, nextSteps, leadConfirmationMessage}`,
    { survey: [SURVEY_ID, `drafts.${SURVEY_ID}`] },
  )
  if (!docs.some((doc) => doc._id === SURVEY_ID)) throw new Error(`${SURVEY_ID} not found`)

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  const guard = new SafeWrite('update-thankyou-copy')
  const tx = client.transaction()
  for (const doc of docs) {
    const ops: { set: Record<string, unknown>; expect: Record<string, Expect> } =
      doc._type === 'location'
        ? { set: { leadConfirmationMessage: NEW_CONFIRMATION }, expect: { leadConfirmationMessage: { value: OLD_CONFIRMATION } } }
        : { set: { nextSteps: NEW_STEPS }, expect: { nextSteps: { value: OLD_STEPS } } }
    const { set, any } = guard.plan(doc._id, doc, ops)
    for (const path of Object.keys(set)) console.log(`${doc._id}: set ${path} = ${JSON.stringify(set[path])}`)
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
