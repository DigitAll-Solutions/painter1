import type { Location } from '@/sanity/lib/types'

export default function StatsRow({ location }: { location: Location }) {
  const stats = [
    location.rating ? { label: 'Google Rating', value: `${location.rating}★` } : null,
    location.reviewsCount ? { label: 'Google Reviews', value: `${location.reviewsCount}+` } : null,
    location.yearsInBusiness ? { label: 'Years Experience', value: `${location.yearsInBusiness}+` } : null,
  ].filter((s): s is { label: string; value: string } => Boolean(s))
  if (!stats.length) return null

  return (
    <section aria-label="By the numbers" className="bg-white">
      <dl className="mx-auto grid max-w-6xl gap-8 border-y border-slate-200 px-4 py-12 text-center sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse gap-2">
            <dt className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">{stat.label}</dt>
            <dd className="text-5xl font-extrabold tracking-tight text-cta md:text-6xl">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
