/**
 * Default surface photos and Rick's cabinet surface copy (Rick, Oct 14).
 *
 * Default (additive: the deployed site doesn't read defaultImage yet): each surface's default photo
 * on the shared service ("Default photo (shown when the location has none)"). Only set when empty.
 *   Interior  Walls, Ceilings, Trim, Doors: Rick's four AI images, uploaded from PHOTO_DIR
 *   Exterior  Stucco, Trim & Doors, Decks, Fences    } the same image files Knoxville shows today
 *   Cabinet   Kitchen, Vanities, Hardware            } (no new upload)
 *   node --env-file=.env.local scripts/seed-surface-defaults.ts --dry-run
 *   node --env-file=.env.local scripts/seed-surface-defaults.ts
 *
 * Post-merge, in this order (each changes what production shows today; --dry-run first every time):
 *   --remove-duplicates  remove a location's own surface photo when it is the same image file as that
 *                        surface's default (Knoxville's AI photos), so the page looks the same and the
 *                        location keeps only its real photos (Knoxville: Siding, Brick)
 *   --cabinet-copy       Rick's cabinet copy into the shared cabinet sections; headings → "Kitchen
 *                        Cabinets", "Bathroom Vanities", "Cabinet Hardware" (link names unchanged)
 *
 * Photos are read from docs/painter1-knoxville/jpg-oct14/ (gitignored; JPEGs converted from Rick's PNGs).
 * Re-running is a no-op.
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { NEUTRAL, RICK_OCT14_CABINET } from './data/rick-oct14-cabinet.ts'
import { plain, show, surfaceBlocks, type Block } from './seed-oct14.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const REMOVE = process.argv.includes('--remove-duplicates')
const COPY = process.argv.includes('--cabinet-copy')
const ADDITIVE = !REMOVE && !COPY

const PHOTO_DIR = 'docs/painter1-knoxville/jpg-oct14'
const CABINET_SOURCE = 'docs/painter1-knoxville/rick-oct14-cabinet-copy.txt'

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

// Alt text describes the scene; it never says whose crew it is (every location shows these)
type Default = { group: 'interior' | 'exterior' | 'cabinet'; slug: string } & ({ file: string; alt: string } | { fromKnoxville: true })
const DEFAULTS: Default[] = [
  { group: 'interior', slug: 'walls', file: 'default-interior-walls.jpg', alt: 'Painter brushing grey paint along the ceiling line of a living room wall, past spackled patches still to be covered, with the furniture wrapped in plastic and drop cloths on the floor.' },
  { group: 'interior', slug: 'ceilings', file: 'default-interior-ceilings.jpg', alt: 'Painter rolling white paint over a water-stained living room ceiling with an extension pole, the light fixture and furniture wrapped in plastic.' },
  { group: 'interior', slug: 'trim', file: 'default-interior-trim.jpg', alt: 'Painter kneeling to brush white enamel onto a baseboard, with blue tape protecting the wood floor and a caulk gun on the drop cloth.' },
  { group: 'interior', slug: 'doors', file: 'default-interior-doors.jpg', alt: 'Painter kneeling to brush white paint onto a six-panel hallway door, with the hinges taped and the knob removed.' },
  ...(['stucco', 'trim-doors', 'decks', 'fences'] as const).map((slug) => ({ group: 'exterior' as const, slug, fromKnoxville: true as const })),
  ...(['kitchen-cabinets', 'bathroom-vanities', 'hardware-upgrades'] as const).map((slug) => ({ group: 'cabinet' as const, slug, fromKnoxville: true as const })),
]

type Img = { _type?: string; asset?: { _type?: string; _ref?: string }; alt?: string }
type Item = { _key: string; title?: string; slug?: { current?: string }; body?: Block[]; defaultImage?: Img }
type ServiceDoc = { _id: string; _rev: string; locationKey: 'interior' | 'exterior' | 'cabinet'; whatWePaint?: Item[] }
type SurfacePhoto = { _key: string; surface?: string; image?: Img }
type LocationDoc = { _id: string; _rev: string; slug?: string; services?: Record<string, { surfacePhotos?: SurfacePhoto[] } | undefined> }

async function main() {
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token: env('SANITY_API_WRITE_TOKEN'), useCdn: false, perspective: 'raw' })
  const drafts = await client.fetch<string[]>(`*[_id in path("drafts.**") && _type in ["service", "location"]]._id`)
  if (drafts.length) throw new Error(`Unpublished drafts exist (${drafts.join(', ')}): publish or discard them in Studio first`)
  const services = await client.fetch<ServiceDoc[]>(`*[_type == "service" && !(_id in path("drafts.**"))] | order(locationKey){_id, _rev, locationKey, whatWePaint}`)
  const locations = await client.fetch<LocationDoc[]>(`*[_type == "location" && !(_id in path("drafts.**"))] | order(_id){_id, _rev, "slug": slug.current, services}`)
  const service = (group: string) => services.find((s) => s.locationKey === group) ?? fail(`No ${group} service`)
  const surface = (group: string, slug: string) => service(group).whatWePaint?.find((i) => i.slug?.current === slug) ?? fail(`${service(group)._id} has no surface #${slug}`)

  const tx = client.transaction()
  let changes = 0
  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")`)
  console.log(`Mode: ${ADDITIVE ? 'default surface photos (additive)' : [REMOVE && 'remove duplicates', COPY && 'cabinet copy'].filter(Boolean).join(' + ') + ' (post-merge)'}\n`)

  if (ADDITIVE) {
    const knoxville = locations.find((l) => l._id === 'location-knoxville') ?? fail('location-knoxville not found')
    const sets = new Map<string, Record<string, Img>>()
    for (const d of DEFAULTS) {
      const item = surface(d.group, d.slug)
      const doc = service(d.group)
      if (item.defaultImage?.asset?._ref) {
        console.log(`${doc._id} #${d.slug}: default already set (${item.defaultImage.asset._ref}); kept`)
        continue
      }
      let ref: string
      let alt: string
      if ('file' in d) {
        const path = `${PHOTO_DIR}/${d.file}`
        if (!existsSync(path)) throw new Error(`${path} not found: convert Rick's PNGs first`)
        ref = DRY_RUN ? `(uploaded on apply: ${d.file}, ${Math.round(statSync(path).size / 1000)} KB)` : (await client.assets.upload('image', createReadStream(path), { filename: d.file }))._id
        alt = d.alt
      } else {
        // The image file Knoxville shows today for this surface
        const own = knoxville.services?.[d.group]?.surfacePhotos?.find((p) => p.surface === item._key)?.image
        if (!own?.asset?._ref || !own.alt) throw new Error(`Knoxville has no ${d.group} #${d.slug} photo to use as the default`)
        ref = own.asset._ref
        alt = own.alt
      }
      console.log(`${doc._id} #${d.slug} (${item.title}) defaultImage ← ${ref}${'fromKnoxville' in d ? '  (the file Knoxville shows today)' : ''}\n  alt: "${alt}"`)
      sets.set(doc._id, { ...sets.get(doc._id), [`whatWePaint[_key=="${item._key}"].defaultImage`]: { _type: 'image', asset: { _type: 'reference', _ref: ref }, alt } })
    }
    for (const [id, set] of sets) {
      changes++
      tx.patch(id, (p) => p.ifRevisionId(services.find((s) => s._id === id)!._rev).set(set))
    }
    console.log()
  }

  if (REMOVE) {
    for (const location of locations) {
      const set: Record<string, SurfacePhoto[]> = {}
      for (const group of ['interior', 'exterior', 'cabinet'] as const) {
        const photos = location.services?.[group]?.surfacePhotos ?? []
        const items = service(group).whatWePaint ?? []
        const duplicate = (p: SurfacePhoto) => {
          const ref = items.find((i) => i._key === p.surface)?.defaultImage?.asset?._ref
          return Boolean(ref && p.image?.asset?._ref === ref)
        }
        const remove = photos.filter(duplicate)
        if (!remove.length) continue
        set[`services.${group}.surfacePhotos`] = photos.filter((p) => !duplicate(p))
        console.log(`${location._id} services.${group}.surfacePhotos: ${remove.length} of ${photos.length} are the same image as the default; removed (the page looks the same)`)
        for (const p of remove) console.log(`  - #${p.surface}  ${p.image?.asset?._ref}`)
        const kept = photos.filter((p) => !duplicate(p))
        console.log(`  kept as this location's own: ${kept.map((p) => `#${p.surface}`).join(', ') || 'none'}`)
      }
      if (Object.keys(set).length) {
        changes++
        tx.patch(location._id, (p) => p.ifRevisionId(location._rev).set(set))
      }
    }
    if (!changes) console.log('No location photo is the same image as its default.')
    console.log()
  }

  if (COPY) {
    const doc = service('cabinet')
    const source = existsSync(CABINET_SOURCE) ? readFileSync(CABINET_SOURCE, 'utf-8') : null
    const set: Record<string, unknown> = {}
    for (const [slug, copy] of Object.entries(RICK_OCT14_CABINET)) {
      const item = surface('cabinet', slug)
      const lines = [copy.intro, ...copy.items, ...copy.extras, copy.whatYouGet, copy.warrantyNote].filter((l): l is string => Boolean(l))
      for (const line of lines) {
        if (/refinish/i.test(line)) throw new Error(`"refinishing" in ${slug}: ${line}`)
        if (source && !NEUTRAL.has(line) && !source.includes(line)) throw new Error(`Not word for word (${slug}): ${line}`)
      }
      const blocks = surfaceBlocks(slug, copy)
      const sameText = item.body && plain(item.body) === plain(blocks) && JSON.stringify(item.body.map((b) => [b.style, b.listItem ?? null])) === JSON.stringify(blocks.map((b) => [b.style, b.listItem ?? null]))
      if (item.title !== copy.title) {
        set[`whatWePaint[_key=="${item._key}"].title`] = copy.title
        console.log(`${doc._id} #${slug} heading: "${item.title}" → "${copy.title}" (link name #${slug} unchanged)`)
      }
      if (sameText) console.log(`${doc._id} #${slug}: already Rick's copy; kept`)
      else {
        set[`whatWePaint[_key=="${item._key}"].body`] = blocks
        console.log(`${doc._id} #${slug} section text ← Rick's copy (${blocks.length} blocks)\n${show(blocks)}`)
      }
      console.log()
    }
    console.log(source ? `  ✓ every line matches ${CABINET_SOURCE} word for word, except the ${NEUTRAL.size} neutral versions of his bracketed "confirm" parts\n` : `  (${CABINET_SOURCE} not on this machine: word-for-word check skipped)\n`)
    if (Object.keys(set).length) {
      changes++
      tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set))
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

function fail(message: string): never {
  throw new Error(message)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
