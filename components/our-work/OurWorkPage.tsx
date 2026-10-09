import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import CTASection from '../CTASection'
import JsonLd from '../JsonLd'
import Section from '../Section'
import ServiceReviews from '../ServiceReviews'
import OurWorkGallery from './OurWorkGallery'
import OurWorkHero from './OurWorkHero'
import WorkCard, { WorkCardLarge } from './WorkCard'
import WorkMap from './WorkMap'
import { getCta, telHref } from '@/lib/location'
import { activeFilter, imageGallerySchema, ourWorkCopy, ourWorkPath, workCards, workChips } from '@/lib/our-work'
import { homepageReviews } from '@/lib/reviews'
import { breadcrumbSchema } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'
import { tokenValues } from '@/lib/tokens'
import { urlFor } from '@/sanity/lib/image'
import { getLocation, getServiceKeys } from '@/sanity/lib/fetch'

/** Location + cards; basic-tier locations (home and free estimate only) and unknown slugs 404 */
async function load(slug: string) {
  const [location, serviceKeys] = await Promise.all([getLocation(slug), getServiceKeys()])
  if (!location || location.locationType === 'maintenance') notFound()
  return { location, cards: workCards(location, serviceKeys) }
}

// Every variant (All and each ?service= filter page) shares one canonical URL
export async function ourWorkMetadata(slug: string): Promise<Metadata> {
  const { location, cards } = await load(slug)
  const copy = ourWorkCopy(location)
  const url = absoluteUrl(ourWorkPath(location))
  const ogImage = cards[0]?.image ?? location.heroImage
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url,
      images: ogImage ? [urlFor(ogImage).width(1200).height(630).fit('crop').url()] : undefined,
    },
  }
}

export default async function OurWorkPage({ slug, filter }: { slug: string; filter?: string }) {
  const { location, cards } = await load(slug)
  const copy = ourWorkCopy(location)
  const { city } = tokenValues(location)
  const path = ourWorkPath(location)
  const initialFilter = activeFilter(filter, cards)
  const estimateHref = getCta(location).href

  const crumbs = [
    { name: 'Home', href: absoluteUrl('/') },
    { name: city, href: `/${location.slug}` },
    { name: 'Our Work' },
  ]

  // Only the first visible card is above the fold on a phone: it loads eagerly (preloaded); everything
  // else is lazy, so the other photos don't compete with the fonts and scripts on a slow connection
  const firstKey = cards.find((card) => !initialFilter || card.filters.includes(initialFilter))?.key

  const items = cards.map((card) => ({
    key: card.key,
    filters: card.filters,
    title: card.title,
    caption: card.image.caption || card.before?.caption,
    card: <WorkCard card={card} eager={card.key === firstKey} preload={card.key === firstKey} />,
    large: <WorkCardLarge card={card} />,
  }))

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: absoluteUrl('/') },
          { name: city, url: absoluteUrl(`/${location.slug}`) },
          { name: 'Our Work', url: absoluteUrl(path) },
        ])}
      />
      {cards.length > 0 && <JsonLd data={imageGallerySchema(location, cards, copy.heading)} />}

      <OurWorkHero crumbs={crumbs} title={copy.heading} intro={copy.intro} estimateHref={estimateHref} phone={location.phone} tel={telHref(location.phone)} />

      {/* Reserved for a project map (renders nothing yet); reads the same per-photo area / city / geo */}
      <WorkMap
        projects={cards.map((card) => ({
          key: card.key,
          title: card.title,
          area: card.image.area,
          city: card.image.city || location.address?.city,
          geo: card.image.geo ?? card.before?.geo,
          filters: card.filters,
        }))}
      />

      {cards.length > 0 ? (
        <Section title="Project Gallery">
          <OurWorkGallery items={items} chips={workChips(location, cards)} initialFilter={initialFilter} />
        </Section>
      ) : (
        <Section title="Project Gallery">
          <p className="text-center text-lg text-slate-700">New project photos are coming soon.</p>
        </Section>
      )}

      <ServiceReviews reviews={homepageReviews(location, 3)} title={`What ${city} Homeowners Are Saying`} />

      <CTASection location={location} />
    </>
  )
}
