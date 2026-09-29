import BeforeAfterSlider from '../BeforeAfterSlider'
import SanityImage from '../SanityImage'
import type { Location } from '@/sanity/lib/types'

const DEFAULT_BODY =
  'Renew your home with expert painting from a team you can watch work. Drag the slider to see a real [City] project, start to finish — prep, protection, and a professional on-site the whole way through. Start with a free estimate, then a color consultation, then a scheduled job that works around your life — not the other way around.'

export default function TransformationSection({ location }: { location: Location }) {
  const before = location.transformationBeforeImage
  const after = location.transformationAfterImage
  if (!before || !after) return null

  const city = location.address?.city ?? location.name
  const body = (location.transformationBody || DEFAULT_BODY).replace(/\[city\]/gi, city)
  const sizes = '(min-width: 1024px) 640px, 100vw'

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
        <BeforeAfterSlider
          className="aspect-4/3"
          before={<SanityImage image={before} fill sizes={sizes} className="object-cover" draggable={false} />}
          after={<SanityImage image={after} fill sizes={sizes} className="object-cover" draggable={false} />}
        />
        <div>
          <p className="text-sm font-bold tracking-[0.2em] text-cta uppercase">See The Transformation</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl">
            Our Painting Services in Action
          </h2>
          <span className="mt-5 block h-1.5 w-24 rounded-full bg-brand-orange" aria-hidden />
          <p className="mt-6 text-lg leading-relaxed text-slate-600">{body}</p>
        </div>
      </div>
    </section>
  )
}
