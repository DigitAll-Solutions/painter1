// node --test: lead retention. Only leads older than 90 days with email "sent" (not test mode) go, with
// their drafts and uploads nothing else uses; recipients docs and every other document are never touched.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { SanityClient } from '@sanity/client'

import { assetRefs, cleanupLeads, describeReport, leadVerdict, RETENTION_DAYS, type LeadRow } from './lead-cleanup.ts'

const NOW = new Date('2026-10-19T12:00:00Z')
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString()
const old = daysAgo(RETENTION_DAYS + 1)

test('selection rule: older than 90 days, email sent, not a test → delete; everything else is kept', () => {
  const v = (lead: Partial<LeadRow>) => leadVerdict({ _id: 'lead.x', ...lead }, NOW)
  assert.equal(v({ submittedAt: old, status: 'sent' }), 'delete')
  assert.equal(v({ submittedAt: daysAgo(RETENTION_DAYS), status: 'sent' }), 'delete', 'exactly 90 days old')
  assert.equal(v({ submittedAt: daysAgo(RETENTION_DAYS - 1), status: 'sent' }), 'recent')
  assert.equal(v({ submittedAt: old, status: 'sent', testMode: true }), 'test')
  assert.equal(v({ submittedAt: old, status: 'failed', }), 'failed')
  assert.equal(v({ submittedAt: old, status: 'skipped (no BREVO_SMTP_USER/BREVO_SMTP_KEY)' }), 'skipped')
  assert.equal(v({ submittedAt: old, status: 'pending' }), 'pending')
  assert.equal(v({ submittedAt: old }), 'pending', 'no email result recorded')
  assert.equal(v({ submittedAt: old, status: 'Sent' }), 'pending', 'only the exact "sent" status counts')
  assert.equal(v({ status: 'sent' }), 'no-date')
  assert.equal(v({ submittedAt: 'not a date', status: 'sent' }), 'no-date')
})

test('assetRefs finds uploaded images and files anywhere in a document, nothing else', () => {
  const doc = { location: { _ref: 'location-knoxville' }, photos: [{ asset: { _ref: 'image-abc-800x600-jpg' } }, { file: { asset: { _ref: 'file-def-pdf' } } }] }
  assert.deepEqual([...assetRefs(doc)], ['image-abc-800x600-jpg', 'file-def-pdf'])
})

// A fake client over an in-memory dataset: answers the three queries cleanupLeads makes, records deletes
function fakeClient(docs: Record<string, unknown>[]) {
  const deleted: string[] = []
  const byId = new Map(docs.map((doc) => [doc._id as string, doc]))
  const client = {
    fetch: async (query: string, params: Record<string, unknown> = {}) => {
      if (query.startsWith('*[_type == "lead" && _id in path("lead.*")]'))
        return docs
          .filter((doc) => doc._type === 'lead' && /^lead\.[^.]+$/.test(doc._id as string))
          .map((doc) => ({ _id: doc._id, submittedAt: doc.submittedAt, testMode: doc.testMode, status: (doc.email as { status?: string } | undefined)?.status }))
      if (query === '*[_id in $all]') return (params.all as string[]).flatMap((id) => (byId.has(id) ? [byId.get(id)] : []))
      if (query.startsWith('count(*[references($asset)'))
        return docs.filter((doc) => !(params.leaving as string[]).includes(doc._id as string) && assetRefs(doc).has(params.asset as string)).length
      throw new Error(`unexpected query ${query}`)
    },
    transaction: () => {
      const ops: string[] = []
      const tx = { delete: (id: string) => (ops.push(id), tx), commit: async () => (deleted.push(...ops), {}) }
      return tx
    },
  }
  return { client: client as unknown as SanityClient, deleted }
}

const dataset = [
  { _id: 'lead.a', _type: 'lead', submittedAt: old, email: { status: 'sent' }, photo: { asset: { _ref: 'image-only-a' } }, shared: { asset: { _ref: 'image-shared' } } },
  { _id: 'drafts.lead.a', _type: 'lead', submittedAt: old, email: { status: 'sent' } },
  { _id: 'lead.b', _type: 'lead', submittedAt: old, email: { status: 'sent' } },
  { _id: 'lead.c', _type: 'lead', submittedAt: old, email: { status: 'failed' } },
  { _id: 'lead.d', _type: 'lead', submittedAt: old, email: { status: 'skipped (x)' } },
  { _id: 'lead.e', _type: 'lead', submittedAt: old, testMode: true, email: { status: 'sent' } },
  { _id: 'lead.f', _type: 'lead', submittedAt: daysAgo(10), email: { status: 'sent' } },
  { _id: 'leads.location-knoxville', _type: 'leadRecipients', leadRecipients: ['x@example.com'] },
  { _id: 'location-knoxville', _type: 'location', heroImage: { asset: { _ref: 'image-shared' } } },
  { _id: 'image-only-a', _type: 'sanity.imageAsset' },
  { _id: 'image-shared', _type: 'sanity.imageAsset' },
]

test('cleanup deletes old sent leads, their drafts and their own uploads; keeps shared assets and everything else', async () => {
  const { client, deleted } = fakeClient(dataset)
  const report = await cleanupLeads(client, { dryRun: false, now: NOW })
  assert.deepEqual(deleted.sort(), ['drafts.lead.a', 'image-only-a', 'lead.a', 'lead.b'])
  assert.deepEqual(report, {
    dryRun: false,
    retentionDays: 90,
    checked: 6,
    deleted: 2,
    draftsDeleted: 1,
    assetsDeleted: 1,
    assetsKept: 1,
    kept: { recent: 1, test: 1, failed: 1, skipped: 1, pending: 0, 'no-date': 0 },
  })
  const line = describeReport(report)
  assert.match(line, /deleted 2 \(\+1 drafts, 1 assets; 1 assets still used elsewhere kept\); kept 1 recent, 1 failed, 1 skipped, 1 test, 0 pending, 0 without a date/)
  assert.doesNotMatch(line, /lead\.|@/, 'no ids or personal data in the log')
})

test('dry run counts the same and deletes nothing', async () => {
  const { client, deleted } = fakeClient(dataset)
  const report = await cleanupLeads(client, { dryRun: true, now: NOW })
  assert.equal(deleted.length, 0)
  assert.equal(report.deleted, 2)
  assert.match(describeReport(report), /DRY RUN .* would delete 2/)
})
