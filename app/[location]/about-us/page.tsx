import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AboutPage from '@/components/about/AboutPage'
import JsonLd from '@/components/JsonLd'
import { aboutMeta, aboutPageLocation, aboutPeople, aboutVariant, ABOUT_PATH } from '@/lib/about'
import { breadcrumbSchema, businessNode } from '@/lib/seo'
import { absoluteUrl } from '@/lib/site'
import { urlFor } from '@/sanity/lib/image'
import { getLocation, getLocationCount } from '@/sanity/lib/fetch'

async function load(slug: string) {
  // Full-tier locations only (client's list): unknown and basic-tier locations 404 (tested in about.test.ts)
  const location = aboutPageLocation(await getLocation(slug))
  if (!location) notFound()
  return location
}

export async function generateMetadata({ params }: PageProps<'/[location]/about-us'>): Promise<Metadata> {
  const location = await load((await params).location)
  const { title, description } = aboutMeta(location, aboutVariant(location))
  const url = absoluteUrl(`/${location.slug}/${ABOUT_PATH}`)
  const image = location.teamPhoto ?? location.ownerActionPhoto ?? location.ownerPhoto
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: image ? [urlFor(image).width(1200).height(630).fit('crop').url()] : undefined },
  }
}

export default async function AboutUsPage({ params }: PageProps<'/[location]/about-us'>) {
  const location = await load((await params).location)
  const networkCount = await getLocationCount()
  const url = absoluteUrl(`/${location.slug}/${ABOUT_PATH}`)
  const staff = aboutPeople(location).filter((person) => !person.isOwner)

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          ...businessNode(location),
          founder: location.ownerName
            ? { '@type': 'Person', name: location.ownerName, jobTitle: 'Owner', image: location.ownerPhoto ? urlFor(location.ownerPhoto).width(600).url() : undefined }
            : undefined,
          employee: staff.length ? staff.map((person) => ({ '@type': 'Person', name: person.name, jobTitle: person.title })) : undefined,
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: location.name, url: absoluteUrl(`/${location.slug}`) },
          { name: 'About', url },
        ])}
      />
      <AboutPage location={location} networkCount={networkCount} />
    </>
  )
}
