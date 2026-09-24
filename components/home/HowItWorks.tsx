import CtaButton from '../CtaButton'
import Section, { Accent } from '../Section'
import { getCta } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

export default function HowItWorks({ location }: { location: Location }) {
  const steps = location.processSteps ?? []
  if (!steps.length) return null
  const cta = getCta(location)

  return (
    <Section
      className="bg-mist"
      title={
        <>
          How It <Accent>Works</Accent>
        </>
      }
    >
      <ol className="grid gap-5 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step._key} className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200/70">
            <span className="absolute -top-4 -right-1 text-[7rem] leading-none font-extrabold text-brand-blue/10 select-none" aria-hidden>
              {i + 1}
            </span>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-orange text-xl font-extrabold text-white">
              {i + 1}
            </span>
            <h3 className="mt-6 text-2xl font-extrabold tracking-tight">{step.title}</h3>
            {step.description && <p className="mt-2 text-lg text-slate-500">{step.description}</p>}
          </li>
        ))}
      </ol>
      <div className="mt-12 text-center">
        <CtaButton href={cta.href} className="w-full sm:w-auto">
          {cta.label}
        </CtaButton>
      </div>
    </Section>
  )
}
