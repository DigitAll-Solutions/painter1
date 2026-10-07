/**
 * Prepares Knoxville's gallery for the Our Work page:
 * - flags photos that aren't Knoxville jobs with "Hide: not a local project" (notLocalProject)
 * - adds the interior / exterior / cabinet slider pairs and the brick "before" photo (assets already in Sanity)
 * - links before/after pairs (projectId + role), ticks "Commercial project", fills projectType from the
 *   live file names, and sorts the gallery newest first by the live upload month
 *
 *   node --env-file=.env.local scripts/seed-our-work.ts --dry-run   # print every photo, write nothing
 *   node --env-file=.env.local scripts/seed-our-work.ts             # apply (needs SANITY_API_WRITE_TOKEN)
 *
 * Re-running is safe: photos are matched by asset, so nothing is added twice. No files are uploaded.
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

const DRY_RUN = process.argv.includes('--dry-run')
const LOCATION_SLUG = 'knoxville'

type Ref = { _type: 'reference'; _ref: string; _key: string }
type GalleryItem = {
  _key: string
  _type?: string
  alt?: string
  asset?: { _type: 'reference'; _ref: string }
  services?: Ref[]
  serviceType?: string
  projectType?: string
  notLocalProject?: boolean
  commercial?: boolean
  projectId?: string
  role?: 'before' | 'after'
  [field: string]: unknown
}
type SliderImage = { alt?: string; asset?: { _ref: string } }

type Plan = {
  /** originalFilename of the asset */
  file: string
  /** Live upload month from the image URL (/wp-content/uploads/YYYY/MM/), for newest-first order */
  month: string
  hide?: string
  /** Replaces the alt text (D7: no customer names until the client confirms) */
  alt?: string
  projectType?: string
  projectId?: string
  role?: 'before' | 'after'
  commercial?: boolean
  /** Not in the gallery yet: copy the asset and alt from this slider (services.<key>.<before|after>Image, or the homepage pair) */
  addFrom?: { slider: 'interior' | 'exterior' | 'cabinet' | 'home'; side: 'before' | 'after'; service?: 'interior' | 'exterior' | 'cabinet'; key: string }
  note?: string
}

const SERVICE_IDS = { interior: 'service-interior-painting', exterior: 'service-exterior-painting', cabinet: 'service-cabinet-refinishing' }
const ref = (id: string): Ref => ({ _type: 'reference', _ref: id, _key: id.replace(/^service-/, '') })

const GENERIC_COMMERCIAL_ALT = { before: 'Commercial building exterior before painting', after: 'Commercial building exterior after painting' }
const DEC_2023 = 'Dec-2023 generic franchise batch (same baked-in "Before/After" composite style as the Mesa photo), on no other Knoxville page, no Knoxville in the file name'

// Final Studio order = this order (newest live upload month first). D7: no customer names in captions.
const PLAN: Plan[] = [
  // 2025/11
  { file: 'Commercial-Exterior-Painting-Service-Kadunza-Auto-Service-Before-Image-1.jpg', month: '2025-11', projectId: 'commercial-exterior-1', role: 'before', commercial: true, projectType: 'Commercial Exterior Painting', alt: GENERIC_COMMERCIAL_ALT.before },
  { file: 'Commercial-Exterior-Painting-Service-Kadunza-Auto-Service-After-Image-1.jpg', month: '2025-11', projectId: 'commercial-exterior-1', role: 'after', commercial: true, projectType: 'Commercial Exterior Painting', alt: GENERIC_COMMERCIAL_ALT.after },
  { file: 'Commercial-Exterior-Painting-Service-Kadunza-Auto-Service-Before-Image-2.jpg', month: '2025-11', projectId: 'commercial-exterior-2', role: 'before', commercial: true, projectType: 'Commercial Exterior Painting', alt: GENERIC_COMMERCIAL_ALT.before },
  { file: 'Commercial-Exterior-Painting-Service-Kadunza-Auto-Service-After-Image-2.jpg', month: '2025-11', projectId: 'commercial-exterior-2', role: 'after', commercial: true, projectType: 'Commercial Exterior Painting', alt: GENERIC_COMMERCIAL_ALT.after },
  // 2025/09
  { file: 'Deck-Painting-Staining-Before-2.jpg', month: '2025-09', projectId: 'deck-privacy-screen', role: 'before', note: 'projectType already set' },
  { file: 'Deck-Painting-Staining-After-2.jpg', month: '2025-09', projectId: 'deck-privacy-screen', role: 'after', note: 'projectType already set' },
  { file: 'Painter1-of-Knoxville-Our-Recent-Painting-Work-Deck-Painting-Staining.jpg', month: '2025-09', projectType: 'Deck Painting & Staining' },
  { file: 'Painter1-of-Knoxville-Our-Recent-Painting-Work-Cabin-Painting-Staining.jpg', month: '2025-09', projectType: 'Cabin Painting & Staining' },
  { file: 'Exterior-House-Painting-Before-4-1.jpg', month: '2025-09', projectId: 'exterior-house-1', role: 'before', projectType: 'Exterior House Painting', addFrom: { slider: 'exterior', side: 'before', service: 'exterior', key: 'exterior-house-1-before' } },
  { file: 'Exterior-House-Painting-After-4-1.jpg', month: '2025-09', projectId: 'exterior-house-1', role: 'after', projectType: 'Exterior House Painting', addFrom: { slider: 'exterior', side: 'after', service: 'exterior', key: 'exterior-house-1-after' } },
  { file: 'Interior-Painting-Before-2.jpg', month: '2025-09', projectId: 'interior-painting-1', role: 'before', projectType: 'Interior Painting', addFrom: { slider: 'interior', side: 'before', service: 'interior', key: 'interior-painting-1-before' } },
  { file: 'Interior-Painting-After-2.jpg', month: '2025-09', projectId: 'interior-painting-1', role: 'after', projectType: 'Interior Painting', addFrom: { slider: 'interior', side: 'after', service: 'interior', key: 'interior-painting-1-after' } },
  { file: 'Cabinet-Painting-Before-1.jpg', month: '2025-09', projectId: 'cabinet-painting-1', role: 'before', projectType: 'Cabinet Painting', addFrom: { slider: 'cabinet', side: 'before', service: 'cabinet', key: 'cabinet-painting-1-before' } },
  { file: 'Cabinet-Painting-After-1.jpg', month: '2025-09', projectId: 'cabinet-painting-1', role: 'after', projectType: 'Cabinet Painting', addFrom: { slider: 'cabinet', side: 'after', service: 'cabinet', key: 'cabinet-painting-1-after' } },
  // 2025/05
  { file: 'Painter1-of-Knoxville-Brick-Painting-Before-After-Work-Before1.jpg', month: '2025-05', projectId: 'brick-painting', role: 'before', projectType: 'Brick Painting', addFrom: { slider: 'home', side: 'before', service: 'exterior', key: 'brick-painting-before' } },
  { file: 'Painter1-of-Knoxville-Brick-Painting-Before-After-Work-After1.jpg', month: '2025-05', projectId: 'brick-painting', role: 'after', projectType: 'Brick Painting' },
  // 2025/04
  { file: 'Painter1-of-Knoxville-Deck-Staining-Before-After-Photos-C.ALLLENFINAL.jpg', month: '2025-04', projectType: 'Deck Staining', note: 'only 330×330, kept (D8)' },
  // 2023/12: not Knoxville jobs, hidden (reversible in Studio)
  { file: 'Cabinet_Painting-1.webp', month: '2023-12', hide: DEC_2023 },
  { file: 'Cabinets-1.webp', month: '2023-12', hide: DEC_2023 },
  { file: 'Exterior-2-2.webp', month: '2023-12', hide: 'Arizona house: stucco walls, clay tile roof, palm tree and desert landscaping; Dec-2023 generic franchise batch' },
  { file: 'Fireplace-Accent-1.webp', month: '2023-12', hide: DEC_2023 },
  { file: 'Garage-Doors-1.webp', month: '2023-12', hide: 'Arizona-style stucco garage with a desert gravel yard; Dec-2023 generic franchise batch' },
  { file: 'Interior-2-1.webp', month: '2023-12', hide: `${DEC_2023}; wrought-iron security screen door typical of Arizona homes` },
  { file: 'Interior-3-1.webp', month: '2023-12', hide: DEC_2023 },
  { file: 'Mesa-Ext-Before-After-1.webp', month: '2023-12', hide: 'Named "Mesa" (Mesa, AZ): stucco two-storey, clay tile roof, palm trees; Dec-2023 generic franchise batch' },
]

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

const SERVICE_NAMES: Record<string, string> = Object.fromEntries(Object.entries(SERVICE_IDS).map(([key, id]) => [id, key[0].toUpperCase() + key.slice(1)]))

async function main() {
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })

  const doc = await client.fetch<{
    _id: string
    _rev: string
    galleryImages?: GalleryItem[]
    sliders: Record<'interior' | 'exterior' | 'cabinet' | 'home', { before?: SliderImage; after?: SliderImage }>
    files: { _id: string; originalFilename?: string }[]
  } | null>(
    `*[_type == "location" && slug.current == $slug && !(_id in path("drafts.**"))][0]{
      _id, _rev, galleryImages,
      "sliders": {
        "interior": {"before": services.interior.beforeImage, "after": services.interior.afterImage},
        "exterior": {"before": services.exterior.beforeImage, "after": services.exterior.afterImage},
        "cabinet": {"before": services.cabinet.beforeImage, "after": services.cabinet.afterImage},
        "home": {"before": transformationBeforeImage, "after": transformationAfterImage}
      },
      "files": galleryImages[].asset->{_id, originalFilename}
    }`,
    { slug: LOCATION_SLUG },
  )
  if (!doc) throw new Error(`Location "${LOCATION_SLUG}" not found`)
  if (await client.fetch<number>('count(*[_id == $id])', { id: `drafts.${doc._id}` })) throw new Error(`drafts.${doc._id} exists: publish or discard it in Studio first`)

  // asset id → filename for every slider and gallery photo
  const sliderRefs = Object.values(doc.sliders).flatMap((s) => [s.before?.asset?._ref, s.after?.asset?._ref]).filter((id): id is string => !!id)
  const assets = await client.fetch<{ _id: string; originalFilename?: string }[]>(`*[_id in $ids]{_id, originalFilename}`, { ids: [...sliderRefs, ...(doc.files ?? []).map((f) => f?._id).filter(Boolean)] })
  const fileOf = new Map(assets.map((a) => [a._id, a.originalFilename ?? a._id]))

  const gallery = doc.galleryImages ?? []
  const byFile = new Map(gallery.map((item) => [fileOf.get(item.asset?._ref ?? '') ?? '', item]))
  const planned = new Set(PLAN.map((p) => p.file))
  const unplanned = gallery.filter((item) => !planned.has(fileOf.get(item.asset?._ref ?? '') ?? ''))

  const next: GalleryItem[] = []
  const rows: { item: GalleryItem; plan?: Plan; file: string; changes: string[] }[] = []
  // Photos added in Studio that the plan doesn't know about are newer: keep them on top, unchanged
  for (const item of unplanned) {
    next.push(item)
    rows.push({ item, file: fileOf.get(item.asset?._ref ?? '') ?? '?', changes: ['not in the plan, unchanged'] })
  }

  for (const plan of PLAN) {
    let item = byFile.get(plan.file)
    const changes: string[] = []
    if (!item) {
      if (!plan.addFrom) throw new Error(`${plan.file} is not in the gallery and the plan has no source for it`)
      const source = doc.sliders[plan.addFrom.slider][plan.addFrom.side]
      if (!source?.asset?._ref || fileOf.get(source.asset._ref) !== plan.file) throw new Error(`${plan.addFrom.slider} ${plan.addFrom.side} photo is not ${plan.file}`)
      item = {
        _key: plan.addFrom.key,
        _type: 'image',
        alt: source.alt,
        asset: { _type: 'reference', _ref: source.asset._ref },
        services: plan.addFrom.service ? [ref(SERVICE_IDS[plan.addFrom.service])] : [],
      }
      changes.push(`NEW (existing asset from the ${plan.addFrom.slider === 'home' ? 'homepage' : plan.addFrom.slider} before/after slider, no upload)`)
    } else {
      item = { ...item }
    }
    const set = <K extends keyof GalleryItem>(field: K, value: GalleryItem[K], label = String(field)) => {
      if (item[field] === value) return
      item[field] = value
      if (!changes[0]?.startsWith('NEW')) changes.push(`${label} → ${JSON.stringify(value)}`)
    }
    // Write false only to undo a true; an unset checkbox already reads as unticked
    if (plan.hide || item.notLocalProject) set('notLocalProject', !!plan.hide, 'hide')
    if (plan.commercial || item.commercial) set('commercial', !!plan.commercial)
    if (plan.alt) set('alt', plan.alt)
    if (plan.projectType && !item.projectType) set('projectType', plan.projectType)
    if (plan.projectId) {
      set('projectId', plan.projectId)
      set('role', plan.role)
    }
    next.push(item)
    rows.push({ item, plan, file: plan.file, changes })
  }

  const moved = gallery.map((g) => g._key).join() !== next.map((g) => g._key).join()

  // ---------- report ----------
  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}", ${doc._id})`)
  console.log(`\nGallery after the change, in Studio order (newest first by live upload month). ${gallery.length} → ${next.length} photos.\n`)
  rows.forEach(({ item, plan, file, changes }, i) => {
    const services = (item.services ?? []).map((s) => SERVICE_NAMES[s._ref] ?? s._ref).join(', ') || '—'
    const pair = item.projectId ? `${item.projectId} (${item.role})` : 'single'
    const projectTypeSource = plan?.projectType && changes.some((c) => c.startsWith('projectType') || c.startsWith('NEW')) ? '  [from live file name, needs client confirmation]' : ''
    console.log(`${String(i + 1).padStart(2)}. ${file}  (live upload ${plan?.month ?? '?'})`)
    console.log(`    ${item.notLocalProject ? `HIDDEN: not a local project — ${plan?.hide}` : 'shown'}`)
    console.log(`    alt: ${item.alt ?? '—'}`)
    console.log(`    service: ${services}${item.commercial ? ' · Commercial project' : ''} · projectType: ${item.projectType ?? '—'}${projectTypeSource} · pair: ${pair}`)
    console.log(`    changes: ${changes.length ? changes.join('; ') : 'none'}${plan?.note ? `  (${plan.note})` : ''}`)
  })
  console.log(`\nOrder: ${moved ? 'changes (sorted by live upload month)' : 'unchanged'}`)

  // What the site will show
  const shown = next.filter((g) => !g.notLocalProject)
  const pairs = new Map<string, GalleryItem[]>()
  for (const g of shown) if (g.projectId) pairs.set(g.projectId, [...(pairs.get(g.projectId) ?? []), g])
  const cardKeys = new Set<string>()
  const cards: { key: string; photos: GalleryItem[] }[] = []
  for (const g of shown) {
    const group = g.projectId ? pairs.get(g.projectId)! : []
    const isPair = group.length === 2 && group.some((x) => x.role === 'before') && group.some((x) => x.role === 'after')
    const key = isPair ? `pair:${g.projectId}` : g._key
    if (cardKeys.has(key)) continue
    cardKeys.add(key)
    cards.push({ key, photos: isPair ? group : [g] })
  }
  const filterOf = (photos: GalleryItem[]) => new Set(photos.flatMap((p) => [...(p.services ?? []).map((s) => SERVICE_NAMES[s._ref]?.toLowerCase()), ...(p.commercial ? ['commercial'] : [])]).filter(Boolean))
  console.log(`\nOur Work: ${shown.length} photos shown in ${cards.length} cards (${cards.filter((c) => c.photos.length === 2).length} before/after sliders), ${next.length - shown.length} hidden`)
  for (const f of ['interior', 'exterior', 'cabinet', 'commercial']) {
    const n = cards.filter((c) => filterOf(c.photos).has(f))
    console.log(`  ${f.padEnd(10)} ${n.length} cards: ${n.map((c) => fileOf.get(c.photos.at(-1)!.asset!._ref)?.replace(/\.(jpg|webp)$/, '')).join(', ') || '—'}`)
  }
  console.log('\nService-page Recent Work (shown from 3 photos; photos already in that page\'s before/after slider are skipped):')
  for (const [key, id] of Object.entries(SERVICE_IDS)) {
    const slider = new Set([doc.sliders[key as 'interior'].before?.asset?._ref, doc.sliders[key as 'interior'].after?.asset?._ref])
    const list = shown.filter((g) => g.services?.some((s) => s._ref === id) && !slider.has(g.asset?._ref))
    console.log(`  ${key.padEnd(9)} ${list.length} photos${list.length < 3 ? ' → section hidden' : ''}`)
  }
  const homeSlider = new Set([doc.sliders.home.before?.asset?._ref, doc.sliders.home.after?.asset?._ref])
  const home = shown.filter((g) => g.role !== 'before' && !homeSlider.has(g.asset?._ref)).slice(0, 6)
  console.log(`\nHomepage "Our Work" grid (first 6, no "before" photos, not the homepage slider's brick pair):\n  ${home.map((g) => fileOf.get(g.asset!._ref)).join('\n  ')}`)

  if (DRY_RUN) {
    console.log('\nDry run complete. No changes written.')
    return
  }
  const result = await client.patch(doc._id).ifRevisionId(doc._rev).set({ galleryImages: next }).commit({ visibility: 'sync' })
  console.log(`\nCommitted ${result._id} rev ${result._rev}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
