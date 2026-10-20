// The homepage owner section's sentences about the owner. With a pronoun set in Studio they use it; with
// none set (the default for new locations) they use the owner's first name and neutral wording, never a
// guessed "he". Tested in owner-copy.test.ts.
import type { Location } from '@/sanity/lib/types'

type Words = { Subj: string; subj: string; poss: string; possOwn: string; does: string; runs: string; is: string; reviews: string; self: string }

export function ownerWords(pronoun: Location['ownerPronoun'], first: string): Words {
  switch (pronoun) {
    case 'he':
      return { Subj: 'He', subj: 'he', poss: 'his', possOwn: 'his', does: 'does', runs: 'runs', is: 'is', reviews: 'reviews', self: 'himself' }
    case 'she':
      return { Subj: 'She', subj: 'she', poss: 'her', possOwn: 'her', does: 'does', runs: 'runs', is: 'is', reviews: 'reviews', self: 'herself' }
    case 'they':
      return { Subj: 'They', subj: 'they', poss: 'their', possOwn: 'their', does: 'do', runs: 'run', is: 'are', reviews: 'review', self: 'themselves' }
    default:
      // "Keith or one of the project leads…", "Keith does every estimate personally", "Keith's direct number"
      return { Subj: first, subj: first, poss: 'the', possOwn: `${first}'s`, does: 'does', runs: 'runs', is: 'is', reviews: 'reviews', self: 'personally' }
  }
}

type OwnerInfo = Pick<Location, 'name' | 'ownerPronoun' | 'ownerSinceYear' | 'ownerBackground' | 'ownerPersonalLine' | 'franchiseStructure'>

/** The paragraph on the owner card */
export function ownerBody(location: OwnerInfo, first: string): string {
  const p = ownerWords(location.ownerPronoun, first)
  const since = location.ownerSinceYear
  const opened = `${first} opened ${location.name}${since ? ` in ${since}` : ''}${location.ownerBackground ? ` after ${location.ownerBackground}` : ''}.`
  return location.franchiseStructure === 'owner-with-team'
    ? `${opened} ${p.Subj} or one of ${p.poss} project leads walks every estimate in person, and ${p.subj} personally ${p.reviews} every job before it closes.${
        location.ownerPersonalLine ? ` ${location.ownerPersonalLine}` : ''
      }`
    : `${opened} ${p.Subj} ${p.does} every estimate ${p.self}, ${p.runs} every job ${p.self}, and ${p.is} the one who walks it with you at the end.`
}

/** Step 3 of the owner-led process strip */
export const onSiteStep = (pronoun: Location['ownerPronoun'], first: string) =>
  `${first} checks in with you and the crew — you have ${ownerWords(pronoun, first).possOwn} direct number.`
