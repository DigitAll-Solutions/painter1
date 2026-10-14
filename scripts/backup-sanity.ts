/**
 * Backs up the whole Sanity dataset before any bulk change: every document (published, drafts and the
 * private lead documents) and every asset's record (id, file name, size, checksum, CDN URL).
 * Image files themselves stay in Sanity; the asset records say which files every document uses.
 *
 *   node --env-file=.env.local scripts/backup-sanity.ts
 *
 * Writes docs/backups/<date>/ (gitignored: it holds private lead details, keep it off shared drives):
 *   documents.ndjson  one document per line, the format `sanity dataset import` reads
 *   assets.json       every image/file asset record
 *   manifest.json     dataset, time, counts per type, sizes
 * Restore (replaces documents with the same id; check with the client first):
 *   npx sanity dataset import docs/backups/<date>/documents.ndjson <dataset> --replace
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const API_VERSION = '2025-01-01'

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

type Doc = { _id: string; _type: string; [key: string]: unknown }

async function main() {
  const projectId = env('NEXT_PUBLIC_SANITY_PROJECT_ID')
  const dataset = env('NEXT_PUBLIC_SANITY_DATASET')
  // A write token sees drafts and private documents; the export is read-only
  const token = env('SANITY_API_WRITE_TOKEN')

  const res = await fetch(`https://${projectId}.api.sanity.io/v${API_VERSION}/data/export/${dataset}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Export failed: ${res.status} ${res.statusText} ${await res.text()}`)
  const ndjson = (await res.text()).trim()
  const docs: Doc[] = ndjson.split('\n').filter(Boolean).map((line) => JSON.parse(line))
  if (!docs.length) throw new Error('The export is empty: nothing written')

  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  // Never overwrite an earlier backup from the same day
  let dir = `docs/backups/${date}`
  if (existsSync(dir)) dir = `${dir}-${now.toISOString().slice(11, 19).replace(/:/g, '')}`
  mkdirSync(dir, { recursive: true })

  const assets = docs.filter((d) => d._type === 'sanity.imageAsset' || d._type === 'sanity.fileAsset')
  writeFileSync(`${dir}/documents.ndjson`, ndjson + '\n')
  writeFileSync(
    `${dir}/assets.json`,
    JSON.stringify(
      assets.map(({ _id, _type, originalFilename, size, sha1hash, url, mimeType }) => ({ _id, _type, originalFilename, size, sha1hash, url, mimeType })),
      null,
      2,
    ) + '\n',
  )

  const byType: Record<string, number> = {}
  for (const d of docs) byType[d._type] = (byType[d._type] ?? 0) + 1
  const drafts = docs.filter((d) => d._id.startsWith('drafts.')).length
  const referenced = new Set(ndjson.match(/"_ref":"(image|file)-[^"]+"/g)?.map((m) => m.slice(8, -1)))
  const manifest = {
    projectId,
    dataset,
    exportedAt: now.toISOString(),
    documents: docs.length,
    drafts,
    assets: assets.length,
    assetsReferenced: referenced.size,
    assetBytesInSanity: assets.reduce((n, a) => n + (Number(a.size) || 0), 0),
    sha256: createHash('sha256').update(ndjson).digest('hex'),
    byType: Object.fromEntries(Object.entries(byType).sort(([a], [b]) => a.localeCompare(b))),
  }
  writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n')

  const kb = (file: string) => `${(statSync(`${dir}/${file}`).size / 1024).toFixed(0)} KB`
  console.log(`Backed up dataset "${dataset}" to ${dir}/`)
  console.log(`  documents.ndjson  ${docs.length} documents (${drafts} drafts)  ${kb('documents.ndjson')}`)
  console.log(`  assets.json       ${assets.length} asset records, ${referenced.size} referenced by documents  ${kb('assets.json')}`)
  console.log(`  manifest.json     ${Object.keys(byType).length} document types  ${kb('manifest.json')}`)
  console.log(`  (image files stay in Sanity: ${(manifest.assetBytesInSanity / 1024 / 1024).toFixed(1)} MB)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
