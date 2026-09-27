import Link from 'next/link'
import { ArrowRight, BadgeCheck, ClipboardList, HardHat, House, PaintRoller, Ruler, ShieldCheck, Star, type LucideIcon } from 'lucide-react'

import CtaButton from '../CtaButton'
import SanityImage from '../SanityImage'
import { getCta } from '@/lib/location'
import type { Location, TeamMember } from '@/sanity/lib/types'

const pronouns = {
  he: { Subj: 'He', subj: 'he', poss: 'his', does: 'does', runs: 'runs', is: 'is', reviews: 'reviews', himself: 'himself' },
  she: { Subj: 'She', subj: 'she', poss: 'her', does: 'does', runs: 'runs', is: 'is', reviews: 'reviews', himself: 'herself' },
  they: { Subj: 'They', subj: 'they', poss: 'their', does: 'do', runs: 'run', is: 'are', reviews: 'review', himself: 'themselves' },
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export default function OwnerSection({ location }: { location: Location }) {
  const fullName = location.ownerName
  if (!fullName) return null

  const first = fullName.split(' ')[0]
  const city = location.address?.city ?? location.name
  const p = pronouns[location.ownerPronoun ?? 'he']
  const withTeam = location.franchiseStructure === 'owner-with-team'
  const cta = getCta(location)
  const photo = location.ownerActionPhoto ?? location.ownerPhoto
  const caption = location.ownerActionPhoto?.caption
  const since = location.ownerSinceYear

  const opened = `${first} opened ${location.name}${since ? ` in ${since}` : ''}${
    location.ownerBackground ? ` after ${location.ownerBackground}` : ''
  }.`
  const body = withTeam
    ? `${opened} ${p.Subj} or one of ${p.poss} project leads walks every estimate in person, and ${p.subj} personally ${p.reviews} every job before it closes.${
        location.ownerPersonalLine ? ` ${location.ownerPersonalLine}` : ''
      }`
    : `${opened} ${p.Subj} ${p.does} every estimate ${p.himself}, ${p.runs} every job ${p.himself}, and ${p.is} the one who walks it with you at the end.`

  return (
    <section className="bg-mist py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-cta-dark uppercase">Why choose us</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl">
            Why {city} Homeowners Call <span className="text-brand-blue">{first}</span> First
          </h2>
          <p className="mt-5 text-lg text-slate-600">
            {withTeam
              ? 'A local owner and a small, named team — the people you meet at the estimate are the people who run your job.'
              : 'Your estimator, your project manager, and the owner are the same person. No hand-offs, no sales rep, one phone number.'}
          </p>
        </div>

        {/* Owner card */}
        <div className="mt-12 grid overflow-hidden rounded-3xl bg-white shadow-[0_20px_50px_-20px_rgb(11_27_51/0.25)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {photo && (
            <div className="relative min-h-80 md:min-h-full">
              <SanityImage image={photo} fill sizes="(min-width: 768px) 480px, 100vw" className="object-cover" />
              {caption && (
                <p className="absolute bottom-4 left-4 rounded-full bg-ink/85 px-4 py-1.5 text-xs font-bold text-white backdrop-blur">
                  {caption}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col justify-center p-7 md:p-10 lg:p-12">
            <h3 className="text-3xl font-extrabold tracking-tight">{fullName}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {withTeam ? 'Owner' : 'Owner & Estimator'}, {location.name}
              {since && ` · Since ${since}`}
            </p>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">{body}</p>
            {location.ownerQuote && (
              <figure className="mt-6 rounded-2xl border-l-4 border-brand-orange bg-orange-50 p-5">
                <blockquote className="text-lg font-medium text-ink">&ldquo;{location.ownerQuote}&rdquo;</blockquote>
                <figcaption className="mt-2 text-sm font-bold text-cta">
                  — {location.ownerQuoteAttribution ?? `${fullName}, Owner`}
                </figcaption>
              </figure>
            )}
            <CtaButton href={cta.href} className="mt-7 self-start">
              {withTeam ? `Get My Estimate from ${first}'s Team` : `Book My Estimate with ${first}`}
            </CtaButton>
          </div>
        </div>

        {withTeam ? <TeamStrip location={location} first={first} /> : <ProcessStrip first={first} p={p} />}

        <TrustStrip location={location} city={city} />
      </div>
    </section>
  )
}

function ProcessStrip({ first, p }: { first: string; p: (typeof pronouns)[keyof typeof pronouns] }) {
  const steps: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: Ruler, title: 'On-site estimate & color consult', text: `${first} measures, checks surfaces, and talks through colors and products.` },
    { icon: ClipboardList, title: 'Written scope & schedule', text: 'Prep plan, products, colors, and start date — in writing before work begins.' },
    { icon: HardHat, title: 'On-site during the job', text: `${first} checks in with you and the crew — you have ${p.poss} direct number.` },
    { icon: BadgeCheck, title: 'Final walkthrough & sign-off', text: "The job closes when you're satisfied — backed by the 2-year warranty." },
  ]

  return (
    <div className="mt-14">
      <h4 className="text-2xl font-extrabold tracking-tight">From first visit to final walkthrough, you deal with {first}</h4>
      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-ink text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-xs font-extrabold tracking-[0.15em] text-cta uppercase">Step {i + 1}</span>
            </div>
            <h5 className="mt-4 text-lg font-extrabold">{title}</h5>
            <p className="mt-1.5 text-slate-600">{text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function TeamStrip({ location, first }: { location: Location; first: string }) {
  const team = location.teamMembers ?? []
  if (!team.length) return null

  return (
    <div className="mt-14">
      <h4 className="text-2xl font-extrabold tracking-tight">Who you&rsquo;ll meet</h4>
      <p className="mt-1 text-slate-600">Your estimate and your project are run by the same person, start to finish.</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {team.map((member) => (
          <TeamCard key={member._key} member={member} first={first} />
        ))}
      </ul>
    </div>
  )
}

function TeamCard({ member, first }: { member: TeamMember; first: string }) {
  return (
    <li className="grid grid-cols-[8rem_minmax(0,1fr)] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <div className="relative min-h-40 bg-ink">
        {member.photo ? (
          <SanityImage image={member.photo} fill sizes="160px" className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold text-white/80" aria-hidden>
            {initials(member.name)}
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-lg font-extrabold">{member.name}</p>
        <p className="text-sm font-semibold text-slate-500">
          {member.jobTitle} with {first}
          {member.withOwnerSince && ` since ${member.withOwnerSince}`}
        </p>
        {member.bio && <p className="mt-2 text-slate-600">{member.bio}</p>}
        {member.namedInReviews && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-cta ring-1 ring-orange-200">
            <Star className="size-3.5 fill-brand-orange text-brand-orange" aria-hidden /> Named in Google reviews
          </p>
        )}
      </div>
    </li>
  )
}

function TrustStrip({ location, city }: { location: Location; city: string }) {
  const base = `/${location.slug}`
  const full = location.locationType !== 'maintenance'
  const items: { icon: LucideIcon; title: string; sub?: string; href?: string }[] = [
    { icon: ShieldCheck, title: '2-Year Workmanship Warranty', sub: "See what's covered", href: full ? `${base}/warranty` : undefined },
    { icon: PaintRoller, title: 'Sherwin-Williams Paints' },
  ]
  if (location.projectsCount) {
    const split = [
      location.interiorProjectsCount && `${location.interiorProjectsCount.toLocaleString('en-US')} interior`,
      location.exteriorProjectsCount && `${location.exteriorProjectsCount.toLocaleString('en-US')} exterior`,
    ].filter(Boolean)
    items.push({ icon: House, title: `${location.projectsCount.toLocaleString('en-US')} Projects in ${city}`, sub: split.join(' · ') || undefined })
  }
  if (location.rating) {
    items.push({
      icon: Star,
      title: `${location.rating} ★ on Google`,
      sub: location.reviewsCount ? `${location.reviewsCount} verified reviews` : undefined,
      href: full ? `${base}/reviews` : undefined,
    })
  }

  return (
    <ul className={`mt-10 grid gap-6 rounded-3xl bg-ink p-8 text-white sm:grid-cols-2 md:p-10 ${items.length > 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
      {items.map(({ icon: Icon, title, sub, href }) => (
        <li key={title}>
          <Icon className="size-7 text-brand-orange" aria-hidden />
          <p className="mt-3 font-extrabold">{title}</p>
          {sub &&
            (href ? (
              <Link href={href} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-orange-300 underline-offset-4 hover:underline">
                {sub} <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            ) : (
              <p className="mt-1 text-sm text-white/70">{sub}</p>
            ))}
        </li>
      ))}
    </ul>
  )
}
