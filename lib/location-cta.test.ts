// node --test: one Studio setting ("Main buttons go to") decides where every main CTA goes; with no valid
// booking URL everything falls back to the survey, so nothing links to an empty page.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { bookingUrl, estimateHref, footerLinks, getCta, scheduleTarget } from './location.ts'

const BOOK = 'https://schedule.painter1.com/knoxville'
const knoxville = { slug: 'knoxville' }

test('booking on with a booking page: main CTAs go straight to it, labelled "Schedule Your FREE Estimate"', () => {
  const location = { ...knoxville, bookingTarget: 'booking' as const, schedulingUrl: BOOK }
  assert.deepEqual(getCta(location), { label: 'Schedule Your FREE Estimate', href: BOOK, booking: true })
  // Service pages too: the booking page, not the survey with ?service=
  assert.deepEqual(getCta(location, 'exterior'), { label: 'Schedule Your FREE Estimate', href: BOOK, booking: true })
  assert.equal(bookingUrl(location), BOOK)
})

test('booking on but the booking page empty (Knoxville today): everything goes to the survey', () => {
  for (const schedulingUrl of [undefined, '', '   ']) {
    const location = { ...knoxville, bookingTarget: 'booking' as const, schedulingUrl }
    assert.deepEqual(getCta(location), { label: 'Get Your FREE Estimate', href: '/knoxville/free-estimate', booking: false })
    assert.equal(getCta(location, 'cabinet').href, '/knoxville/free-estimate?service=cabinet')
    assert.equal(bookingUrl(location), undefined, '"Pick a time now" hidden too')
  }
})

test('booking on with an unusable URL (http, not a URL): survey', () => {
  for (const schedulingUrl of ['http://schedule.painter1.com/knoxville', 'schedule.painter1.com/knoxville', 'javascript:alert(1)']) {
    assert.equal(getCta({ ...knoxville, bookingTarget: 'booking', schedulingUrl }).href, '/knoxville/free-estimate')
  }
})

test('survey (the default, or unset): survey everywhere even when a booking page is filled in', () => {
  for (const bookingTarget of ['survey', undefined] as const) {
    const location = { ...knoxville, bookingTarget, schedulingUrl: BOOK }
    assert.deepEqual(getCta(location, 'interior'), { label: 'Get Your FREE Estimate', href: '/knoxville/free-estimate?service=interior', booking: false })
    assert.equal(bookingUrl(location), undefined)
  }
})

test('side tab, phone bar and the footer "Free Estimate" link always go to the survey', () => {
  const location = { ...knoxville, bookingTarget: 'booking' as const, schedulingUrl: BOOK, locationType: 'growth' as const }
  assert.equal(estimateHref(location), '/knoxville/free-estimate')
  assert.equal(footerLinks(location).find((link) => link.label === 'Free Estimate')?.href, '/knoxville/free-estimate')
})

test('/<location>/schedule: the booking page when one is set (UTMs kept), else the survey (query kept)', () => {
  const search = '?utm_source=google&utm_medium=cpc&gclid=G1&ref=x'
  assert.equal(scheduleTarget({ slug: 'knoxville', schedulingUrl: BOOK }, search), `${BOOK}?utm_source=google&utm_medium=cpc&gclid=G1`)
  assert.equal(scheduleTarget({ slug: 'knoxville', schedulingUrl: BOOK }), BOOK)
  for (const schedulingUrl of [undefined, '', '  ', 'http://schedule.painter1.com/knoxville', 'not a url']) {
    assert.equal(scheduleTarget({ slug: 'knoxville', schedulingUrl }, search), `/knoxville/free-estimate${search}`)
  }
  assert.equal(scheduleTarget({ slug: 'knoxville' }), '/knoxville/free-estimate')
})
