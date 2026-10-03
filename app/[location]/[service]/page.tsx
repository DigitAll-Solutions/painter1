import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import GalleryGrid from '@/components/GalleryGrid'
import JsonLd from '@/components/JsonLd'
import Section from '@/components/Section'
import ServiceReviews from '@/components/ServiceReviews'
import TransformationBlock from '@/components/TransformationBlock'
import OwnerCard from '@/components/service/OwnerCard'
import ServiceCta from '@/components/service/ServiceCta'
import ServiceFaq from '@/components/service/ServiceFaq'
import ServicePageHeader, { type Crumb } from '@/components/service/ServicePageHeader'
import ServiceProcess from '@/components/service/ServiceProcess'
import WhatWePaint from '@/components/service/WhatWePaint'
import { getCta } from '@/lib/location'
import { serviceReviews } from '@/lib/reviews'
import { breadcrumbSchema, cityName, faqSchema, serviceSchema } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'
import { fillTokens, tokenValues } from '@/lib/tokens'
import { urlFor } from '@/sanity/lib/image'
import { getLocation, getService, getServiceSlugs } from '@/sanity/lib/fetch'

const MAX_GALLERY = 8
const MIN_GALLERY = 4

// Every service document × the parent location. Service docs added later still work:
// dynamicParams stays on and unknown or missing services 404 below.
export async function generateStaticParams({ params }: { params: { location: string } }) {
  const location = await getLocation(params.location)
  if (!location || location.locationType === 'maintenance') return []
  const slugs = await getServiceSlugs()
  return slugs.map((service) => ({ service }))
}

async function loadPage(params: PageProps<'/[location]/[service]'>['params']) {
  const { location: locationSlug, service: serviceSlug } = await params
  const [location, service] = await Promise.all([getLocation(locationSlug), getService(serviceSlug)])
  // Maintenance locations only have a homepage and About page for now
  if (!location || !service || location.locationType === 'maintenance') notFound()
  return { location, service, path: `/${location.slug}/${service.slug}` }
}

export async function generateMetadata({ params }: PageProps<'/[location]/[service]'>): Promise<Metadata> {
  const { location, service, path } = await loadPage(params)
  const { city } = tokenValues(location)
  const title = `${service.title} in ${cityName(location)} | Painter1 of ${city}`
  const description = service.metaDescription ? fillTokens(service.metaDescription, location) : undefined
  const ogImage = location.services?.[service.locationKey]?.afterImage ?? location.heroImage

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      images: ogImage ? [urlFor(ogImage).width(1200).height(630).fit('crop').url()] : undefined,
    },
  }
}

export default async function ServicePage({ params }: PageProps<'/[location]/[service]'>) {
  const { location, service, path } = await loadPage(params)
  const fill = (text: string) => fillTokens(text, location)
  const { city } = tokenValues(location)
  const detail = location.services?.[service.locationKey]
  const showHeader = service.showPageHeader !== false

  const crumbs: Crumb[] = [
    { name: 'Home', href: absoluteUrl('/') },
    { name: city, href: `/${location.slug}` },
    { name: service.title },
  ]

  // Location override wins over the service default
  const transformationBody = fill(detail?.transformationBody || service.transformationBody || '')

  // Whole rows of 4 only (4 or 8), so the grid never ends with gaps
  const taggedImages = (location.galleryImages ?? []).filter((image) => image.services?.includes(service._id))
  const gallery = taggedImages.slice(0, Math.min(MAX_GALLERY, taggedImages.length - (taggedImages.length % MIN_GALLERY)))

  const { reviews, tagged } = serviceReviews(location, service._id)
  const reviewsTitle = tagged
    ? `What ${city} Homeowners Say About Our ${service.shortName} Work`
    : `What ${city} Homeowners Are Saying`

  const faqs = (service.faqs ?? []).map((faq) => ({ ...faq, answer: fill(faq.answer) }))

  return (
    <>
      <JsonLd
        data={serviceSchema({
          location,
          name: service.title,
          path,
          description: service.metaDescription ? fill(service.metaDescription) : undefined,
          // Only reviews actually tagged with this service; fill-in reviews stay on the homepage's LocalBusiness
          reviews: reviews.filter((review) => review.services?.includes(service._id)),
        })}
      />
      <JsonLd
        data={breadcrumbSchema(crumbs.map((crumb) => ({ name: crumb.name, url: crumb.href?.startsWith('http') ? crumb.href : absoluteUrl(crumb.href ?? path) })))}
      />
      {faqs.length > 0 && <JsonLd data={faqSchema(faqs)} />}

      {/* Exactly one H1: the page header's, or the transformation heading when the header is hidden */}
      {showHeader && <ServicePageHeader crumbs={crumbs} title={`${service.title} in ${cityName(location)}`} />}

      <TransformationBlock
        before={detail?.beforeImage}
        after={detail?.afterImage}
        heading={fill(service.transformationHeading || service.title)}
        headingLevel={showHeader ? 'h2' : 'h1'}
        body={transformationBody}
        cta={{ href: getCta(location).href, label: 'Get My Free Estimate →' }}
        priority
      />

      <OwnerCard location={location} variant={service.ownerCardVariant} />

      <ServiceProcess location={location} service={service} />

      <WhatWePaint service={service} />

      {gallery.length >= MIN_GALLERY && (
        <Section eyebrow="Recent Work" title={`${service.shortName} Projects in ${city}`}>
          <GalleryGrid images={gallery} columns={4} captions />
        </Section>
      )}

      <ServiceReviews reviews={reviews} title={reviewsTitle} />

      <ServiceFaq faqs={faqs} title={`${service.shortName} Painting FAQ`} />

      <ServiceCta serviceTitle={service.title} phone={location.phone} estimateHref={getCta(location).href} />
    </>
  )
}
