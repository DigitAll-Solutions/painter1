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
    <section className="bg-brand-orange text-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center md:py-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-balance md:text-5xl">{title}</h2>
        {subtitle && <p className="mt-4 text-lg font-medium md:text-xl">{subtitle}</p>}
        <CtaButton href={cta.href} variant="white" className="mt-8 w-full sm:w-auto">
          {cta.label} Today!
        </CtaButton>
        {tel && (
          <a href={tel} className="mt-5 inline-flex items-center gap-2 text-lg font-bold hover:underline">
            <Phone className="size-5" aria-hidden /> or call {location.phone}
          </a>
        )}
      </div>
    </section>
  )
}
