import { notFound } from 'next/navigation'

import OurWorkPage, { ourWorkMetadata } from '@/components/our-work/OurWorkPage'
import { isWorkFilter, WORK_FILTERS } from '@/lib/our-work-filters'
import { getLocation } from '@/sanity/lib/fetch'

// Prebuilt filtered views. Visitors reach them as /[location]/our-work?service=<filter> through the
// rewrite in next.config.ts; the canonical URL is always /[location]/our-work.
export async function generateStaticParams({ params }: { params: { location: string } }) {
  const location = await getLocation(params.location)
  if (!location || location.locationType === 'maintenance') return []
  return WORK_FILTERS.map((filter) => ({ filter: filter.key }))
}

async function filterParam(params: PageProps<'/[location]/our-work/[filter]'>['params']) {
  const { location, filter } = await params
  if (!isWorkFilter(filter)) notFound()
  return { location, filter }
}

export async function generateMetadata({ params }: PageProps<'/[location]/our-work/[filter]'>) {
  return ourWorkMetadata((await filterParam(params)).location)
}

export default async function Page({ params }: PageProps<'/[location]/our-work/[filter]'>) {
  const { location, filter } = await filterParam(params)
  return <OurWorkPage slug={location} filter={filter} />
}
