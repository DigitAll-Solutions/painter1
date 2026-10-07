import OurWorkPage, { ourWorkMetadata } from '@/components/our-work/OurWorkPage'

// "All" view. Filter links (?service=interior …) are rewritten in next.config.ts to the prebuilt
// pages in ./[filter], so every view stays static.
export async function generateMetadata({ params }: PageProps<'/[location]/our-work'>) {
  return ourWorkMetadata((await params).location)
}

export default async function Page({ params }: PageProps<'/[location]/our-work'>) {
  return <OurWorkPage slug={(await params).location} />
}
