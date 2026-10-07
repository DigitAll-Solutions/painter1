import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import CTASection from '@/components/CTASection'
import GalleryGrid from '@/components/GalleryGrid'
import HeroSection from '@/components/HeroSection'
import JsonLd from '@/components/JsonLd'
import Section, { Accent } from '@/components/Section'
import HowItWorks from '@/components/home/HowItWorks'
import OwnerSection from '@/components/home/OwnerSection'
import ReviewsSection from '@/components/home/ReviewsSection'
import ServiceAreas from '@/components/home/ServiceAreas'
import ServicesGrid from '@/components/home/ServicesGrid'
import StatsRow from '@/components/home/StatsRow'
import TransformationSection from '@/components/home/TransformationSection'
import WarrantyBand from '@/components/home/WarrantyBand'
import { autoHomeDescription, localBusinessSchema, pageTitle } from '@/lib/seo'
import { urlFor } from '@/sanity/lib/image'
import { getLocation } from '@/sanity/lib/fetch'

export async function generateMetadata({ params }: PageProps<'/[location]'>): Promise<Metadata> {
  const location = await getLocation((await params).location)
  if (!location) return {}
  const title = location.metaTitle ?? pageTitle('Painters', location)
  const description = location.metaDescription?.trim() || autoHomeDescription(location)
  return {
    title,
    description,
    alternates: { canonical: `/${location.slug}` },
    openGraph: {
      title,
      description,
      url: `/${location.slug}`,
      images: location.heroImage ? [urlFor(location.heroImage).width(1200).height(630).fit('crop').url()] : undefined,
    },
  }
}

export default async function LocationHomePage({ params }: PageProps<'/[location]'>) {
  const location = await getLocation((await params).location)
  if (!location) notFound()

  const gallery = location.galleryImages?.slice(0, 6) ?? []

  return (
    <>
      <JsonLd data={localBusinessSchema(location)} />

      {/* Hero with owner seal and trust bar */}
      <HeroSection location={location} home />

      {/* Before/after slider — hidden unless both images are set */}
      <TransformationSection location={location} />

      {/* Why [City] homeowners call [Owner] first — owner-led or owner-with-team variant */}
      <OwnerSection location={location} />

      <ServicesGrid location={location} />

      <HowItWorks location={location} />

      {/* Trustindex widget: rating badge + review carousel */}
      <ReviewsSection location={location} />

      {gallery.length > 0 && (
        <Section
          title={
            <>
              Our <Accent>Work</Accent>
            </>
          }
        >
          <GalleryGrid images={gallery} />
          {location.locationType !== 'maintenance' && (
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

      <StatsRow location={location} />

      <WarrantyBand location={location} />

      <ServiceAreas location={location} />

      <CTASection location={location} />
    </>
  )
}
