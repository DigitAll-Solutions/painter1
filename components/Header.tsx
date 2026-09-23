import Image from 'next/image'
import Link from 'next/link'
import { Phone } from 'lucide-react'

import CtaButton from './CtaButton'
import MobileMenu from './MobileMenu'
import { getCta, getNavLinks, telHref } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

export default function Header({ location }: { location: Location }) {
  const cta = getCta(location)
  const links = getNavLinks(location)
  const tel = telHref(location.phone)

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-20">
        <Link href={`/${location.slug}`} className="shrink-0" aria-label={`${location.name} home`}>
          <Image src="/painter1-logo.svg" alt="Painter1" width={1582} height={505} loading="eager" className="h-10 w-auto md:h-12" />
        </Link>

        {tel && (
          <a href={tel} className="hidden items-center gap-3 md:flex" aria-label={`Call ${location.phone}`}>
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
              <Phone className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Call us today</span>
              <span className="block text-xl font-bold text-ink">{location.phone}</span>
            </span>
          </a>
        )}

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
          <MobileMenu links={links} cta={cta} phone={location.phone} tel={tel} />
        </div>
      </div>

      <nav aria-label="Main" className="hidden border-t border-slate-100 lg:block">
        <ul className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-4 py-2.5 text-sm font-semibold text-slate-700">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-brand-blue">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
