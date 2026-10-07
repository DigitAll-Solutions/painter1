import { Phone } from 'lucide-react'

import Breadcrumbs, { type Crumb } from '../Breadcrumbs'
import CtaButton from '../CtaButton'

type Props = { crumbs: Crumb[]; title: string; intro: string; estimateHref: string; phone?: string; tel?: string }

// Compact text hero: the photos below are the page's content, so no hero image
export default function OurWorkHero({ crumbs, title, intro, estimateHref, phone, tel }: Props) {
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="text-slate-700">
          <Breadcrumbs crumbs={crumbs} />
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-ink md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700">{intro}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <CtaButton href={estimateHref} size="md">
            Get My Free Estimate
          </CtaButton>
          {tel && (
            <CtaButton href={tel} variant="navy" size="md">
              <Phone className="size-5" aria-hidden /> Call {phone}
            </CtaButton>
          )}
        </div>
      </div>
    </section>
  )
}
