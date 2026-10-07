import SanityImage from '../SanityImage'
import { hotspotPosition } from '@/lib/image'
import type { ServiceDetail } from '@/sanity/lib/types'

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// A location's sub-services (e.g. Siding and Stucco on Exterior), one section each with an anchor id
// (#siding, #stucco) so old WordPress URLs can redirect straight to them. Styled like the
// transformation block: photo beside the copy when there is one, centred copy when there isn't.
export default function SubServices({ items }: { items?: ServiceDetail['subServices'] }) {
  if (!items?.length) return null

  return items.map((item, i) => (
    <section
      key={item._key}
      id={item.anchor || slug(item.title)}
      className={`scroll-mt-20 py-16 md:scroll-mt-24 md:py-24 ${i % 2 ? 'bg-mist' : 'bg-white'}`}
    >
      {item.image ? (
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
          <div className={`relative aspect-4/3 overflow-hidden rounded-3xl bg-mist shadow-[0_20px_50px_-20px_rgb(11_27_51/0.35)] ${i % 2 ? 'lg:order-last' : ''}`}>
            <SanityImage
              image={item.image}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
              style={{ objectPosition: hotspotPosition(item.image) }}
            />
          </div>
          <SubServiceCopy title={item.title} description={item.description} />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-4">
          <SubServiceCopy title={item.title} description={item.description} />
        </div>
      )}
    </section>
  ))
}

function SubServiceCopy({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl md:text-5xl">{title}</h2>
      <span className="mt-5 block h-1.5 w-24 rounded-full bg-brand-orange" aria-hidden />
      {description && <p className="mt-6 text-lg leading-relaxed text-slate-600">{description}</p>}
    </div>
  )
}
