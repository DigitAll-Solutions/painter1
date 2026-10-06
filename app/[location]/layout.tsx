import { notFound } from 'next/navigation'

import AttributionCapture from '@/components/AttributionCapture'
import FloatingCta from '@/components/FloatingCta'
import Footer from '@/components/Footer'
import GoogleTagManager from '@/components/GoogleTagManager'
import Header from '@/components/Header'
import HideOnPath from '@/components/HideOnPath'
import MobileCtaBar from '@/components/MobileCtaBar'
import { getLocation, getLocationSlugs } from '@/sanity/lib/fetch'

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await getLocationSlugs()
  return slugs.map((location) => ({ location }))
}

export default async function LocationLayout({ children, params }: LayoutProps<'/[location]'>) {
  const { location: slug } = await params
  const location = await getLocation(slug)
  if (!location) notFound()

  return (
    <>
      <div id="top" />
      <Header location={location} />
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      <div className="pb-16 sm:pb-0">
        <Footer location={location} />
      </div>
      {/* The estimate page links to itself, so it drops the floating CTAs */}
      <HideOnPath suffix="/free-estimate">
        <FloatingCta location={location} />
        <MobileCtaBar location={location} />
      </HideOnPath>
      <AttributionCapture />
      <GoogleTagManager />
    </>
  )
}
