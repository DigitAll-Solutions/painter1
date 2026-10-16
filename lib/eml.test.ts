// node --test: the received-email checker passes only a single text/plain part that is the lead email as
// built, and catches what Brevo's API did to it (HTML, <br/>, tracking pixel, rewritten links).
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { checkLeadEml, decodeWords, firstDifference, matchesTemplate, parseEml } from './eml.ts'

const TEMPLATE = 'Url:\n{submission.source_url}\n\nEmail: {inputs.email}\n\nClient Tether Parsing Data:\nPARSER: {inputs.channel}, {inputs.channeldrilldown1}, {inputs.channeldrilldown2} '
const BODY = 'Url:\nhttps://www.painter1.com/knoxville/free-estimate\n\nEmail: jane@example.com\n\nClient Tether Parsing Data:\nPARSER: Paid Search, Google, knoxville-exterior '

const crlf = (lines: string[]) => lines.join('\r\n')
const AUTH = 'Authentication-Results: mx.google.com; dkim=pass header.i=@painter1.com header.s=brevo1; spf=pass (google.com: domain of bounces@painter1.com designates 1.2.3.4) smtp.mailfrom=bounces@painter1.com; dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=painter1.com'
const head = [
  'Delivered-To: me@example.com',
  AUTH,
  'DKIM-Signature: v=1; a=rsa-sha256; d=painter1.com; s=brevo1; h=from:to:subject:list-unsubscribe:',
  '\tlist-unsubscribe-post:date; bh=abc=; b=def=',
  'List-Unsubscribe: <https://unsubscribe.example/x>, <mailto:unsub@example.com>',
  'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
  'From: Painter1 <leads@painter1.com>',
  'Subject: =?utf-8?Q?[TEST]_New_lead_=E2=80=94_Jane?=',
  'Message-ID: <abc@painter1.com>',
  'MIME-Version: 1.0',
]
// The body as nodemailer writes it: quoted-printable, the trailing space as =20, ending with CRLF
const qpBody = BODY.replace(/ $/, '=20').split('\n').join('\r\n') + '\r\n'

test('passes: a single text/plain part identical to the lead email, trailing space kept', () => {
  const raw = crlf([...head, 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: quoted-printable', '', qpBody])
  const check = checkLeadEml(Buffer.from(raw, 'latin1'), BODY, TEMPLATE)
  assert.deepEqual(check.problems, [])
  assert.equal(check.ok, true)
  assert.equal(check.text, BODY)
  assert.equal(check.subject, '[TEST] New lead — Jane')
  assert.equal(check.messageId, '<abc@painter1.com>')
  assert.ok(check.notes.some((n) => n.startsWith('List-Unsubscribe present with one-click List-Unsubscribe-Post, signed into DKIM')))
  assert.ok(check.notes.includes('Authentication-Results: spf=pass (painter1.com), dkim=pass (painter1.com), dmarc=pass (painter1.com)'))
  assert.ok(check.notes.includes('DKIM-Signature d=painter1.com s=brevo1'))
})

test('passes: base64 text/plain and an .eml pasted with LF line endings', () => {
  const b64 = Buffer.from(BODY, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n')
  assert.equal(checkLeadEml(crlf(['Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '', b64]), BODY, TEMPLATE).ok, true)
  const lf = [...head, 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: quoted-printable', '', qpBody.replace(/\r\n/g, '\n')].join('\n')
  assert.deepEqual(checkLeadEml(lf, BODY, TEMPLATE).problems, [])
})

test('fails: what the Brevo API delivered — text/html, <br/>, &amp;, a tracking pixel, no text part', () => {
  const html = `Url:<br/>https://www.painter1.com/knoxville/free-estimate?a=1&amp;b=2<br/><br/>PARSER: Paid Search, Google, knoxville-exterior <img width="1" height="1" src="https://ezswxtdl.r.sb1.sendibt3.com/tr/op/abc" alt="" />`
  const raw = crlf([...head, 'Content-Type: text/html; charset=utf-8', 'Content-Transfer-Encoding: quoted-printable', '', html.replace(/=/g, '=3D')])
  const check = checkLeadEml(raw, BODY, TEMPLATE)
  assert.equal(check.ok, false)
  assert.ok(check.problems.some((p) => p.startsWith('not a single text/plain part: text/html')))
  assert.ok(check.problems.some((p) => p.startsWith('HTML part has 1 tracking pixel(s)')))
  assert.ok(check.problems.includes('no text/plain part'))
  assert.ok(check.notes.includes('HTML part: newlines turned into <br/>'))
})

test('fails: multipart with an HTML alternative, even when the text part is right', () => {
  const raw = crlf([
    ...head,
    'Content-Type: multipart/alternative; boundary="b1"',
    '',
    '--b1',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    qpBody,
    '--b1',
    'Content-Type: text/html; charset=utf-8',
    '',
    '<p>hi</p><img src="https://x.sendibt3.com/tr/op/1" width="1" height="1">',
    '--b1--',
    '',
  ])
  const check = checkLeadEml(raw, BODY, TEMPLATE)
  assert.equal(check.text, BODY)
  assert.deepEqual(parseEml(raw).parts.map((p) => p.contentType), ['text/plain', 'text/html'])
  assert.equal(check.problems.length, 2)
  assert.ok(check.problems[0].startsWith('not a single text/plain part: multipart/alternative'))
  assert.ok(check.problems[1].startsWith('HTML part has 1 tracking pixel(s)'))
})

test('fails: the trailing space lost, a link rewritten, or DMARC not passing', () => {
  const noSpace = crlf(['Content-Type: text/plain; charset=utf-8', '', BODY.trimEnd() + '\r\n'])
  const check = checkLeadEml(noSpace, BODY, TEMPLATE)
  assert.equal(check.ok, false)
  assert.match(check.problems[0], /^text\/plain differs from the lead email as built: first difference at character \d+ \(lengths \d+ vs \d+\)/)
  assert.match(check.problems[1], /542|ends with a space/)

  const rewritten = BODY.replace('https://www.painter1.com/knoxville/free-estimate', 'https://ezswxtdl.r.sb1.sendibt3.com/mk/cl/abc')
  const linkCheck = checkLeadEml(crlf(['Content-Type: text/plain; charset=utf-8', '', rewritten]), BODY, TEMPLATE)
  assert.ok(linkCheck.problems.includes('link rewritten or added: https://ezswxtdl.r.sb1.sendibt3.com/mk/cl/abc'))

  const dmarc = checkLeadEml(crlf([AUTH.replace('dmarc=pass', 'dmarc=fail'), 'Content-Type: text/plain; charset=utf-8', '', BODY]), BODY, TEMPLATE)
  assert.ok(dmarc.problems.some((p) => p.startsWith('DMARC did not pass')))
})

test('helpers: template match, first difference, encoded words', () => {
  assert.equal(matchesTemplate(BODY, TEMPLATE), true)
  assert.equal(matchesTemplate(BODY.trimEnd(), TEMPLATE), false)
  assert.equal(matchesTemplate(BODY.replace('Email:', 'E-mail:'), TEMPLATE), false)
  assert.equal(firstDifference('abc', 'abc'), undefined)
  assert.equal(firstDifference('abX', 'abc'), 'first difference at character 2 (lengths 3 vs 3); received "abX", expected "abc"')
  assert.equal(decodeWords('=?UTF-8?B?W1RFU1RdIE5ldyBsZWFk?= =?utf-8?Q?_=E2=80=94?='), '[TEST] New lead —')
})
