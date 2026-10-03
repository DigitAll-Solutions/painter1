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
    showPageHeader: true,
    ownerCardVariant: 'compact',
    metaDescription:
      'Interior painting in {city}, {state} by Painter1: walls, ceilings, trim, and doors with full furniture and floor protection and Sherwin-Williams paint. Free on-site estimate.',
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
    showPageHeader: true,
    ownerCardVariant: 'featured',
    metaDescription:
      'Exterior painting in {city}, {state} by Painter1: siding, brick, stucco, trim, decks, and fences, with full prep and Sherwin-Williams exterior paint. Free on-site estimate.',
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
      { icon: 'House', title: 'Siding', description: 'Our most common exterior job — full-surface prep and coating.' },
      { icon: 'BrickWall', title: 'Brick', description: 'Painted brick and masonry, cleaned and primed for a lasting bond.' },
      { icon: 'Layers', title: 'Stucco', description: 'Specialized coating for stucco exteriors.' },
      { icon: 'DoorClosed', title: 'Trim & Doors', description: 'Eaves, fascia, trim detail, and exterior doors and frames.' },
      { icon: 'Rows3', title: 'Decks', description: 'Deck boards and railings, cleaned and coated for the outdoors.' },
      { icon: 'Fence', title: 'Fences', description: 'Wood fences, prepped and coated to hold up season after season.' },
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
const TAG_TO_SERVICE: Record<string, string> = { interior: 'service-interior-painting', exterior: 'service-exterior-painting' }
// The brief names these two explicitly; the run fails if they would not end up on Interior Painting.
const REQUIRED_INTERIOR_REVIEWERS = ['Stasia Porter', 'Jason Tallent']
const MOJIBAKE: [string, string][] = [['â€“', '–']]

// ---------- run ----------

type Ref = { _type: 'reference'; _ref: string; _key: string }
type LocationDoc = {
  _id: string
  _rev: string
  galleryImages?: { _key: string; alt?: string; serviceType?: string; services?: Ref[] }[]
  reviews?: { _key: string; reviewerName?: string; serviceTag?: string; services?: Ref[] }[]
}

const ref = (id: string): Ref => ({ _type: 'reference', _ref: id, _key: id.replace(/^service-/, '') })
const fixMojibake = (text: string) => MOJIBAKE.reduce((out, [bad, good]) => out.split(bad).join(good), text)

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
  out.push(`    title: ${doc.title} | shortName: ${doc.shortName} | locationKey: ${doc.locationKey} | ownerCard: ${doc.ownerCardVariant} | showPageHeader: ${doc.showPageHeader}`)
  out.push(`    metaDescription (written for this seed, not in the brief): ${doc.metaDescription}`)
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

  const docs = await client.fetch<LocationDoc[]>(
    `*[_type == "location" && slug.current == $slug]{_id, _rev, galleryImages[]{_key, alt, serviceType, services}, reviews[]{_key, reviewerName, serviceTag, services}}`,
    { slug: LOCATION_SLUG },
  )
  const published = docs.find((d) => !d._id.startsWith('drafts.'))
  if (!published) throw new Error(`Location "${LOCATION_SLUG}" not found`)
  const targets = [published, ...docs.filter((d) => d._id.startsWith('drafts.'))]

  const tx = client.transaction()
  for (const { _id, _type, ...fields } of SERVICE_SEED) {
    tx.createIfNotExists({ _id, _type, title: fields.title })
    tx.patch(_id, (p) => p.set(fields))
  }

  console.log(`LOCATION "${LOCATION_SLUG}" (only this document${targets.length > 1 ? ' and its draft' : ''} is patched)`)
  let changes = 0
  for (const doc of targets) {
    const { set, lines, skipped } = planLocation(doc)
    changes += Object.keys(set).length
    console.log(`  ${doc._id}  (rev ${doc._rev})`)
    console.log(lines.join('\n'))
    console.log('  Not changed:')
    console.log(skipped.join('\n') || '    —')
    if (Object.keys(set).length) tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set))
  }
  console.log(`\n  ${changes} field change(s) on the location${targets.length > 1 ? ' + draft' : ''}; ${SERVICE_SEED.length} service doc(s) created or updated.`)

  if (DRY_RUN) {
    console.log('\nDry run complete. No changes written.')
    return
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
