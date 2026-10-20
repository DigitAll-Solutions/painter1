// node --test: owner copy uses the Studio pronoun when set and the owner's first name with neutral wording
// when not (new locations), never a guessed "he".
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { onSiteStep, ownerBody } from './owner-copy.ts'

const base = { name: 'Painter1 of Knoxville', ownerSinceYear: '2002', ownerBackground: undefined, ownerPersonalLine: undefined }

test('pronoun set: same sentences as before', () => {
  assert.equal(
    ownerBody({ ...base, ownerPronoun: 'he', franchiseStructure: 'owner-led' }, 'Keith'),
    'Keith opened Painter1 of Knoxville in 2002. He does every estimate himself, runs every job himself, and is the one who walks it with you at the end.',
  )
  assert.equal(
    ownerBody({ ...base, ownerPronoun: 'she', franchiseStructure: 'owner-with-team' }, 'Ann'),
    'Ann opened Painter1 of Knoxville in 2002. She or one of her project leads walks every estimate in person, and she personally reviews every job before it closes.',
  )
  assert.equal(
    ownerBody({ ...base, ownerPronoun: 'they', franchiseStructure: 'owner-led' }, 'Sam'),
    'Sam opened Painter1 of Knoxville in 2002. They do every estimate themselves, run every job themselves, and are the one who walks it with you at the end.',
  )
  assert.equal(onSiteStep('he', 'Keith'), 'Keith checks in with you and the crew — you have his direct number.')
})

test('no pronoun set: the first name and neutral wording, no he/she/they', () => {
  const solo = ownerBody({ ...base, ownerPronoun: undefined, franchiseStructure: 'owner-led' }, 'Keith')
  const team = ownerBody({ ...base, ownerPronoun: undefined, franchiseStructure: 'owner-with-team', ownerPersonalLine: 'Keith grew up in Farragut.' }, 'Keith')
  const step = onSiteStep(undefined, 'Keith')
  assert.equal(solo, 'Keith opened Painter1 of Knoxville in 2002. Keith does every estimate personally, runs every job personally, and is the one who walks it with you at the end.')
  assert.equal(
    team,
    'Keith opened Painter1 of Knoxville in 2002. Keith or one of the project leads walks every estimate in person, and Keith personally reviews every job before it closes. Keith grew up in Farragut.',
  )
  assert.equal(step, "Keith checks in with you and the crew — you have Keith's direct number.")
  for (const text of [solo, team, step]) assert.doesNotMatch(text, /\b(he|his|him|himself|she|her|herself|they|their|themselves)\b/i)
})
