import Link from 'next/link'
import type { PortableTextBlock } from 'next-sanity'

import SanityImage from '../SanityImage'
import type { Location } from '@/sanity/lib/types'

const blockText = (block?: PortableTextBlock) =>
  (block?.children as { text?: string }[] | undefined)?.map((child) => child.text ?? '').join('') ?? ''

export default function WarrantyBand({ location }: { location: Location }) {
  const blocks = location.warranty ?? []
  if (location.locationType === 'maintenance' || !blocks.length) return null

  const heading = blockText(blocks.find((b) => b.style === 'h2'))
  const summary = blockText(blocks.find((b) => b.style === 'normal' && !b.listItem))

  return (
    <section className="relative isolate overflow-hidden bg-brand-blue text-white">
      {/* flowing darker shape behind the copy */}
      <svg className="absolute inset-y-0 left-0 -z-10 h-full w-[70%] text-brand-blue-dark" viewBox="0 0 700 600" preserveAspectRatio="none" aria-hidden>
        <path fill="currentColor" d="M0 0h140c90 120 190 170 170 300S160 520 250 600H0z" />
        <circle cx="210" cy="40" r="26" fill="currentColor" />
      </svg>

      <div className="grid lg:grid-cols-2">
        <div className="mx-auto w-full max-w-xl px-4 py-16 md:py-24 lg:mr-0 lg:ml-auto lg:pr-16">
          <h2 className="text-4xl font-extrabold tracking-tight text-balance md:text-5xl">{heading}</h2>
          {summary && <p className="mt-6 text-lg leading-relaxed text-white/90">{summary}</p>}
          <Link
            href={`/${location.slug}/warranty`}
            className="mt-9 inline-flex items-center rounded-xl border-2 border-white px-7 py-3.5 text-sm font-extrabold tracking-[0.15em] uppercase transition-colors hover:bg-white hover:text-brand-blue-text"
          >
            View Warranty
          </Link>
        </div>

        {location.warrantyImage && (
          <div className="relative min-h-72 lg:min-h-full">
            <SanityImage
              image={location.warrantyImage}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover lg:[clip-path:ellipse(95%_120%_at_100%_50%)]"
            />
          </div>
        )}
      </div>
    </section>
  )
}
