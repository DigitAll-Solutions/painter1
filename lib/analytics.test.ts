import assert from 'node:assert/strict'
import { test } from 'node:test'

import { linkEvent } from './analytics.ts'
import { ownerOrTeam, successHeading } from './estimate-survey.ts'

const PAGE = 'https://www.painter1.com/knoxville/interior-painting'

test('linkEvent: calls, booking and free-estimate links', () => {
  assert.equal(linkEvent('tel:+18653455800', PAGE), 'phone_click')
  assert.equal(linkEvent(' TEL:865-345-5800', PAGE), 'phone_click')
  assert.equal(linkEvent('https://schedule.painter1.com/knoxville?utm_source=x', PAGE), 'booking_click')
  assert.equal(linkEvent('/knoxville/free-estimate', PAGE), 'estimate_cta_click')
  assert.equal(linkEvent('/knoxville/free-estimate?service=interior#top', PAGE), 'estimate_cta_click')
  assert.equal(linkEvent('https://www.painter1.com/knoxville/free-estimate/', PAGE), 'estimate_cta_click')
})

test('linkEvent: everything else is ignored', () => {
  for (const href of ['/knoxville', '/knoxville/free-estimate/extra', 'https://other.com/knoxville/free-estimate', 'mailto:a@b.com', 'sms:865', 'javascript:void(0)', '#top', 'https://painter1.com.evil.com/x', 'http://[bad'])
    assert.equal(linkEvent(href, PAGE), null, href)
})

test('ownerOrTeam: owner with team, owner alone, no owner', () => {
  assert.equal(ownerOrTeam('Keith Lane', 2), 'Keith or the team')
  assert.equal(ownerOrTeam('Keith Lane', 0), 'Keith')
  assert.equal(ownerOrTeam(' ', 3), 'Our team')
  assert.equal(ownerOrTeam(undefined, 0), 'Our team')
})

test('successHeading: first name, or "Thanks!" without one', () => {
  assert.equal(successHeading('Thanks, {firstName}!', 'Ann'), 'Thanks, Ann!')
  assert.equal(successHeading('Thanks, {firstName}!', ''), 'Thanks!')
  assert.equal(successHeading('Thanks, {firstName}!', undefined), 'Thanks!')
  assert.equal(successHeading('Thank you!', 'Ann'), 'Thank you!')
})
