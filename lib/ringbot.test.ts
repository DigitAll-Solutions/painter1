// node --test: Ringbot web chat ID from what an editor pastes
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ringbotId, ringbotSrc } from './ringbot.ts'

const ID = 'eyJpdiI6IjVGSllPd3NhREZLVXFSS21lVFpFb0E9PSIsInZhbHVlIjoiRUdMZnUxaUsxaFFGT3FGeGdlYnFldz09In0='

test('accepts the whole embed code, the URL or the bare iID', () => {
  assert.equal(ringbotId(`<script src="https://api.callwidget.co/embed?iID=${ID}"></script>`), ID)
  assert.equal(ringbotId(`https://api.callwidget.co/embed?iID=${encodeURIComponent(ID)}`), ID)
  assert.equal(ringbotId(`  ${ID}  `), ID)
  assert.equal(ringbotSrc(ID), `https://api.callwidget.co/embed?iID=${encodeURIComponent(ID)}`)
})

test('empty or not an ID: no widget', () => {
  assert.equal(ringbotId(''), undefined)
  assert.equal(ringbotId(undefined), undefined)
  assert.equal(ringbotId('<script src="https://example.com/x.js"></script>'), undefined)
  assert.equal(ringbotId('abc'), undefined)
})
