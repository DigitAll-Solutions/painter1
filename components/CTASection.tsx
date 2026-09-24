import { Phone } from 'lucide-react'

import CtaButton from './CtaButton'
import { getCta, telHref } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

type Props = { location: Location; title?: string; subtitle?: string }

export default function CTASection({
  location,
  title = 'Ready for a Fresh Look?',
  subtitle = 'Get your free estimate today — no obligation, no pressure.',
}: Props) {
  const cta = getCta(location)
  const tel = telHref(location.phone)

  return (
    <section>
      <div className="relative isolate overflow-hidden bg-brand-orange text-white">
        <svg className="absolute -top-24 -right-24 -z-10 size-96 text-white/10" viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="100" fill="currentColor" />
        </svg>
        <svg className="absolute -bottom-32 -left-16 -z-10 size-80 text-black/5" viewBox="0 0 200 200" aria-hidden>
          <circle cx="100" cy="100" r="100" fill="currentColor" />
        </svg>
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center md:py-24">
          <h2 className="text-4xl font-extrabold tracking-tight text-balance md:text-6xl">{title}</h2>
          {subtitle && <p className="mt-5 text-lg font-medium md:text-xl">{subtitle}</p>}
          <CtaButton href={cta.href} variant="white" className="mt-9 w-full sm:w-auto">
            {cta.label} Today!
          </CtaButton>
          {tel && (
            <a href={tel} className="mt-5 inline-flex items-center gap-2 text-lg font-bold hover:underline">
              <Phone className="size-5" aria-hidden /> or call {location.phone}
            </a>
          )}
        </div>
      </div>
      {/* brand stripes */}
      <div aria-hidden>
        <div className="h-2 bg-ink" />
        <div className="h-1.5 bg-white" />
        <div className="h-2 bg-brand-blue-dark" />
        <div className="h-1.5 bg-white" />
        <div className="h-2 bg-brand-blue" />
      </div>
    </section>
  )
}
