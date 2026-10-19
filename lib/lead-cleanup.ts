// Lead retention (Sanity Free plan: 10k documents, so leads can't pile up forever). A lead is deleted
// 90 days after it was submitted, and only if its email was sent: it then lives on in the recipients'
// inboxes and in Client Tether. Failed, skipped, pending and test-mode leads are kept and counted, so
// someone can follow them up. Only `lead` documents (lead.<uuid> and their drafts) and assets nothing
// else references are deleted; leads.<location id> recipient documents and every other type are never
// touched. Runs daily from app/api/cron/cleanup-leads (Vercel Cron) or by hand with
// scripts/cleanup-leads.ts. Logs counts only, never personal data. Tested in lead-cleanup.test.ts.
import type { SanityClient } from '@sanity/client'

export const RETENTION_DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000
const BATCH = 100

export type LeadRow = { _id: string; submittedAt?: string | null; testMode?: boolean | null; status?: string | null }
export type Verdict = 'delete' | 'recent' | 'test' | 'failed' | 'skipped' | 'pending' | 'no-date'

/** The retention rule for one lead: older than 90 days AND email "sent" AND not test mode → delete */
export function leadVerdict(lead: LeadRow, now: Date, days = RETENTION_DAYS): Verdict {
  const submitted = lead.submittedAt ? Date.parse(lead.submittedAt) : NaN
  if (Number.isNaN(submitted)) return 'no-date'
  if (now.getTime() - submitted < days * DAY_MS) return 'recent'
  if (lead.testMode) return 'test'
  const status = lead.status?.trim() ?? ''
  if (status === 'sent') return 'delete'
  if (status.startsWith('failed')) return 'failed'
  if (status.startsWith('skipped')) return 'skipped'
  return 'pending'
}

/** Asset ids a document points at (image-… / file-…), anywhere in it */
export function assetRefs(value: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) assetRefs(item, found)
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === '_ref' && typeof item === 'string' && /^(image|file)-/.test(item)) found.add(item)
      else assetRefs(item, found)
    }
  }
  return found
}

export type CleanupReport = {
  dryRun: boolean
  retentionDays: number
  checked: number
  deleted: number
  draftsDeleted: number
  assetsDeleted: number
  assetsKept: number
  kept: Record<Exclude<Verdict, 'delete'>, number>
}

const isLeadId = (id: string) => /^lead\.[^.]+$/.test(id)

/**
 * Applies the retention rule to every published lead. dryRun: counts what would go, deletes nothing.
 * The client needs a write token (or a read token for a dry run).
 */
export async function cleanupLeads(client: SanityClient, { dryRun, now = new Date() }: { dryRun: boolean; now?: Date }): Promise<CleanupReport> {
  const rows = await client.fetch<LeadRow[]>(`*[_type == "lead" && _id in path("lead.*")]{_id, submittedAt, testMode, "status": email.status}`, {}, { perspective: 'raw' })
  const kept: CleanupReport['kept'] = { recent: 0, test: 0, failed: 0, skipped: 0, pending: 0, 'no-date': 0 }
  const doomed: string[] = []
  for (const row of rows) {
    const verdict = leadVerdict(row, now)
    if (verdict === 'delete' && isLeadId(row._id)) doomed.push(row._id)
    else if (verdict !== 'delete') kept[verdict]++
  }

  const report: CleanupReport = { dryRun, retentionDays: RETENTION_DAYS, checked: rows.length, deleted: 0, draftsDeleted: 0, assetsDeleted: 0, assetsKept: 0, kept }
  for (let i = 0; i < doomed.length; i += BATCH) {
    const ids = doomed.slice(i, i + BATCH)
    const drafts = ids.map((id) => `drafts.${id}`)
    // Whole documents (published + drafts) only to find uploaded assets; nothing from them is logged
    const docs = await client.fetch<{ _id: string; _type: string }[]>(`*[_id in $all]`, { all: [...ids, ...drafts] }, { perspective: 'raw' })
    const leadDocs = docs.filter((doc) => doc._type === 'lead')
    const existingDrafts = leadDocs.filter((doc) => doc._id.startsWith('drafts.')).map((doc) => doc._id)
    const assets = [...assetRefs(leadDocs)]
    // Delete an asset only when nothing outside this batch of leads references it
    const freeAssets: string[] = []
    for (const asset of assets) {
      const others = await client.fetch<number>(`count(*[references($asset) && !(_id in $leaving)])`, { asset, leaving: [...ids, ...existingDrafts] }, { perspective: 'raw' })
      if (others === 0) freeAssets.push(asset)
      else report.assetsKept++
    }

    if (!dryRun) {
      const tx = client.transaction()
      for (const id of [...ids, ...existingDrafts]) tx.delete(id)
      for (const asset of freeAssets) tx.delete(asset)
      await tx.commit({ visibility: 'async' })
    }
    report.deleted += ids.length
    report.draftsDeleted += existingDrafts.length
    report.assetsDeleted += freeAssets.length
  }
  return report
}

/** One log line, counts only */
export const describeReport = (r: CleanupReport) =>
  `[lead-cleanup]${r.dryRun ? ' DRY RUN' : ''} checked ${r.checked} leads (retention ${r.retentionDays} days, sent only): ` +
  `${r.dryRun ? 'would delete' : 'deleted'} ${r.deleted} (+${r.draftsDeleted} drafts, ${r.assetsDeleted} assets; ${r.assetsKept} assets still used elsewhere kept); ` +
  `kept ${r.kept.recent} recent, ${r.kept.failed} failed, ${r.kept.skipped} skipped, ${r.kept.test} test, ${r.kept.pending} pending, ${r.kept['no-date']} without a date`
