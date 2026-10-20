/**
 * Reading the client's location list (docs/reference/Painter1 URLs.csv, gitignored). Shared by
 * scripts/sync-location-slugs.ts and scripts/seed-locations.ts.
 */

/** Minimal CSV parser: quoted fields, commas and newlines inside quotes */
export function parseCsv(text: string): string[][] {
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
export function readUrl(raw: string) {
  const m = raw.trim().match(/^(?:https?:\/\/)?([^/\s]+)\/([^/?#\s]+)\/?$/)
  return m ? { host: m[1].toLowerCase(), slug: m[2] } : undefined
}

/**
 * Rows whose URL in the client's list is wrong, by location name → the slug the live site uses.
 * North Georgia's row repeats Main Line's URL; the live site has /north-georgia/ (confirmed Oct 20).
 */
export const URL_CORRECTIONS: Readonly<Record<string, string>> = { 'Painter1 of North Georgia': 'north-georgia' }
