import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PortableText, type PortableTextBlock, type PortableTextComponents } from 'next-sanity'

import { telHref } from '@/lib/location'
import { absoluteUrl } from '@/lib/site'
import { getLocation, getPrivacyPolicy } from '@/sanity/lib/fetch'

type Span = { _type?: string; text?: string; marks?: string[] }

/** Fill {locationName}, {phone}, {email} in every text span (anchor items pass through) */
function fillBlocks(blocks: PortableTextBlock[], tokens: Record<string, string>) {
  const fill = (text: string) => text.replace(/\{(locationName|phone|email)\}/g, (_, key: string) => tokens[key] ?? '')
  return blocks.map((block) => {
    if (block._type !== 'block') return block
    const children = ((block.children as Span[] | undefined) ?? []).map((child) => (typeof child.text === 'string' ? { ...child, text: fill(child.text) } : child))
    return { ...block, children }
  }) as PortableTextBlock[]
}

export async function generateMetadata({ params }: PageProps<'/[location]/privacy-policy'>): Promise<Metadata> {
  const location = await getLocation((await params).location)
  if (!location) return {}
  const title = `Privacy Policy | ${location.name}`
  const url = absoluteUrl(`/${location.slug}/privacy-policy`)
  return {
    title,
    description: `How ${location.name} and Painter1 collect, use and protect your personal information, and your privacy rights.`,
    alternates: { canonical: url },
    openGraph: { title, url },
  }
}

export default async function PrivacyPolicyPage({ params }: PageProps<'/[location]/privacy-policy'>) {
  const { location: locationSlug } = await params
  const [location, policy] = await Promise.all([getLocation(locationSlug), getPrivacyPolicy()])
  if (!location || !policy?.body?.length) notFound()

  const body = fillBlocks(policy.body, { locationName: location.name, phone: location.phone ?? '', email: location.email ?? '' })

  const components: PortableTextComponents = {
    block: {
      h2: ({ children }) => (
        <h2 className="mt-12 text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mt-8 text-xl font-extrabold text-ink">
          {children}
        </h3>
      ),
      normal: ({ children }) => <p className="mt-4 leading-relaxed text-slate-700">{children}</p>,
    },
    // Link targets from the live page (#infocollect, #uslaws, #communication-opt-in, #do-not-sell …)
    types: {
      privacyAnchor: ({ value }) => <span id={value?.id} className="block scroll-mt-24" aria-hidden />,
    },
    list: {
      bullet: ({ children }) => <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">{children}</ul>,
    },
    listItem: ({ children }) => <li className="leading-relaxed">{children}</li>,
    marks: {
      strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      underline: ({ children }) => <span className="underline">{children}</span>,
      link: ({ value, children }) => (
        <a href={value?.href} className="font-semibold text-brand-blue-dark underline underline-offset-2">
          {children}
        </a>
      ),
    },
  }

  const tel = telHref(location.phone)

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <p className="text-sm font-bold tracking-[0.15em] text-cta uppercase">{location.name}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink md:text-5xl">{policy.title || 'Privacy Policy'}</h1>
        {(tel || location.email) && (
          <p className="mt-6 rounded-2xl bg-mist p-5 text-slate-700">
            Questions about this notice or your information? Contact {location.name}
            {tel && (
              <>
                {' '}
                at{' '}
                <a href={tel} className="font-semibold whitespace-nowrap text-brand-blue-dark underline underline-offset-2">
                  {location.phone}
                </a>
              </>
            )}
            {location.email && (
              <>
                {' '}
                or{' '}
                <a href={`mailto:${location.email}`} className="font-semibold text-brand-blue-dark underline underline-offset-2">
                  {location.email}
                </a>
              </>
            )}
            .
          </p>
        )}
        {/* wrap-anywhere: long URLs used as link text would otherwise overflow at 360px */}
        <div className="mt-4 wrap-anywhere">
          <PortableText value={body} components={components} />
        </div>
      </div>
    </section>
  )
}
