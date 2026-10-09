/**
 * Oct 9 feedback data changes.
 *
 * Default (additive: the deployed site doesn't read these fields): every service's surfaces get a link
 * name (slug) and section text (body), and Knoxville gets its own What We Paint photos (Siding from its
 * old section; Brick, Decks and Fences from the live site's pages), in Knoxville's location document,
 * keyed to the surface's _key. Photos are per location: nothing is written to the shared service photo.
 * Only empty fields are filled.
 *   node --env-file=.env.local scripts/seed-oct9.ts --dry-run
 *   node --env-file=.env.local scripts/seed-oct9.ts
 *
 * Post-merge, in this order (each changes what production shows today, so never before):
 *   --cabinet-slug          service "Cabinet" slug cabinet-refinishing → cabinet-painting
 *   --remove-shared-photos  remove the old shared surface photo (Siding) from the service documents
 *   --remove-subservices    remove locations' old service sub-sections once each surface has its own text
 *                           and this location's photo
 *   (each with --dry-run first)
 *
 * Re-running is a no-op.
 */
import { createReadStream, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { surfaceSlug } from '../lib/paint-surfaces.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const CABINET_SLUG = process.argv.includes('--cabinet-slug')
const REMOVE_SHARED_PHOTOS = process.argv.includes('--remove-shared-photos')
const REMOVE_SUBSERVICES = process.argv.includes('--remove-subservices')
const ADDITIVE = !CABINET_SLUG && !REMOVE_SHARED_PHOTOS && !REMOVE_SUBSERVICES

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

// ---------- Portable Text from short strings: blank line = new paragraph, "- " = bullet, **bold** ----------
let keyCount = 0
const nextKey = () => `oct9${String(++keyCount).padStart(3, '0')}`
const spans = (text: string) =>
  text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => ({ _type: 'span', _key: nextKey(), text: part, marks: i % 2 ? ['strong'] : [] }))
    .filter((span) => span.text)
const blocks = (text: string) =>
  text.split('\n').filter((line) => line.trim()).map((line) => {
    const bullet = line.startsWith('- ')
    return { _type: 'block', _key: nextKey(), style: 'normal', markDefs: [], children: spans(bullet ? line.slice(2) : line), ...(bullet ? { listItem: 'bullet', level: 1 } : {}) }
  })
const plain = (value: unknown) => ((value as { children?: { text?: string }[] }[] | undefined) ?? []).map((b) => (b.children ?? []).map((c) => c.text).join('')).join(' / ')

// ---------- Section text per surface (link name → copy, source) ----------
const placeholder = (thing: string) => `We'll walk through the prep, products and colors for your ${thing} during your free estimate.`
type Copy = { text: string; source: string }
const COPY: Record<string, Record<string, Copy>> = {
  exterior: {
    // Knoxville's old "Home Siding Painting" / "Stucco Painting" sections (same words as the live pages)
    siding: { text: "Revitalize the exterior of your home with Painter1's specialized home siding services from old wood slats to vinyl or aluminum siding. Choose Painter1 for your home siding painting and enjoy a seamless, stress-free experience from start to finish.", source: 'Knoxville section "Home Siding Painting" (= live home-siding-painting)' },
    brick: {
      text: [
        '- **Offers variety:** Painting your brick home allows you to show off more of your personality as you can choose from a large variety of colors and different finishes.',
        '- **Boosts curb appeal:** The variety of color options also allow you to improve the aesthetic pleasure of your home, increasing both its curb appeal and its value.',
        '- **Provides a layer of protection:** Paint provides a brick home with a layer of protection as it seals and smooths the porous surface of a normal, raw brick exterior.',
        "- **Low-maintenance:** The sealing and smoothing effect of painting brick also leads to a low-maintenance surface as it doesn't collect as much dirt and is easy to clean.",
      ].join('\n'),
      source: 'live brick-painting ("Why Paint Your Brick Home?")',
    },
    stucco: { text: 'At Painter1, we understand the unique challenges and requirements of painting stucco surfaces. Our team of experts uses high-quality paints and materials designed specifically for stucco, ensuring a durable, long-lasting finish that resists fading, cracking, and peeling.', source: 'Knoxville section "Stucco Painting" (= live stucco-painting)' },
    'trim-doors': { text: placeholder('exterior trim and doors'), source: 'PLACEHOLDER (no copy on the live site)' },
    decks: { text: 'Elevate your outdoor living with our professional deck painting and staining services, and let your deck become a stunning masterpiece that stands the test of time. Our dedicated team specializes in enhancing the aesthetic appeal of your outdoor retreat while providing long-lasting protection against the elements.', source: 'live deck-painting-and-staining' },
    fences: { text: "At Painter1, we understand that your fence is more than just a boundary; it's an integral part of your outdoor space. We specialize in a variety of fence painting and staining techniques, ensuring that your fence becomes a standout feature that complements the overall aesthetics of your property.", source: 'live fence-painting-and-staining' },
  },
  interior: {
    walls: { text: placeholder('walls'), source: 'PLACEHOLDER (live interior page has no per-surface copy)' },
    ceilings: { text: placeholder('ceilings'), source: 'PLACEHOLDER' },
    trim: { text: placeholder('trim'), source: 'PLACEHOLDER' },
    doors: { text: placeholder('doors'), source: 'PLACEHOLDER' },
  },
  cabinet: {
    'kitchen-cabinets': { text: placeholder('kitchen cabinets'), source: 'PLACEHOLDER (the live intro is already the page’s transformation text)' },
    'bathroom-vanities': { text: placeholder('bathroom vanities'), source: 'PLACEHOLDER' },
    'hardware-upgrades': { text: 'Once your doors and drawers are reinstalled and aligned, hardware is reattached or upgraded. Optional upgrades include soft-close hardware and glass door inserts.', source: 'live cabinet-painting process list ("Hardware is reattached or upgraded", "Optional upgrades like soft-close hardware or glass door inserts")' },
  },
}

// Knoxville's own job photos for its exterior surfaces (by the surface's link name; stored by its _key).
// Brick and Decks are already in Sanity; the Fences photo is uploaded from the saved live site
// (docs/painter1-knoxville, gitignored). Decks and Fences show the same job (deck + privacy screen),
// as on the live site's two pages.
type KnoxPhoto = { slug: string; source: string; alt: string; asset?: string; file?: string; fromOldSection?: boolean }
const KNOXVILLE_PHOTOS: KnoxPhoto[] = [
  { slug: 'siding', source: 'Knoxville old section "Home Siding Painting" (Siding-Painting-After-1)', alt: '', fromOldSection: true },
  { slug: 'brick', source: 'live brick-painting (Painter1-of-Knoxville-Brick-Painting-Before-After-Work-After1)', asset: 'image-7d5c193a7f135ef84eab1c4d5e2cd996e78b5ff0-1000x750-jpg', alt: 'Two-story brick house painted white, with black shutters, window frames, trim and front door.' },
  { slug: 'decks', source: 'live deck-painting-and-staining (Deck-Painting-Staining-After-2)', asset: 'image-7cbe13edfbada8c4f29c08bc57c5d6346afed4bb-800x600-jpg', alt: 'Backyard deck with boards painted light grey, outdoor seating and a black-stained slatted privacy screen.' },
  { slug: 'fences', source: 'live fence-painting-and-staining (Fence-Painting-Staining-After-1)', file: 'docs/painter1-knoxville/images/2025_09_Fence-Painting-Staining-After-1.jpg', alt: 'Horizontal-slat privacy fence stained black, enclosing a deck painted light grey.' },
]

type Img = { _type?: string; asset?: { _ref?: string }; alt?: string; hotspot?: unknown; crop?: unknown }
type Item = { _key: string; title?: string; slug?: { current?: string }; body?: unknown[]; image?: Img }
type ServiceDoc = { _id: string; _rev: string; title: string; slug?: string; locationKey: string; whatWePaint?: Item[] }
type Sub = { _key: string; title: string; anchor?: string; description?: string; image?: Img }
type SurfacePhoto = { _key: string; surface?: string; image?: Img }
type LocationDoc = { _id: string; _rev: string; slug?: string; services?: Record<string, { subServices?: Sub[]; surfacePhotos?: SurfacePhoto[] } | undefined> }

async function main() {
  const token = env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  const { services, locations, drafts } = await client.fetch<{ services: ServiceDoc[]; locations: LocationDoc[]; drafts: string[] }>(`{
    "services": *[_type == "service" && !(_id in path("drafts.**"))] | order(locationKey){_id, _rev, title, "slug": slug.current, locationKey, whatWePaint},
    "locations": *[_type == "location" && !(_id in path("drafts.**"))]{_id, _rev, "slug": slug.current, services},
    "drafts": *[_type in ["service", "location"] && _id in path("drafts.**")]._id
  }`)
  if (drafts.length) throw new Error(`Unpublished drafts exist (${drafts.join(', ')}): publish or discard them in Studio first`)

  const tx = client.transaction()
  let changes = 0
  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")`)
  console.log(`Mode: ${ADDITIVE ? 'surfaces + Knoxville photos (additive)' : [CABINET_SLUG && 'cabinet slug (post-merge)', REMOVE_SHARED_PHOTOS && 'remove shared surface photos (post-merge)', REMOVE_SUBSERVICES && 'remove old sub-sections (post-merge)'].filter(Boolean).join(' + ')}\n`)

  if (ADDITIVE) {
    for (const service of services) {
      const copy = COPY[service.locationKey] ?? {}
      const set: Record<string, unknown> = {}
      console.log(`SERVICE ${service._id} (${service.title}, rev ${service._rev})`)
      for (const item of service.whatWePaint ?? []) {
        const slug = item.slug?.current || surfaceSlug(item.title ?? '')
        const path = `whatWePaint[_key=="${item._key}"]`
        const lines: string[] = []
        if (!item.slug?.current) {
          set[`${path}.slug`] = { _type: 'slug', current: slug }
          lines.push(`link name → #${slug}`)
        }
        const entry = copy[slug]
        if (item.body?.length) lines.push(`section text kept: "${plain(item.body).slice(0, 60)}…"`)
        else if (entry) {
          set[`${path}.body`] = blocks(entry.text)
          lines.push(`section text ← ${entry.source}\n        "${entry.text.replace(/\n/g, ' / ')}"`)
        } else lines.push('section text: none found (card text shows)')
        console.log(`  ${item.title} (#${slug})\n    - ${lines.join('\n    - ')}`)
      }
      if (Object.keys(set).length) {
        changes++
        tx.patch(service._id, (p) => p.ifRevisionId(service._rev).set(set))
      }
      console.log()
    }

    // Knoxville's own photos, in its location document, keyed to the exterior surfaces' _key
    const knoxville = locations.find((l) => l.slug === 'knoxville')
    const exterior = services.find((s) => s.locationKey === 'exterior')
    if (!knoxville || !exterior) throw new Error('Knoxville or the exterior service is missing')
    const existing = knoxville.services?.exterior?.surfacePhotos ?? []
    const add: SurfacePhoto[] = []
    console.log(`KNOXVILLE ${knoxville._id} (rev ${knoxville._rev}): services.exterior.surfacePhotos (${existing.length} now)`)
    for (const photo of KNOXVILLE_PHOTOS) {
      const item = exterior.whatWePaint?.find((i) => (i.slug?.current || surfaceSlug(i.title ?? '')) === photo.slug)
      if (!item) {
        console.log(`  #${photo.slug}: no such surface on ${exterior._id}; skipped`)
        continue
      }
      if (existing.some((p) => p.surface === item._key)) {
        console.log(`  ${item.title} (key "${item._key}"): already has a photo; kept`)
        continue
      }
      let image: Img | undefined
      if (photo.fromOldSection) {
        const old = (knoxville.services?.exterior?.subServices ?? []).find((sub) => (sub.anchor || surfaceSlug(sub.title)) === photo.slug)
        if (old?.image?.asset?._ref) {
          const { asset, alt, hotspot, crop } = old.image
          image = { _type: 'image', asset, alt, ...(hotspot ? { hotspot } : {}), ...(crop ? { crop } : {}) }
        }
      } else if (photo.asset) image = { _type: 'image', asset: { _ref: photo.asset }, alt: photo.alt }
      else if (photo.file) {
        if (!existsSync(photo.file)) {
          console.log(`  ${item.title}: ${photo.file} not found on this machine; skipped`)
          continue
        }
        // Sanity keeps one asset per file content, so re-running doesn't duplicate it
        const ref = DRY_RUN ? '(uploaded on apply)' : (await client.assets.upload('image', createReadStream(photo.file), { filename: basename(photo.file).replace(/^\d{4}_\d{2}_/, '') }))._id
        image = { _type: 'image', asset: { _ref: ref }, alt: photo.alt }
      }
      if (!image?.asset?._ref) {
        console.log(`  ${item.title}: photo not found; skipped`)
        continue
      }
      add.push({ _key: `photo-${item._key}`, surface: item._key, image: { ...image, asset: { _type: 'reference', _ref: image.asset._ref } } as Img })
      console.log(`  ${item.title} (key "${item._key}") ← ${photo.source}\n      ${image.asset._ref}\n      alt: "${image.alt}"`)
    }
    if (add.length) {
      changes++
      tx.patch(knoxville._id, (p) => p.ifRevisionId(knoxville._rev).setIfMissing({ 'services.exterior.surfacePhotos': [] }).append('services.exterior.surfacePhotos', add.map((photo) => ({ _type: 'surfacePhoto', ...photo }))))
    }
    console.log()
  }

  if (REMOVE_SHARED_PHOTOS) {
    // The site stopped reading these: each location has its own photos now
    for (const service of services) {
      const withPhoto = (service.whatWePaint ?? []).filter((item) => item.image)
      if (!withPhoto.length) continue
      changes++
      tx.patch(service._id, (p) => p.ifRevisionId(service._rev).unset(withPhoto.map((item) => `whatWePaint[_key=="${item._key}"].image`)))
      for (const item of withPhoto) console.log(`SERVICE ${service._id} "${item.title}": remove shared photo ${item.image?.asset?._ref}`)
    }
    console.log()
  }

  if (CABINET_SLUG) {
    const cabinet = services.find((s) => s.locationKey === 'cabinet')
    if (!cabinet) throw new Error('No cabinet service document')
    if (cabinet.slug === 'cabinet-painting') console.log(`CABINET ${cabinet._id}: slug already "cabinet-painting"`)
    else {
      changes++
      tx.patch(cabinet._id, (p) => p.ifRevisionId(cabinet._rev).set({ slug: { _type: 'slug', current: 'cabinet-painting' } }))
      console.log(`CABINET ${cabinet._id} (rev ${cabinet._rev}): slug "${cabinet.slug}" → "cabinet-painting"`)
    }
    console.log()
  }

  if (REMOVE_SUBSERVICES) {
    // Only when every old section's surface has its own text and this location's photo (nothing is lost)
    for (const location of locations) {
      const unset: string[] = []
      for (const [key, detail] of Object.entries(location.services ?? {})) {
        const subs = detail?.subServices ?? []
        if (!subs.length) continue
        const service = services.find((s) => s.locationKey === key)
        const covered = subs.map((sub) => {
          const slug = sub.anchor || surfaceSlug(sub.title)
          const item = service?.whatWePaint?.find((i) => (i.slug?.current || surfaceSlug(i.title ?? '')) === slug)
          const photo = detail?.surfacePhotos?.find((p) => p.surface === item?._key)
          return { sub, slug, ok: Boolean(item?.body?.length) && (!sub.image?.asset?._ref || photo?.image?.asset?._ref === sub.image.asset._ref) }
        })
        for (const c of covered) console.log(`${location.slug} ${key} "${c.sub.title}" (#${c.slug}): ${c.ok ? 'surface has its own text (and this location’s photo where the old section had one)' : 'NOT covered: kept'}`)
        if (covered.every((c) => c.ok)) unset.push(`services.${key}.subServices`)
      }
      if (unset.length) {
        changes++
        tx.patch(location._id, (p) => p.ifRevisionId(location._rev).unset(unset))
        console.log(`  → ${location.slug}: remove ${unset.join(', ')}`)
      }
    }
    console.log()
  }

  console.log(`${changes} document(s) to change.`)
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
