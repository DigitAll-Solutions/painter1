/**
 * Seeds the Interior Painting and Exterior Painting service documents and tags Knoxville's
 * existing gallery photos and reviews with them.
 *
 *   node --env-file=.env.local scripts/seed-services.ts --dry-run   # print every change, write nothing
 *   node --env-file=.env.local scripts/seed-services.ts             # apply (needs SANITY_API_WRITE_TOKEN)
 *
 * Re-running is safe: service docs are created if missing, then only the fields below are set;
 * Knoxville patches only add missing service references and fix mojibake in alt text.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { createClient, type SanityClient } from '@sanity/client'

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
  `Every ${kind} job gets the same written warranty: if paint we applied peels, blisters, or flakes within two years, we'll come back and fix it, labor and materials included.`

export const SERVICE_SEED = [
  {
    _id: 'service-interior-painting',
    _type: 'service',
    title: 'Interior Painting',
    slug: { _type: 'slug', current: 'interior-painting' },
    shortName: 'Interior',
    locationKey: 'interior',
    heroSubtitle: 'Clean lines, protected floors and furniture, and a finish that lasts.',
    ownerCardVariant: 'compact',
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
      ['How long does interior paint smell last?', 'Sherwin-Williams low-VOC lines we use typically clear within a day or two with normal ventilation.'],
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
    ownerCardVariant: 'featured',
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
      { _key: 'typical-timeline', title: 'Typical Timeline', body: boldText('Most exterior projects take **3–4 days** from start to finish, weather permitting.') },
      {
        _key: 'weather-window',
        title: 'Weather Window',
        body: boldText(
          "We paint in temperatures from **35°F to 95°F** — Sherwin-Williams' exterior lines are formulated to cure properly across that range, so we're not limited to just the peak summer months.",
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
        "We paint in temperatures ranging from 35°F to 95°F, using Sherwin-Williams exterior lines formulated to cure properly across that range — so we're not limited to just summer.",
      ],
      ['How long does an exterior repaint take?', 'Most exterior projects take 3–4 days from start to finish, depending on the size of the home and weather conditions.'],
      [
        'How long will the paint job last?',
        "Proper prep — pressure washing, scraping, and caulking — combined with quality Sherwin-Williams paint is what makes an exterior finish hold up against {city}'s weather swings over time.",
      ],
    ]),
  },
]

// Legacy string tags → service document ids. Cabinet/commercial/general have no service doc yet.
/** Fields removed from the service schema; the seed clears any stored value */
const REMOVED_SERVICE_FIELDS = ['showPageHeader']

const TAG_TO_SERVICE: Record<string, string> = { interior: 'service-interior-painting', exterior: 'service-exterior-painting' }
// The brief names these two explicitly; the run fails if they would not end up on Interior Painting.
const REQUIRED_INTERIOR_REVIEWERS = ['Stasia Porter', 'Jason Tallent']
const MOJIBAKE: [string, string][] = [['â€“', '–']]

// Knoxville project photos from the live-site download (docs/painter1-knoxville, gitignored).
// Only the files listed here can be uploaded; the block-list is a second guard against
// another location's or franchise stock images ever reaching Knoxville.
const PHOTO_DIR = 'docs/painter1-knoxville/images'
const NEVER_UPLOAD = /Inland-Northwest|b-city-g\d+|_print_no_phone|Painter1-Our-Painting-Services-|Painter1-Who-We-Are-Imagery-/i
type Photo = { file: string; filename: string; alt: string }

/** Interior before/after slider (services.interior), not added to the gallery */
const INTERIOR_PAIR: { before: Photo; after: Photo } = {
  before: {
    file: '2025_09_Interior-Painting-Before-2.jpg',
    filename: 'Interior-Painting-Before-2.jpg',
    alt: 'Living room before painting: white board-and-batten accent wall behind a grey sectional sofa, with spots marked for patching.',
  },
  after: {
    file: '2025_09_Interior-Painting-After-2.jpg',
    filename: 'Interior-Painting-After-2.jpg',
    alt: 'The same living room after painting: board-and-batten accent wall in dark charcoal, with blue-grey walls around it.',
  },
}

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
  galleryImages?: { _key: string; alt?: string; serviceType?: string; services?: Ref[]; assetRef?: string }[]
  interiorBefore?: string
  interiorAfter?: string
  reviews?: { _key: string; reviewerName?: string; serviceTag?: string; services?: Ref[] }[]
}

const ref = (id: string): Ref => ({ _type: 'reference', _ref: id, _key: id.replace(/^service-/, '') })
const fixMojibake = (text: string) => MOJIBAKE.reduce((out, [bad, good]) => out.split(bad).join(good), text)

type LocalAsset = Photo & { buffer: Buffer; bytes: number; width: number; height: number; assetId: string }

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

const imageField = (asset: LocalAsset) => ({ _type: 'image', alt: asset.alt, asset: { _type: 'reference', _ref: asset.assetId } })

/** Interior slider + new gallery photos for one location document */
function planPhotos(doc: LocationDoc, assets: Map<string, LocalAsset>) {
  const set: Record<string, unknown> = {}
  const insert: Record<string, unknown>[] = []
  const lines: string[] = ['  Interior before/after slider (services.interior):']
  for (const side of ['before', 'after'] as const) {
    const asset = assets.get(INTERIOR_PAIR[side].file)!
    const current = side === 'before' ? doc.interiorBefore : doc.interiorAfter
    if (current === asset.assetId) {
      lines.push(`    ${side}Image: already ${asset.filename}, no change`)
    } else {
      set[`services.interior.${side}Image`] = imageField(asset)
      lines.push(`    ${side}Image: ${current ?? '(empty)'} → ${asset.filename}\n        alt: ${asset.alt}`)
    }
  }
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
  const lines: string[] = []
  const skipped: string[] = []

  lines.push('  Gallery images:')
  for (const image of doc.galleryImages ?? []) {
    const target = image.serviceType ? TAG_TO_SERVICE[image.serviceType] : undefined
    const existing = image.services ?? []
    const label = `    [${image._key}] ${JSON.stringify(image.alt ?? '')}`
    if (target && !existing.some((r) => r._ref === target)) {
      set[`galleryImages[_key=="${image._key}"].services`] = [...existing, ref(target)]
      lines.push(`${label}\n        serviceType "${image.serviceType}" → services += ${target}`)
    } else if (target) {
      lines.push(`${label}\n        already tagged ${target}, no change`)
    } else {
      skipped.push(`    gallery [${image._key}] ${JSON.stringify(image.alt ?? '')}: serviceType "${image.serviceType ?? '—'}" has no service doc, left untagged`)
    }
    const fixed = image.alt ? fixMojibake(image.alt) : image.alt
    if (image.alt && fixed !== image.alt) {
      set[`galleryImages[_key=="${image._key}"].alt`] = fixed
      lines.push(`        alt fix: ${JSON.stringify(image.alt)} → ${JSON.stringify(fixed)}`)
    }
  }

  lines.push('  Reviews:')
  const interiorReviewers = new Set<string>()
  for (const review of doc.reviews ?? []) {
    const target = review.serviceTag ? TAG_TO_SERVICE[review.serviceTag] : undefined
    const existing = review.services ?? []
    const label = `    [${review._key}] ${review.reviewerName}`
    if (target && !existing.some((r) => r._ref === target)) {
      set[`reviews[_key=="${review._key}"].services`] = [...existing, ref(target)]
      lines.push(`${label}: serviceTag "${review.serviceTag}" → services += ${target}`)
    } else if (target) {
      lines.push(`${label}: already tagged ${target}, no change`)
    } else {
      skipped.push(`    review [${review._key}] ${review.reviewerName}: serviceTag "${review.serviceTag ?? '—'}", left untagged`)
    }
    if (target === TAG_TO_SERVICE.interior || existing.some((r) => r._ref === TAG_TO_SERVICE.interior)) interiorReviewers.add(review.reviewerName ?? '')
  }

  const missing = REQUIRED_INTERIOR_REVIEWERS.filter((name) => !interiorReviewers.has(name))
  if (missing.length) throw new Error(`Expected these reviews to be tagged Interior Painting but they are not: ${missing.join(', ')}`)

  return { set, lines, skipped }
}

function describeService(doc: (typeof SERVICE_SEED)[number], exists: boolean) {
  const text = (blocks: Block[]) => blocks.map((b) => b.children.map((c) => (c.marks.length ? `**${c.text}**` : c.text)).join('')).join(' ')
  const out = [`  ${exists ? 'UPDATE' : 'CREATE'} ${doc._id}  (/[location]/${doc.slug.current})`]
  out.push(`    title: ${doc.title} | shortName: ${doc.shortName} | locationKey: ${doc.locationKey} | ownerCard: ${doc.ownerCardVariant}`)
  out.push(`    heroSubtitle: ${doc.heroSubtitle}`)
  out.push(`    metaDescription: ${doc.metaDescription}`)
  out.push(`    transformationHeading: ${doc.transformationHeading}`)
  out.push(`    transformationBody: ${doc.transformationBody}`)
  if ('processIntro' in doc) out.push(`    processIntro: ${doc.processIntro}`)
  out.push(`    prepIntro: ${doc.prepIntro}`)
  doc.prepBullets.forEach((b) => out.push(`      • ${b}`))
  out.push(`    materialsBody: ${text(doc.materialsBody)}`)
  doc.materialsBlocks.forEach((b) => out.push(`      ${b.title}: ${text(b.body)}`))
  out.push(`    warrantyBannerBody: ${doc.warrantyBannerBody}`)
  out.push(`    whatWePaint (${doc.whatWePaint.length}):`)
  doc.whatWePaint.forEach((w) => out.push(`      [${w.icon}] ${w.title}: ${w.description}`))
  out.push(`    faqs (${doc.faqs.length}):`)
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

  const existingIds = new Set(await client.fetch<string[]>(`*[_id in $ids]._id`, { ids: SERVICE_SEED.map((d) => d._id) }))
  console.log('SERVICE DOCUMENTS')
  for (const doc of SERVICE_SEED) console.log(describeService(doc, existingIds.has(doc._id)) + '\n')

  // "What We Paint" card text: what changes compared with Sanity now
  const currentCards = await client.fetch<{ _id: string; whatWePaint?: { title: string; description?: string }[] }[]>(
    `*[_id in $ids]{_id, whatWePaint[]{title, description}}`,
    { ids: SERVICE_SEED.map((d) => d._id) },
  )
  console.log('CARD CHANGES')
  let cardChanges = 0
  for (const doc of SERVICE_SEED) {
    const current = new Map((currentCards.find((c) => c._id === doc._id)?.whatWePaint ?? []).map((card) => [card.title, card.description]))
    for (const card of doc.whatWePaint) {
      if (current.get(card.title) === card.description) continue
      cardChanges++
      console.log(`  ${doc.title} / ${card.title}:\n    before: ${current.get(card.title) ?? '(none)'}\n    after:  ${card.description}`)
    }
  }
  if (!cardChanges) console.log('  —')

  const currentHero = await client.fetch<{ _id: string; heroSubtitle?: string; showPageHeader?: boolean }[]>(
    `*[_id in $ids]{_id, heroSubtitle, showPageHeader}`,
    { ids: SERVICE_SEED.map((d) => d._id) },
  )
  console.log('\nHERO SUBTITLE / REMOVED FIELDS')
  for (const doc of SERVICE_SEED) {
    const current = currentHero.find((c) => c._id === doc._id)
    if (current?.heroSubtitle !== doc.heroSubtitle) console.log(`  ${doc.title} heroSubtitle:\n    before: ${current?.heroSubtitle ?? '(none)'}\n    after:  ${doc.heroSubtitle}`)
    for (const field of REMOVED_SERVICE_FIELDS) {
      const value = current?.[field as keyof typeof current]
      if (value !== undefined) console.log(`  ${doc.title} ${field}: ${JSON.stringify(value)} → (unset)`)
    }
  }

  // Photos: everything listed above, uploaded only if Sanity doesn't already have the exact file
  const photos = [INTERIOR_PAIR.before, INTERIOR_PAIR.after, ...GALLERY_PHOTOS]
  const assets = new Map(photos.map((photo) => [photo.file, localAsset(photo)]))
  const uploaded = new Set(await client.fetch<string[]>(`*[_id in $ids]._id`, { ids: [...assets.values()].map((a) => a.assetId) }))
  console.log('\nASSETS')
  for (const asset of assets.values()) {
    console.log(`  ${uploaded.has(asset.assetId) ? 'already in Sanity' : 'UPLOAD'}  ${asset.filename}  ${asset.width}x${asset.height}  ${(asset.bytes / 1024).toFixed(0)} KB  → ${asset.assetId}`)
  }
  console.log('')

  const docs = await client.fetch<LocationDoc[]>(
    `*[_type == "location" && slug.current == $slug]{_id, _rev, "interiorBefore": services.interior.beforeImage.asset._ref, "interiorAfter": services.interior.afterImage.asset._ref, galleryImages[]{_key, alt, serviceType, services, "assetRef": asset._ref}, reviews[]{_key, reviewerName, serviceTag, services}}`,
    { slug: LOCATION_SLUG },
  )
  const published = docs.find((d) => !d._id.startsWith('drafts.'))
  if (!published) throw new Error(`Location "${LOCATION_SLUG}" not found`)
  const targets = [published, ...docs.filter((d) => d._id.startsWith('drafts.'))]

  const tx = client.transaction()
  for (const { _id, _type, ...fields } of SERVICE_SEED) {
    tx.createIfNotExists({ _id, _type, title: fields.title })
    tx.patch(_id, (p) => p.set(fields).unset(REMOVED_SERVICE_FIELDS))
  }

  console.log(`LOCATION "${LOCATION_SLUG}" (only this document${targets.length > 1 ? ' and its draft' : ''} is patched)`)
  let changes = 0
  for (const doc of targets) {
    const { set, lines, skipped } = planLocation(doc)
    const photoPlan = planPhotos(doc, assets)
    Object.assign(set, photoPlan.set)
    changes += Object.keys(set).length + photoPlan.insert.length
    console.log(`  ${doc._id}  (rev ${doc._rev})`)
    console.log(photoPlan.lines.join('\n'))
    console.log(lines.join('\n'))
    console.log('  Not changed:')
    console.log(skipped.join('\n') || '    —')
    if (Object.keys(set).length || photoPlan.insert.length) {
      tx.patch(doc._id, (p) => {
        let patch = p.ifRevisionId(doc._rev)
        if (Object.keys(set).length) patch = patch.set(set)
        // At the start, so a before/after pair is never split by the 8-photo limit
        if (photoPlan.insert.length) {
          patch = doc.galleryImages?.length
            ? patch.insert('before', 'galleryImages[0]', photoPlan.insert)
            : patch.set({ galleryImages: photoPlan.insert })
        }
        return patch
      })
    }
  }
  console.log(`\n  ${changes} field change(s) on the location${targets.length > 1 ? ' + draft' : ''}; ${SERVICE_SEED.length} service doc(s) created or updated.`)

  if (DRY_RUN) {
    console.log('\nDry run complete. No changes written.')
    return
  }
  // Uploads can't be part of a transaction: upload first (Sanity de-duplicates identical files)
  // and check each lands on the id the patches already reference.
  for (const asset of assets.values()) {
    if (uploaded.has(asset.assetId)) continue
    const doc = await client.assets.upload('image', asset.buffer, { filename: asset.filename })
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
