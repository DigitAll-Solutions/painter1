import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CalendarDays, ClipboardList, Download, Mail, MessageSquareText, PenLine, Phone, ShieldCheck, User, Wrench, type LucideIcon } from 'lucide-react'

import Breadcrumbs from '@/components/Breadcrumbs'
import CTASection from '@/components/CTASection'
import CtaButton from '@/components/CtaButton'
import JsonLd from '@/components/JsonLd'
import SanityImage from '@/components/SanityImage'
import Rich, { fillWarranty } from '@/components/warranty/Rich'
import WarrantyShield from '@/components/warranty/WarrantyShield'
import { hasWarrantyPage } from '@/lib/location'
import { breadcrumbSchema, cityName } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'
import { hotspotPosition } from '@/lib/image'
import { tokenValues } from '@/lib/tokens'
import { CONTACT_ANCHOR, warrantyContact } from '@/lib/warranty-contact'
import { getLocation, getWarrantyTerms } from '@/sanity/lib/fetch'

const CONTACT_ICONS = { call: Phone, text: MessageSquareText, email: Mail }
const STAT_ICONS: Record<string, LucideIcon> = { calendar: CalendarDays, shield: ShieldCheck, wrench: Wrench, user: User }

async function load(slug: string) {
  const [location, terms] = await Promise.all([getLocation(slug), getWarrantyTerms()])
  // Basic-tier locations (client's list) have no warranty page
  if (!location || !hasWarrantyPage(location) || !terms?.title) notFound()
  return { location, terms }
}

export async function generateMetadata({ params }: PageProps<'/[location]/warranty'>): Promise<Metadata> {
  const { location } = await load((await params).location)
  const { city } = tokenValues(location)
  const title = `2-Year Workmanship Warranty | Painter1 of ${city}`
  const description = `What the Painter1 two-year workmanship warranty covers in ${cityName(location)}, what it requires, and how to reach ${location.name} with questions.`
  const url = absoluteUrl(`/${location.slug}/warranty`)
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
}

export default async function WarrantyPage({ params }: PageProps<'/[location]/warranty'>) {
  const { location, terms } = await load((await params).location)
  const { city } = tokenValues(location)
  const tokens = { city, ownerFull: location.ownerName ?? '', locationName: location.name }
  const fill = (text?: string) => fillWarranty(text, tokens)
  // This location's own warranty photo only; without one the hero shows the shield alone
  const photo = location.warrantyPageImage
  const contact = warrantyContact(location, terms)
  const pdf = location.warrantyPdf?.asset?.url
  const intro = location.ownerName ? terms.heroIntro : terms.heroIntroNoOwner || terms.heroIntro
  const disclaimer = [fill(terms.disclaimer), terms.contractNoteConfirmed ? terms.contractNote : ''].filter(Boolean).join(' ')

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: absoluteUrl('/') },
          { name: city, url: absoluteUrl(`/${location.slug}`) },
          { name: 'Warranty', url: absoluteUrl(`/${location.slug}/warranty`) },
        ])}
      />

      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-12 md:py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <div className="text-slate-300">
              <Breadcrumbs crumbs={[{ name: 'Home', href: absoluteUrl('/') }, { name: city, href: `/${location.slug}` }, { name: 'Warranty' }]} />
            </div>
            <p className="mt-6 text-sm font-bold tracking-[0.2em] text-orange-300 uppercase">{location.name}</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance md:text-5xl lg:text-6xl">
              <Rich text={terms.title} accentClass="text-orange-300" />
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200">{fill(intro)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {/* Low-key on purpose: warranty requests are rare (Oct 14) */}
              {contact.links.length > 0 && (
                <CtaButton href={`#${CONTACT_ANCHOR}`} variant="outline" size="md" className="focus-visible:outline-white">
                  Questions? Contact Us
                </CtaButton>
              )}
              {pdf && (
                <CtaButton href={`${pdf}?dl=`} variant="outline" size="md" className="focus-visible:outline-white">
                  <Download className="size-5" aria-hidden /> Download Warranty Sheet (PDF)
                </CtaButton>
              )}
            </div>
          </div>
          {photo ? (
            <div className="relative">
              <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-ink/40">
                <SanityImage image={photo} fill preload quality={70} sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" style={{ objectPosition: hotspotPosition(photo) }} />
              </div>
              <WarrantyShield className="absolute -bottom-6 -left-3 w-28 drop-shadow-xl sm:w-36 lg:top-1/2 lg:bottom-auto lg:-left-14 lg:w-44 lg:-translate-y-1/2" />
            </div>
          ) : (
            <div className="flex justify-center">
              <WarrantyShield className="w-40 drop-shadow-xl sm:w-52 lg:w-64" />
            </div>
          )}
        </div>
      </section>

      {/* Owner quote: only the owner's real words, never invented */}
      {location.ownerQuote?.trim() && (
        <section className="bg-white pt-16 md:pt-20">
          <div className="mx-auto max-w-7xl px-4">
            <figure className="flex flex-col gap-6 rounded-3xl bg-mist p-6 sm:flex-row sm:items-center md:p-8">
              {location.ownerPhoto && (
                <SanityImage image={location.ownerPhoto} aspect={1} width={120} sizes="120px" className="size-24 shrink-0 rounded-full object-cover ring-4 ring-white md:size-28" alt="" />
              )}
              <div>
                <blockquote className="text-xl leading-relaxed font-medium text-ink md:text-2xl">&ldquo;{location.ownerQuote.trim()}&rdquo;</blockquote>
                <figcaption className="mt-3 text-slate-600">
                  {location.ownerName && <span className="font-bold text-ink">{location.ownerName}</span>}
                  {location.ownerName && ' · '}Owner, {location.name}
                  {location.ownerSinceYear && ` · Since ${location.ownerSinceYear}`}
                </figcaption>
              </div>
            </figure>
          </div>
        </section>
      )}

      {/* Stats, covered, requirements */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          {!!terms.stats?.length && (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {terms.stats.map((stat) => {
                const Icon = STAT_ICONS[stat.icon ?? 'shield'] ?? ShieldCheck
                return (
                  <li key={stat._key} className="rounded-2xl bg-mist p-6 md:p-7">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-brand-blue-dark text-white">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <p className="mt-5 text-3xl leading-tight font-extrabold tracking-tight text-ink">{stat.title}</p>
                    {stat.body && <p className="mt-3 text-slate-600">{stat.body}</p>}
                  </li>
                )
              })}
            </ul>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200">
              <h2 className="flex items-center gap-3 bg-navy px-6 py-5 text-lg font-extrabold tracking-wide text-white uppercase md:px-8">
                <ShieldCheck className="size-5" aria-hidden /> {terms.coveredHeading}
              </h2>
              <ul className="divide-y divide-slate-200 px-6 md:px-8">
                {(terms.covered ?? []).map((paragraph, i) => (
                  <li key={i} className="py-5 text-lg leading-relaxed text-slate-700">
                    <Rich text={paragraph} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-3xl ring-1 ring-slate-200">
              <h2 className="flex items-center gap-3 bg-navy px-6 py-5 text-lg font-extrabold tracking-wide text-white uppercase md:px-8">
                <ClipboardList className="size-5" aria-hidden /> {terms.requirementsHeading}
              </h2>
              <div className="px-6 py-5 md:px-8">
                {terms.requirementsIntro && <p className="text-lg text-slate-700">{terms.requirementsIntro}</p>}
                <ol className="mt-2 divide-y divide-dashed divide-slate-200">
                  {(terms.requirements ?? []).map((item, i) => (
                    <li key={i} className="flex items-center gap-4 py-4 text-lg font-bold text-ink">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-blue-dark text-white">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How covered repairs work */}
      {!!terms.repairs?.length && (
        <section className="bg-mist py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:flex-row md:p-10">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-blue-dark text-white md:size-20">
                <PenLine className="size-8" aria-hidden />
              </span>
              <div>
                {terms.repairsEyebrow && <p className="text-sm font-bold tracking-[0.2em] text-cta uppercase">{terms.repairsEyebrow}</p>}
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-balance text-ink md:text-3xl">
                  <Rich text={terms.repairsHeading} accentClass="text-brand-blue-dark" />
                </h2>
                <ul className="mt-5 list-disc space-y-2 pl-5 text-lg text-slate-700 marker:text-ink">
                  {terms.repairs.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Exclusions */}
      {!!terms.exclusions?.length && (
        <section className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              {terms.exclusionsEyebrow && <p className="text-sm font-bold tracking-[0.2em] text-cta uppercase">{terms.exclusionsEyebrow}</p>}
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl">
                <Rich text={terms.exclusionsHeading} accentClass="text-brand-blue-dark" />
              </h2>
              {terms.exclusionsIntro && <p className="mt-4 text-lg text-slate-600">{terms.exclusionsIntro}</p>}
            </div>
            <ul className="mt-10 grid gap-x-10 gap-y-4 rounded-3xl bg-mist p-6 sm:grid-cols-2 md:p-10 lg:grid-cols-3">
              {terms.exclusions.map((item) => (
                <li key={item._key} className="flex gap-3 text-lg text-slate-700">
                  <span className="mt-2.5 size-2 shrink-0 rounded-full bg-brand-orange" aria-hidden />
                  {item.text}
                </li>
              ))}
            </ul>
            {terms.sameEverywhere && <p className="mt-6 text-center text-slate-600">{terms.sameEverywhere}</p>}
          </div>
        </section>
      )}

      {/* Questions: a short contact block (it replaced the repair request form) */}
      {contact.links.length > 0 && (
        <section id={CONTACT_ANCHOR} aria-labelledby={`${CONTACT_ANCHOR}-heading`} className="scroll-mt-20 bg-mist py-14 md:scroll-mt-24 md:py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 id={`${CONTACT_ANCHOR}-heading`} className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              {contact.heading}
            </h2>
            <p className="mt-3 text-lg text-slate-700">{contact.text}</p>
            <ul className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {contact.links.map((link) => {
                const Icon = CONTACT_ICONS[link.kind]
                return (
                  <li key={link.kind}>
                    <a
                      href={link.href}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-ink shadow-sm ring-1 ring-slate-300 transition-colors hover:bg-slate-50 hover:ring-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue sm:w-auto"
                    >
                      <Icon className="size-5 shrink-0 text-brand-blue-dark" aria-hidden />
                      {/* Visible "Call (865) 345-5800"; announced "Call Painter1 of Knoxville at (865) 345-5800" */}
                      <span>
                        {link.verb} <span className="sr-only">{location.name} at </span>
                        {/* A long email address may wrap, but only before the @ */}
                        {link.kind === 'email' ? (
                          <>
                            {link.value.split('@')[0]}
                            <wbr />@{link.value.split('@').slice(1).join('@')}
                          </>
                        ) : (
                          link.value
                        )}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      <CTASection location={location} />

      {disclaimer && (
        <div className="bg-white">
          <p className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-600">{disclaimer}</p>
        </div>
      )}
    </>
  )
}
