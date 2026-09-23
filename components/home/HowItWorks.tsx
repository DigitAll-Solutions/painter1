import CtaButton from '../CtaButton'
import Section from '../Section'
import { getCta } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

export default function HowItWorks({ location }: { location: Location }) {
  const steps = location.processSteps ?? []
  if (!steps.length) return null
  const cta = getCta(location)

  return (
    <Section eyebrow="Simple & stress-free" title="How It Works">
      <div className="relative">
        <div className="absolute top-8 right-[16%] left-[16%] hidden h-0.5 bg-slate-200 md:block" aria-hidden />
        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <li key={step._key} className="flex flex-col items-center text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-brand-orange text-2xl font-extrabold text-white ring-8 ring-white">
                {i + 1}
              </span>
              <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
              {step.description && <p className="mt-2 max-w-xs text-slate-600">{step.description}</p>}
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-12 text-center">
        <CtaButton href={cta.href} className="w-full sm:w-auto">
          {cta.label}
        </CtaButton>
      </div>
    </Section>
  )
}
