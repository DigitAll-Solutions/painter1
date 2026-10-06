import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PortableText, type PortableTextComponents } from 'next-sanity'
import { Phone } from 'lucide-react'

import CtaButton from '@/components/CtaButton'
import JsonLd from '@/components/JsonLd'
import SanityImage from '@/components/SanityImage'
import EstimateSurvey from '@/components/estimate/EstimateSurvey'
import { fillTokens } from '@/lib/estimate-survey'
import { telHref } from '@/lib/location'
import { breadcrumbSchema, cityName } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'
import { tokenValues } from '@/lib/tokens'
import { turnstileSiteKey } from '@/lib/turnstile'
import { getEstimateSurvey, getLocation } from '@/sanity/lib/fetch'

// Consent text sits inside a <label>, so paragraphs render as block spans (valid phrasing content)
const consentText: PortableTextComponents = {
  block: { normal: ({ children }) => <span className="mt-2 block first:mt-0">{children}</span> },
  marks: {
    em: ({ children }) => <em>{children}</em>,
    strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
    link: ({ value, children }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-blue-dark underline underline-offset-2">
        {children}
      </a>
    ),
  },
}

export async function generateMetadata({ params }: PageProps<'/[location]/free-estimate'>): Promise<Metadata> {
  const location = await getLocation((await params).location)
  if (!location) return {}
  const { city } = tokenValues(location)
  const title = `Free Estimate in ${cityName(location)} | Painter1 of ${city}`
  const description = `Request a free, no-obligation painting estimate from ${location.name}. Answer a few quick questions and we'll reach out to schedule your on-site visit.`
  const url = absoluteUrl(`/${location.slug}/free-estimate`)
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
}

export default async function FreeEstimatePage({ params }: PageProps<'/[location]/free-estimate'>) {
  const { location: slug } = await params
  const [location, survey] = await Promise.all([getLocation(slug), getEstimateSurvey(slug)])
  if (!location) notFound()

  const { city } = tokenValues(location)
  const ownerFull = location.ownerName ?? location.name
  const owner = location.ownerName?.split(' ')[0] ?? 'our team'
  const copy = fillTokens(survey, { owner, ownerFull, city })
  const tel = telHref(location.phone)
  const consents = (location.consentBlocks ?? []).map((block) => ({ name: block.name, content: <PortableText value={block.body} components={consentText} /> }))
  const photo = location.ownerPhoto ?? location.ownerActionPhoto

  const ownerCard = (
    <div className="flex items-start gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      {photo && (
        <SanityImage image={photo} aspect={1} width={64} sizes="64px" className="size-16 shrink-0 rounded-full object-cover" alt="" />
      )}
      <div>
        <p className="font-extrabold text-ink">{copy.ownerRole}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{copy.ownerCardLine}</p>
      </div>
    </div>
  )

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: absoluteUrl('/') },
          { name: city, url: absoluteUrl(`/${location.slug}`) },
          { name: 'Free Estimate', url: absoluteUrl(`/${location.slug}/free-estimate`) },
        ])}
      />
      <section className="bg-mist">
        <div className="mx-auto max-w-2xl px-4 pt-5 pb-12 md:pt-10 md:pb-20">
          <h1 className="text-sm font-bold tracking-[0.15em] text-cta-dark uppercase">Free estimate · {location.name}</h1>

          {consents.length ? (
            <EstimateSurvey
              slug={location.slug}
              city={city}
              state={location.address?.state ?? ''}
              phone={location.phone}
              tel={tel}
              survey={copy}
              consents={consents}
              ownerCard={ownerCard}
              confirmationMessage={location.leadConfirmationMessage || 'Thank you for your message. We will get in touch with you shortly'}
              turnstileSiteKey={turnstileSiteKey()}
            />
          ) : (
            // Consent checkboxes aren't set up for this location yet: never take a request without them
            <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <p className="text-xl font-extrabold text-ink">Please call us at {location.phone} to request your free estimate.</p>
              {tel && (
                <CtaButton href={tel} className="mt-4">
                  <Phone className="size-5" aria-hidden /> Call {location.phone}
                </CtaButton>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
