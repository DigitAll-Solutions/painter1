import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Star } from 'lucide-react'

import CTASection from '@/components/CTASection'
import GalleryGrid from '@/components/GalleryGrid'
import HeroSection from '@/components/HeroSection'
import JsonLd from '@/components/JsonLd'
import ReviewsCarousel from '@/components/ReviewsCarousel'
import Section from '@/components/Section'
import HowItWorks from '@/components/home/HowItWorks'
import ServiceAreas from '@/components/home/ServiceAreas'
import ServicesGrid from '@/components/home/ServicesGrid'
import TrustBar from '@/components/home/TrustBar'
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

      {/* 1 — Hero */}
      <HeroSection location={location} showOwner />

      {/* 2 — Trust bar */}
      <TrustBar yearsInBusiness={location.yearsInBusiness} />

      {/* 3 — Services */}
      <ServicesGrid location={location} />

      {/* 4 — How it works */}
      <HowItWorks location={location} />

      {/* 5 — Gallery preview */}
      {gallery.length > 0 && (
        <Section className="bg-slate-50" eyebrow="Recent projects" title="Our Work">
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
          eyebrow="What our customers say"
          title={
            location.rating && location.reviewsCount ? (
              <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <span className="flex text-yellow-400" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="size-7 fill-current" />
                  ))}
                </span>
                {location.rating} Stars — {location.reviewsCount} Google Reviews
              </span>
            ) : (
              'Customer Reviews'
            )
          }
        >
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
        </Section>
      )}

      {/* 7 — Service areas */}
      <ServiceAreas location={location} />

      {/* 8 — Final CTA */}
      <CTASection location={location} />
    </>
  )
}
