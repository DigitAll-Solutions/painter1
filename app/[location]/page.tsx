import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Star } from 'lucide-react'

import CTASection from '@/components/CTASection'
import GalleryGrid from '@/components/GalleryGrid'
import HeroSection from '@/components/HeroSection'
import JsonLd from '@/components/JsonLd'
import ReviewsCarousel from '@/components/ReviewsCarousel'
import Section, { Accent } from '@/components/Section'
import HowItWorks from '@/components/home/HowItWorks'
import ServiceAreas from '@/components/home/ServiceAreas'
import ServicesGrid from '@/components/home/ServicesGrid'
import StatsRow from '@/components/home/StatsRow'
import WarrantyBand from '@/components/home/WarrantyBand'
import { localBusinessSchema, pageTitle } from '@/lib/seo'
import { urlFor } from '@/sanity/lib/image'
import { getLocation } from '@/sanity/lib/fetch'

export async function generateMetadata({ params }: PageProps<'/[location]'>): Promise<Metadata> {
  const location = await getLocation((await params).location)
  if (!location) return {}
  const title = location.metaTitle ?? pageTitle('Painters', location)
  return {
    title,
    description: location.metaDescription,
    alternates: { canonical: `/${location.slug}` },
    openGraph: {
      title,
      description: location.metaDescription,
      url: `/${location.slug}`,
      images: location.heroImage ? [urlFor(location.heroImage).width(1200).height(630).fit('crop').url()] : undefined,
    },
  }
}

export default async function LocationHomePage({ params }: PageProps<'/[location]'>) {
  const location = await getLocation((await params).location)
  if (!location) notFound()

  const maintenance = location.locationType === 'maintenance'
  const gallery = location.galleryImages?.slice(0, 6) ?? []
  const reviews = location.testimonials?.slice(0, 3) ?? []

  return (
    <>
      <JsonLd data={localBusinessSchema(location)} />

      {/* 1 + 2 — Hero with owner seal and trust bar */}
      <HeroSection location={location} home />

      {/* 3 — Services */}
      <ServicesGrid location={location} />

      {/* 4 — How it works */}
      <HowItWorks location={location} />

      {/* 5 — Gallery preview */}
      {gallery.length > 0 && (
        <Section
          title={
            <>
              Our <Accent>Work</Accent>
            </>
          }
        >
          <GalleryGrid images={gallery} />
          {!maintenance && (
            <div className="mt-10 text-center">
              <Link
                href={`/${location.slug}/our-work`}
                className="inline-flex items-center gap-2 text-lg font-bold text-brand-blue-text hover:underline"
              >
                See All Our Work <ArrowRight className="size-5" aria-hidden />
              </Link>
            </div>
          )}
        </Section>
      )}

      {/* 6 — Reviews */}
      {reviews.length > 0 && (
        <Section
          className="overflow-hidden bg-white"
          title={
            location.rating && location.reviewsCount ? (
              <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <span className="flex text-yellow-400" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="size-8 fill-current" />
                  ))}
                </span>
                {location.rating} Stars — <Accent>{location.reviewsCount} Google Reviews</Accent>
              </span>
            ) : (
              'Customer Reviews'
            )
          }
        >
          <svg className="pointer-events-none absolute top-0 left-0 -z-10 h-full w-1/2 text-mist" viewBox="0 0 400 800" preserveAspectRatio="none" aria-hidden>
            <path fill="currentColor" d="M0 0h160c120 200 150 420 30 800H0z" />
          </svg>
          <ReviewsCarousel reviews={reviews} />
          {!maintenance && (
            <div className="mt-10 text-center">
              <Link
                href={`/${location.slug}/reviews`}
                className="inline-flex items-center gap-2 text-lg font-bold text-brand-blue-text hover:underline"
              >
                Read All Reviews <ArrowRight className="size-5" aria-hidden />
              </Link>
            </div>
          )}
          <StatsRow location={location} />
        </Section>
      )}

      {/* Warranty */}
      <WarrantyBand location={location} />

      {/* 7 — Service areas */}
      <ServiceAreas location={location} />

      {/* 8 — Final CTA */}
      <CTASection location={location} />
    </>
  )
}
