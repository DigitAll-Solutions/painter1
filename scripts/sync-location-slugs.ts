/**
 * Reads the client's authoritative list of active locations (docs/reference/Painter1 URLs.csv,
 * gitignored) and writes the URL slugs and page tiers to sanity/lib/known-location-slugs.ts (public
 * data: slugs and which pages each location gets). The Studio warns when a slug isn't in the list.
 * Reports totals, tiers, odd URLs and every difference from the earlier list
 * (docs/reference/Painter1 locations.csv) and the live /locations/ page
 * (docs/painter1-knoxville/pages/locations.html), when those are saved.
 *
 *   node scripts/sync-location-slugs.ts [--check]     # --check: report only, don't write
 *
 * CSV: header "Location, URL, Home Page, Free Estimate, Service Pages, About Page, Our Work, Warranty";
 * an "X" marks a page the location gets (the privacy page isn't listed: every location has it).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

import { SLUG_PATTERN } from '../sanity/lib/location-slugs.ts'

const CSV = 'docs/reference/Painter1 URLs.csv'
const EARLIER_CSV = 'docs/reference/Painter1 locations.csv'
const LIVE_PAGE = 'docs/painter1-knoxville/pages/locations.html'
const OUT = 'sanity/lib/known-location-slugs.ts'
const EXPECTED = 37
const CHECK = process.argv.includes('--check')
const PAGES = ['Home Page', 'Free Estimate', 'Service Pages', 'About Page', 'Our Work', 'Warranty'] as const

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

/** "https://www.painter1.com/knoxville/" → { host, slug } (also "painter1.com/knoxville") */
function readUrl(raw: string) {
  const m = raw.trim().match(/^(?:https?:\/\/)?([^/\s]+)\/([^/?#\s]+)\/?$/)
  return m ? { host: m[1].toLowerCase(), slug: m[2] } : undefined
}

if (!existsSync(CSV)) {
  console.error(`${CSV} not found. Save the client's list there (it's gitignored), then run this again.`)
  process.exit(1)
}

// ---------- the authoritative list ----------
const [header, ...rows] = parseCsv(readFileSync(CSV, 'utf-8').replace(/^﻿/, ''))
const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase())
const missingCols = ['Location', 'URL', ...PAGES].filter((name) => col(name) < 0)
if (missingCols.length) {
  console.error(`Missing columns in ${CSV}: ${missingCols.join(', ')} (found: ${header.join(', ')})`)
  process.exit(1)
}

type Entry = { line: number; name: string; slug: string; pages: string[] }
const entries: Entry[] = []
const problems: string[] = []
rows.forEach((row, i) => {
  const line = i + 2
  const rawName = row[col('Location')] ?? ''
  const name = rawName.trim()
  const rawUrl = (row[col('URL')] ?? '').trim()
  const url = readUrl(rawUrl)
  if (!url) return problems.push(`line ${line} "${name}": can't read the URL "${rawUrl}"`)
  if (url.host !== 'www.painter1.com') {
    problems.push(`line ${line} "${name}": URL "${rawUrl}" ${url.host === 'painter1.com' ? 'has no "www."' : `uses "${url.host}"`}${/^https:\/\//.test(rawUrl) ? '' : ' and no https://'}`)
  } else if (!/^https:\/\//.test(rawUrl)) problems.push(`line ${line} "${name}": URL "${rawUrl}" has no https://`)
  if (url.slug !== url.slug.toLowerCase()) problems.push(`line ${line} "${name}": uppercase in "${url.slug}"`)
  const slug = url.slug.toLowerCase()
  if (rawName !== name || /\s{2,}/.test(rawName)) problems.push(`line ${line} "${name}": extra spaces in the name ("${rawName}")`)
  if (!/^Painter1 of /.test(name)) problems.push(`line ${line} "${name}": name doesn't follow "Painter1 of …"`)
  if (!SLUG_PATTERN.test(slug)) return problems.push(`line ${line} "${name}": "${slug}" isn't a valid slug`)
  const dup = entries.find((e) => e.slug === slug)
  if (dup) return problems.push(`line ${line} "${name}": same URL /${slug}/ as line ${dup.line} "${dup.name}" (one of them is wrong; this row is left out)`)
  const pages = PAGES.filter((page) => /^x$/i.test((row[col(page)] ?? '').trim()))
  entries.push({ line, name, slug, pages })
})

const tierKey = (e: Entry) => e.pages.join(' + ') || '(none)'
const tiers = new Map<string, Entry[]>()
for (const e of entries) tiers.set(tierKey(e), [...(tiers.get(tierKey(e)) ?? []), e])

console.log(`${CSV}: ${rows.length} rows → ${entries.length} locations with a usable, unique URL (expected ${EXPECTED})${entries.length === EXPECTED ? '' : `  ← ${entries.length - EXPECTED > 0 ? '+' : ''}${entries.length - EXPECTED}`}`)
console.log('\nPage tiers (privacy page not counted; every location has it):')
for (const [tier, list] of tiers) console.log(`  ${list.length} × ${tier}\n     ${list.map((e) => e.slug).join(', ')}`)
console.log(`\nTypos and odd URLs (${problems.length}):`)
console.log(problems.length ? problems.map((p) => `  ! ${p}`).join('\n') : '  none')

// ---------- differences ----------
const slugs = entries.map((e) => e.slug)
const norm = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim()
const byName = new Map(entries.map((e) => [norm(e.name), e]))

if (existsSync(EARLIER_CSV)) {
  const earlier = parseCsv(readFileSync(EARLIER_CSV, 'utf-8').replace(/^﻿/, ''))
    .filter((r) => (r[1] ?? '').trim())
    .map((r) => ({ name: (r[0] ?? '').trim(), slug: readUrl(r[1])?.slug.toLowerCase() ?? '' }))
  const earlierSlugs = earlier.map((e) => e.slug)
  console.log(`\nvs the earlier list (${EARLIER_CSV}, ${earlier.length} locations):`)
  const added = entries.filter((e) => !earlierSlugs.includes(e.slug) && !earlier.some((x) => norm(x.name) === norm(e.name)))
  const removed = earlier.filter((x) => !slugs.includes(x.slug) && !byName.has(norm(x.name)))
  const changed = earlier.flatMap((x) => {
    const now = byName.get(norm(x.name))
    return now && now.slug !== x.slug ? [`${x.name}: /${x.slug}/ → /${now.slug}/`] : []
  })
  const renamed = entries.flatMap((e) => {
    const was = earlier.find((x) => x.slug === e.slug)
    return was && norm(was.name) !== norm(e.name) ? [`/${e.slug}/: "${was.name}" → "${e.name}"`] : []
  })
  console.log(`  new in this list (${added.length}): ${added.map((e) => `${e.slug} ("${e.name}")`).join(', ') || '—'}`)
  console.log(`  no longer listed (${removed.length}): ${removed.map((x) => `${x.slug} ("${x.name}")`).join(', ') || '—'}`)
  console.log(`  URL changed (${changed.length}):${changed.length ? `\n    ${changed.join('\n    ')}` : ' —'}`)
  console.log(`  name changed (${renamed.length}):${renamed.length ? `\n    ${renamed.join('\n    ')}` : ' —'}`)
}

if (existsSync(LIVE_PAGE)) {
  const html = readFileSync(LIVE_PAGE, 'utf-8')
  const corporate = new Set(['locations', 'privacy-policy', 'terms-and-conditions', 'warranty', 'testimonials', 'painting-blog', 'why-choose-us', 'residential-painting', 'contact', 'commercial-painting', 'about-us', 'low-cost-franchise-opportunities', 'wp-json', 'wp-content'])
  const live = new Map<string, string>()
  for (const m of html.matchAll(/<a[^>]*href="https?:\/\/(?:www\.)?painter1\.com\/([A-Za-z0-9-]+)\/?"[^>]*>([\s\S]*?)<\/a>/g)) {
    const slug = m[1].toLowerCase()
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
    if (!corporate.has(slug) && text.length >= (live.get(slug) ?? '').length) live.set(slug, text)
  }
  const onlyLive = [...live.keys()].filter((s) => !slugs.includes(s)).sort()
  const onlyCsv = entries.filter((e) => !live.has(e.slug))
  console.log(`\nvs the live /locations/ page (${live.size} location links; ${live.size - onlyLive.length} match):`)
  console.log(`  in this list, not on the live page (${onlyCsv.length}): ${onlyCsv.map((e) => `${e.slug} ("${e.name}")`).join(', ') || '—'}`)
  console.log(`  on the live page, not in this list (${onlyLive.length}): ${onlyLive.map((s) => `${s} ("${live.get(s)}")`).join(', ') || '—'}`)
}

if (!CHECK) {
  const tierOf = (e: Entry) => (PAGES.every((p) => e.pages.includes(p)) ? 'full' : 'basic')
  const basicPages = [...new Set(entries.filter((e) => tierOf(e) === 'basic').map(tierKey))].join(' / ') || 'n/a'
  writeFileSync(
    OUT,
    `// GENERATED by scripts/sync-location-slugs.ts from the client's list of active locations
// (docs/reference/Painter1 URLs.csv, gitignored). Public data only: URL slugs and page tiers.
// full = every page; basic = ${basicPages}.
export const KNOWN_LOCATION_SLUGS: readonly string[] = ${JSON.stringify(slugs.slice().sort(), null, 2)}

export const LOCATION_TIERS: Readonly<Record<string, 'full' | 'basic'>> = ${JSON.stringify(Object.fromEntries(entries.map((e) => [e.slug, tierOf(e)]).sort()), null, 2)}
`,
  )
  console.log(`\nwrote ${OUT} (${slugs.length} slugs)`)
}
