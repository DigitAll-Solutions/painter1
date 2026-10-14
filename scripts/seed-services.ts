/**
 * Seeds the Interior Painting and Exterior Painting service documents and tags Knoxville's
 * existing gallery photos and reviews with them.
 *
 *   node --env-file=.env.local scripts/seed-services.ts --dry-run   # print every change, write nothing
 *   node --env-file=.env.local scripts/seed-services.ts             # apply (needs SANITY_API_WRITE_TOKEN)
 *
 * Safe to re-run (scripts/lib/safe-write.ts): a service document is created when missing; after that only
 * EMPTY fields are filled. Anything with content (Rick's surface copy, default photos, card text, FAQs,
 * anything edited in Studio) is kept and listed; --force overwrites it after confirmation. Knoxville:
 * only empty fields are filled, and the alt-text mojibake fix replaces only the broken text.
 *   … --force   overwrite what's listed as KEPT (asks first)
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'

import { SafeWrite } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const LOCATION_SLUG = 'knoxville'
const API_VERSION = '2025-01-01'

// ---------- content ----------

type Block = { _type: 'block'; _key: string; style: 'normal'; markDefs: []; children: { _type: 'span'; _key: string; text: string; marks: string[] }[] }

const keyOf = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

/** One paragraph; **text** becomes bold */
function boldText(text: string, key = 'p0'): Block[] {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return [
    {
      _type: 'block',
      _key: key,
      style: 'normal',
      markDefs: [],
      // split() with a capture group alternates plain (even) and bold (odd) parts
      children: parts
        .map((part, i) => ({ part, bold: i % 2 === 1 }))
        .filter(({ part }) => part)
        .map(({ part, bold }, i) => ({ _type: 'span' as const, _key: `${key}s${i}`, text: part, marks: bold ? ['strong'] : [] })),
    },
  ]
}

const items = <T extends { title: string }>(list: T[]) => list.map((item) => ({ _key: keyOf(item.title), ...item }))
const faqs = (list: [string, string][]) => list.map(([question, answer]) => ({ _key: keyOf(question), question, answer }))

const warranty = (kind: string) =>
  `Every ${kind} job gets the same written warranty: if paint we applied peels, blisters, or flakes within two years, we'll come back and fix it at no labor charge.`

export const SERVICE_SEED = [
  {
    _id: 'service-interior-painting',
    _type: 'service',
    title: 'Interior Painting',
    slug: { _type: 'slug', current: 'interior-painting' },
    shortName: 'Interior',
    locationKey: 'interior',
    heroSubtitle: 'Clean lines, protected floors and furniture, and a finish that lasts.',
    metaDescription:
      'Interior painting in {city}, {state} by Painter1. Sherwin-Williams paints, full furniture and floor protection, and a 2-year warranty. Free estimate.',
    transformationHeading: 'Real Interiors, Real Results',
    transformationBody:
      "Every interior job starts with a free on-site estimate and a color consultation, then a scheduled crew that protects your floors and furniture, preps every surface, and cleans up like they were never there. No shortcuts on prep — that's what makes the finish last.",
    prepIntro: 'Prep is scoped to the job — but this is standard on every project:',
    prepBullets: ['Patching and sanding walls', 'Taping trim, windows, and edges', 'Full furniture and floor protection', 'Surface cleaning before first coat'],
    materialsBody: boldText('We paint exclusively with **Sherwin-Williams** — no off-brand substitutions. Your estimate will specify the exact line and finish for your project.'),
    materialsBlocks: [],
    warrantyBannerBody: warranty('interior'),
    whatWePaint: items([
      { icon: 'PaintRoller', title: 'Walls', description: 'Precision-prepped, even coverage, clean lines.' },
      { icon: 'PanelTop', title: 'Ceilings', description: 'Flat and textured ceilings, stain-blocked where needed.' },
      { icon: 'Ruler', title: 'Trim', description: 'Baseboards, crown molding, and window casings.' },
      { icon: 'DoorOpen', title: 'Doors', description: 'Interior doors and frames, factory-smooth finish.' },
    ]),
    faqs: faqs([
      ['Do you move furniture?', 'Yes — our crew moves and protects furniture as part of every job, and puts it back when the work is done.'],
      ['How long does interior paint smell last?', 'Low-VOC Sherwin-Williams paints typically clear within a day or two with normal ventilation.'],
      ['How much does interior painting cost?', 'Cost depends on square footage, number of rooms, and finish level — your free on-site estimate gives you an exact, written number.'],
      ['Do I need to be home during the job?', "Not necessarily — many clients arrange access and receive updates remotely. We'll work out what's easiest for your schedule."],
    ]),
  },
  {
    _id: 'service-exterior-painting',
    _type: 'service',
    title: 'Exterior Painting',
    slug: { _type: 'slug', current: 'exterior-painting' },
    shortName: 'Exterior',
    locationKey: 'exterior',
    heroSubtitle: "Proper prep and Sherwin-Williams paint that holds up to {city}'s weather.",
    metaDescription:
      'Exterior painting in {city}, {state} by Painter1. Pressure washing, scraping, caulking and Sherwin-Williams paints, plus a 2-year warranty. Free estimate.',
    transformationHeading: 'Real Exteriors, Real Results',
    transformationBody:
      "Every exterior job starts with a free on-site estimate, then proper prep — pressure washing, scraping, and caulking — before a coat of paint ever goes on. That's what makes the finish hold up against {city}'s weather swings, not just look good on day one.",
    processIntro: "Prep is where exterior jobs are won or lost — here's what's covered on every project.",
    prepIntro: 'Standard on every exterior job:',
    prepBullets: [
      'Pressure washing to remove dirt, mildew, and loose paint',
      'Scraping failing or peeling paint',
      'Caulking gaps and joints to seal out moisture',
      'Primer applied to all bare wood before topcoat',
    ],
    materialsBody: boldText(
      'We paint exclusively with **Sherwin-Williams** exterior lines — Resilience, Duration, and Emerald, matched to your project and budget during your estimate.',
    ),
    materialsBlocks: [
      { _key: 'typical-timeline', title: 'Typical Timeline', body: boldText('Your estimate will include **how long the job will take**, which depends on the size of the home and the weather.') },
      {
        _key: 'weather-window',
        title: 'Weather Window',
        body: boldText(
          "Sherwin-Williams' exterior lines are formulated to cure properly across **a wide temperature range**, so we're not limited to just the peak summer months.",
        ),
      },
    ],
    warrantyBannerBody: warranty('exterior'),
    whatWePaint: items([
      { icon: 'House', title: 'Siding', description: 'Wood, vinyl, and aluminum siding, prepped and fully coated.' },
      { icon: 'BrickWall', title: 'Brick', description: "Sealed brick that's protected and easy to keep clean." },
      { icon: 'Layers', title: 'Stucco', description: 'Specialized coating for stucco exteriors.' },
      { icon: 'DoorClosed', title: 'Trim & Doors', description: 'Eaves, fascia, trim detail, and exterior doors and frames.' },
      { icon: 'Rows3', title: 'Decks', description: 'Deck painting and staining with lasting weather protection.' },
      { icon: 'Fence', title: 'Fences', description: 'Fence painting and staining, prepped to hold up season after season.' },
    ]),
    faqs: faqs([
      ['Do you paint stucco and siding?', 'Yes — siding is our most common exterior surface, and we also paint stucco homes with a specialized coating approach.'],
      [
        'What temperature do you need for exterior painting?',
        "It depends on the paint: Sherwin-Williams exterior lines are formulated to cure properly across a wide temperature range, so we're not limited to just summer.",
      ],
      ['How long does an exterior repaint take?', 'It depends on the size of the home and weather conditions. Your estimate will include how long the job will take.'],
      [
        'How long will the paint job last?',
        "Proper prep — pressure washing, scraping, and caulking — combined with quality Sherwin-Williams paint is what makes an exterior finish hold up against {city}'s weather swings over time.",
      ],
    ]),
  },
  {
    _id: 'service-cabinet-refinishing',
    _type: 'service',
    title: 'Cabinet Painting',
    slug: { _type: 'slug', current: 'cabinet-painting' },
    shortName: 'Cabinet',
    locationKey: 'cabinet',
    heroSubtitle: 'A factory-smooth finish without the cost of new cabinets.',
    metaDescription:
      'Cabinet painting in {city}, {state} by Painter1: Sherwin-Williams cabinet enamel, most kitchens done in 3–5 days, and a 2-year warranty. Free estimate.',
    transformationHeading: 'Real Kitchens, Real Results',
    transformationBody:
      'Cabinet painting is a cost-effective solution to breathe new life into your kitchen or bathroom without the need for a full remodel. This allows you to preserve the original cabinets while updating the appearance to match contemporary trends or your personal style preferences.',
    processIntro: 'Your kitchen deserves more than just a paint job—it deserves a transformation.',
    prepIntro: 'On day one of the project:',
    prepBullets: [
      'All cabinet doors and drawers are carefully removed',
      'We mask and tape off counters, floors, and appliances',
      'Everything is cleaned, degreased, sanded, and primed',
      'We set up a ventilated spray area if needed, and apply protective plastic sheeting to control dust',
    ],
    materialsBody: boldText(
      'We use professional-grade HVLP sprayers (or brushes if preferred) to apply **2 coats of primer** (shellac or water-based, depending on your cabinet material) and **2–3 topcoats of Sherwin-Williams cabinet enamel**.',
    ),
    materialsBlocks: [
      {
        _key: 'color-finish',
        title: 'Color & Finish',
        body: boldText(
          'Choose from **hundreds of Sherwin-Williams shades** and the right finish for durability and looks.',
        ),
      },
      { _key: 'typical-timeline', title: 'Typical Timeline', body: boldText('Your estimate will include **how long your kitchen will be out of service**, usually far shorter than a full cabinet replacement.') },
      {
        _key: 'cost',
        title: 'Cost',
        body: boldText(
          'Cabinet painting typically costs **far less** than complete cabinet replacement. Your free estimate gives you a written price for your kitchen.',
        ),
      },
    ],
    warrantyBannerBody: warranty('cabinet'),
    whatWePaint: items([
      { icon: 'CookingPot', title: 'Kitchen cabinets', description: 'Doors, drawers and frames, finished with Sherwin-Williams cabinet enamel.' },
      { icon: 'Bath', title: 'Bathroom vanities', description: 'Vanity doors, drawers and frames, prepped and finished the same way.' },
      { icon: 'Wrench', title: 'Hardware & upgrades', description: 'New knobs and pulls, set straight and level.' },
    ]),
    faqs: faqs([
      [
        'How much does cabinet painting cost?',
        'Cabinet painting typically costs far less than replacing your cabinets. Your free in-home estimate gives you a written price with a detailed breakdown, with no hidden fees.',
      ],
      ['How long does cabinet painting take?', 'It depends on the size of your kitchen and the work involved. Your estimate will include how long your kitchen will be out of service.'],
      [
        'What do you use on cabinets?',
        "A bonding, stain-blocking primer, then Sherwin-Williams cabinet enamel made for the wear cabinets take. Your estimate will name the exact products and how they're applied.",
      ],
      [
        'Do you take the doors off?',
        'Yes. All cabinet doors and drawers are carefully removed, and counters, floors and appliances are masked and protected. Afterwards the doors and drawers are reinstalled and aligned, and any minor touch-ups are completed.',
      ],
    ]),
  },
]

/**
 * Where each field's text comes from, shown in the dry run only (never written to Sanity).
 * "drafted" = written for this seed and needs client approval before launch.
 */
const SOURCES: Record<string, Record<string, string>> = {
  'service-cabinet-refinishing': {
    heroSubtitle: 'imported services.cabinet.summary (first sentence)',
    metaDescription: 'DRAFTED, needs client approval (facts from the live page)',
    transformationHeading: 'DRAFTED, needs client approval (same pattern as Interior/Exterior)',
    transformationBody: 'live cabinet-painting page intro ("solutions" typo fixed, as in the imported copy)',
    processIntro: 'live page, first sentence of "From Estimate to Final Walkthrough"',
    prepIntro: 'live page, step 3 "Prep & Protection"',
    prepBullets: 'live page, step 3 bullets, verbatim',
    materialsBody: 'adapted from live step 4 "Painting Process"',
    'materialsBlocks.Color & Finish': 'adapted from live step 2 "Color & Finish Selection"',
    'materialsBlocks.Typical Timeline': 'adapted from imported card bullet "Most kitchens done in 3-5 days" + live "weeks to just 3-5 days"',
    'materialsBlocks.Cost': 'live "Why Paint Your Cabinets?" figures',
    warrantyBannerBody: 'same approved wording as Interior/Exterior',
    whatWePaintTitle: 'DRAFTED, needs client approval',
    whatWePaint: 'DRAFTED, needs client approval (each card built from facts on the live page)',
    faqs: 'DRAFTED, needs client approval (answers use only facts from the live page / imported content)',
  },
}

/** Fields removed from the service schema; the seed clears any stored value */
const REMOVED_SERVICE_FIELDS = ['showPageHeader', 'ownerCardVariant']
// The brief names these two explicitly; the run fails if they would not end up on Interior Painting.
const REQUIRED_INTERIOR_REVIEWERS = ['Stasia Porter', 'Jason Tallent']
const MOJIBAKE: [string, string][] = [['â€“', '–']]

// Knoxville project photos from the live-site download (docs/painter1-knoxville, gitignored).
// Only the files listed here can be uploaded; the block-list is a second guard against
// another location's or franchise stock images ever reaching Knoxville.
const PHOTO_DIR = 'docs/painter1-knoxville/images'
const NEVER_UPLOAD = /Inland-Northwest|b-city-g\d+|_print_no_phone|Painter1-Our-Painting-Services-|Painter1-Who-We-Are-Imagery-/i
type Photo = { file: string; filename: string; alt: string }

/** New gallery photos. The fence page's Before-1/After-1 are pixel-identical copies of this deck pair, so it is added once. */
const GALLERY_PHOTOS: (Photo & { _key: string; service: string; projectType: string })[] = [
  {
    _key: 'deck-screen-before',
    file: '2025_09_Deck-Painting-Staining-Before-2.jpg',
    filename: 'Deck-Painting-Staining-Before-2.jpg',
    alt: 'Backyard deck before: weathered bare-wood deck boards and an unfinished natural-wood slatted privacy screen.',
    service: 'service-exterior-painting',
    projectType: 'Deck & Privacy Screen Staining',
  },
  {
    _key: 'deck-screen-after',
    file: '2025_09_Deck-Painting-Staining-After-2.jpg',
    filename: 'Deck-Painting-Staining-After-2.jpg',
    alt: 'The same deck after: boards painted light grey and the slatted privacy screen stained black.',
    service: 'service-exterior-painting',
    projectType: 'Deck & Privacy Screen Staining',
  },
]

// ---------- run ----------

type Ref = { _type: 'reference'; _ref: string; _key: string }
type LocationDoc = {
  _id: string
  _rev: string
  galleryImages?: { _key: string; alt?: string; services?: Ref[]; assetRef?: string }[]
  reviews?: { _key: string; reviewerName?: string; services?: Ref[] }[]
}

const MOJIBAKE_TEST = { test: (v: unknown) => typeof v === 'string' && MOJIBAKE.some(([bad]) => v.includes(bad)), label: 'alt text with mojibake' }
const ref = (id: string): Ref => ({ _type: 'reference', _ref: id, _key: id.replace(/^service-/, '') })
const fixMojibake = (text: string) => MOJIBAKE.reduce((out, [bad, good]) => out.split(bad).join(good), text)

type LocalAsset = Photo & { buffer: Buffer; bytes: number; width: number; height: number; assetId: string }
type SanityAsset = { _id: string; originalFilename?: string; size?: number }
/** What happens to one photo: reuse an asset already in Sanity, or upload the local file */
type AssetPlan = Photo & { assetId: string; bytes?: number; upload?: LocalAsset; note: string }

/** Width and height from a JPEG's start-of-frame marker */
function jpegSize(buf: Buffer) {
  let i = 2
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error('Not a JPEG')
    const marker = buf[i + 1]
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  throw new Error('JPEG size not found')
}

/** Sanity names image assets image-<sha1>-<w>x<h>-<ext>, so the id is known before uploading */
function localAsset(photo: Photo): LocalAsset {
  if (NEVER_UPLOAD.test(photo.file) || NEVER_UPLOAD.test(photo.filename)) throw new Error(`Refusing to upload ${photo.filename}: on the never-upload list`)
  const buffer = readFileSync(`${PHOTO_DIR}/${photo.file}`)
  const { width, height } = jpegSize(buffer)
  const sha1 = createHash('sha1').update(buffer).digest('hex')
  return { ...photo, buffer, bytes: buffer.length, width, height, assetId: `image-${sha1}-${width}x${height}-jpg` }
}

/**
 * Reuse an asset Sanity already has when its originalFilename and byte size match the local file,
 * so re-runs never re-upload. If the local download is missing (another machine), fall back to a
 * filename-only match and say so; with no match at all the photo can't be placed and the run stops.
 */
function planAsset(photo: Photo, existing: SanityAsset[]): AssetPlan {
  if (NEVER_UPLOAD.test(photo.file) || NEVER_UPLOAD.test(photo.filename)) throw new Error(`Refusing to upload ${photo.filename}: on the never-upload list`)
  const path = `${PHOTO_DIR}/${photo.file}`
  const sameName = existing.filter((asset) => asset.originalFilename === photo.filename)
  if (existsSync(path)) {
    const bytes = statSync(path).size
    const match = sameName.find((asset) => asset.size === bytes)
    if (match) return { ...photo, assetId: match._id, bytes, note: 'already in Sanity (same filename + size), skip upload' }
    const upload = localAsset(photo)
    return { ...photo, assetId: upload.assetId, bytes, upload, note: `UPLOAD ${upload.width}x${upload.height}` }
  }
  if (sameName.length === 1) return { ...photo, assetId: sameName[0]._id, note: 'local file missing; reusing the Sanity asset with this filename (size not checked)' }
  throw new Error(`${path} not found and Sanity has ${sameName.length} assets named ${photo.filename}; can't tell which to use`)
}

const imageField = (asset: AssetPlan) => ({ _type: 'image', alt: asset.alt, asset: { _type: 'reference', _ref: asset.assetId } })

/** New gallery photos for one location document */
function planPhotos(doc: LocationDoc, assets: Map<string, AssetPlan>) {
  const set: Record<string, unknown> = {}
  const insert: Record<string, unknown>[] = []
  const lines: string[] = []
  lines.push('  New gallery photos (inserted at the START of galleryImages, in this order):')
  const inGallery = new Set((doc.galleryImages ?? []).map((image) => image.assetRef))
  for (const photo of GALLERY_PHOTOS) {
    const asset = assets.get(photo.file)!
    if (inGallery.has(asset.assetId)) {
      lines.push(`    [${photo._key}] ${asset.filename}: already in the gallery, no change`)
      continue
    }
    insert.push({ ...imageField(asset), _key: photo._key, services: [ref(photo.service)], projectType: photo.projectType })
    lines.push(`    [${photo._key}] + ${asset.filename}\n        services: ${photo.service} | projectType: "${photo.projectType}" | area: (blank)\n        alt: ${asset.alt}`)
  }
  // Resulting Recent Work order for each service touched: the page shows the first 8 tagged photos
  const MAX_SHOWN = 8
  const after = [
    ...insert.map((item) => ({ alt: item.alt as string, services: (item.services as Ref[]).map((r) => r._ref) })),
    ...(doc.galleryImages ?? []).map((image) => ({ alt: image.alt ?? '', services: (image.services ?? []).map((r) => r._ref) })),
  ]
  for (const service of new Set(GALLERY_PHOTOS.map((photo) => photo.service))) {
    const tagged = after.filter((image) => image.services.includes(service))
    lines.push(`  ${service} Recent Work after this (${tagged.length} tagged, first ${MAX_SHOWN} shown):`)
    tagged.forEach((image, i) => lines.push(`    ${String(i + 1).padStart(2)}. ${i < MAX_SHOWN ? 'shown ' : 'hidden'} ${image.alt}`))
  }
  return { set, insert, lines }
}

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

/** set-operations for one location document, plus a printable plan */
function planLocation(doc: LocationDoc) {
  const set: Record<string, unknown> = {}
  const lines: string[] = ['  Gallery alt text:']
  const skipped: string[] = []
  for (const image of doc.galleryImages ?? []) {
    const fixed = image.alt ? fixMojibake(image.alt) : image.alt
    if (image.alt && fixed !== image.alt) {
      set[`galleryImages[_key=="${image._key}"].alt`] = fixed
      lines.push(`    [${image._key}] alt fix: ${JSON.stringify(image.alt)} → ${JSON.stringify(fixed)}`)
    }
  }
  // The brief names these two reviews for Interior Painting (tagged with Services in Studio)
  const interior = 'service-interior-painting'
  const interiorReviewers = new Set((doc.reviews ?? []).filter((r) => r.services?.some((s) => s._ref === interior)).map((r) => r.reviewerName ?? ''))
  const missing = REQUIRED_INTERIOR_REVIEWERS.filter((name) => !interiorReviewers.has(name))
  if (missing.length) skipped.push(`    reviews not tagged Interior Painting (expected by the brief): ${missing.join(', ')}`)
  return { set, lines, skipped }
}

function describeService(doc: (typeof SERVICE_SEED)[number], exists: boolean, brief = false) {
  const text = (blocks: Block[]) => blocks.map((b) => b.children.map((c) => (c.marks.length ? `**${c.text}**` : c.text)).join('')).join(' ')
  const sources = SOURCES[doc._id] ?? {}
  const src = (field: string) => (sources[field] ? `   ⟵ ${sources[field]}` : '')
  const out = [`  ${exists ? 'UPDATE' : 'CREATE'} ${doc._id}  (/[location]/${doc.slug.current})`]
  if (brief) return `${out[0]}  (content unchanged from the previous seed)`
  out.push(`    title: ${doc.title} | shortName: ${doc.shortName} | locationKey: ${doc.locationKey}`)
  out.push(`    heroSubtitle: ${doc.heroSubtitle}${src('heroSubtitle')}`)
  const filled = doc.metaDescription.replaceAll('{city}', 'Knoxville').replaceAll('{state}', 'TN')
  out.push(`    metaDescription (${filled.length} chars for Knoxville): ${doc.metaDescription}${src('metaDescription')}`)
  out.push(`    transformationHeading: ${doc.transformationHeading}${src('transformationHeading')}`)
  out.push(`    transformationBody: ${doc.transformationBody}${src('transformationBody')}`)
  if ('processIntro' in doc) out.push(`    processIntro: ${doc.processIntro}${src('processIntro')}`)
  out.push(`    prepIntro: ${doc.prepIntro}${src('prepIntro')}`)
  doc.prepBullets.forEach((b, i) => out.push(`      • ${b}${i === 0 ? src('prepBullets') : ''}`))
  out.push(`    materialsBody: ${text(doc.materialsBody)}${src('materialsBody')}`)
  doc.materialsBlocks.forEach((b) => out.push(`      ${b.title}: ${text(b.body)}${src(`materialsBlocks.${b.title}`)}`))
  out.push(`    warrantyBannerBody: ${doc.warrantyBannerBody}${src('warrantyBannerBody')}`)
  if ('whatWePaintTitle' in doc) out.push(`    whatWePaintTitle: ${doc.whatWePaintTitle}${src('whatWePaintTitle')}`)
  out.push(`    whatWePaint (${doc.whatWePaint.length}):${src('whatWePaint')}`)
  doc.whatWePaint.forEach((w) => out.push(`      [${w.icon}] ${w.title}: ${w.description}`))
  out.push(`    faqs (${doc.faqs.length}):${src('faqs')}`)
  doc.faqs.forEach((f) => out.push(`      Q: ${f.question}\n      A: ${f.answer}`))
  return out.join('\n')
}

async function main() {
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client: SanityClient = createClient({
    projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'),
    dataset: env('NEXT_PUBLIC_SANITY_DATASET'),
    apiVersion: API_VERSION,
    token,
    useCdn: false,
    perspective: 'raw', // see drafts too, so an unpublished draft can't silently undo the patch
  })

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}", ${token ? 'authenticated' : 'no token: drafts not visible'})\n`)

  const guard = new SafeWrite('seed-services')
  const tx = client.transaction()
  const currentServices = await client.fetch<Record<string, unknown>[]>(`*[_id in $ids]`, { ids: SERVICE_SEED.map((d) => d._id) })
  console.log('SERVICE DOCUMENTS (a new document gets the whole seed; an existing one only its empty fields)')
  for (const { _id, _type, ...fields } of SERVICE_SEED) {
    const current = currentServices.find((d) => d._id === _id)
    if (guard.create(_id, Boolean(current))) {
      console.log(describeService({ _id, _type, ...fields } as (typeof SERVICE_SEED)[number], false) + '\n')
      tx.createIfNotExists({ _id, _type, ...fields } as { _id: string; _type: string })
      continue
    }
    // Removed fields are hidden in Studio and no longer read, so any stored value may go
    const expect = Object.fromEntries(REMOVED_SERVICE_FIELDS.map((field) => [field, { test: () => true, label: 'removed field' }]))
    const { set, unset, any } = guard.plan(_id, current, { set: fields, unset: REMOVED_SERVICE_FIELDS, expect })
    const filled = Object.keys(set)
    console.log(`  ${_id}: ${filled.length ? `fills ${filled.join(', ')}` : 'no empty fields to fill'}${unset.length ? `; removes ${unset.join(', ')}` : ''}`)
    if (any) tx.patch(_id, (p) => p.ifRevisionId(String(current!._rev)).set(set).unset(unset))
  }

  // Photos: everything listed above, uploaded only if Sanity doesn't already have the same filename + size
  const photos = [...GALLERY_PHOTOS]
  const existingAssets = await client.fetch<SanityAsset[]>(
    `*[_type == "sanity.imageAsset" && originalFilename in $names]{_id, originalFilename, size}`,
    { names: photos.map((photo) => photo.filename) },
  )
  const assets = new Map(photos.map((photo) => [photo.file, planAsset(photo, existingAssets)]))
  console.log('\nASSETS')
  for (const asset of assets.values()) {
    console.log(`  ${asset.note}  ${asset.filename}${asset.bytes ? `  ${(asset.bytes / 1024).toFixed(0)} KB` : ''}  → ${asset.assetId}`)
  }
  console.log('')

  const docs = await client.fetch<LocationDoc[]>(
    `*[_type == "location" && slug.current == $slug]{_id, _rev, galleryImages[]{_key, alt, services, "assetRef": asset._ref}, reviews[]{_key, reviewerName, services}}`,
    { slug: LOCATION_SLUG },
  )
  const published = docs.find((d) => !d._id.startsWith('drafts.'))
  if (!published) throw new Error(`Location "${LOCATION_SLUG}" not found`)
  const targets = [published, ...docs.filter((d) => d._id.startsWith('drafts.'))]

  const rawLocations = await client.fetch<Record<string, unknown>[]>(`*[_id in $ids]`, { ids: targets.map((d) => d._id) })

  console.log(`LOCATION "${LOCATION_SLUG}" (only this document${targets.length > 1 ? ' and its draft' : ''} is patched)`)
  for (const doc of targets) {
    const { set, lines, skipped } = planLocation(doc)
    const photoPlan = planPhotos(doc, assets)
    Object.assign(set, photoPlan.set)
    console.log(`  ${doc._id}  (rev ${doc._rev})`)
    console.log(photoPlan.lines.join('\n'))
    console.log(lines.join('\n'))
    console.log('  Not changed:')
    console.log(skipped.join('\n') || '    —')
    // New gallery photos go at the start, so a before/after pair is never split by the 8-photo limit.
    // Adding to a gallery that already has photos counts as changing it (kept unless --force).
    const raw = rawLocations.find((d) => d._id === doc._id)
    if (photoPlan.insert.length) set.galleryImages = [...photoPlan.insert, ...((raw?.galleryImages as unknown[]) ?? [])]
    const expect = Object.fromEntries(Object.keys(set).filter((path) => path.endsWith('.alt')).map((path) => [path, MOJIBAKE_TEST]))
    const allowed = guard.plan(doc._id, raw, { set, expect })
    if (allowed.any) tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(allowed.set))
  }
  guard.report()
  const changes = guard.changes.length

  if (DRY_RUN || !changes) {
    console.log(DRY_RUN ? '\nDry run complete. No changes written.' : '\nNothing to do.')
    return
  }
  await guard.confirm(DRY_RUN)
  // Uploads can't be part of a transaction: upload first (Sanity de-duplicates identical files)
  // and check each lands on the id the patches already reference. Only files a write still uses.
  const written = JSON.stringify(guard.changes.map((c) => c.next))
  for (const asset of assets.values()) {
    if (!asset.upload || !written.includes(asset.assetId)) continue
    const doc = await client.assets.upload('image', asset.upload.buffer, { filename: asset.filename })
    if (doc._id !== asset.assetId) throw new Error(`Uploaded ${asset.filename} as ${doc._id}, expected ${asset.assetId}; nothing else written`)
    console.log(`Uploaded ${asset.filename} → ${doc._id}`)
  }
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`\nCommitted transaction ${result.transactionId} (${result.results.length} mutations).`)
}

// Only when run directly (`node scripts/seed-services.ts`), not when SERVICE_SEED is imported
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
