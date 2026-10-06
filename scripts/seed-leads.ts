/**
 * Seeds Knoxville's free-estimate setup from its Fluent Forms export (#73 "Knoxville-contact-form"):
 *   - location fields: lead email subject, template (byte for byte), confirmation message, consent blocks
 *   - private leads.<location id> document: recipients (read from the gitignored export at run time,
 *     so no address is ever in the repo)
 *   - the default estimateSurvey document (client copy from lib/estimate-survey-defaults.json; only
 *     empty fields are filled, so edits made in Studio survive re-runs)
 *
 *   node --env-file=.env.local scripts/seed-leads.ts --dry-run   # print everything (addresses masked)
 *   node --env-file=.env.local scripts/seed-leads.ts             # apply (needs SANITY_API_WRITE_TOKEN)
 */
import { readdirSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { createClient } from '@sanity/client'

const DRY_RUN = process.argv.includes('--dry-run')
const LOCATION_SLUG = 'knoxville'
const FORM_TITLE = 'Knoxville-contact-form'
const EXPORT_DIR = 'docs/reference/fluentforms'
const SURVEY_ID = 'estimate-survey-default'
const API_VERSION = '2025-01-01'

// ---------- Fluent Forms export ----------

type Meta = { id?: number | string; meta_key?: string; value?: unknown }
type FluentField = {
  element?: string
  attributes?: { name?: string }
  settings?: { tnc_html?: string }
  columns?: { fields: FluentField[] }[]
}

const parse = (value: unknown) => {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function loadForm() {
  for (const file of readdirSync(EXPORT_DIR).filter((name) => name.endsWith('.json'))) {
    const forms = JSON.parse(readFileSync(`${EXPORT_DIR}/${file}`, 'utf-8')) as Record<string, unknown>[]
    const form = forms.find((f) => String(f.title).startsWith(FORM_TITLE))
    if (!form) continue
    // PHP exports a gapped array as an object; form_meta carries the same rows
    const rawMetas = form.metas && typeof form.metas === 'object' && !Array.isArray(form.metas) ? Object.values(form.metas) : ((form.metas as unknown[]) ?? [])
    const metas = [...rawMetas, ...((form.form_meta as unknown[]) ?? [])].filter((m): m is Meta => !!m && typeof m === 'object')
    const meta = (key: string) => parse(metas.find((m) => m.meta_key === key)?.value) as Record<string, unknown> | undefined
    const fields: FluentField[] = []
    const walk = (list: FluentField[]) => list.forEach((f) => (f.element === 'container' ? f.columns?.forEach((c) => walk(c.fields)) : fields.push(f)))
    walk((parse(form.form_fields) as { fields: FluentField[] }).fields)
    return { file, id: form.id, title: form.title, fields, notification: meta('notifications'), settings: meta('formSettings') }
  }
  throw new Error(`No "${FORM_TITLE}" form found in ${EXPORT_DIR}`)
}

// ---------- consent HTML → portable text ----------

type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
type Block = { _type: 'block'; _key: string; style: 'normal'; markDefs: { _type: 'link'; _key: string; href: string }[]; children: Span[] }

const decode = (text: string) =>
  text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))

/** <p> → block; <i>/<em> → em; <b>/<strong> → strong; <a href> → link; classes and <span>s dropped */
function htmlToBlocks(html: string, prefix: string): Block[] {
  return [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((match, p) => {
    const block: Block = { _type: 'block', _key: `${prefix}p${p}`, style: 'normal', markDefs: [], children: [] }
    const marks: string[] = []
    const close = (mark: string) => {
      const i = marks.lastIndexOf(mark)
      if (i >= 0) marks.splice(i, 1)
    }
    for (const token of match[1].split(/(<[^>]+>)/).filter(Boolean)) {
      if (token.startsWith('<')) {
        const tag = token.match(/^<\/?\s*([a-zA-Z0-9]+)/)?.[1].toLowerCase()
        const closing = token.startsWith('</')
        const decorator = tag === 'i' || tag === 'em' ? 'em' : tag === 'b' || tag === 'strong' ? 'strong' : null
        if (decorator) {
          if (closing) close(decorator)
          else marks.push(decorator)
        } else if (tag === 'a') {
          if (closing) {
            const link = [...marks].reverse().find((m) => m.startsWith(`${prefix}l`))
            if (link) close(link)
          } else {
            const key = `${prefix}l${block.markDefs.length}`
            block.markDefs.push({ _type: 'link', _key: key, href: decode(token.match(/href="([^"]*)"/)?.[1] ?? '') })
            marks.push(key)
          }
        }
        continue
      }
      const text = decode(token)
      const last = block.children.at(-1)
      if (last && last.marks.join() === marks.join()) last.text += text
      else block.children.push({ _type: 'span', _key: `${prefix}p${p}s${block.children.length}`, text, marks: [...marks] })
    }
    // "<p>&nbsp;</p>" becomes an empty paragraph
    for (const span of block.children) if (!span.text.trim()) span.text = span.text.trim()
    if (!block.children.length) block.children.push({ _type: 'span', _key: `${prefix}p${p}s0`, text: '', marks: [] })
    return block
  })
}

/** Readable rendering for the dry run: _italic_, **bold**, [text](href) */
const showBlocks = (blocks: Block[]) =>
  blocks
    .map((b) =>
      b.children
        .map((c) => {
          let t = c.text
          for (const m of c.marks) {
            if (m === 'em') t = `_${t}_`
            else if (m === 'strong') t = `**${t}**`
            else t = `[${t}](${b.markDefs.find((d) => d._key === m)?.href})`
          }
          return t
        })
        .join('') || '(empty paragraph)',
    )
    .join('\n        ')

// ---------- run ----------

const mask = (email: string) => email.replace(/^(.)[^@]*@(.+)$/, (_, first: string, domain: string) => `${first}***@${domain}`)

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} (run with --env-file=.env.local)`)
  return value
}

async function main() {
  const token = DRY_RUN ? process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN : env('SANITY_API_WRITE_TOKEN')
  const client = createClient({ projectId: env('NEXT_PUBLIC_SANITY_PROJECT_ID'), dataset: env('NEXT_PUBLIC_SANITY_DATASET'), apiVersion: API_VERSION, token, useCdn: false, perspective: 'raw' })

  const form = loadForm()
  const notification = (form.notification as Record<string, unknown>) ?? {}
  const sendTo = ((notification.sendTo as { email?: string })?.email ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const subject = String(notification.subject ?? '')
  const template = String(notification.message ?? '')
  const confirmation = String(((form.settings as Record<string, unknown>)?.confirmation as { messageToShow?: string })?.messageToShow ?? '')
  const consentFields = form.fields.filter((f) => f.element === 'terms_and_condition')
  const consentBlocks = consentFields.map((f) => ({
    _key: f.attributes?.name ?? 'consent',
    _type: 'consentBlock',
    name: f.attributes?.name ?? 'consent',
    body: htmlToBlocks(f.settings?.tnc_html ?? '', `${f.attributes?.name}-`),
  }))
  const surveyDefaults = JSON.parse(readFileSync('lib/estimate-survey-defaults.json', 'utf-8')) as Record<string, unknown>

  const docs = await client.fetch<{ _id: string; _rev: string; leadEmailSubject?: string; leadEmailTemplate?: string; leadConfirmationMessage?: string; consentBlocks?: unknown[] }[]>(
    `*[_type == "location" && slug.current == $slug]{_id, _rev, leadEmailSubject, leadEmailTemplate, leadConfirmationMessage, consentBlocks}`,
    { slug: LOCATION_SLUG },
  )
  const location = docs.find((d) => !d._id.startsWith('drafts.'))
  if (!location) throw new Error(`Location "${LOCATION_SLUG}" not found`)
  const drafts = docs.filter((d) => d._id.startsWith('drafts.'))
  const recipientsId = `leads.${location._id}`
  const [existingRecipients, existingSurvey] = await Promise.all([
    client.fetch<{ leadRecipients?: string[] } | null>(`*[_id == $id][0]{leadRecipients}`, { id: recipientsId }),
    client.fetch<Record<string, unknown> | null>(`*[_id == $id][0]`, { id: SURVEY_ID }),
  ])

  console.log(`${DRY_RUN ? 'DRY RUN — nothing will be written' : 'APPLYING CHANGES'}  (dataset "${process.env.NEXT_PUBLIC_SANITY_DATASET}", ${token ? 'authenticated' : 'no token'})`)
  console.log(`Source: ${EXPORT_DIR}/${form.file} → #${form.id} ${form.title}\n`)

  console.log(`LOCATION ${location._id} (rev ${location._rev})${drafts.length ? ` + draft ${drafts.map((d) => d._id).join(', ')}` : ''}`)
  console.log(`  leadEmailSubject: ${location.leadEmailSubject ? JSON.stringify(location.leadEmailSubject) : '(empty)'} → ${JSON.stringify(subject)}`)
  console.log(`  leadConfirmationMessage: ${location.leadConfirmationMessage ? JSON.stringify(location.leadConfirmationMessage) : '(empty)'} → ${JSON.stringify(confirmation)}`)
  console.log(`  leadEmailTemplate: ${location.leadEmailTemplate ? 'replace' : '(empty) → set'} (${template.length} chars, ends with ${JSON.stringify(template.slice(-12))})`)
  console.log(`    ${JSON.stringify(template)}`)
  console.log(`  consentBlocks: ${location.consentBlocks?.length ?? 0} → ${consentBlocks.length}`)
  consentBlocks.forEach((block, i) => {
    console.log(`    [${block.name}] required checkbox`)
    console.log(`      source HTML: ${consentFields[i].settings?.tnc_html?.replace(/\n/g, '\\n')}`)
    console.log(`      rich text:   ${showBlocks(block.body)}`)
  })

  console.log(`\nPRIVATE ${recipientsId} (not served by the public API)`)
  console.log(`  leadRecipients: ${existingRecipients?.leadRecipients?.length ?? 0} → ${sendTo.length}: ${sendTo.map(mask).join(', ')}`)

  const surveyFill = Object.fromEntries(Object.entries(surveyDefaults).filter(([key]) => existingSurvey?.[key] === undefined))
  console.log(`\nSURVEY ${SURVEY_ID} (public; ${existingSurvey ? 'exists' : 'new'}): ${Object.keys(surveyFill).length} empty field(s) filled from lib/estimate-survey-defaults.json`)
  for (const [key, value] of Object.entries(surveyFill)) console.log(`  ${key}: ${JSON.stringify(value)}`)

  const tx = client.transaction()
  for (const doc of [location, ...drafts]) {
    tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set({ leadEmailSubject: subject, leadEmailTemplate: template, leadConfirmationMessage: confirmation, consentBlocks }))
  }
  tx.createIfNotExists({ _id: recipientsId, _type: 'leadSettings' })
  tx.patch(recipientsId, (p) => p.set({ leadRecipients: sendTo }))
  tx.createIfNotExists({ _id: SURVEY_ID, _type: 'estimateSurvey', title: 'Default survey' })
  if (Object.keys(surveyFill).length) tx.patch(SURVEY_ID, (p) => p.setIfMissing(surveyFill))

  if (DRY_RUN) {
    console.log('\nDry run complete. No changes written.')
    return
  }
  const result = await tx.commit({ visibility: 'sync' })
  console.log(`\nCommitted transaction ${result.transactionId} (${result.results.length} mutations).`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
