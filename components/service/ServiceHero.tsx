import { Phone } from 'lucide-react'

import Breadcrumbs, { type Crumb } from '../Breadcrumbs'
import CtaButton from '../CtaButton'
import SanityImage from '../SanityImage'
import { hotspotPosition } from '@/lib/image'
import type { SanityImage as SanityImageType } from '@/sanity/lib/types'

export type { Crumb }

type Props = {
  crumbs: Crumb[]
  title: string
  subtitle?: string
  image?: SanityImageType
  estimateHref: string
  phone?: string
  tel?: string
}

// Ink (#0b1b33) overlay. White text needs at least 60% ink to reach 4.5:1 even over a pure-white
// pixel; every point that can sit behind text gets 70% or more:
// - phones/tablets (text at the bottom, filling most of the height): bottom-up, never below 70%
// - desktop (text column ends by ~58% of the width): left-to-right, 80%+ to 60%, then fades
const OVERLAY =
  'bg-[linear-gradient(to_top,rgb(11_27_51/0.9)_0%,rgb(11_27_51/0.8)_70%,rgb(11_27_51/0.7)_100%)] ' +
  'lg:bg-[linear-gradient(to_right,rgb(11_27_51/0.88)_0%,rgb(11_27_51/0.8)_60%,rgb(11_27_51/0.25)_100%)]'

export default function ServiceHero({ crumbs, title, subtitle, image, estimateHref, phone, tel }: Props) {
  return (
    <section className="relative isolate h-[420px] overflow-hidden bg-navy text-white md:h-[480px] lg:h-[560px]">
      {image && (
        // The LCP element: eager, fetchpriority high and preloaded
        <SanityImage image={image} fill preload quality={60} sizes="100vw" className="-z-20 object-cover" style={{ objectPosition: hotspotPosition(image) }} />
      )}
      <div className={`absolute inset-0 -z-10 ${OVERLAY}`} aria-hidden />

      <div className="mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-8 md:pb-12 lg:justify-center lg:pb-0">
        <div className="max-w-xl">
          <Breadcrumbs crumbs={crumbs} />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance md:text-4xl lg:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 text-lg leading-snug md:text-xl">{subtitle}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <CtaButton href={estimateHref} size="md" className="focus-visible:outline-white">
              Get My Free Estimate
            </CtaButton>
            {tel && (
              <CtaButton href={tel} variant="outline" size="md" className="focus-visible:outline-white">
                <Phone className="size-5" aria-hidden /> Call {phone}
              </CtaButton>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
