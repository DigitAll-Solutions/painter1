// node --test: About page variants, people and roles, steps, reviews, story
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Review, TeamMember } from '@/sanity/lib/types'

import { aboutPeople, aboutReviews, aboutVariant, memberRole, storyParagraphs, teamSteps, tenure } from './about.ts'

const member = (name: string, jobTitle: string, extra: Partial<TeamMember> = {}): TeamMember => ({ _key: name, name, jobTitle, ...extra })
const review = (reviewerName: string, reviewText: string, teamMemberMentioned?: string, reviewDate = '2026-09-01'): Review => ({ _key: reviewerName, reviewerName, reviewText, teamMemberMentioned, reviewDate })

test('variant: franchise structure first, then whether there are team members', () => {
  assert.equal(aboutVariant({ franchiseStructure: 'owner-with-team', teamMembers: [] }), 'team')
  assert.equal(aboutVariant({ franchiseStructure: 'owner-led', teamMembers: [member('Ann', 'Estimator')] }), 'owner')
  assert.equal(aboutVariant({ teamMembers: [member('Ann', 'Estimator')] }), 'team')
  assert.equal(aboutVariant({}), 'owner')
})

test('roles: the Studio role wins; older data reads the job title', () => {
  assert.equal(memberRole({ jobTitle: 'Project Manager' }), 'projectManager')
  assert.equal(memberRole({ jobTitle: 'Sales & Estimates' }), 'estimator')
  assert.equal(memberRole({ jobTitle: 'Office Manager' }), 'office')
  assert.equal(memberRole({ jobTitle: 'Crew lead' }), 'other')
  assert.equal(memberRole({ jobTitle: 'Crew lead', role: 'estimator' }), 'estimator')
})

test('people: owner first, sorted by role; a member who is the owner merges into the owner card', () => {
  const people = aboutPeople({
    ownerName: 'Keith Lane',
    ownerSinceYear: '2020',
    teamMembers: [member('Jarrod Davenport', 'Project Manager'), member('Ann Lee', 'Estimator', { bio: 'Measures everything twice.' }), member('Keith Lane', 'Owner', { bio: 'Runs the show.' })],
  })
  assert.deepEqual(people.map((p) => [p.name, p.role]), [['Keith Lane', 'owner'], ['Ann Lee', 'estimator'], ['Jarrod Davenport', 'projectManager']])
  assert.equal(people[0].line, 'Runs the show.')
  assert.equal(people[1].line, 'Measures everything twice.')
  assert.equal(people[2].line, 'Plans your job, checks on the crew and walks the finished work with you.')
})

test('tenure: from the year, nothing when missing or invalid', () => {
  assert.equal(tenure({ since: '2020', isOwner: true }, 2026), 'Owner since 2020')
  assert.equal(tenure({ since: '2023', isOwner: false }, 2026), '3 years with the company')
  assert.equal(tenure({ since: '2025', isOwner: false }, 2026), '1 year with the company')
  assert.equal(tenure({ since: '2026', isOwner: false }, 2026), 'Joined in 2026')
  assert.equal(tenure({ since: undefined, isOwner: false }, 2026), undefined)
  assert.equal(tenure({ since: '20', isOwner: false }, 2026), undefined)
})

test('team steps: badges from roles, "Owner" when nobody holds the role', () => {
  const people = aboutPeople({ ownerName: 'Keith Lane', teamMembers: [member('Jarrod Davenport', 'Project Manager')] })
  const steps = teamSteps(people, 'Keith')
  assert.deepEqual(steps.map((s) => s.badge), ['Owner', 'Project Manager', 'Painting crew', 'Project Manager', 'Owner'])
  assert.equal(steps[0].text, 'Keith walks the project and gives you a written, itemized estimate.')
  assert.equal(steps[1].text, 'Your project manager confirms the scope, colors and start date with you.')
  const ownerOnly = teamSteps(aboutPeople({ ownerName: 'Ana Ruiz', teamMembers: [] }), 'Ana')
  assert.deepEqual(ownerOnly.map((s) => s.badge), ['Owner', 'Owner', 'Painting crew', 'Owner', 'Owner'])
})

test('reviews: team variant matches estimator, PM, owner, then fills with owner mentions; owner variant only owner mentions', () => {
  const reviews = [
    review('A', 'Jarrod checked on us daily.', 'Jarrod Davenport', '2026-09-10'),
    review('B', 'Ann gave a clear estimate.', 'Ann', '2026-09-09'),
    review('C', 'Keith followed up personally.', undefined, '2026-09-08'),
    review('D', 'Keith fixed a spot we missed.', 'Keith', '2026-09-07'),
    review('E', 'Great crew.', 'Zulien', '2026-09-11'),
  ]
  const people = aboutPeople({ ownerName: 'Keith Lane', teamMembers: [member('Jarrod Davenport', 'Project Manager'), member('Ann Lee', 'Estimator')] })
  assert.deepEqual(aboutReviews({ reviews, ownerName: 'Keith Lane' }, 'team', people).map((r) => r.reviewerName), ['B', 'A', 'C'])
  assert.deepEqual(aboutReviews({ reviews, ownerName: 'Keith Lane' }, 'owner', people).map((r) => r.reviewerName), ['C', 'D'])
  // Nobody named: no reviews (the section hides)
  assert.deepEqual(aboutReviews({ reviews: [review('E', 'Great crew.', 'Zulien')], ownerName: 'Keith Lane' }, 'owner', people), [])
})

test('story: paragraphs on blank lines, empty when missing', () => {
  assert.deepEqual(storyParagraphs('One.\n\nTwo\nlines.\n\n\n'), ['One.', 'Two lines.'])
  assert.deepEqual(storyParagraphs(undefined), [])
})

test('meta: within 60 / 160 characters, with or without an owner name', async () => {
  const { aboutMeta } = await import('./about.ts')
  const knox = { name: 'Painter1 of Knoxville', ownerName: 'Keith Lane', address: { city: 'Knoxville' } }
  assert.deepEqual(aboutMeta(knox, 'team').title, 'About Painter1 of Knoxville | Keith Lane and Team')
  for (const variant of ['team', 'owner'] as const) {
    for (const loc of [knox, { ...knox, ownerName: undefined }, { ...knox, name: 'Painter1 of Carmel Fisher and the Greater Northern Suburbs', ownerName: 'Bartholomew Montgomery-Whitfield' }]) {
      const m = aboutMeta(loc, variant)
      assert.ok(m.title.length <= 60 && m.description.length <= 160, `${variant}: ${m.title} / ${m.description}`)
      assert.ok(!/\[|\]|undefined/.test(m.title + m.description))
    }
  }
})

test('basic tier (fixture): the About URL 404s and neither nav nor footer links to it; full tier does', async () => {
  const { aboutPageLocation } = await import('./about.ts')
  const { footerLinks, getNavLinks } = await import('./location.ts')
  const services = { interior: { title: 'Interior Painting' }, exterior: { title: 'Exterior Painting' }, cabinet: { title: 'Cabinet Painting' } }
  const basic = { slug: 'fixture-basic', locationType: 'maintenance' as const, services }
  const full = { slug: 'fixture-full', locationType: 'growth' as const, services }
  // The About page renders aboutPageLocation(...) and calls notFound() on null
  assert.equal(aboutPageLocation(basic), null)
  assert.equal(aboutPageLocation(null), null)
  assert.equal(aboutPageLocation(full), full)
  const hrefs = (links: { href: string }[]) => links.map((l) => l.href)
  assert.ok(!hrefs(getNavLinks(basic)).some((h) => h.endsWith('/about-us')))
  assert.ok(!hrefs(footerLinks(basic)).some((h) => h.endsWith('/about-us')))
  assert.deepEqual(hrefs(getNavLinks(basic)), ['/fixture-basic', '/fixture-basic/free-estimate'])
  assert.deepEqual(hrefs(footerLinks(basic)), ['/fixture-basic/free-estimate'])
  assert.ok(hrefs(getNavLinks(full)).includes('/fixture-full/about-us'))
  assert.ok(hrefs(footerLinks(full)).includes('/fixture-full/about-us'))
})

test('team owner section: "Why I built a team" only when the owner wrote about it', async () => {
  const { teamStoryHeading } = await import('./about.ts')
  assert.equal(teamStoryHeading(storyParagraphs('I added a project manager so every job gets a daily check.')), 'Why I built a team instead of doing it all myself')
  assert.equal(teamStoryHeading(storyParagraphs(undefined)), 'From the owner')
  assert.equal(teamStoryHeading(storyParagraphs('   ')), 'From the owner')
})
