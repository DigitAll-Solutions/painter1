/**
 * Manual run of the daily lead cleanup (same rule and code as app/api/cron/cleanup-leads): leads older
 * than 90 days whose email was sent are deleted; failed, skipped, pending and test leads are kept and
 * counted. Prints counts only.
 *
 *   node --env-file=.env.local scripts/cleanup-leads.ts --dry-run   # what would be deleted
 *   node --env-file=.env.local scripts/cleanup-leads.ts             # delete (SANITY_API_WRITE_TOKEN)
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { cleanupLeads, describeReport } from '../lib/lead-cleanup.ts'

const DRY_RUN = process.argv.includes('--dry-run')

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

async function main() {
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be deleted' : 'DELETING'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")`)
  console.log(describeReport(await cleanupLeads(client, { dryRun: DRY_RUN })))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
