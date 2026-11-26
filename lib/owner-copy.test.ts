// node --test: owner copy uses the Studio pronoun when set and the owner's first name with neutral wording
// when not (new locations), never a guessed "he". "Owner background" is shown exactly as written.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { backgroundParagraphs, onSiteStep, ownerBody } from './owner-copy.ts'

const base = { ownerBackground: undefined, ownerPersonalLine: undefined }

test('pronoun set: same sentences as before', () => {
  assert.deepEqual(ownerBody({ ...base, ownerPronoun: 'he', franchiseStructure: 'owner-led' }, 'Keith'), [
    'He does every estimate himself, runs every job himself, and is the one who walks it with you at the end.',
  ])
  assert.deepEqual(ownerBody({ ...base, ownerPronoun: 'she', franchiseStructure: 'owner-with-team' }, 'Ann'), [
    'She or one of her project leads walks every estimate in person, and she personally reviews every job before it closes.',
  ])
  assert.deepEqual(ownerBody({ ...base, ownerPronoun: 'they', franchiseStructure: 'owner-led' }, 'Sam'), [
    'They do every estimate themselves, run every job themselves, and are the one who walks it with you at the end.',
  ])
  assert.equal(onSiteStep('he', 'Keith'), 'Keith checks in with you and the crew — you have his direct number.')
})

test('no pronoun set: the first name and neutral wording, no he/she/they', () => {
  const [solo] = ownerBody({ ...base, ownerPronoun: undefined, franchiseStructure: 'owner-led' }, 'Keith')
  const [team] = ownerBody({ ...base, ownerPronoun: undefined, franchiseStructure: 'owner-with-team', ownerPersonalLine: 'Keith grew up in Farragut.' }, 'Keith')
  const step = onSiteStep(undefined, 'Keith')
  assert.equal(solo, 'Keith does every estimate personally, runs every job personally, and is the one who walks it with you at the end.')
  assert.equal(team, 'Keith or one of the project leads walks every estimate in person, and Keith personally reviews every job before it closes. Keith grew up in Farragut.')
  assert.equal(step, "Keith checks in with you and the crew — you have Keith's direct number.")
  for (const text of [solo, team, step]) assert.doesNotMatch(text, /\b(he|his|him|himself|she|her|herself|they|their|themselves)\b/i)
})

test('owner background: exactly as written, no template; the how-we-work sentences continue its last paragraph', () => {
  const story = 'Keith opened Painter1 of Knoxville in 2020 after 23 years in home improvement and remodeling.'
  assert.deepEqual(ownerBody({ ...base, ownerBackground: story, ownerPronoun: 'he', franchiseStructure: 'owner-led' }, 'Keith'), [
    `${story} He does every estimate himself, runs every job himself, and is the one who walks it with you at the end.`,
  ])
  const two = ownerBody({ ...base, ownerBackground: '  First paragraph.\r\n\r\n  Second one.\n', ownerPronoun: 'she', franchiseStructure: 'owner-led' }, 'Ann')
  assert.deepEqual(two, ['First paragraph.', 'Second one. She does every estimate herself, runs every job herself, and is the one who walks it with you at the end.'])
  assert.doesNotMatch(two.join(' '), /opened|after/)
})

test('background paragraphs: split at blank lines, trimmed, empty → none', () => {
  assert.deepEqual(backgroundParagraphs(undefined), [])
  assert.deepEqual(backgroundParagraphs(' \n \n '), [])
  assert.deepEqual(backgroundParagraphs('One line\nsame paragraph.\n\n\nNext.'), ['One line\nsame paragraph.', 'Next.'])
})
