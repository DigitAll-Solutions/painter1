// Reads a raw received email (.eml, Gmail's "Download original") and checks the lead email that arrived:
// the text/plain part must be the buildLeadEmail output byte for byte (Client Tether parses it), with no
// HTML part, tracking pixel or rewritten link. No dependencies; tested in eml.test.ts and used by
// scripts/check-lead-eml.ts.

export type Headers = { name: string; value: string }[]
export type Part = { contentType: string; params: Record<string, string>; encoding: string; headers: Headers; body: string }
export type Eml = { headers: Headers; parts: Part[]; topType: string }

const header = (headers: Headers, name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value
const allHeaders = (headers: Headers, name: string) => headers.filter((h) => h.name.toLowerCase() === name.toLowerCase()).map((h) => h.value)

/** Splits a header block (latin1 string) into unfolded name/value pairs, in order */
function parseHeaders(block: string): Headers {
  const out: Headers = []
  for (const line of block.split(/\r?\n/)) {
    if (/^[ \t]/.test(line) && out.length) out[out.length - 1].value += ' ' + line.trim()
    else {
      const colon = line.indexOf(':')
      if (colon > 0) out.push({ name: line.slice(0, colon).trim(), value: line.slice(colon + 1).trim() })
    }
  }
  return out
}

/** `text/plain; charset="utf-8"` → type and lower-cased parameters */
function parseContentType(value = 'text/plain; charset=us-ascii') {
  const [type, ...rest] = value.split(';')
  const params: Record<string, string> = {}
  for (const param of rest) {
    const eq = param.indexOf('=')
    if (eq > 0) params[param.slice(0, eq).trim().toLowerCase()] = param.slice(eq + 1).trim().replace(/^"(.*)"$/, '$1')
  }
  return { type: type.trim().toLowerCase(), params }
}

/** Transfer-decodes a body (latin1 string = raw bytes) and decodes its charset */
function decodeBody(raw: string, encoding: string, charset = 'us-ascii'): string {
  let bytes: Buffer
  if (encoding === 'base64') bytes = Buffer.from(raw.replace(/[^A-Za-z0-9+/=]/g, ''), 'base64')
  else if (encoding === 'quoted-printable')
    bytes = Buffer.from(raw.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16))), 'latin1')
  else bytes = Buffer.from(raw, 'latin1')
  const label = charset.toLowerCase() === 'us-ascii' ? 'utf-8' : charset
  try {
    return new TextDecoder(label).decode(bytes)
  } catch {
    return bytes.toString('utf8')
  }
}

/** RFC 2047 encoded words in headers (=?utf-8?Q?…?= / =?utf-8?B?…?=) */
export function decodeWords(value: string): string {
  return value.replace(/=\?([^?]+)\?([QqBb])\?([^?]*)\?=(\s+(?==\?))?/g, (_, charset: string, kind: string, text: string) => {
    const raw = kind.toUpperCase() === 'B' ? Buffer.from(text, 'base64').toString('latin1') : text.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (_m, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    return decodeBody(raw, '8bit', charset)
  })
}

function parseEntity(raw: string, parts: Part[]): { headers: Headers; type: string } {
  const split = raw.search(/\r?\n\r?\n/)
  const headers = parseHeaders(split < 0 ? raw : raw.slice(0, split))
  const body = split < 0 ? '' : raw.slice(split).replace(/^\r?\n\r?\n/, '')
  const { type, params } = parseContentType(header(headers, 'content-type'))
  if (type.startsWith('multipart/') && params.boundary) {
    const delimiter = '--' + params.boundary
    const sections = body.split(new RegExp(`\\r?\\n?${delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
    // [0] is the preamble; the section starting with "--" is the closing delimiter and epilogue
    for (const section of sections.slice(1)) {
      if (section.startsWith('--')) break
      parseEntity(section.replace(/^[ \t]*\r?\n/, ''), parts)
    }
  } else {
    const encoding = (header(headers, 'content-transfer-encoding') ?? '7bit').toLowerCase()
    parts.push({ contentType: type, params, encoding, headers, body: decodeBody(body, encoding, params.charset) })
  }
  return { headers, type }
}

/** Parses a raw message; pass the file as a Buffer so 8bit bodies keep their bytes */
export function parseEml(raw: Buffer | string): Eml {
  const text = typeof raw === 'string' ? Buffer.from(raw, 'utf8').toString('latin1') : raw.toString('latin1')
  const parts: Part[] = []
  const { headers, type } = parseEntity(text.replace(/^﻿/, ''), parts)
  return { headers, parts, topType: type }
}

const URL_PATTERN = /https?:\/\/[^\s"'<>)]+/g
// Hosts Brevo (formerly Sendinblue) uses for tracking pixels and click redirects
const TRACKING_HOST = /(^|\.)(sendibt\d*\.com|sendibm\d*\.com|sendib\w*\.com|brevo\.com|sendinblue\.com|mailin\.fr|r\.sb\d*\.\w+|brevosend\.com)$/i

/** The template's fixed text must appear, in order, around the filled-in values (placeholders are {…}) */
export function matchesTemplate(text: string, template: string): boolean {
  const pieces = template.split(/\{[^{}]+\}/).map((piece) => piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`^${pieces.join('[\\s\\S]*?')}$`).test(text)
}

/** Where two strings first differ, with a little context either side (JSON-escaped so spaces and newlines show) */
export function firstDifference(actual: string, expected: string): string | undefined {
  if (actual === expected) return undefined
  let i = 0
  while (i < actual.length && i < expected.length && actual[i] === expected[i]) i++
  const around = (s: string) => JSON.stringify(s.slice(Math.max(0, i - 30), i + 30))
  return `first difference at character ${i} (lengths ${actual.length} vs ${expected.length}); received ${around(actual)}, expected ${around(expected)}`
}

export type LeadEmlCheck = {
  ok: boolean
  problems: string[]
  notes: string[]
  text?: string
  subject?: string
  messageId?: string
}

/**
 * Pass only if: the message is a single text/plain part (no HTML, no attachments), its text equals
 * `expected` exactly (line breaks compared as \n: SMTP always carries CRLF), it matches `template`
 * when given (fixed text and the trailing space), and no link points at a tracking host.
 * List-Unsubscribe and SPF/DKIM/DMARC results are reported as notes.
 */
export function checkLeadEml(raw: Buffer | string, expected: string, template?: string): LeadEmlCheck {
  const eml = parseEml(raw)
  const problems: string[] = []
  const notes: string[] = []
  const subject = decodeWords(header(eml.headers, 'subject') ?? '')
  const messageId = header(eml.headers, 'message-id')

  notes.push(`structure: ${eml.topType}${eml.parts.length > 1 || eml.topType.startsWith('multipart/') ? ` → ${eml.parts.map((p) => `${p.contentType} (${p.encoding})`).join(', ')}` : ` (${eml.parts[0]?.encoding})`}`)
  const textParts = eml.parts.filter((p) => p.contentType === 'text/plain')
  const others = eml.parts.filter((p) => p.contentType !== 'text/plain')
  if (eml.topType !== 'text/plain' || eml.parts.length !== 1) problems.push(`not a single text/plain part: ${eml.topType} with ${eml.parts.map((p) => p.contentType).join(', ')}`)

  for (const part of others.filter((p) => p.contentType === 'text/html')) {
    const pixels = part.body.match(/<img\b[^>]*>/gi)?.filter((tag) => /\b(width|height)\s*=\s*["']?[01]\b|display\s*:\s*none|[?&/]tr(ack)?[/?]/i.test(tag) || [...tag.matchAll(URL_PATTERN)].some((m) => TRACKING_HOST.test(new URL(m[0]).hostname)))
    if (pixels?.length) problems.push(`HTML part has ${pixels.length} tracking pixel(s): ${pixels.map((p) => p.slice(0, 120)).join(' | ')}`)
    if (/<br\s*\/?>/i.test(part.body)) notes.push('HTML part: newlines turned into <br/>')
  }

  let text = textParts[0]?.body.replace(/\r\n/g, '\n')
  // Every SMTP message ends with a line break (Fluent Forms' too); one there that the body doesn't have is not a change
  if (text?.endsWith('\n') && !expected.endsWith('\n')) {
    text = text.slice(0, -1)
    notes.push('text ends with the line break that ends every SMTP message')
  }
  if (text === undefined) problems.push('no text/plain part')
  else {
    const diff = firstDifference(text, expected)
    if (diff) problems.push(`text/plain differs from the lead email as built: ${diff}`)
    if (template !== undefined && !matchesTemplate(text, template)) problems.push(`text/plain does not follow the location's lead email template (${template.length} characters${template.endsWith(' ') ? ', ends with a space' : ''})`)
    const expectedUrls = new Set(expected.match(URL_PATTERN) ?? [])
    for (const url of text.match(URL_PATTERN) ?? []) {
      let host = ''
      try {
        host = new URL(url).hostname
      } catch {
        // not a URL after all
      }
      if (!expectedUrls.has(url) || TRACKING_HOST.test(host)) problems.push(`link rewritten or added: ${url}`)
    }
  }

  const unsubscribe = header(eml.headers, 'list-unsubscribe')
  if (unsubscribe) {
    const signed = allHeaders(eml.headers, 'dkim-signature').some((sig) => /\bh=[^;]*list-unsubscribe/i.test(sig.replace(/\s+/g, '')))
    notes.push(`List-Unsubscribe present${header(eml.headers, 'list-unsubscribe-post') ? ' with one-click List-Unsubscribe-Post' : ''}${signed ? ', signed into DKIM' : ''}: ${unsubscribe.slice(0, 160)}`)
  } else notes.push('no List-Unsubscribe header')

  for (const result of allHeaders(eml.headers, 'authentication-results')) {
    const pick = (key: string) => result.match(new RegExp(`\\b${key}=(\\w+)([^;]*)`, 'i'))
    const summary = ['spf', 'dkim', 'dmarc'].map((key) => {
      const m = pick(key)
      if (!m) return `${key}=?`
      const domain = m[2].match(/header\.(?:i|d|from)=@?([^\s;]+)|smtp\.mailfrom=[^@\s]*@?([^\s;]+)/i)
      return `${key}=${m[1].toLowerCase()}${domain ? ` (${domain[1] ?? domain[2]})` : ''}`
    })
    notes.push(`Authentication-Results: ${summary.join(', ')}`)
    if (/\bdmarc=(fail|none)/i.test(result)) problems.push(`DMARC did not pass: ${result.slice(0, 200)}`)
  }
  for (const sig of allHeaders(eml.headers, 'dkim-signature')) notes.push(`DKIM-Signature d=${sig.match(/\bd=([^;\s]+)/)?.[1] ?? '?'} s=${sig.match(/\bs=([^;\s]+)/)?.[1] ?? '?'}`)

  return { ok: problems.length === 0, problems, notes, text, subject, messageId }
}
