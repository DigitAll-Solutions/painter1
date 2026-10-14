/**
 * Oct 14 feedback data changes.
 *
 * Default (additive: the deployed site doesn't read warrantyPageImage): Knoxville's warranty page photo
 * (Rick's "Friendly Kitchen Agreement"). Only set when empty.
 *   node --env-file=.env.local scripts/seed-oct14.ts --dry-run
 *   node --env-file=.env.local scripts/seed-oct14.ts
 *
 * Post-merge, in this order (each changes what production shows today; --dry-run first every time):
 *   --labor-only       service warranty banners: "labor and materials included" → "at no labor charge"
 *   --cabinet-wording  every "refinishing" in the cabinet service, Knoxville and the estimate survey
 *                      → "painting" ("What We Refinish" removed, so the heading is "What We Paint")
 *   --surface-copy     Rick's exterior and interior surface copy into the shared surface sections
 *   --surface-photos   Knoxville's Stucco, Trim & Doors, Decks, Fences and cabinet surface photos
 *
 * Photos are read from docs/painter1-knoxville/jpg-oct14/ (gitignored; JPEGs converted from Rick's PNGs).
 * Re-running is a no-op.
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { RICK_OCT14_COPY, type SurfaceCopy } from './data/rick-oct14-surfaces.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const LABOR = process.argv.includes('--labor-only')
const CABINET = process.argv.includes('--cabinet-wording')
const COPY = process.argv.includes('--surface-copy')
const PHOTOS = process.argv.includes('--surface-photos')
const ADDITIVE = !LABOR && !CABINET && !COPY && !PHOTOS

const PHOTO_DIR = 'docs/painter1-knoxville/jpg-oct14'
const MESSAGES = 'docs/painter1-knoxville/rick-oct14-messages.txt'

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

// ---------- Photos (alt text describes what each image shows; "painting", never "refinishing") ----------
const WARRANTY_PAGE_PHOTO = {
  file: 'knoxville-warranty-kitchen-handshake.jpg',
  alt: 'A Painter1 owner shaking hands with a homeowner couple across a kitchen island, with freshly painted white cabinets behind them.',
}
type Photo = { service: 'exterior' | 'cabinet'; slug: string; file: string; alt: string }
const SURFACE_PHOTOS: Photo[] = [
  { service: 'exterior', slug: 'stucco', file: 'knoxville-stucco-masked-windows.jpg', alt: 'Painter rolling a warm beige coat onto a cream stucco wall, with the windows masked in plastic and blue tape and the shrubs covered with drop cloths.' },
  { service: 'exterior', slug: 'trim-doors', file: 'knoxville-trim-door-navy.jpg', alt: 'Painter brushing white enamel onto door trim beside a navy front door, with the door hardware wrapped in paper and blue tape.' },
  { service: 'exterior', slug: 'decks', file: 'knoxville-deck-staining.jpg', alt: 'Painter applying cedar-toned stain to a backyard deck with a pad applicator, half the boards stained and half still weathered grey.' },
  { service: 'exterior', slug: 'fences', file: 'knoxville-fence-staining.jpg', alt: 'Painter spraying cedar-toned stain onto a wooden privacy fence, with the shrubs along the fence covered in plastic.' },
  { service: 'cabinet', slug: 'kitchen-cabinets', file: 'knoxville-kitchen-cabinet-painting.jpg', alt: 'Painter in a respirator spraying white paint onto open kitchen cabinet frames, with the counters and backsplash covered in plastic and the oak cabinets on the left still unpainted.' },
  { service: 'cabinet', slug: 'bathroom-vanities', file: 'knoxville-bathroom-vanity-navy.jpg', alt: 'Painter kneeling to spray navy paint onto an oak bathroom vanity, half painted, with the countertop and sinks covered in plastic.' },
  { service: 'cabinet', slug: 'hardware-upgrades', file: 'knoxville-cabinet-hardware.jpg', alt: 'Installer fitting a matte black bar pull to a white painted kitchen drawer with a cordless drill, the old brass knobs set aside on the counter.' },
]

// ---------- Labor only ----------
const MATERIALS = "we'll come back and fix it, labor and materials included."
const LABOR_ONLY = "we'll come back and fix it at no labor charge."

// ---------- Cabinet wording: every prose "refinish…" → "paint…" ----------
const WORDING: [RegExp, string][] = [
  [/Cabinet Refinishing/g, 'Cabinet Painting'],
  [/Cabinet refinishing/g, 'Cabinet painting'],
  [/cabinet refinishing/g, 'cabinet painting'],
  [/professional refinishing/g, 'professional painting'],
]
const HOMEPAGE_WARRANTY_ALT = 'A Painter1 representative shaking hands with a homeowner couple in a kitchen with white painted cabinets.'

// ---------- Portable Text for the surface copy ----------
type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
export type Block = { _type: 'block'; _key: string; style: string; markDefs: never[]; children: Span[]; listItem?: 'bullet'; level?: number }
/** "Identify the material first. Vinyl…" → bold first sentence, then the rest */
const firstSentence = (text: string) => {
  const m = text.match(/^(.+?[.?!])(\s.*)?$/)
  return m ? [m[1], m[2] ?? ''] : [text, '']
}
/** "What you get: a new…" → bold label, then the rest */
const label = (text: string) => {
  const i = text.indexOf(':')
  return [text.slice(0, i + 1), text.slice(i + 1)]
}
/** Rick's surface structure: intro, "How we do it" label, bullets with a bold first sentence, labelled extras, "What you get:", "Warranty note:" */
export function surfaceBlocks(slug: string, copy: SurfaceCopy): Block[] {
  let n = 0
  const block = (style: string, parts: [string, boolean][], list = false): Block => {
    const key = `${slug}-b${++n}`
    return {
      _type: 'block',
      _key: key,
      style,
      markDefs: [],
      children: parts.filter(([text]) => text).map(([text, bold], i) => ({ _type: 'span', _key: `${key}s${i}`, text, marks: bold ? ['strong'] : [] })),
      ...(list ? { listItem: 'bullet' as const, level: 1 } : {}),
    }
  }
  const boldFirst = (text: string, split: (t: string) => string[]) => {
    const [head, rest] = split(text)
    return [
      [head, true],
      [rest, false],
    ] as [string, boolean][]
  }
  return [
    block('normal', [[copy.intro, false]]),
    block('label', [['How we do it', false]]),
    ...copy.items.map((item) => block('normal', boldFirst(item, firstSentence), true)),
    ...copy.extras.map((extra) => block('normal', boldFirst(extra, label))),
    block('normal', boldFirst(copy.whatYouGet, label)),
    ...(copy.warrantyNote ? [block('note', boldFirst(copy.warrantyNote, label))] : []),
  ]
}
export const plain = (blocks: Block[]) => blocks.map((b) => b.children.map((c) => c.text).join('')).join('\n')
export const show = (blocks: Block[]) =>
  blocks
    .map((b) => `${b.listItem ? '  • ' : b.style === 'label' ? '  [label] ' : b.style === 'note' ? '  [note] ' : '  '}${b.children.map((c) => (c.marks.length ? `**${c.text}**` : c.text)).join('')}`)
    .join('\n')

type Img = { _type?: string; asset?: { _ref?: string }; alt?: string }
type Item = { _key: string; title?: string; slug?: { current?: string }; body?: Block[] }
type ServiceDoc = { _id: string; _rev: string; title?: string; locationKey: string; warrantyBannerBody?: string; whatWePaint?: Item[] }
type LocationDoc = { _id: string; _rev: string; warrantyPageImage?: Img; services?: Record<string, { surfacePhotos?: { _key: string; surface?: string; image?: Img }[] } | undefined> }

/** Every string under a document with a Sanity patch path (array items by _key) */
function strings(value: unknown, path = ''): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }]
  if (Array.isArray(value)) return value.flatMap((item, i) => strings(item, `${path}[${item && typeof item === 'object' && '_key' in item ? `_key=="${(item as { _key: string })._key}"` : i}]`))
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => (k.startsWith('_') || k === 'slug' || k === 'asset' ? [] : strings(v, path ? `${path}.${k}` : k)))
  return []
}

async function main() {
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token: env('SANITY_API_WRITE_TOKEN'), useCdn: false, perspective: 'raw' })
  const drafts = await client.fetch<string[]>(`*[_id in path("drafts.**") && _type in ["service", "location", "estimateSurvey"]]._id`)
  if (drafts.length) throw new Error(`Unpublished drafts exist (${drafts.join(', ')}): publish or discard them in Studio first`)
  const services = await client.fetch<ServiceDoc[]>(`*[_type == "service" && !(_id in path("drafts.**"))] | order(locationKey){_id, _rev, title, locationKey, warrantyBannerBody, whatWePaint}`)
  const knoxville = await client.fetch<LocationDoc>(`*[_id == "location-knoxville"][0]{_id, _rev, warrantyPageImage, services}`)

  const tx = client.transaction()
  let changes = 0
  const upload = async (file: string) => {
    const path = `${PHOTO_DIR}/${file}`
    if (!existsSync(path)) throw new Error(`${path} not found: convert Rick's PNGs first (see the report)`)
    if (DRY_RUN) return `(uploaded on apply: ${file}, ${Math.round(statSync(path).size / 1000)} KB)`
    return (await client.assets.upload('image', createReadStream(path), { filename: file }))._id
  }
  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")`)
  console.log(`Mode: ${ADDITIVE ? 'Knoxville warranty page photo (additive)' : [LABOR && 'labor only', CABINET && 'cabinet wording', COPY && 'surface copy', PHOTOS && 'surface photos'].filter(Boolean).join(' + ') + ' (post-merge)'}\n`)

  if (ADDITIVE) {
    if (knoxville.warrantyPageImage?.asset?._ref) console.log(`KNOXVILLE warrantyPageImage: already set (${knoxville.warrantyPageImage.asset._ref}); kept`)
    else {
      const ref = await upload(WARRANTY_PAGE_PHOTO.file)
      console.log(`KNOXVILLE ${knoxville._id} (rev ${knoxville._rev}) warrantyPageImage ← ${ref}\n  alt: "${WARRANTY_PAGE_PHOTO.alt}"`)
      changes++
      tx.patch(knoxville._id, (p) => p.ifRevisionId(knoxville._rev).set({ warrantyPageImage: { _type: 'image', asset: { _type: 'reference', _ref: ref }, alt: WARRANTY_PAGE_PHOTO.alt } }))
    }
  }

  if (LABOR) {
    for (const service of services) {
      if (!service.warrantyBannerBody?.includes(MATERIALS)) {
        console.log(`${service._id} warrantyBannerBody: no "labor and materials" wording; kept`)
        continue
      }
      const next = service.warrantyBannerBody.replace(MATERIALS, LABOR_ONLY)
      console.log(`${service._id} (rev ${service._rev}) warrantyBannerBody\n  - ${service.warrantyBannerBody}\n  + ${next}`)
      changes++
      tx.patch(service._id, (p) => p.ifRevisionId(service._rev).set({ warrantyBannerBody: next }))
    }
    console.log()
  }

  if (CABINET) {
    const docs = await client.fetch<{ _id: string; _rev: string }[]>(`*[_id in ["service-cabinet-refinishing", "location-knoxville", "estimate-survey-default"]]{_id, _rev}`)
    for (const { _id, _rev } of docs) {
      const doc = await client.getDocument(_id)
      const set: Record<string, string> = {}
      const unset: string[] = []
      for (const { path, text } of strings(doc)) {
        if (!/refinish/i.test(text)) continue
        if (path === 'whatWePaintTitle') unset.push(path)
        else if (path === 'warrantyImage.alt') set[path] = HOMEPAGE_WARRANTY_ALT
        else set[path] = WORDING.reduce((t, [from, to]) => t.replace(from, to), text)
        const next = unset.includes(path) ? '(removed: the heading falls back to "What We Paint")' : set[path]
        // Long text: show the part around the change
        const at = Math.max(0, text.search(/refinish/i) - 60)
        const around = (t: string) => `${at ? '…' : ''}${t.replace(/\s+/g, ' ').slice(at, at + 170)}`
        console.log(`${_id} ${path}\n  - ${around(text)}\n  + ${around(next)}`)
        if (path !== 'whatWePaintTitle' && /refinish/i.test(next)) throw new Error(`Unhandled wording at ${_id} ${path}`)
      }
      if (Object.keys(set).length || unset.length) {
        changes++
        tx.patch(_id, (p) => p.ifRevisionId(_rev).set(set).unset(unset))
      }
    }
    console.log()
  }

  if (COPY) {
    // Word-for-word check against Rick's messages when they're on this machine
    const source = existsSync(MESSAGES) ? readFileSync(MESSAGES, 'utf-8') : null
    for (const group of ['exterior', 'interior'] as const) {
      const service = services.find((s) => s.locationKey === group)
      if (!service) throw new Error(`No ${group} service`)
      const set: Record<string, Block[]> = {}
      for (const [slug, copy] of Object.entries(RICK_OCT14_COPY[group])) {
        const item = service.whatWePaint?.find((i) => i.slug?.current === slug)
        if (!item) throw new Error(`${service._id} has no surface #${slug}`)
        const blocks = surfaceBlocks(slug, copy)
        if (source) {
          for (const line of [copy.intro, ...copy.items, ...copy.extras, copy.whatYouGet, copy.warrantyNote].filter((l): l is string => Boolean(l))) {
            if (!source.includes(line) && !source.includes(line.replace('10-12 years', '[10-12] years'))) throw new Error(`Not word for word (${slug}): ${line}`)
          }
        }
        if (item.body && plain(item.body) === plain(blocks) && JSON.stringify(item.body.map((b) => [b.style, b.listItem ?? null])) === JSON.stringify(blocks.map((b) => [b.style, b.listItem ?? null]))) {
          console.log(`${service._id} #${slug}: already Rick's copy; kept`)
          continue
        }
        set[`whatWePaint[_key=="${item._key}"].body`] = blocks
        console.log(`${service._id} #${slug} (${item.title}) ← Rick's copy (${blocks.length} blocks)\n${show(blocks)}\n`)
      }
      console.log(source ? `  ✓ every line matches ${MESSAGES} word for word (only Brick's "10-12" differs, as confirmed)\n` : `  (${MESSAGES} not on this machine: word-for-word check skipped)\n`)
      if (Object.keys(set).length) {
        changes++
        tx.patch(service._id, (p) => p.ifRevisionId(service._rev).set(set))
      }
    }
  }

  if (PHOTOS) {
    // One patch on Knoxville for both services
    const set: Record<string, unknown> = {}
    for (const group of ['exterior', 'cabinet'] as const) {
      const service = services.find((s) => s.locationKey === group)!
      const current = knoxville.services?.[group]?.surfacePhotos ?? []
      let next = [...current]
      let changed = false
      console.log(`KNOXVILLE services.${group}.surfacePhotos (${current.length} now: ${current.map((p) => p.surface).join(', ') || 'none'})`)
      for (const photo of SURFACE_PHOTOS.filter((p) => p.service === group)) {
        const item = service.whatWePaint?.find((i) => i.slug?.current === photo.slug)
        if (!item) throw new Error(`${service._id} has no surface #${photo.slug}`)
        const existing = current.find((p) => p.surface === item._key)
        if (existing?.image?.alt === photo.alt) {
          console.log(`  ${item.title}: already this photo; kept`)
          continue
        }
        const ref = await upload(photo.file)
        const entry = { _key: `photo-${item._key}`, _type: 'surfacePhoto', surface: item._key, image: { _type: 'image', asset: { _type: 'reference', _ref: ref }, alt: photo.alt } }
        next = existing ? next.map((p) => (p.surface === item._key ? entry : p)) : [...next, entry]
        changed = true
        console.log(`  ${item.title} (key "${item._key}") ${existing ? `replaces ${existing.image?.asset?._ref}` : 'new'}\n    ← ${ref}\n    alt: "${photo.alt}"`)
      }
      if (changed) set[`services.${group}.surfacePhotos`] = next
      console.log()
    }
    if (Object.keys(set).length) {
      changes++
      tx.patch(knoxville._id, (p) => p.ifRevisionId(knoxville._rev).set(set))
    }
  }

  console.log(`${changes} document change(s).`)
  if (DRY_RUN || !changes) {
    console.log(DRY_RUN ? 'Dry run complete. No changes written.' : 'Nothing to do.')
    return
  }
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`Committed transaction ${result.transactionId} (${result.results.length} mutations).`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
