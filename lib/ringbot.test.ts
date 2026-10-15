// node --test: Ringbot web chat iID: Studio keeps only the iID, the site accepts nothing else
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { extractRingbotId, ringbotId, ringbotSrc } from './ringbot.ts'

const ID = 'eyJpdiI6IjVGSllPd3NhREZLVXFSS21lVFpFb0E9PSIsInZhbHVlIjoiRUdMZnUxaUsxaFFGT3FGeGdlYnFldz09In0='

test('Studio: the iID is pulled out of the whole embed code, the URL or the bare value', () => {
  assert.equal(extractRingbotId(`<script src="https://api.callwidget.co/embed?iID=${ID}"></script>`), ID)
  assert.equal(extractRingbotId(`https://api.callwidget.co/embed?iID=${encodeURIComponent(ID)}`), ID)
  assert.equal(extractRingbotId(`  ${ID}  `), ID)
})

test('site: only a bare iID loads; tags, URLs and other scripts are ignored', () => {
  assert.equal(ringbotId(ID), ID)
  assert.equal(ringbotId(`<script src="https://api.callwidget.co/embed?iID=${ID}"></script>`), undefined)
  assert.equal(ringbotId(`https://api.callwidget.co/embed?iID=${ID}`), undefined)
  assert.equal(ringbotId(`${ID}"></script><script src="https://evil.example/x.js`), undefined)
  assert.equal(extractRingbotId('<script src="https://example.com/x.js"></script>'), undefined)
  assert.equal(ringbotSrc(ID), `https://api.callwidget.co/embed?iID=${encodeURIComponent(ID)}`)
})

test('empty, too short or too long: no widget', () => {
  for (const v of ['', '   ', undefined, null, 'abc', 'a'.repeat(1100)]) {
    assert.equal(ringbotId(v), undefined)
    assert.equal(extractRingbotId(v), undefined)
  }
})
