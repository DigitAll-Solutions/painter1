import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { preconnect } from 'react-dom'

import AttributionCapture from '@/components/AttributionCapture'
import FloatingCta from '@/components/FloatingCta'
import Footer from '@/components/Footer'
import GoogleTagManager from '@/components/GoogleTagManager'
import Header from '@/components/Header'
import HideOnPath from '@/components/HideOnPath'
import MobileCtaBar from '@/components/MobileCtaBar'
import RingbotWidget from '@/components/RingbotWidget'
import { locationGtmId } from '@/lib/gtm'
import { isLiveLocation } from '@/lib/indexing'
import { ringbotId } from '@/lib/ringbot'
import { getLocation, getLocationSlugs } from '@/sanity/lib/fetch'

// Same fallback as sanity/lib/fetch.ts: the publish webhook is the main update path
export const revalidate = 3600

// Only live locations are built ahead; the others (being filled in Studio) render on first visit, so
// Rick can preview them on painter1.vercel.app/<slug>
export async function generateStaticParams() {
  const slugs = await getLocationSlugs()
  return slugs.filter(isLiveLocation).map((location) => ({ location }))
}

// A location that isn't live yet is never indexed, whatever the host (lib/indexing.ts). Pages don't set
// `robots` themselves, so this applies to every page of the location.
export async function generateMetadata({ params }: LayoutProps<'/[location]'>): Promise<Metadata> {
  const { location } = await params
  return isLiveLocation(location) ? {} : { robots: { index: false, follow: false } }
}

export default async function LocationLayout({ children, params }: LayoutProps<'/[location]'>) {
  const { location: slug } = await params
  const location = await getLocation(slug)
  if (!location) notFound()
  // Every page's hero / LCP image comes from the Sanity image CDN: open that connection with the HTML
  preconnect('https://cdn.sanity.io')
  const webchat = ringbotId(location.webchatId)
  const gtm = locationGtmId(location.gtmId)

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
      {/* This location's own Ringbot install, loaded after the first interaction */}
      {webchat && <RingbotWidget id={webchat} />}
      <AttributionCapture />
      {/* This location's own GTM container, else the site-wide one: never both */}
      {gtm && <GoogleTagManager id={gtm} />}
    </>
  )
}
