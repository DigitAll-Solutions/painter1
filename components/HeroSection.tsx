import { Phone, Star } from 'lucide-react'

import CtaButton from './CtaButton'
import SanityImage from './SanityImage'
import { getCta, telHref } from '@/lib/location'
import type { Location, SanityImage as SanityImageType } from '@/sanity/lib/types'

type Props = {
  location: Location
  headline?: string
  subheadline?: string
  image?: SanityImageType
}

export default function HeroSection({ location, headline, subheadline, image }: Props) {
  const cta = getCta(location)
  const tel = telHref(location.phone)
  const bg = image ?? location.heroImage

  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      {bg && (
        <SanityImage
          image={bg}
          fill
          preload
          sizes="100vw"
          className="-z-10 object-cover"
          alt={bg.alt ?? ''}
        />
      )}
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink/90 via-ink/75 to-ink/40" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 lg:py-32">
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
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-6 py-3.5 text-lg font-bold text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
              >
                <Phone className="size-5" aria-hidden /> Call {location.phone}
              </a>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            {location.ownerName && (
              <div className="flex items-center gap-3">
                {location.ownerPhoto && (
                  <SanityImage
                    image={location.ownerPhoto}
                    aspect={1}
                    width={112}
                    height={112}
                    sizes="56px"
                    loading="eager"
                    className="size-14 rounded-full border-2 border-white object-cover"
                  />
                )}
                <div className="leading-tight">
                  <p className="font-bold">{location.ownerName}</p>
                  <p className="text-sm text-slate-300">Owner, {location.name}</p>
                </div>
              </div>
            )}
            {location.rating && location.reviewsCount ? (
              <div className="flex items-center gap-2">
                <span className="flex text-yellow-400" aria-hidden>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="size-5 fill-current" />
                  ))}
                </span>
                <span className="text-sm font-semibold">
                  {location.rating} from {location.reviewsCount} Google Reviews
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
