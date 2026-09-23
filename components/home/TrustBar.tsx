import { Award, ClipboardCheck, PaintBucket, ShieldCheck, ThumbsUp } from 'lucide-react'

export default function TrustBar({ yearsInBusiness }: { yearsInBusiness?: number }) {
  const items = [
    { icon: ShieldCheck, label: 'Licensed & Insured' },
    { icon: ClipboardCheck, label: 'Free Estimates' },
    { icon: PaintBucket, label: 'Sherwin-Williams Products' },
    { icon: ThumbsUp, label: 'Satisfaction Guaranteed' },
    ...(yearsInBusiness ? [{ icon: Award, label: `${yearsInBusiness}+ Years Experience` }] : []),
  ]

  return (
    <section aria-label="Why homeowners trust us" className="border-b border-slate-200 bg-slate-50">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-8 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(({ icon: Icon, label }, i) => (
          <li
            key={label}
            className={`flex flex-col items-center gap-2 text-center ${i === items.length - 1 && items.length % 2 ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            <Icon className="size-9 text-brand-blue" strokeWidth={1.75} aria-hidden />
            <span className="text-sm font-bold text-ink md:text-base">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
