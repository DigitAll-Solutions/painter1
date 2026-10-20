/**
 * Creates one location document per row of the client's list (docs/reference/Painter1 URLs.csv,
 * gitignored), so Rick can fill them in the Studio with the right slugs and tiers:
 *   - location-<slug>: slug exactly as the live URL; name as the live site shows it (scripts/lib/location-names.ts;
 *     the CSV's shorthand only where the live name couldn't be found); tier (full → growth, basic → maintenance).
 *     The list has no phone numbers or addresses, so those stay empty.
 *   - leads.location-<slug>: the private lead recipients document, with no recipients, so estimate
 *     emails for that location are skipped until someone adds them.
 * Only new documents are created (createIfNotExists, through scripts/lib/safe-write.ts): an existing
 * document (Knoxville) is skipped and reported, and no field of an existing document is touched.
 * New locations are previewable on painter1.vercel.app/<slug> but never public: only LIVE_LOCATIONS
 * (lib/legacy-redirects.ts) are in the sitemap, and other locations' pages are noindex.
 *
 *   node --env-file=.env.local scripts/seed-locations.ts --dry-run   # the list, nothing written
 *   node --env-file=.env.local scripts/seed-locations.ts             # create (SANITY_API_WRITE_TOKEN)
 *   … --with-defaults   also fill what Studio's "New location" pre-fills (sanity/lib/new-location-defaults.ts:
 *                       service titles, lead email subject/template, confirmation message, consent
 *                       checkboxes, …); the tier still comes from the list
 */
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { SLUG_PATTERN } from '../sanity/lib/location-slugs.ts'
import { NEW_LOCATION_DEFAULTS } from '../sanity/lib/new-location-defaults.ts'
import { parseCsv, readUrl, URL_CORRECTIONS } from './lib/location-csv.ts'
import { LIVE_LOCATION_NAMES } from './lib/location-names.ts'
import { SafeWrite } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const WITH_DEFAULTS = process.argv.includes('--with-defaults')
const CSV = 'docs/reference/Painter1 URLs.csv'
const PAGES = ['Home Page', 'Free Estimate', 'Service Pages', 'About Page', 'Our Work', 'Warranty'] as const
const BASIC = ['Home Page', 'Free Estimate']

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Row = { line: number; name: string; slug: string; tier: 'full' | 'basic' }

/** The name to create: the live site's (scripts/lib/location-names.ts), else the CSV's */
export const locationName = (row: Pick<Row, 'slug' | 'name'>) => LIVE_LOCATION_NAMES[row.slug]?.name ?? row.name

/** The CSV's usable rows, and the ones that can't be mapped cleanly (not created) */
export function readList(text: string): { rows: Row[]; unmapped: string[] } {
  const [header, ...lines] = parseCsv(text.replace(/^﻿/, ''))
  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase())
  const missing = ['Location', 'URL', ...PAGES].filter((name) => col(name) < 0)
  if (missing.length) throw new Error(`Missing columns in ${CSV}: ${missing.join(', ')}`)
  const rows: Row[] = []
  const unmapped: string[] = []
  lines.forEach((cells, i) => {
    const line = i + 2
    const name = (cells[col('Location')] ?? '').trim().replace(/\s+/g, ' ')
    const url = readUrl(cells[col('URL')] ?? '')
    const slug = URL_CORRECTIONS[name] ?? url?.slug.toLowerCase()
    const pages = PAGES.filter((page) => /^x$/i.test((cells[col(page)] ?? '').trim()))
    const tier = PAGES.every((p) => pages.includes(p)) ? 'full' : pages.length === BASIC.length && BASIC.every((p) => pages.includes(p as (typeof PAGES)[number])) ? 'basic' : undefined
    if (!name) return unmapped.push(`line ${line}: no location name`)
    if (!url || url.host.replace(/^www\./, '') !== 'painter1.com') return unmapped.push(`line ${line} "${name}": URL "${cells[col('URL')]}" isn't a painter1.com/<location> URL`)
    if (!slug || !SLUG_PATTERN.test(slug)) return unmapped.push(`line ${line} "${name}": "${slug}" isn't a valid slug`)
    if (!tier) return unmapped.push(`line ${line} "${name}": pages "${pages.join(', ')}" are neither every page (full) nor Home Page + Free Estimate (basic)`)
    const dup = rows.find((r) => r.slug === slug)
    if (dup) return unmapped.push(`line ${line} "${name}": same URL /${slug}/ as line ${dup.line} "${dup.name}"`)
    rows.push({ line, name, slug, tier })
  })
  return { rows, unmapped }
}

async function main() {
  if (!existsSync(CSV)) throw new Error(`${CSV} not found (gitignored; save the client's list there)`)
  const { rows, unmapped } = readList(readFileSync(CSV, 'utf-8'))
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })

  // Existing documents: by id (published or draft) and any location already using the slug
  const ids = rows.flatMap((r) => [`location-${r.slug}`, `drafts.location-${r.slug}`, `leads.location-${r.slug}`, `drafts.leads.location-${r.slug}`])
  const existing = new Set(await client.fetch<string[]>(`*[_id in $ids]._id`, { ids }))
  const slugTaken = new Map((await client.fetch<{ _id: string; slug: string }[]>(`*[_type == "location"]{_id, "slug": slug.current}`)).map((l) => [l.slug, l._id.replace(/^drafts\./, '')]))

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")`)
  console.log(WITH_DEFAULTS ? `With Studio's New-location defaults: ${Object.keys(NEW_LOCATION_DEFAULTS).filter((k) => k !== 'locationType').join(', ')}` : `Name, slug and tier only (add --with-defaults for what Studio's "New location" pre-fills)`)
  console.log(`${CSV}: ${rows.length} usable rows (${rows.filter((r) => r.tier === 'full').length} full, ${rows.filter((r) => r.tier === 'basic').length} basic), ${unmapped.length} not mapped\n`)

  const guard = new SafeWrite('seed-locations')
  const tx = client.transaction()
  const table: string[] = []
  for (const row of rows) {
    const locationId = `location-${row.slug}`
    const leadsId = `leads.${locationId}`
    const locationExists = existing.has(locationId) || existing.has(`drafts.${locationId}`) || slugTaken.has(row.slug)
    const leadsExists = existing.has(leadsId) || existing.has(`drafts.${leadsId}`)
    const created: string[] = []
    if (guard.create(locationId, locationExists)) {
      tx.createIfNotExists({ ...(WITH_DEFAULTS ? NEW_LOCATION_DEFAULTS : {}), _id: locationId, _type: 'location', name: locationName(row), slug: { _type: 'slug', current: row.slug }, locationType: row.tier === 'full' ? 'growth' : 'maintenance' })
      created.push(WITH_DEFAULTS ? 'location (+ New-location defaults)' : 'location')
    }
    if (guard.create(leadsId, leadsExists)) {
      tx.createIfNotExists({ _id: leadsId, _type: 'leadSettings', leadRecipients: [] })
      created.push('recipients (empty)')
    }
    const status = created.length ? `create ${created.join(' + ')}` : `SKIPPED (exists${slugTaken.has(row.slug) && slugTaken.get(row.slug) !== locationId ? ` as ${slugTaken.get(row.slug)}` : ''})`
    const live = LIVE_LOCATION_NAMES[row.slug]
    const note = !created.length ? '' : !live ? '  ← NO LIVE NAME FOUND: CSV name used' : live.note ? `  ← ${live.note}` : live.name !== row.name ? `  ← CSV: "${row.name}"` : ''
    table.push(`  ${row.slug.padEnd(22)} ${locationName(row).padEnd(36)} ${row.tier.padEnd(6)} ${status}${note}`)
  }
  console.log(`  ${'slug'.padEnd(22)} ${'name (live site)'.padEnd(36)} ${'tier'.padEnd(6)} action`)
  console.log(table.join('\n'))
  console.log(`\nNot mapped (not created): ${unmapped.length ? `\n  ! ${unmapped.join('\n  ! ')}` : 'none'}`)
  guard.report()
  if (DRY_RUN || !guard.changes.length) {
    console.log(DRY_RUN ? '\nDry run complete. No changes written.' : '\nNothing to do.')
    return
  }
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`\nCommitted transaction ${result.transactionId}: ${guard.changes.length} documents created.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
