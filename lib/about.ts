// About page (/[location]/about-us): one template, two variants, picked from the location's data.
// Pure functions only (tested in about.test.ts); the page and its sections render what these return,
// and anything missing is left out (never a placeholder).
import type { Location, Review, TeamMember } from '@/sanity/lib/types'

import { hasAboutPage } from './location.ts'
import { cityOrPlace } from './place.ts'

export const ABOUT_PATH = 'about-us' // the live site's URL (/knoxville/about-us/)


export type AboutVariant = 'owner' | 'team'

/** The location the About page renders, or null (404): unknown locations and basic tier have no About page */
export const aboutPageLocation = <T extends Pick<Location, 'locationType'>>(location: T | null | undefined): T | null => (location && hasAboutPage(location) ? location : null)

/**
 * Team variant's owner section: the "why I built a team" heading only over the owner's own words on
 * that; otherwise a neutral heading over the general story (headings never promise missing content).
 */
export const teamStoryHeading = (teamStory: string[]) => (teamStory.length ? 'Why I built a team instead of doing it all myself' : 'From the owner')

/** "Owner with team" / "Owner-led" from the location; unset falls back to whether it lists team members */
export function aboutVariant(location: Pick<Location, 'franchiseStructure' | 'teamMembers'>): AboutVariant {
  if (location.franchiseStructure === 'owner-with-team') return 'team'
  if (location.franchiseStructure === 'owner-led') return 'owner'
  return (location.teamMembers ?? []).length ? 'team' : 'owner'
}

// ---------- People and roles ----------
export const ROLES = ['owner', 'estimator', 'projectManager', 'office', 'other'] as const
export type Role = (typeof ROLES)[number]
export const ROLE_LABEL: Record<Role, string> = { owner: 'Owner', estimator: 'Estimator', projectManager: 'Project Manager', office: 'Office & Scheduling', other: 'Team' }

/** The Studio role, or one read from the job title for older data ("Project Manager" → projectManager) */
export function memberRole(member: Pick<TeamMember, 'role' | 'jobTitle'>): Role {
  if (member.role && (ROLES as readonly string[]).includes(member.role)) return member.role as Role
  const title = member.jobTitle?.toLowerCase() ?? ''
  if (/owner/.test(title)) return 'owner'
  if (/estimat|sales|consult/.test(title)) return 'estimator'
  if (/project manager|\bpm\b|supervis/.test(title)) return 'projectManager'
  if (/office|schedul|admin|coordinat/.test(title)) return 'office'
  return 'other'
}

/** What each role does for the customer, used on a card when the person has no line of their own */
const ROLE_LINE: Record<Role, string> = {
  owner: 'Sets the standard, trains the team, reviews quality and makes the final call on warranty work.',
  estimator: 'Walks your project with you and writes your itemized estimate.',
  projectManager: 'Plans your job, checks on the crew and walks the finished work with you.',
  office: 'Books your estimate, sets your start date and keeps you updated.',
  other: '',
}

export type Person = { key: string; name: string; first: string; role: Role; title: string; line?: string; photo?: TeamMember['photo']; since?: string; isOwner: boolean }

const firstName = (name?: string) => name?.trim().split(/\s+/)[0] ?? ''

/** Owner first, then estimators, project managers, office, others (a member marked Owner merges into the owner) */
export function aboutPeople(location: Pick<Location, 'ownerName' | 'ownerPhoto' | 'ownerSinceYear' | 'teamMembers'>): Person[] {
  const ownerName = location.ownerName?.trim()
  const members = (location.teamMembers ?? []).filter((m) => m.name?.trim())
  const ownerMember = members.find((m) => memberRole(m) === 'owner' || (ownerName && m.name.trim() === ownerName))
  const people: Person[] = []
  if (ownerName)
    people.push({
      key: 'owner',
      name: ownerName,
      first: firstName(ownerName),
      role: 'owner',
      title: 'Owner',
      line: ownerMember?.bio?.trim() || ROLE_LINE.owner,
      photo: ownerMember?.photo ?? location.ownerPhoto,
      since: location.ownerSinceYear?.trim() || ownerMember?.withOwnerSince,
      isOwner: true,
    })
  for (const member of members) {
    if (member === ownerMember && ownerName) continue
    const role = memberRole(member)
    people.push({
      key: member._key,
      name: member.name.trim(),
      first: firstName(member.name),
      role,
      title: member.jobTitle?.trim() || ROLE_LABEL[role],
      line: member.bio?.trim() || ROLE_LINE[role] || undefined,
      photo: member.photo,
      since: member.withOwnerSince?.trim() || undefined,
      isOwner: false,
    })
  }
  return people.sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role))
}

/** "3 years with the company" (owner: "Owner since 2020"); nothing without a valid year */
export function tenure(person: Pick<Person, 'since' | 'isOwner'>, year = new Date().getFullYear()) {
  const since = Number(person.since)
  if (!/^\d{4}$/.test(person.since ?? '') || since > year) return undefined
  if (person.isOwner) return `Owner since ${since}`
  const years = year - since
  return years < 1 ? `Joined in ${since}` : `${years} year${years === 1 ? '' : 's'} with the company`
}

// ---------- How your project works ----------
export type Step = { title: string; badge: string; text: string }

export function ownerSteps(owner: string): Step[] {
  const who = owner || 'The owner'
  return [
    { title: 'Free on-site estimate', badge: 'Owner', text: `${who} walks the project with you, answers questions and puts a written, itemized estimate in your hands.` },
    { title: 'Colors & scheduling', badge: 'Owner', text: 'Help choosing colors and sheens, and a start date that works around your schedule.' },
    { title: 'The painting', badge: 'Painting crew', text: `A vetted crew does the prep and painting to ${owner ? `${owner}'s` : 'our'} standards, while ${owner || 'the owner'} checks in on progress.` },
    { title: 'Walkthrough & follow-up', badge: 'Owner', text: `${who} walks the finished job with you, fixes anything that isn't right, and follows up afterward.` },
  ]
}

/** Team variant: the badge is whoever holds the role here, or "Owner" when nobody does */
export function teamSteps(people: Person[], owner: string): Step[] {
  const has = (role: Role) => people.some((p) => p.role === role)
  const who = (role: Role, phrase: string) => (has(role) ? { badge: ROLE_LABEL[role], subject: phrase } : { badge: 'Owner', subject: owner || 'The owner' })
  const est = who('estimator', 'Your estimator')
  const pm = who('projectManager', 'Your project manager')
  const pmChecking = has('projectManager') ? 'your project manager' : owner || 'the owner'
  return [
    { title: 'Free on-site estimate', badge: est.badge, text: `${est.subject} walks the project and gives you a written, itemized estimate.` },
    { title: 'Plan & colors', badge: pm.badge, text: `${pm.subject} confirms the scope, colors and start date with you.` },
    { title: 'The painting', badge: 'Painting crew', text: `A vetted crew does the prep and painting, with ${pmChecking} checking in.` },
    { title: 'Final walkthrough', badge: pm.badge, text: `You walk the finished job together with ${has('projectManager') ? 'your project manager' : owner || 'the owner'}, and anything that isn't right gets fixed.` },
    { title: 'Follow-up', badge: 'Owner', text: `${owner || 'The owner'} or the office follows up to make sure you're happy, and handles any warranty request.` },
  ]
}

// ---------- Reviews ----------
const mentions = (review: Review, first: string) => {
  if (!first) return false
  const name = new RegExp(`\\b${first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  return name.test(review.teamMemberMentioned ?? '') || name.test(review.reviewText ?? '')
}
const newest = (a: Review, b: Review) => (b.reviewDate ?? '').localeCompare(a.reviewDate ?? '')

/**
 * Owner variant: up to 2 reviews naming the owner. Team variant: one review each for the estimator,
 * project manager and owner (matched by name), then reviews naming the owner, up to 3.
 */
export function aboutReviews(location: Pick<Location, 'reviews' | 'ownerName'>, variant: AboutVariant, people: Person[]): Review[] {
  const reviews = [...(location.reviews ?? [])].sort(newest)
  const owner = firstName(location.ownerName)
  if (variant === 'owner') return reviews.filter((r) => mentions(r, owner)).slice(0, 2)
  const picked: Review[] = []
  for (const role of ['estimator', 'projectManager', 'owner'] as const) {
    const person = people.find((p) => p.role === role)
    const review = person && reviews.find((r) => !picked.includes(r) && mentions(r, person.first))
    if (review) picked.push(review)
  }
  for (const review of reviews) if (picked.length < 3 && !picked.includes(review) && mentions(review, owner)) picked.push(review)
  return picked.slice(0, 3)
}

// ---------- Story ----------
/** The owner's story (Studio "Owner story") as paragraphs, split on blank lines */
export const storyParagraphs = (text?: string) => (text ?? '').split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean)

// ---------- Meta (title ≤ 60, description ≤ 160 characters; shorter fallbacks when names are long) ----------
const fit = (limit: number, ...options: string[]) => options.find((o) => o.length <= limit) ?? options[options.length - 1].slice(0, limit)

export function aboutMeta(location: Pick<Location, 'name' | 'ownerName' | 'address'>, variant: AboutVariant) {
  const owner = location.ownerName?.trim()
  const city = cityOrPlace(location)
  const title =
    variant === 'team'
      ? fit(60, owner ? `About ${location.name} | ${owner} and Team` : `About ${location.name} | Our Team`, `About ${location.name}`)
      : fit(60, owner ? `About ${location.name} | Meet ${owner}` : `About ${location.name}`, `About ${location.name}`)
  const description =
    variant === 'team'
      ? fit(
          160,
          `Meet ${owner ? `${owner} and ` : ''}the ${location.name} team: who walks your estimate, runs your project and stands behind the 2-year workmanship warranty.`,
          `Meet the ${location.name} team: who walks your estimate, runs your project and stands behind your warranty.`,
          `Meet the ${city} Painter1 team.`,
        )
      : fit(
          160,
          `Meet ${owner ? `${owner}, owner of ${location.name},` : `the owner of ${location.name},`} who gives every estimate, checks every finished job and stands behind the 2-year workmanship warranty.`,
          `Meet ${owner || 'the owner'} of ${location.name}: every estimate, every finished job and the 2-year warranty, handled by the owner.`,
          `Meet the owner of Painter1 in ${city}.`,
        )
  return { title, description }
}
