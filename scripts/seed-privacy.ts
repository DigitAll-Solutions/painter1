/**
 * Creates the shared franchise-wide Privacy Policy document ("privacy-policy") from the LIVE
 * corporate page saved in the browser download (source of truth), and reports every difference
 * from the copy imported into Sanity earlier (location "knoxville".privacyPolicy).
 *
 * Conversion: Termly's heading_1 → h2, heading_2 → h3, paragraphs, bullet lists, bold/italic/
 * underline, links (links to /privacy-policy/#x become in-page #x links). Every id the live page
 * uses as a link target is kept as an anchor item (#infocollect, #uslaws, #communication-opt-in …).
 * The live page has no "Do Not Sell" section or anchor, so #do-not-sell (footer link) is placed at
 * #uslaws (section 10, US privacy rights). "Painter1 of Knoxville" → {locationName}.
 *
 *   node --env-file=.env.local scripts/seed-privacy.ts --dry-run
 *   node --env-file=.env.local scripts/seed-privacy.ts            # needs SANITY_API_WRITE_TOKEN
 */
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'
import { HTMLElement, NodeType, parse, type Node } from 'node-html-parser'

const DRY_RUN = process.argv.includes('--dry-run')
const LIVE_FILE = 'docs/painter1-knoxville/pages/Privacy Policy - Painter1 Franchise.html'
const LIVE_URL = 'https://www.painter1.com/privacy-policy/'
const DOC_ID = 'privacy-policy'
const DO_NOT_SELL_AT = 'uslaws'
const LOCATION_NAME = 'Painter1 of Knoxville'

type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type MarkDef = { _type: 'link'; _key: string; href: string }
type Block = { _type: 'block'; _key: string; style: 'normal' | 'h2' | 'h3'; markDefs: MarkDef[]; children: Span[]; listItem?: 'bullet'; level?: number }
type Anchor = { _type: 'privacyAnchor'; _key: string; id: string }
type Item = Block | Anchor

// ---------- live HTML → portable text ----------

const BLOCK_TAGS = new Set(['div', 'p', 'li', 'ul', 'ol', 'table', 'tbody', 'thead', 'tr', 'td', 'th', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const tagOf = (node: Node) => (node.nodeType === NodeType.ELEMENT_NODE ? (node as HTMLElement).rawTagName?.toLowerCase() ?? '' : '')
const isBlock = (node: Node) => BLOCK_TAGS.has(tagOf(node))
/** Ids that are link targets on the live page (not page-builder ids like text_block-7-5129, not Termly's repeated "control") */
const isContentId = (id: string | undefined): id is string => !!id && id !== 'control' && !/-\d+(-\d+)?$/.test(id)

type Piece = { text: string; marks: string[]; href?: string } | { br: true }

function inline(node: Node, marks: string[], href: string | undefined, out: Piece[], classes: Set<string>) {
  if (node.nodeType === NodeType.TEXT_NODE) {
    out.push({ text: node.text.replace(/ /g, ' '), marks, href })
    return
  }
  if (node.nodeType !== NodeType.ELEMENT_NODE) return
  const el = node as HTMLElement
  const tag = tagOf(el)
  if (tag === 'br') {
    out.push({ br: true })
    return
  }
  const custom = el.getAttribute('data-custom-class')
  if (custom) classes.add(custom)
  let nextMarks = marks
  if (tag === 'strong' || tag === 'b') nextMarks = [...marks, 'strong']
  if (tag === 'em' || tag === 'i') nextMarks = [...marks, 'em']
  if (tag === 'u') nextMarks = [...marks, 'underline']
  let nextHref = href
  if (tag === 'a' && el.getAttribute('href')) nextHref = el.getAttribute('href')!.replace(LIVE_URL, '').replace(/^https?:\/\/www\.painter1\.com\/privacy-policy\/?(?=#)/, '')
  for (const child of el.childNodes) inline(child, [...new Set(nextMarks)], nextHref, out, classes)
}

class Builder {
  items: Item[] = []
  pendingAnchors: string[] = []
  private n = 0
  key = (prefix: string) => `${prefix}${(this.n++).toString(36)}`

  anchor(id: string) {
    this.pendingAnchors.push(id)
  }

  /** Turn collected inline pieces into one block per <br>-separated chunk */
  flush(pieces: Piece[], classes: Set<string>, forced?: Block['style'], list?: { level: number }) {
    const chunks: Piece[][] = [[]]
    for (const piece of pieces) {
      if ('br' in piece) chunks.push([])
      else chunks[chunks.length - 1].push(piece)
    }
    const style: Block['style'] = forced ?? (classes.has('heading_1') || classes.has('title') ? 'h2' : classes.has('heading_2') ? 'h3' : 'normal')
    for (const chunk of chunks) {
      const block: Block = { _type: 'block', _key: this.key('b'), style, markDefs: [], children: [] }
      if (list) Object.assign(block, { listItem: 'bullet', level: list.level })
      for (const piece of chunk as { text: string; marks: string[]; href?: string }[]) {
        const marks = [...piece.marks]
        if (piece.href) {
          let def = block.markDefs.find((d) => d.href === piece.href)
          if (!def) block.markDefs.push((def = { _type: 'link', _key: this.key('l'), href: piece.href }))
          marks.push(def._key)
        }
        const last = block.children.at(-1)
        if (last && last.marks.join() === marks.join()) last.text += piece.text
        else block.children.push({ _type: 'span', _key: this.key('s'), text: piece.text, marks })
      }
      // collapse whitespace, trim the block's ends, drop empty spans/blocks
      block.children.forEach((s) => (s.text = s.text.replace(/\s+/g, ' ')))
      if (block.children.length) {
        block.children[0].text = block.children[0].text.trimStart()
        block.children[block.children.length - 1].text = block.children[block.children.length - 1].text.trimEnd()
      }
      block.children = block.children.filter((s) => s.text)
      if (!block.children.length) continue
      block.markDefs = block.markDefs.filter((d) => block.children.some((s) => s.marks.includes(d._key)))
      for (const id of this.pendingAnchors.splice(0)) this.items.push({ _type: 'privacyAnchor', _key: this.key('a'), id })
      this.items.push(block)
    }
  }

  walk(el: HTMLElement, opts: { forced?: Block['style']; listLevel?: number } = {}) {
    const id = el.getAttribute?.('id')
    if (isContentId(id)) this.anchor(id)
    const tag = tagOf(el)
    if (tag === 'ul' || tag === 'ol') {
      for (const child of el.childNodes) if (tagOf(child) === 'li') this.walk(child as HTMLElement, { listLevel: (opts.listLevel ?? 0) + 1 })
      return
    }
    const list = tag === 'li' ? { level: opts.listLevel ?? 1 } : undefined
    const forced = /^h[1-6]$/.test(tag) ? (tag === 'h3' ? 'h2' : 'h2') : opts.forced
    let pieces: Piece[] = []
    let classes = new Set<string>()
    for (const child of el.childNodes) {
      if (isBlock(child)) {
        this.flush(pieces, classes, forced, list)
        pieces = []
        classes = new Set()
        this.walk(child as HTMLElement, { listLevel: opts.listLevel })
      } else {
        // an inline element can still carry a link-target id
        if (child.nodeType === NodeType.ELEMENT_NODE) {
          const childId = (child as HTMLElement).getAttribute('id')
          if (isContentId(childId) && !pieces.length) this.anchor(childId)
        }
        inline(child, [], undefined, pieces, classes)
      }
    }
    this.flush(pieces, classes, forced, list)
  }
}

function convertLive(html: string) {
  const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false } })
  const termly = root.querySelectorAll('div.ct-code-block').find((el) => /PRIVACY NOTICE/.test(el.text))
  const optIn = root.querySelector('#communication-opt-in')
  if (!termly || !optIn) throw new Error('Privacy notice or #communication-opt-in section not found in the live page')
  const builder = new Builder()
  builder.walk(termly)
  builder.walk(optIn)
  return builder.items
}

// ---------- comparison (word for word) ----------

const plain = (b: { children?: { text?: string }[] }) => (b.children ?? []).map((c) => c.text ?? '').join('').replace(/\s+/g, ' ').trim()

/** Longest common subsequence alignment of two string lists */
function align<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ops: { op: '=' | '-' | '+'; a?: T; b?: T }[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (eq(a[i], b[j])) ops.push({ op: '=', a: a[i++], b: b[j++] })
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ op: '-', a: a[i++] })
    else ops.push({ op: '+', b: b[j++] })
  }
  while (i < a.length) ops.push({ op: '-', a: a[i++] })
  while (j < b.length) ops.push({ op: '+', b: b[j++] })
  return ops
}

function wordDiff(a: string, b: string) {
  const ops = align(a.split(' '), b.split(' '), (x, y) => x === y)
  const out: string[] = []
  for (const o of ops) out.push(o.op === '=' ? o.a! : o.op === '-' ? `[-${o.a}-]` : `{+${o.b}+}`)
  return out.join(' ').replace(/-\] \[-/g, ' ').replace(/\+\} \{\+/g, ' ')
}

type Para = { text: string; h2: boolean }

/** Paragraphs match on text; an h2 only matches an h2 (so a TOC entry never pairs with its section heading) */
function compare(imported: Para[], live: Para[]) {
  const ops = align(imported, live, (x, y) => x.text === y.text && x.h2 === y.h2)
  const lines: string[] = []
  let same = 0
  let context = '(start)'
  // group consecutive removals/additions so changed paragraphs are shown as word diffs
  for (let k = 0; k < ops.length; ) {
    if (ops[k].op === '=') {
      same++
      context = ops[k].b!.text
      k++
      continue
    }
    const removed: string[] = []
    const added: string[] = []
    for (; k < ops.length && ops[k].op !== '='; k++) {
      if (ops[k].op === '-') removed.push(ops[k].a!.text)
      else added.push(ops[k].b!.text)
    }
    lines.push(`  after "${context.length > 70 ? `${context.slice(0, 70)}…` : context}":`)
    const pairs = Math.min(removed.length, added.length)
    for (let p = 0; p < pairs; p++) {
      lines.push(removed[p] === added[p] ? `    = same words, heading on live page only: ${added[p]}` : `    ~ changed: ${wordDiff(removed[p], added[p])}`)
    }
    for (const r of removed.slice(pairs)) lines.push(`    - only in imported copy: ${r}`)
    for (const a of added.slice(pairs)) lines.push(`    + only on live page: ${a}`)
  }
  return { same, lines }
}

// ---------- run ----------

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

async function main() {
  if (!existsSync(LIVE_FILE)) throw new Error(`Live page not found: ${LIVE_FILE}`)
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: '2025-01-01', token, useCdn: false, perspective: 'raw' })

  const items = convertLive(readFileSync(LIVE_FILE, 'utf-8'))
  const blocks = items.filter((i): i is Block => i._type === 'block')
  const headings = blocks.filter((b) => b.style !== 'normal')
  const anchors = items.filter((i): i is Anchor => i._type === 'privacyAnchor').map((a) => a.id)

  // Compare with the imported copy before tokenising (both say "Painter1 of Knoxville")
  const imported = (await client.fetch<{ style?: string; listItem?: string; markDefs?: unknown[]; children?: { text?: string }[] }[] | null>(`*[_type == "location" && slug.current == "knoxville" && !(_id in path("drafts.**"))][0].privacyPolicy`)) ?? []
  const para = (b: { style?: string; children?: { text?: string }[] }) => ({ text: plain(b), h2: b.style === 'h2' })
  const { same, lines } = compare(imported.map(para).filter((p) => p.text), blocks.map(para).filter((p) => p.text))
  const importedLinks = imported.reduce((n, b) => n + (b.markDefs?.length ?? 0), 0)
  const importedH2 = imported.filter((b) => b.style === 'h2').length
  const importedH3 = imported.filter((b) => b.style === 'h3').length

  // #do-not-sell next to #uslaws; location name → token
  const body: Item[] = []
  let replacements = 0
  for (const item of items) {
    if (item._type === 'privacyAnchor' && item.id === DO_NOT_SELL_AT) body.push({ _type: 'privacyAnchor', _key: `${item._key}dns`, id: 'do-not-sell' })
    if (item._type === 'block') {
      for (const span of item.children) {
        if (!span.text.includes(LOCATION_NAME)) continue
        replacements += span.text.split(LOCATION_NAME).length - 1
        span.text = span.text.split(LOCATION_NAME).join('{locationName}')
      }
    }
    body.push(item)
  }
  if (!anchors.includes(DO_NOT_SELL_AT)) throw new Error(`#${DO_NOT_SELL_AT} not found on the live page`)

  const existing = await client.fetch<{ _id: string } | null>(`*[_id == $id][0]{_id}`, { id: DOC_ID })
  const links = [...new Set(blocks.flatMap((b) => b.markDefs.map((d) => d.href)))]

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}")`)
  console.log(`Source of truth: ${LIVE_FILE}  (${LIVE_URL})\n`)

  console.log(`COMPARISON: live page vs the copy imported into Sanity (location "knoxville".privacyPolicy), word for word`)
  console.log(`  live: ${blocks.length} blocks · imported: ${imported.length} blocks · identical: ${same}`)
  console.log(lines.length ? lines.join('\n') : '  no text differences')
  const liveLinks = blocks.reduce((n, b) => n + b.markDefs.length, 0)
  console.log(
    `  formatting: imported copy has ${importedH2} h2 / ${importedH3} h3, ${importedLinks} links, 0 anchors; live has ${headings.filter((h) => h.style === 'h2').length} h2 / ${headings.filter((h) => h.style === 'h3').length} h3, ${liveLinks} links, ${anchors.length} anchors`,
  )

  console.log(`\n${existing ? 'UPDATE' : 'CREATE'} ${DOC_ID} (_type privacyPolicy, public, one for every location)`)
  console.log(`  body: ${blocks.length} blocks (${headings.filter((h) => h.style === 'h2').length} h2, ${headings.filter((h) => h.style === 'h3').length} h3, ${blocks.filter((b) => b.listItem).length} list items) + ${body.length - blocks.length} anchors`)
  console.log(`  anchors kept from the live page (${anchors.length}): ${anchors.map((a) => `#${a}`).join(' ')}`)
  console.log(`  #do-not-sell: the live page has no "Do Not Sell" section or anchor → placed with #${DO_NOT_SELL_AT} (10. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?)`)
  console.log(`  "${LOCATION_NAME}" → {locationName}: ${replacements} occurrence(s) (the live corporate page itself says "${LOCATION_NAME}")`)
  console.log(`  links (${links.length}): ${links.join('  ')}`)
  console.log(`  headings:`)
  for (const h of headings) console.log(`    ${h.style}  ${plain(h)}`)
  console.log(`\nUnchanged: location "knoxville".privacyPolicy (legacy import, hidden in Studio, not used by the site).`)

  if (DRY_RUN) {
    console.log('\nDry run complete. No changes written.')
    return
  }
  const result = await client
    .transaction()
    .createIfNotExists({ _id: DOC_ID, _type: 'privacyPolicy', title: 'Privacy Policy' })
    .patch(DOC_ID, (p) => p.set({ title: 'Privacy Policy', body }).unset(['doNotSellHeading']))
    .commit({ visibility: 'sync' })
  console.log(`\nCommitted transaction ${result.transactionId}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
