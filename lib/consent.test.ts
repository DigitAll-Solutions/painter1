// node --test: consent placeholder filling and the stored plain text
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { ConsentBlock } from '../sanity/lib/types.ts'
import { consentPlainText, fillConsentBlocks } from './consent.ts'

const block = (paragraphs: { text: string; marks?: string[] }[][]): ConsentBlock => ({
  _key: 'k',
  name: 'terms',
  body: paragraphs.map((spans, i) => ({ _type: 'block', _key: `b${i}`, style: 'normal', markDefs: [], children: spans.map((s, j) => ({ _type: 'span', _key: `s${j}`, marks: s.marks ?? [], text: s.text })) })),
})

test('fills {locationName} in every span, keeping marks and structure', () => {
  const [filled] = fillConsentBlocks(
    [block([[{ text: 'I agree to calls from {locationName} about ' }, { text: 'my estimate', marks: ['em'] }], [{ text: 'Texts from {locationName}. {locationName} rocks' }]])],
    'Painter1 of Knoxville',
  )
  assert.equal(consentPlainText(filled.body), 'I agree to calls from Painter1 of Knoxville about my estimate\n\nTexts from Painter1 of Knoxville. Painter1 of Knoxville rocks')
  assert.deepEqual((filled.body[0].children as { marks: string[] }[])[1].marks, ['em'])
})

test('text without a placeholder is unchanged, and the input is not mutated', () => {
  const original = block([[{ text: 'No placeholder here' }]])
  const [filled] = fillConsentBlocks([original], 'Painter1 of Maryville')
  assert.equal(consentPlainText(filled.body), 'No placeholder here')
  assert.notEqual(filled, original)
  assert.equal(consentPlainText(fillConsentBlocks([block([[{ text: '{locationName}' }]])], 'X')[0].body), 'X')
})

test('plain text: paragraphs joined by a blank line, empty paragraphs dropped, ends trimmed', () => {
  assert.equal(consentPlainText(block([[{ text: '  One  ' }], [{ text: '' }], [{ text: 'Two' }]]).body), 'One\n\nTwo')
})
