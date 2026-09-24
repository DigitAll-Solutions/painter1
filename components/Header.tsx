import Image from 'next/image'
import Link from 'next/link'
import { Phone } from 'lucide-react'

import CtaButton from './CtaButton'
import NavMenu from './NavMenu'
import { getCta, getNavLinks, telHref } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

export default function Header({ location }: { location: Location }) {
  const cta = getCta(location)
  const links = getNavLinks(location)
  const tel = telHref(location.phone)

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="relative mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 md:h-20">
        <Link href={`/${location.slug}`} aria-label={`${location.name} home`}>
          <Image src="/painter1-logo.svg" alt="Painter1" width={1582} height={505} loading="eager" className="h-10 w-auto md:h-12" />
        </Link>

        <div className="flex justify-center">
          {tel && (
            <a href={tel} className="hidden items-center gap-3 text-brand-blue md:flex" aria-label={`Call ${location.phone}`}>
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-blue/10">
                <Phone className="size-5" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Call us today</span>
                <span className="block text-xl font-bold">{location.phone}</span>
              </span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <CtaButton href={cta.href} size="md">
              {cta.label}
            </CtaButton>
          </div>
          {tel && (
            <a
              href={tel}
              aria-label={`Call ${location.phone}`}
              className="flex size-11 items-center justify-center rounded-lg bg-brand-blue text-white md:hidden"
            >
              <Phone className="size-5" aria-hidden />
            </a>
          )}
          <NavMenu links={links} cta={cta} phone={location.phone} tel={tel} />
        </div>
      </div>
    </header>
  )
}
