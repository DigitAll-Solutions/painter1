import Image from 'next/image'
import Link from 'next/link'
import { Phone } from 'lucide-react'

import CtaButton from './CtaButton'
import HeaderShell from './HeaderShell'
import NavMenu from './NavMenu'
import { getCta, getNavLinks, telHref } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

export default function Header({ location }: { location: Location }) {
  const cta = getCta(location)
  const links = getNavLinks(location)
  const tel = telHref(location.phone)
  const home = `/${location.slug}`

  return (
    <HeaderShell homePath={home}>
      <div className="relative mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 md:h-20">
        {/* Colors follow the shell's data-solid flag: white over the hero, brand colors on white */}
        <Link href={home} aria-label={`${location.name} home`} className="relative">
          <Image
            src="/painter1-logo.svg"
            alt="Painter1"
            width={1582}
            height={505}
            loading="eager"
            className="h-10 w-auto transition-opacity md:h-12 group-data-[solid=false]/header:opacity-0"
          />
          <Image
            src="/painter1-logo-white.svg"
            alt=""
            aria-hidden
            width={1582}
            height={505}
            loading="eager"
            className="absolute inset-0 h-10 w-auto opacity-0 transition-opacity md:h-12 group-data-[solid=false]/header:opacity-100"
          />
        </Link>

        <div className="flex justify-center">
          {tel && (
            <a
              href={tel}
              className="hidden items-center gap-3 text-brand-blue md:flex group-data-[solid=false]/header:text-white"
              aria-label={`Call ${location.phone}`}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-blue/10 group-data-[solid=false]/header:bg-white/15">
                <Phone className="size-5" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 group-data-[solid=false]/header:text-white/80">
                  Call us today
                </span>
                <span className="block text-xl font-extrabold">{location.phone}</span>
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
              className="flex size-11 items-center justify-center rounded-xl bg-brand-blue text-white md:hidden"
            >
              <Phone className="size-5" aria-hidden />
            </a>
          )}
          <NavMenu links={links} cta={cta} phone={location.phone} tel={tel} />
        </div>
      </div>
    </HeaderShell>
  )
}
