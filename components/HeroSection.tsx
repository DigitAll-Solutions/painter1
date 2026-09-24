import { Award, ClipboardCheck, PaintBucket, Phone, ShieldCheck, Star, ThumbsUp, type LucideIcon } from 'lucide-react'

import CtaButton from './CtaButton'
import OwnerSeal from './OwnerSeal'
import SanityImage from './SanityImage'
import { getCta, telHref } from '@/lib/location'
import { urlFor } from '@/sanity/lib/image'
import type { Location, SanityImage as SanityImageType } from '@/sanity/lib/types'

type Props = {
  location: Location
  headline?: string
  subheadline?: string
  image?: SanityImageType
  /** Homepage variant: full-height hero under the transparent header, owner seal and trust row */
  home?: boolean
}

export function trustItems(yearsInBusiness?: number): { icon: LucideIcon; label: string }[] {
  return [
    { icon: ShieldCheck, label: 'Licensed & Insured' },
    { icon: ClipboardCheck, label: 'Free Estimates' },
    { icon: PaintBucket, label: 'Sherwin-Williams Products' },
    { icon: ThumbsUp, label: 'Satisfaction Guaranteed' },
    ...(yearsInBusiness ? [{ icon: Award, label: `${yearsInBusiness}+ Years Experience` }] : []),
  ]
}

export default function HeroSection({ location, headline, subheadline, image, home = false }: Props) {
  const cta = getCta(location)
  const tel = telHref(location.phone)
  const bg = image ?? location.heroImage
  const video = home ? location.heroVideo?.asset?.url : undefined
  const title = headline ?? location.heroHeadline
  const sub = subheadline ?? location.heroSubheadline

  return (
    <section
      className={`relative isolate flex flex-col overflow-hidden bg-ink text-white ${
        home ? '-mt-16 min-h-svh pt-16 md:-mt-20 md:min-h-215 md:pt-20' : ''
      }`}
    >
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
      <div className="absolute inset-0 -z-10 bg-ink/55" aria-hidden />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-linear-to-b from-ink/70 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-linear-to-t from-ink/80 to-transparent" aria-hidden />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-14 text-center md:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-300">{location.name}</p>
        <h1
          className={`mt-4 font-extrabold tracking-tight text-balance uppercase [text-shadow:0_2px_24px_rgb(0_0_0/0.35)] ${
            home ? 'text-4xl leading-[1.05] sm:text-6xl lg:text-7xl xl:text-8xl' : 'text-4xl sm:text-5xl lg:text-6xl'
          }`}
        >
          {title}
        </h1>
        {sub && <p className="mt-6 max-w-2xl text-lg text-white/90 md:text-xl">{sub}</p>}

        <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <CtaButton href={cta.href}>{cta.label}</CtaButton>
          {tel && (
            <a
              href={tel}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-blue bg-ink/40 px-6 py-3 text-lg font-bold text-white backdrop-blur-sm transition-colors hover:bg-brand-blue"
            >
              <Phone className="size-5" aria-hidden /> Call {location.phone}
            </a>
          )}
        </div>

        {home && (
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            {location.ownerPhoto && location.ownerName && (
              <OwnerSeal photo={location.ownerPhoto} ownerName={location.ownerName} businessName={location.name} />
            )}
            <div className="text-center sm:text-left">
              {location.ownerName && (
                <p className="text-xl font-extrabold">
                  Meet {location.ownerName}
                  <span className="block text-sm font-medium text-white/80">Your local owner, {location.name}</span>
                </p>
              )}
              {location.rating && location.reviewsCount ? (
                <p className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold sm:justify-start">
                  <span className="flex text-yellow-400" aria-hidden>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </span>
                  {location.rating} Stars · {location.reviewsCount} Google Reviews
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {home && (
        <div className="border-b-4 border-brand-blue">
          <ul
            aria-label="Why homeowners trust us"
            className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-4 px-4 pb-7 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8 xl:gap-x-12"
          >
            {trustItems(location.yearsInBusiness).map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wider sm:text-sm">
                <Icon className="size-6 shrink-0" strokeWidth={1.75} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
