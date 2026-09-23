import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Star } from 'lucide-react'

import CTASection from '@/components/CTASection'
import GalleryGrid from '@/components/GalleryGrid'
import HeroSection from '@/components/HeroSection'
import ReviewsCarousel from '@/components/ReviewsCarousel'
import Section from '@/components/Section'
import HowItWorks from '@/components/home/HowItWorks'
import ServiceAreas from '@/components/home/ServiceAreas'
import ServicesGrid from '@/components/home/ServicesGrid'
import TrustBar from '@/components/home/TrustBar'
import WelcomeSection from '@/components/home/WelcomeSection'
import WhyChooseUs from '@/components/home/WhyChooseUs'
import { urlFor } from '@/sanity/lib/image'
import { getLocation } from '@/sanity/lib/fetch'

export async function generateMetadata({ params }: PageProps<'/[location]'>): Promise<Metadata> {
  const location = await getLocation((await params).location)
  if (!location) return {}
  return {
    title: location.metaTitle ?? location.name,
    description: location.metaDescription,
    openGraph: location.heroImage
      ? { images: [urlFor(location.heroImage).width(1200).height(630).fit('crop').url()] }
      : undefined,
  }
}

export default async function LocationHomePage({ params }: PageProps<'/[location]'>) {
  const location = await getLocation((await params).location)
  if (!location) notFound()

  const gallery = location.galleryImages?.slice(0, 6) ?? []
  const reviews = location.testimonials?.slice(0, 3) ?? []

  return (
    <>
      <HeroSection location={location} />
      <TrustBar yearsInBusiness={location.yearsInBusiness} />
      <WelcomeSection location={location} />
      <ServicesGrid location={location} />
      <HowItWorks location={location} />

      {gallery.length > 0 && (
        <Section className="bg-slate-50" eyebrow="Recent projects" title="See the Difference Fresh Paint Makes">
          <GalleryGrid images={gallery} />
          {location.locationType !== 'maintenance' && (
            <div className="mt-10 text-center">
              <Link
                href={`/${location.slug}/our-work`}
                className="inline-flex items-center gap-2 text-lg font-bold text-brand-blue hover:underline"
              >
                See All Our Work <ArrowRight className="size-5" aria-hidden />
              </Link>
            </div>
          )}
        </Section>
      )}

      <WhyChooseUs items={location.whyChooseUs} name={location.name} />

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
                {location.rating} stars — {location.reviewsCount} Google Reviews
              </span>
            ) : (
              'Customer Reviews'
            )
          }
        >
          <ReviewsCarousel reviews={reviews} />
          {location.locationType !== 'maintenance' && (
            <div className="mt-10 text-center">
              <Link
                href={`/${location.slug}/reviews`}
                className="inline-flex items-center gap-2 text-lg font-bold text-brand-blue hover:underline"
              >
                Read More Reviews <ArrowRight className="size-5" aria-hidden />
              </Link>
            </div>
          )}
        </Section>
      )}

      <ServiceAreas location={location} />
      <CTASection location={location} />
    </>
  )
}
