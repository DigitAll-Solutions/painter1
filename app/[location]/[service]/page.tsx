import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import JsonLd from '@/components/JsonLd'
import ServiceReviews from '@/components/ServiceReviews'
import TransformationBlock from '@/components/TransformationBlock'
import OwnerCard from '@/components/service/OwnerCard'
import ServiceCta from '@/components/service/ServiceCta'
import ServiceFaq from '@/components/service/ServiceFaq'
import RecentWork from '@/components/service/RecentWork'
import ServiceHero, { type Crumb } from '@/components/service/ServiceHero'
import ServiceProcess from '@/components/service/ServiceProcess'
import SubServices from '@/components/service/SubServices'
import WhatWePaint from '@/components/service/WhatWePaint'
import { getCta, telHref } from '@/lib/location'
import { serviceReviews } from '@/lib/reviews'
import { breadcrumbSchema, cityName, faqSchema, serviceSchema } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'
import { fillTokens, tokenValues } from '@/lib/tokens'
import { urlFor } from '@/sanity/lib/image'
import { getLocation, getService, getServiceSlugs } from '@/sanity/lib/fetch'

// Recent Work slider: shown from 3 tagged photos, up to 12, in the order stored in Sanity
const MIN_GALLERY = 3
const MAX_GALLERY = 12

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
  const detail = location.services?.[service.locationKey]
  // Per-location override first, then the automatic title / the service's tokenised description
  const title = detail?.metaTitle?.trim() || `${service.title} in ${cityName(location)} | Painter1 of ${city}`
  const metaDescription = detail?.metaDescription?.trim() || service.metaDescription
  const description = metaDescription ? fillTokens(metaDescription, location) : undefined
  const ogImage = detail?.afterImage ?? location.heroImage

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

  const crumbs: Crumb[] = [
    { name: 'Home', href: absoluteUrl('/') },
    { name: city, href: `/${location.slug}` },
    { name: service.title },
  ]

  // Location override wins over the service default
  const transformationBody = fill(detail?.transformationBody || service.transformationBody || '')

  const gallery = (location.galleryImages ?? []).filter((image) => image.services?.includes(service._id)).slice(0, MAX_GALLERY)

  // Hero photo: this location's for this service → the service default → the location's homepage hero
  const heroImage = detail?.heroImage ?? service.heroImage ?? location.heroImage

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

      {/* The hero's H1 is the page's only H1 */}
      <ServiceHero
        crumbs={crumbs}
        title={`${service.title} in ${cityName(location)}`}
        subtitle={service.heroSubtitle ? fill(service.heroSubtitle) : undefined}
        image={heroImage}
        estimateHref={getCta(location, service.locationKey).href}
        phone={location.phone}
        tel={telHref(location.phone)}
      />

      <TransformationBlock
        before={detail?.beforeImage}
        after={detail?.afterImage}
        heading={fill(service.transformationHeading || service.title)}
        body={transformationBody}
        cta={{ href: getCta(location, service.locationKey).href, label: 'Get My Free Estimate →' }}
      />

      <OwnerCard location={location} variant={service.ownerCardVariant} />

      <ServiceProcess location={location} service={service} />

      <WhatWePaint service={service} />

      {/* e.g. Siding and Stucco on Exterior (#siding, #stucco) */}
      <SubServices items={detail?.subServices} />

      {gallery.length >= MIN_GALLERY && (
        <RecentWork images={gallery} title={`${service.shortName} Projects in ${city}`} label={`${service.shortName} projects in ${city}`} />
      )}

      <ServiceReviews reviews={reviews} title={reviewsTitle} />

      <ServiceFaq faqs={faqs} title={`${service.shortName} Painting FAQ`} />

      <ServiceCta serviceTitle={service.title} phone={location.phone} estimateHref={getCta(location, service.locationKey).href} />
    </>
  )
}
