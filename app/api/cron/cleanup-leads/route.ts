// Daily lead cleanup, called by Vercel Cron (vercel.json). Applies the retention rule in
// lib/lead-cleanup.ts: leads older than 90 days whose email was sent are deleted; failed, skipped,
// pending and test leads are kept and counted. Vercel sends CRON_SECRET as a Bearer token; anything
// else gets 401. Dry run (counts only, nothing deleted): ?dryRun=1, or LEAD_CLEANUP_DRY_RUN=true.
// Responds and logs counts only, never personal data.
import { timingSafeEqual } from 'node:crypto'

import { type NextRequest, NextResponse } from 'next/server'

import { cleanupLeads, describeReport } from '@/lib/lead-cleanup'
import { leadWriteClient } from '@/sanity/lib/private-client'

export const maxDuration = 60

function authorized(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(header ?? '')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ message: 'CRON_SECRET is not set' }, { status: 500 })
  if (!authorized(req.headers.get('authorization'), secret)) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const client = leadWriteClient()
  if (!client) return NextResponse.json({ message: 'SANITY_API_WRITE_TOKEN is not set' }, { status: 500 })

  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1' || process.env.LEAD_CLEANUP_DRY_RUN === 'true'
  try {
    const report = await cleanupLeads(client, { dryRun })
    console.log(describeReport(report))
    return NextResponse.json(report)
  } catch (error) {
    console.error('[lead-cleanup] failed:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ message: 'Cleanup failed' }, { status: 500 })
  }
}
