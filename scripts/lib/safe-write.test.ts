// node --test: the seed/migration write guard never overwrites or removes content without --force
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getPath, isEmpty, SafeWrite } from './safe-write.ts'

const block = (text: string) => ({ _type: 'block', _key: 'p0', style: 'normal', markDefs: [], children: [{ _type: 'span', _key: 's0', text, marks: [] }] })
const doc = {
  title: 'Interior Painting',
  heroSubtitle: '',
  whatWePaint: [
    { _key: 'walls', title: 'Walls', body: [block('Rick’s copy, edited in Studio')] },
    { _key: 'doors', title: 'Doors', body: [block('  ')] },
  ],
  faqs: [{ _key: 'a', question: 'Q', answer: 'A' }],
  ownerCardVariant: 'compact',
  showPageHeader: null,
}

test('paths: fields, keyed list items and indexes', () => {
  assert.equal(getPath(doc, 'title'), 'Interior Painting')
  assert.equal(getPath(doc, 'whatWePaint[_key=="doors"].title'), 'Doors')
  assert.equal(getPath(doc, 'faqs[0].answer'), 'A')
  assert.equal(getPath(doc, 'whatWePaint[_key=="nope"].title'), undefined)
})

test('empty: blank text, empty lists, rich text with no words, images without a file', () => {
  for (const v of [undefined, null, '', '  ', [], [block(' ')], { _type: 'image', alt: 'x' }]) assert.ok(isEmpty(v), JSON.stringify(v))
  for (const v of ['x', [block('x')], { _type: 'image', asset: { _ref: 'image-1' } }, 0, false]) assert.ok(!isEmpty(v), JSON.stringify(v))
})

test('a re-run fills empty fields only; content is kept, the same value is skipped', () => {
  const guard = new SafeWrite('test')
  const { set, unset } = guard.plan('service-interior-painting', doc, {
    set: {
      title: 'Interior Painting', // same
      heroSubtitle: 'Clean lines.', // empty → fill
      'whatWePaint[_key=="walls"].body': [block('Seed copy')], // edited → kept
      'whatWePaint[_key=="doors"].body': [block('Seed copy')], // blank → fill
      faqs: [{ _key: 'a', question: 'Q', answer: 'Seed answer' }], // list with content → kept
    },
    unset: ['showPageHeader', 'ownerCardVariant'], // null: nothing to remove; content → kept
  })
  assert.deepEqual(Object.keys(set), ['heroSubtitle', 'whatWePaint[_key=="doors"].body'])
  assert.deepEqual(unset, [])
  assert.deepEqual(guard.kept.map((p) => p.path), ['whatWePaint[_key=="walls"].body', 'faqs', 'ownerCardVariant'])
  assert.equal(guard.changes.length, 2)
})

test('a migration replaces only the exact old value it names', () => {
  const guard = new SafeWrite('test')
  const expect = { title: { value: 'Interior Painting' }, ownerCardVariant: { test: (v: unknown) => v === 'featured' || v === 'compact', label: 'featured or compact' } }
  const fresh = guard.plan('a', doc, { set: { title: 'Interior House Painting' }, unset: ['ownerCardVariant'], expect })
  assert.deepEqual(fresh.set, { title: 'Interior House Painting' })
  assert.deepEqual(fresh.unset, ['ownerCardVariant'])
  // Edited since: the old value isn't there any more, so it's kept
  const edited = guard.plan('b', { ...doc, title: 'Interior Painting & Drywall', ownerCardVariant: 'custom' }, { set: { title: 'Interior House Painting' }, unset: ['ownerCardVariant'], expect })
  assert.deepEqual(edited.set, {})
  assert.deepEqual(edited.unset, [])
  assert.equal(guard.kept.length, 2)
})

test('a re-run on data it already wrote reports 0 changes', () => {
  const guard = new SafeWrite('test')
  guard.plan('a', doc, { set: { title: doc.title, faqs: doc.faqs, 'whatWePaint[_key=="walls"].body': doc.whatWePaint[0].body }, unset: ['showPageHeader'] })
  assert.equal(guard.create('a', true), false)
  assert.equal(guard.changes.length, 0)
  assert.equal(guard.kept.length, 0)
})
