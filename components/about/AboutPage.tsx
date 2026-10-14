import { ArrowDown, ArrowRight, BadgeCheck, Paintbrush, Phone, ShieldCheck, Star, Users } from 'lucide-react'

import Breadcrumbs from '@/components/Breadcrumbs'
import CTASection from '@/components/CTASection'
import CtaButton from '@/components/CtaButton'
import SanityImage from '@/components/SanityImage'
import { Accent } from '@/components/Section'
import { aboutPeople, aboutReviews, aboutVariant, networkLine, NETWORK_PAGE_URL, ownerSteps, ROLE_LABEL, storyParagraphs, teamSteps, tenure, type Person, type Step } from '@/lib/about'
import { getCta, getWarrantyHref, telHref } from '@/lib/location'
import type { Location, Review } from '@/sanity/lib/types'

const TEAM_ANCHOR = 'team'
const eyebrow = 'text-sm font-bold tracking-[0.2em] text-cta-dark uppercase'
const h2 = 'mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl'

/**
 * The location's About page. Variant from the data (lib/about.ts): "owner" (owner-led) or "team"
 * (owner with estimators / project managers). Every section and line hides when its data is missing.
 */
export default function AboutPage({ location, networkCount }: { location: Location; networkCount: number }) {
  const variant = aboutVariant(location)
  const city = location.address?.city?.trim() || location.name
  const owner = location.ownerName?.trim()
  const first = owner?.split(/\s+/)[0] ?? ''
  const people = aboutPeople(location)
  const reviews = aboutReviews(location, variant, people)
  const cta = getCta(location)
  const tel = telHref(location.phone)
  const crumbs = [{ name: location.name, href: `/${location.slug}` }, { name: 'About' }]
  const story = storyParagraphs(location.ownerBio)
  const quote = location.ownerQuote?.trim()

  return (
    <>
      {variant === 'team' ? (
        <TeamHero location={location} city={city} owner={owner} people={people} cta={cta} crumbs={crumbs} />
      ) : (
        <OwnerHero location={location} city={city} owner={owner} first={first} cta={cta} tel={tel} crumbs={crumbs} />
      )}

      {variant === 'team' ? (
        <TeamOwnerStory location={location} owner={owner} story={story} quote={quote} />
      ) : (
        <OwnerWords owner={owner} first={first} attribution={location.ownerQuoteAttribution} story={story} quote={quote} />
      )}

      {variant === 'team' && <TeamCards people={people} />}

      <Steps
        steps={variant === 'team' ? teamSteps(people, first) : ownerSteps(first)}
        title={
          variant === 'team' ? (
            <>
              A named person <Accent>at every step</Accent>
            </>
          ) : (
            <>
              One point of contact, <Accent>start to finish</Accent>
            </>
          )
        }
        intro={variant === 'owner' ? 'The person who quotes your job is the person who checks it.' : undefined}
      />

      <Standards location={location} variant={variant} first={first} people={people} />

      <StatsAndReviews location={location} city={city} reviews={reviews} />

      <section className="bg-mist py-14 md:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Locally owned. Backed by Painter1.</h2>
            <p className="mt-3 text-lg text-slate-700">{networkLine(location.name, networkCount)}</p>
          </div>
          {NETWORK_PAGE_URL && (
            <a href={NETWORK_PAGE_URL} className="inline-flex shrink-0 items-center gap-2 font-bold text-brand-blue-text hover:underline">
              About the Painter1 network <ArrowRight className="size-4" aria-hidden />
            </a>
          )}
        </div>
      </section>

      {variant === 'team' ? (
        <CTASection location={location} title="Ready to meet the team?" subtitle={people.some((p) => p.role === 'estimator') ? 'Schedule a free on-site estimate with one of our estimators.' : 'Schedule a free on-site estimate.'} />
      ) : (
        <CTASection location={location} title={first ? `Get your estimate from ${first}` : 'Get your free estimate'} subtitle={first ? 'Free, on-site, and with the owner, not a salesperson.' : 'Free, on-site, and no obligation.'} />
      )}
    </>
  )
}

// ---------- Heroes ----------
type Cta = ReturnType<typeof getCta>

function HeroText({ crumbs, city, title, intro, children }: { crumbs: { name: string; href?: string }[]; city: string; title: React.ReactNode; intro?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-slate-300">
        <Breadcrumbs crumbs={crumbs} />
      </div>
      <p className="mt-6 text-sm font-bold tracking-[0.2em] text-orange-300 uppercase">About Painter1 of {city}</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance md:text-5xl lg:text-6xl">{title}</h1>
      {intro && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">{intro}</p>}
      <div className="mt-8 flex flex-wrap gap-3">{children}</div>
    </div>
  )
}

function OwnerHero({ location, city, owner, first, cta, tel, crumbs }: { location: Location; city: string; owner?: string; first: string; cta: Cta; tel?: string; crumbs: { name: string; href?: string }[] }) {
  const photo = location.ownerActionPhoto ?? location.ownerPhoto
  const since = tenure({ since: location.ownerSinceYear, isOwner: true })
  const rating = location.rating && location.reviewsCount ? { value: location.rating, count: location.reviewsCount } : undefined
  return (
    <section className="bg-navy text-white">
      <div className={`mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 md:py-16 lg:py-20 ${photo ? 'lg:grid-cols-[7fr_5fr]' : ''}`}>
        <HeroText
          crumbs={crumbs}
          city={city}
          title={
            owner ? (
              <>
                Meet {owner}, the owner who handles your job <span className="text-orange-300">start to finish</span>
              </>
            ) : (
              <>
                The owner handles your job <span className="text-orange-300">start to finish</span>
              </>
            )
          }
          intro={`When you call ${location.name}, you talk to the owner. ${first || 'The owner'} gives every estimate, checks every finished job and follows up afterward. You'll never be handed off to a salesperson.`}
        >
          <CtaButton href={cta.href} size="md" className="focus-visible:outline-white">
            {first ? `Get Your Estimate from ${first}` : cta.label}
          </CtaButton>
          {tel && (
            <CtaButton href={tel} variant="outline" size="md" className="focus-visible:outline-white">
              <Phone className="size-5" aria-hidden /> Call {location.phone}
            </CtaButton>
          )}
        </HeroText>
        {photo && (
          <div className="relative">
            <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-ink/40 sm:aspect-4/3 lg:aspect-4/5">
              <SanityImage image={photo} fill preload quality={70} sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" />
            </div>
            {(since || rating) && (
              <div className="absolute -bottom-5 left-4 rounded-2xl bg-white px-5 py-3 text-ink shadow-xl">
                {since && <p className="text-xs font-bold tracking-[0.16em] text-cta-dark uppercase">{since}</p>}
                {rating && (
                  <p className="mt-0.5 flex items-center gap-1 font-bold">
                    {rating.value}
                    <Star className="size-4 fill-brand-orange text-brand-orange" aria-hidden />
                    <span className="sr-only">out of 5,</span> · {rating.count} Google reviews
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function TeamHero({ location, city, owner, people, cta, crumbs }: { location: Location; city: string; owner?: string; people: Person[]; cta: Cta; crumbs: { name: string; href?: string }[] }) {
  // Only name the roles this location really has
  const plural = (role: Person['role'], one: string, many: string) => {
    const n = people.filter((p) => p.role === role).length
    return n ? (n === 1 ? `a dedicated ${one}` : `dedicated ${many}`) : ''
  }
  const roles = [plural('estimator', 'estimator', 'estimators'), plural('projectManager', 'project manager', 'project managers')].filter(Boolean)
  const owned = owner ? `Locally owned by ${owner}${roles.length ? `, with ${roles.join(' and ')}` : ''}.` : ''
  return (
    <section className="bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 lg:py-20">
        <HeroText
          crumbs={crumbs}
          city={city}
          title={
            <>
              The {city} team behind <span className="text-orange-300">every Painter1 job</span>
            </>
          }
          intro={`${owned} Every job has a named person accountable for it, and the owner's standard behind it.`.trim()}
        >
          <CtaButton href={cta.href} size="md" className="focus-visible:outline-white">
            {cta.label}
          </CtaButton>
          <CtaButton href={`#${TEAM_ANCHOR}`} variant="outline" size="md" className="focus-visible:outline-white">
            Meet the Team <ArrowDown className="size-5" aria-hidden />
          </CtaButton>
        </HeroText>
        {location.teamPhoto && (
          <div className="relative mt-12 aspect-video overflow-hidden rounded-3xl bg-ink/40">
            <SanityImage image={location.teamPhoto} fill preload quality={70} sizes="(min-width: 1280px) 1248px, 100vw" className="object-cover" />
          </div>
        )}
      </div>
    </section>
  )
}

// ---------- Owner's story ----------
function OwnerWords({ owner, first, attribution, story, quote }: { owner?: string; first: string; attribution?: string; story: string[]; quote?: string }) {
  if (!story.length && !quote) return null
  return (
    <section className="bg-white py-16 md:py-24">
      <div className={`mx-auto grid max-w-7xl gap-12 px-4 ${quote && story.length ? 'lg:grid-cols-[5fr_7fr] lg:gap-16' : 'max-w-3xl'}`}>
        {quote && (
          <figure>
            <p className={eyebrow}>{first ? `In ${first}'s words` : 'In the owner’s words'}</p>
            <blockquote className="mt-4 text-2xl leading-snug font-extrabold tracking-tight text-ink md:text-3xl">&ldquo;{quote}&rdquo;</blockquote>
            {owner && <figcaption className="mt-4 text-slate-600">{attribution?.trim() || `${owner}, Owner`}</figcaption>}
          </figure>
        )}
        {story.length > 0 && (
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">My story</h2>
            {story.map((paragraph, i) => (
              <p key={i} className="mt-4 text-lg leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function TeamOwnerStory({ location, owner, story, quote }: { location: Location; owner?: string; story: string[]; quote?: string }) {
  if (!story.length && !quote) return null
  const since = tenure({ since: location.ownerSinceYear, isOwner: true })
  return (
    <section className="bg-white py-16 md:py-24">
      <div className={`mx-auto grid max-w-7xl items-start gap-12 px-4 ${location.ownerPhoto ? 'lg:grid-cols-[5fr_7fr] lg:gap-16' : 'max-w-3xl'}`}>
        {location.ownerPhoto && (
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-mist">
              <SanityImage image={location.ownerPhoto} fill sizes="(min-width: 1024px) 448px, 100vw" className="object-cover" />
            </div>
            {(since || owner) && (
              <div className="absolute -bottom-5 left-4 rounded-2xl bg-navy px-5 py-3 text-white shadow-xl">
                {since && <p className="text-xs font-bold tracking-[0.16em] text-orange-300 uppercase">{since}</p>}
                {owner && <p className="mt-0.5 font-bold">{owner}</p>}
              </div>
            )}
          </div>
        )}
        <div>
          <p className={eyebrow}>From the owner</p>
          <h2 className={`${h2} md:text-4xl`}>Why I built a team instead of doing it all myself</h2>
          {story.map((paragraph, i) => (
            <p key={i} className="mt-4 text-lg leading-relaxed text-slate-700">
              {paragraph}
            </p>
          ))}
          {quote && (
            <blockquote className="mt-8 rounded-2xl border-l-4 border-brand-orange bg-orange-50 p-5 text-lg font-bold text-ink">&ldquo;{quote}&rdquo;</blockquote>
          )}
        </div>
      </div>
    </section>
  )
}

// ---------- Team ----------
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

function TeamCards({ people }: { people: Person[] }) {
  if (!people.length) return null
  return (
    <section id={TEAM_ANCHOR} className="scroll-mt-20 bg-mist py-16 md:scroll-mt-24 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <p className={eyebrow}>Meet the team</p>
          <h2 className={h2}>
            The people you&rsquo;ll <Accent>actually meet</Accent>
          </h2>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => {
            const years = tenure(person)
            return (
              <li key={person.key} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
                {person.photo ? (
                  <div className="relative aspect-4/3 bg-slate-100">
                    <SanityImage image={person.photo} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover" alt="" />
                  </div>
                ) : (
                  <div className="flex aspect-4/3 items-center justify-center bg-navy" aria-hidden>
                    <span className="text-5xl font-extrabold tracking-tight text-white/90">{initials(person.name)}</span>
                  </div>
                )}
                <div className="p-6">
                  <p className="inline-flex rounded-full bg-brand-blue-dark/10 px-3 py-1 text-xs font-bold text-brand-blue-dark">{ROLE_LABEL[person.role] === 'Team' ? person.title : ROLE_LABEL[person.role]}</p>
                  <h3 className="mt-3 text-xl font-extrabold tracking-tight text-ink">{person.name}</h3>
                  {person.title !== ROLE_LABEL[person.role] && ROLE_LABEL[person.role] !== 'Team' && <p className="text-sm font-semibold text-slate-600">{person.title}</p>}
                  {person.line && <p className="mt-2 leading-relaxed text-slate-600">{person.line}</p>}
                  {years && <p className="mt-3 text-sm text-slate-600">{years}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

// ---------- How your project works ----------
function Steps({ steps, title, intro }: { steps: Step[]; title: React.ReactNode; intro?: string }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <p className={eyebrow}>How your project works</p>
          <h2 className={h2}>{title}</h2>
          {intro && <p className="mt-4 text-lg text-slate-600">{intro}</p>}
        </div>
        <ol className={`grid gap-5 sm:grid-cols-2 ${steps.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
          {steps.map((step, i) => (
            <li key={step.title} className="flex flex-col rounded-2xl bg-mist p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-cta font-bold text-white" aria-hidden>
                  {i + 1}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-blue-dark ring-1 ring-slate-200">{step.badge}</span>
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-ink">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 leading-relaxed text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ---------- Standards ----------
function Standards({ location, variant, first, people }: { location: Location; variant: 'owner' | 'team'; first: string; people: Person[] }) {
  const license = location.licenseNumber?.trim()
  const warranty = getWarrantyHref(location)
  const checker = variant === 'team' && people.some((p) => p.role === 'projectManager') ? 'a project manager' : first || 'the owner'
  const cards = [
    { icon: BadgeCheck, title: 'Licensed & insured', body: license ? `License #${license} · General liability coverage.` : 'General liability coverage on every job.' },
    { icon: Paintbrush, title: 'Sherwin-Williams products', body: 'Your estimate names the exact product line and finish.' },
    { icon: Users, title: 'Vetted painting crews', body: `Experienced painters held to Painter1 standards, with ${checker} checking the work.` },
    { icon: ShieldCheck, title: '2-year workmanship warranty', body: 'In writing: covered repairs at no labor charge.', link: warranty },
  ]
  return (
    <section className="bg-mist py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <p className={eyebrow}>The standard on every job</p>
        <h2 className={h2}>{variant === 'team' ? 'What the whole team is held to' : first ? `What ${first} holds every job to` : 'What every job is held to'}</h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, title, body, link }) => (
            <li key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
              <Icon className="size-7 text-brand-blue-dark" aria-hidden />
              <h3 className="mt-4 text-lg font-extrabold text-ink">{title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{body}</p>
              {link && (
                <a href={link} className="mt-3 inline-flex items-center gap-1 font-bold text-brand-blue-text hover:underline">
                  See what&rsquo;s covered <ArrowRight className="size-4" aria-hidden />
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ---------- Stats and reviews ----------
const reviewDate = (date?: string) => (date ? new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : undefined)

function StatsAndReviews({ location, city, reviews }: { location: Location; city: string; reviews: Review[] }) {
  const stats = [
    location.rating ? { value: `${location.rating}`, star: true, label: 'Google rating' } : null,
    location.reviewsCount ? { value: location.reviewsCount.toLocaleString('en-US'), label: 'Google reviews' } : null,
    /^\d{4}$/.test(location.ownerSinceYear ?? '') ? { value: location.ownerSinceYear!, label: `Serving ${city} since` } : null,
    location.projectsCount ? { value: location.projectsCount.toLocaleString('en-US'), label: 'Local projects documented' } : null,
  ].filter((s): s is { value: string; label: string; star?: boolean } => Boolean(s))
  if (!stats.length && !reviews.length) return null
  return (
    <section className="bg-navy py-16 text-white md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="sr-only">Ratings and reviews</h2>
        {stats.length > 0 && (
          <dl className={`grid grid-cols-2 gap-8 text-center ${stats.length >= 4 ? 'lg:grid-cols-4' : stats.length === 3 ? 'lg:grid-cols-3' : ''}`}>
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-2 text-sm font-bold tracking-[0.16em] text-slate-300 uppercase">{stat.label}</dt>
                <dd className="flex items-center justify-center gap-1 text-4xl font-extrabold text-orange-300 md:text-5xl">
                  {stat.value}
                  {stat.star && (
                    <>
                      <Star className="size-8 fill-orange-300 text-orange-300" aria-hidden />
                      <span className="sr-only">out of 5</span>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {reviews.length > 0 && (
          <ul className={`mt-12 grid gap-5 ${reviews.length === 1 ? 'mx-auto max-w-2xl' : reviews.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {reviews.map((review) => (
              <li key={review._key} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <blockquote className="leading-relaxed text-slate-100">&ldquo;{review.reviewText}&rdquo;</blockquote>
                <p className="mt-4 text-sm text-slate-300">
                  {[review.reviewerName, review.source || 'Google', reviewDate(review.reviewDate)].filter(Boolean).join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
