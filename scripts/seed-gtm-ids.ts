/**
 * Fills each location's own Google Tag Manager container ("GTM container ID", gtmId) from Rick's
 * "Painter1 GTM" sheet (Nov 7). Container IDs are public (they're in every page's source), so the
 * mapping lives here. Sheet names that differ from ours are noted inline.
 *
 * Not mapped:
 *   - our locations with no container: bozeman, marietta (they keep the site-wide container)
 *   - containers for locations we don't have: Baldwin County, Charlotte (not Charlotte Metro),
 *     Chattanooga, Fayetteville, Lowcountry, Montgomery County, Nampa / Meridian, New England,
 *     North Central Utah, Orlando (not Greater Orlando), Pompano Beach, The DMV, The Triangle
 *   - "Painter1 Corp" GTM-5LG3XH7S: the site-wide container (NEXT_PUBLIC_GTM_ID), not a location
 *
 *   node --env-file=.env.local scripts/seed-gtm-ids.ts --dry-run   # print what would change
 *   node --env-file=.env.local scripts/seed-gtm-ids.ts             # apply (SANITY_API_WRITE_TOKEN)
 *
 * Safe to re-run (scripts/lib/safe-write.ts): gtmId is written only while empty; one already set in
 * Studio is kept and reported. The published document and its draft (if any) are both updated.
 */
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

import { gtmId } from '../lib/gtm.ts'
import { SafeWrite } from './lib/safe-write.ts'

const DRY_RUN = process.argv.includes('--dry-run')

export const GTM_BY_SLUG: Record<string, string> = {
  'austin-metro': 'GTM-N7FRRBFM',
  'bayou-city': 'GTM-PS8CHQVR',
  'boca-raton': 'GTM-KKLT6MRW',
  'carmel-fishers': 'GTM-KDMRDTP6',
  'central-florida': 'GTM-5TFCNZJ8',
  'charlotte-metro': 'GTM-P8GFC2PS',
  cincinnati: 'GTM-WJW3H3MX',
  'coastal-carolina': 'GTM-P4WNWDJD', // sheet: "Costal Carolina"
  columbus: 'GTM-5HR7VLDV',
  dallas: 'GTM-PS8DZTQD',
  dfw: 'GTM-PSJD983J',
  'greater-north-austin': 'GTM-T57ZM4V7',
  'greater-orlando': 'GTM-MJHW83J5',
  'greater-salt-lake': 'GTM-T39WG2JQ', // sheet: "Greater SLC" (not Salt Lake City, which is slc)
  'highlands-ranch': 'GTM-P43JDPKX',
  indianapolis: 'GTM-PLJL49HW',
  'inland-northwest': 'GTM-WSN5HNLM',
  knoxville: 'GTM-PVDK2ZFJ',
  'main-line': 'GTM-TPMWXVHS', // ours: "Bryn Mawr/Main Line"
  memphis: 'GTM-MPF4FCXL',
  miami: 'GTM-54G8K2MG',
  'mid-michigan': 'GTM-P6JVC57T',
  'north-georgia': 'GTM-5CV22VDR',
  'northern-utah': 'GTM-NW4CLMFJ',
  'park-city': 'GTM-WG58JG55',
  portland: 'GTM-5LMTZJ4N',
  raleigh: 'GTM-P769VL4L',
  scottsdale: 'GTM-N2DTK443',
  slc: 'GTM-KX6XTKW8', // sheet: "Salt Lake City"
  southatl: 'GTM-MDWLRGHS', // sheet: "South Atlanta"
  'st-george': 'GTM-TJDS5N45',
  tulsa: 'GTM-PVTSS78L',
  upstate: 'GTM-MKVLZR3D', // sheet: "Upstate SC"
  'utah-county': 'GTM-PVT2R62S',
  westminster: 'GTM-WBBXG3FB',
}

type Doc = { _id: string; _rev: string; slug?: string; gtmId?: string }

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

const publishedId = (id: string) => id.replace(/^drafts\./, '')

async function main() {
  for (const [slug, id] of Object.entries(GTM_BY_SLUG)) if (gtmId(id) !== id) throw new Error(`Bad container ID for ${slug}: ${id}`)
  const ids = Object.values(GTM_BY_SLUG)
  if (new Set(ids).size !== ids.length) throw new Error('The same container is mapped to two locations')

  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })
  const docs = await client.fetch<Doc[]>(`*[_type == "location"]{_id, _rev, "slug": slug.current, gtmId} | order(slug asc)`)

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")\n`)
  const guard = new SafeWrite('seed-gtm-ids')
  const tx = client.transaction()
  const published = docs.filter((doc) => !doc._id.startsWith('drafts.'))
  const missing = Object.keys(GTM_BY_SLUG).filter((slug) => !published.some((doc) => doc.slug === slug))
  for (const pub of published) {
    const container = pub.slug ? GTM_BY_SLUG[pub.slug] : undefined
    if (!container) continue
    for (const doc of docs.filter((d) => publishedId(d._id) === pub._id)) {
      const { set, any } = guard.plan(doc._id, doc, { set: { gtmId: container } })
      if (any) console.log(`${doc._id}: set gtmId = ${set.gtmId}`)
      if (any) tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set))
    }
  }
  const unmapped = published.filter((doc) => !doc.slug || !GTM_BY_SLUG[doc.slug]).map((doc) => doc.slug)
  console.log(`\nNo container (site-wide one stays): ${unmapped.join(', ') || 'none'}`)
  if (missing.length) console.log(`Mapped but not in Sanity (skipped): ${missing.join(', ')}`)
  guard.report()
  if (DRY_RUN || !guard.changes.length) {
    console.log(DRY_RUN ? '\nDry run complete. No changes written.' : '\nNothing to do.')
    return
  }
  await guard.confirm(DRY_RUN)
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`\nCommitted transaction ${result.transactionId}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
