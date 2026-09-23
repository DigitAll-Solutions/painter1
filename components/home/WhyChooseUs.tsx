import { CircleCheck, ClipboardCheck, HardHat, ShieldCheck, Sparkles, Star, Timer, type LucideIcon } from 'lucide-react'

import Section from '../Section'

// Pick an icon from the wording of each item so editors can reorder or rename freely.
const iconRules: [RegExp, LucideIcon][] = [
  [/contractor|quality|professional/i, HardHat],
  [/fast|timely|completion/i, Timer],
  [/estimate/i, ClipboardCheck],
  [/rated|recommend|review/i, Star],
  [/clean|spotless|jobsite/i, Sparkles],
  [/guarantee|satisfaction|warranty/i, ShieldCheck],
]
const iconFor = (label: string) => iconRules.find(([re]) => re.test(label))?.[1] ?? CircleCheck

export default function WhyChooseUs({ items, name }: { items?: string[]; name: string }) {
  if (!items?.length) return null

  return (
    <Section className="bg-brand-blue text-white" title={`Why Choose ${name}?`}>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {items.map((label) => {
          const Icon = iconFor(label)
          return (
            <li key={label} className="flex flex-col items-center gap-3 rounded-2xl bg-white/10 px-3 py-6 text-center">
              <Icon className="size-10" strokeWidth={1.75} aria-hidden />
              <span className="text-base font-bold md:text-lg">{label}</span>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
