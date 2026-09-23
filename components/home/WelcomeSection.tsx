import CtaButton from '../CtaButton'
import SanityImage from '../SanityImage'
import { getCta } from '@/lib/location'
import type { Location } from '@/sanity/lib/types'

export default function WelcomeSection({ location }: { location: Location }) {
  const cta = getCta(location)
  const paragraphs = location.intro?.split(/\n{2,}/) ?? []

  return (
    <section className="overflow-x-clip py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-orange">Locally owned & operated</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance md:text-4xl">Welcome to {location.name}!</h2>
          <div className="mt-5 space-y-4 text-lg text-slate-600">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
          <CtaButton href={cta.href} className="mt-8 w-full sm:w-auto">
            {cta.label}
          </CtaButton>
        </div>

        {location.ownerPhoto && (
          <figure className="relative isolate mx-auto w-full max-w-md">
            <div className="absolute -inset-3 -z-10 rotate-2 rounded-3xl bg-brand-blue/10" aria-hidden />
            <SanityImage
              image={location.ownerPhoto}
              aspect={4 / 5}
              sizes="(min-width: 768px) 448px, 100vw"
              className="aspect-4/5 w-full rounded-2xl object-cover shadow-lg"
            />
            {location.ownerName && (
              <figcaption className="absolute bottom-4 left-4 rounded-lg bg-white/95 px-4 py-2 shadow">
                <span className="block font-bold">{location.ownerName}</span>
                <span className="block text-sm text-slate-600">Owner, {location.name}</span>
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </section>
  )
}
