import { Phone, Star } from 'lucide-react'

import CtaButton from './CtaButton'
import SanityImage from './SanityImage'
import { getCta, telHref } from '@/lib/location'
import { urlFor } from '@/sanity/lib/image'
import type { Location, SanityImage as SanityImageType } from '@/sanity/lib/types'

type Props = {
  location: Location
  headline?: string
  subheadline?: string
  image?: SanityImageType
  /** Show the large owner card beside the headline (homepage) */
  showOwner?: boolean
}

function Rating({ location }: { location: Location }) {
  if (!location.rating || !location.reviewsCount) return null
  return (
    <p className="flex items-center gap-2 text-sm font-semibold">
      <span className="flex text-yellow-400" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="size-5 fill-current" />
        ))}
      </span>
      {location.rating} Stars · {location.reviewsCount} Google Reviews
    </p>
  )
}

export default function HeroSection({ location, headline, subheadline, image, showOwner = false }: Props) {
  const cta = getCta(location)
  const tel = telHref(location.phone)
  const bg = image ?? location.heroImage
  const video = !image ? location.heroVideo?.asset?.url : undefined
  const owner = showOwner && location.ownerName ? location : null

  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      {bg && !video && <SanityImage image={bg} fill preload quality={60} sizes="100vw" className="-z-10 object-cover" alt={bg.alt} />}
      {video && (
        <video
          className="absolute inset-0 -z-10 size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          poster={bg ? urlFor(bg).width(1600).auto('format').url() : undefined}
        >
          <source src={video} type={location.heroVideo?.asset?.mimeType} />
        </video>
      )}
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink/90 via-ink/75 to-ink/45" aria-hidden />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-24 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-orange-300">{location.name}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {headline ?? location.heroHeadline}
          </h1>
          {(subheadline ?? location.heroSubheadline) && (
            <p className="mt-5 text-lg text-slate-200 md:text-xl">{subheadline ?? location.heroSubheadline}</p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaButton href={cta.href}>{cta.label}</CtaButton>
            {tel && (
              <a
                href={tel}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-blue bg-ink/40 px-6 py-3 text-lg font-bold text-white transition-colors hover:bg-brand-blue"
              >
                <Phone className="size-5" aria-hidden /> Call {location.phone}
              </a>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
            {owner && (
              <div className="flex items-center gap-3 lg:hidden">
                {owner.ownerPhoto && (
                  <SanityImage
                    image={owner.ownerPhoto}
                    aspect={1}
                    width={128}
                    height={128}
                    sizes="64px"
                    loading="eager"
                    className="size-16 rounded-full border-2 border-white object-cover"
                  />
                )}
                <div className="leading-tight">
                  <p className="text-lg font-bold">{owner.ownerName}</p>
                  <p className="text-sm text-slate-300">Owner, {owner.name}</p>
                </div>
              </div>
            )}
            <Rating location={location} />
          </div>
        </div>

        {owner?.ownerPhoto && (
          <figure className="relative hidden lg:block">
            <SanityImage
              image={owner.ownerPhoto}
              aspect={4 / 5}
              sizes="(min-width: 1280px) 416px, 352px"
              className="aspect-4/5 w-full rounded-3xl border-4 border-white/90 object-cover shadow-2xl"
            />
            <figcaption className="absolute -bottom-5 left-6 right-6 rounded-xl bg-white px-5 py-3 text-ink shadow-lg">
              <span className="block text-lg font-bold">{owner.ownerName}</span>
              <span className="block text-sm text-slate-600">Owner, {owner.name}</span>
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  )
}
