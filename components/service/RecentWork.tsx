import BeforeAfterSlider from '../BeforeAfterSlider'
import GallerySlider from '../GallerySlider'
import SanityImage from '../SanityImage'
import Section from '../Section'
import { TITLE_BAND as BAND } from '@/lib/gallery'
import { hotspotPosition } from '@/lib/image'
import type { WorkCard } from '@/lib/work-cards'

const SIZES = '(min-width: 1280px) 410px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'
const FRAME = 'rounded-2xl shadow-sm md:rounded-3xl'

/** A single photo, or a before/after pair in the same slider as the Project Gallery */
export default function RecentWork({ cards, title, label }: { cards: WorkCard[]; title: string; label: string }) {
  const slides = cards.map((card) => {
    const caption = card.title && <figcaption className={`pointer-events-none absolute inset-x-0 bottom-0 px-4 pt-10 pb-3 text-sm font-semibold text-white ${BAND}`}>{card.title}</figcaption>
    if (card.before) {
      return (
        // handleOnly: dragging the photo swipes the carousel; the handle moves the divider
        <figure key={card.key} className={`relative overflow-hidden ${FRAME}`}>
          <BeforeAfterSlider
            className="aspect-4/3"
            handleOnly
            label={card.title || undefined}
            before={<SanityImage image={card.before} fill sizes={SIZES} className="object-cover" style={{ objectPosition: hotspotPosition(card.before) }} draggable={false} />}
            after={<SanityImage image={card.image} fill sizes={SIZES} className="object-cover" style={{ objectPosition: hotspotPosition(card.image) }} draggable={false} />}
          />
          {caption}
        </figure>
      )
    }
    return (
      <figure key={card.key} className={`relative aspect-4/3 overflow-hidden bg-mist ${FRAME}`}>
        <SanityImage image={card.image} fill sizes={SIZES} className="object-cover" style={{ objectPosition: hotspotPosition(card.image) }} />
        {caption}
      </figure>
    )
  })

  return (
    <Section eyebrow="Recent Work" title={title}>
      <GallerySlider label={label} slides={slides} />
    </Section>
  )
}
