import { Phone } from 'lucide-react'

import CtaButton from '../CtaButton'
import { telHref } from '@/lib/location'

type Props = { serviceTitle: string; phone?: string; estimateHref: string }

export default function ServiceCta({ serviceTitle, phone, estimateHref }: Props) {
  const tel = telHref(phone)

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <p className="text-sm font-bold tracking-[0.2em] text-cta uppercase">Ready When You Are</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl">
          Get Your {serviceTitle} Estimate Today?
        </h2>
        <p className="mt-5 text-lg text-slate-700">
          Talk directly with our team - no call center, no pressure. Just straight answers about your project
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {tel && (
            <CtaButton href={tel} className="w-full sm:w-auto">
              <Phone className="size-5" aria-hidden /> Call {phone}
            </CtaButton>
          )}
          <CtaButton href={estimateHref} variant="navy" className="w-full sm:w-auto">
            Start My Free Estimate →
          </CtaButton>
        </div>
      </div>
    </section>
  )
}
