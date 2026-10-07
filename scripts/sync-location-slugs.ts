/**
 * Reads the client's location list (docs/reference/locations.csv, gitignored) and writes only the URL
 * slugs to sanity/lib/known-location-slugs.ts, which the Studio uses to warn about a slug that isn't a
 * live location URL. Also compares the list with the live /locations/ page when it has been saved
 * (docs/painter1-knoxville/pages/locations.html) and with the expected count.
 *
 *   node scripts/sync-location-slugs.ts [--check]     # --check: report only, don't write
 *
 * The CSV needs a header row and either a "slug" column or a URL column (url / link / website / page);
 * slugs are taken from the first path segment of painter1.com URLs.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

import { SLUG_PATTERN } from '../sanity/lib/location-slugs.ts'

// The client's export, under either name it has been saved as
const CSV = ['docs/reference/locations.csv', 'docs/reference/Painter1 locations.csv'].find((path) => existsSync(path)) ?? 'docs/reference/locations.csv'
const LIVE_PAGE = 'docs/painter1-knoxville/pages/locations.html'
const OUT = 'sanity/lib/known-location-slugs.ts'
const EXPECTED = 37
const CHECK = process.argv.includes('--check')

/** Minimal CSV parser: quoted fields, commas and newlines inside quotes */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const endRow = () => {
    row.push(field)
    rows.push(row)
    row = []
    field = ''
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      endRow()
    } else field += c
  }
  if (field || row.length) endRow()
  return rows.filter((r) => r.some((cell) => cell.trim()))
}

if (!existsSync(CSV)) {
  console.error(`${CSV} not found. Save the client's location list there (it's gitignored), then run this again.`)
  process.exit(1)
}

const table = parseCsv(readFileSync(CSV, 'utf-8').replace(/^﻿/, ''))
const columns = table[0].map((h) => h.trim().toLowerCase())
const headed = columns.includes('slug') || columns.some((c) => ['url', 'link', 'website', 'page', 'site', 'location url'].includes(c))
// Two layouts: a header row with slug/URL columns, or the client's export (name, URL, scheduling) with
// "Growth" / "Maintenance" section rows and no header
const nameCol = headed ? Math.max(0, columns.findIndex((c) => ['name', 'location', 'location name'].includes(c))) : 0
const slugCol = headed ? columns.indexOf('slug') : -1
const urlCol = headed ? columns.findIndex((c) => ['url', 'link', 'website', 'page', 'site', 'location url'].includes(c)) : 1
const body = (headed ? table.slice(1) : table).map((row, i) => ({ row, line: i + (headed ? 2 : 1) }))

type Entry = { line: number; name: string; slug: string; section: string }
const problems: string[] = []
const entries: Entry[] = []
let section = ''
for (const { row, line } of body) {
  const name = (row[nameCol] ?? '').trim()
  const raw = ((slugCol >= 0 ? row[slugCol] : row[urlCol]) ?? '').trim()
  if (!raw && /^(growth|maintenance)$/i.test(name)) {
    section = name.toLowerCase()
    continue
  }
  if (!raw && !name) continue
  if (!raw) {
    problems.push(`line ${line} "${name}": no URL`)
    continue
  }
  let slug = raw
  if (slugCol < 0) {
    const m = raw.match(/^(?:https?:\/\/)?(?:www\.)?([^/\s]+)\/([^/?#\s]+)/)
    if (!m) {
      problems.push(`line ${line} "${name}": can't read the URL "${raw}"`)
      continue
    }
    if (m[1].toLowerCase() !== 'painter1.com') problems.push(`line ${line} "${name}": domain "${m[1]}" in "${raw}" (expected painter1.com)`)
    slug = m[2]
  }
  if (slug !== slug.toLowerCase()) problems.push(`line ${line} "${name}": uppercase in "${slug}" (live URLs are lowercase: using "${slug.toLowerCase()}")`)
  slug = slug.toLowerCase()
  if (!SLUG_PATTERN.test(slug)) problems.push(`line ${line} "${name}": "${slug}" isn't a valid slug`)
  else if (entries.some((e) => e.slug === slug)) problems.push(`line ${line} "${name}": duplicate slug "${slug}" (also line ${entries.find((e) => e.slug === slug)!.line})`)
  else entries.push({ line, name, slug, section })
  const rawName = row[nameCol] ?? ''
  if (rawName !== rawName.trim() || /\s{2,}/.test(rawName)) problems.push(`line ${line} "${name}": extra spaces in the name ("${rawName}")`)
  if (!/^Painter1 of /.test(name)) problems.push(`line ${line} "${name}": name doesn't follow "Painter1 of …"`)
}
const slugs = entries.map((e) => e.slug).sort()
const sections = [...new Set(entries.map((e) => e.section || '(no section)'))].map((sec) => `${sec} ${entries.filter((e) => (e.section || '(no section)') === sec).length}`)

console.log(`${CSV}: ${entries.length} locations (${sections.join(', ')}); expected ${EXPECTED}${entries.length === EXPECTED ? '' : `  ← MISMATCH (${entries.length - EXPECTED > 0 ? '+' : ''}${entries.length - EXPECTED})`}`)
console.log(problems.length ? problems.map((p) => `  ! ${p}`).join('\n') : '  no invalid rows or duplicates')

/** Edit distance, to pair near-identical slugs ("charloote-metro" ~ "charlotte-metro") */
const distance = (a: string, b: string) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

if (existsSync(LIVE_PAGE)) {
  const html = readFileSync(LIVE_PAGE, 'utf-8')
  const corporate = new Set(['locations', 'privacy-policy', 'terms-and-conditions', 'warranty', 'testimonials', 'painting-blog', 'why-choose-us', 'residential-painting', 'contact', 'commercial-painting', 'about-us', 'low-cost-franchise-opportunities', 'wp-json', 'wp-content'])
  const liveNames = new Map<string, string>()
  for (const m of html.matchAll(/<a[^>]*href="https?:\/\/(?:www\.)?painter1\.com\/([A-Za-z0-9-]+)\/?"[^>]*>([\s\S]*?)<\/a>/g)) {
    const slug = m[1].toLowerCase()
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
    if (!corporate.has(slug) && (!liveNames.get(slug) || text.length > (liveNames.get(slug) ?? '').length)) liveNames.set(slug, text)
  }
  const liveSlugs = [...liveNames.keys()].sort()
  const onlyLive = liveSlugs.filter((s) => !slugs.includes(s))
  const onlyCsv = entries.filter((e) => !liveSlugs.includes(e.slug))
  console.log(`\n${LIVE_PAGE}: ${liveSlugs.length} location links; ${liveSlugs.length - onlyLive.length} match the CSV`)
  console.log(`  in the CSV, not on the live page (${onlyCsv.length}):`)
  for (const e of onlyCsv) {
    const near = onlyLive.filter((s) => distance(s, e.slug) <= 3 || s.replace(/-/g, '').includes(e.slug.replace(/-/g, '')) || e.slug.replace(/-/g, '').includes(s.replace(/-/g, '')))
    console.log(`    ${e.slug.padEnd(24)} "${e.name}" (${e.section})${near.length ? `  → live has ${near.map((s) => `"${s}"${liveNames.get(s) ? ` (${liveNames.get(s)})` : ''}`).join(', ')}` : ''}`)
  }
  console.log(`  on the live page, not in the CSV (${onlyLive.length}):`)
  for (const s of onlyLive) console.log(`    ${s.padEnd(24)} ${liveNames.get(s) ? `"${liveNames.get(s)}"` : ''}`)
} else {
  console.log(`${LIVE_PAGE} not saved: live /locations/ comparison skipped`)
}

if (!CHECK) {
  writeFileSync(
    OUT,
    `// GENERATED by scripts/sync-location-slugs.ts from the client's location CSV in docs/reference/ (gitignored).\n// Only the URL slugs are kept here (they're public). Empty = list not imported yet: no slug warnings.\nexport const KNOWN_LOCATION_SLUGS: readonly string[] = ${JSON.stringify(slugs, null, 2)}\n`,
  )
  console.log(`wrote ${OUT}`)
}
