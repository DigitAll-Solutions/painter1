import { Expand } from 'lucide-react'

import BeforeAfterSlider from '../BeforeAfterSlider'
import SanityImage from '../SanityImage'
import { TITLE_BAND } from '@/lib/gallery'
import { hotspotPosition } from '@/lib/image'
import { largeImageUrl, type WorkCard as Card } from '@/lib/our-work'

// 1 / 2 / 3 columns
const SIZES = '(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
// Same frame as the before/after slider, so photo and pair cards line up
const FRAME = 'rounded-3xl shadow-[0_20px_50px_-20px_rgb(11_27_51/0.35)]'
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue'

/**
 * The first visible card loads eagerly and is preloaded (with a compact hero it's on a phone's first
 * screen). Every other card's photos are deferred: OurWorkGallery loads them as they near the viewport.
 */
type Loading = { eager?: boolean; preload?: boolean }

/**
 * Grid card. Without JavaScript the photo (or the pair's expand button) is a plain link to the large
 * image; with JavaScript the gallery opens it in the lightbox instead ([data-lightbox]).
 */
export default function WorkCard({ card, eager, preload }: { card: Card } & Loading) {
  const loading = eager ? 'eager' : undefined
  const label = card.title || card.image.alt || 'Project photo'

  if (card.before) {
    return (
      <div className="relative">
        <BeforeAfterSlider
          className="aspect-4/3"
          before={<SanityImage image={card.before} fill sizes={SIZES} loading={loading} deferred={!eager} className="object-cover" style={{ objectPosition: hotspotPosition(card.before) }} draggable={false} />}
          after={<SanityImage image={card.image} fill sizes={SIZES} loading={loading} deferred={!eager} preload={preload} className="object-cover" style={{ objectPosition: hotspotPosition(card.image) }} draggable={false} />}
        />
        {/* Clicks pass through the band to the slider; only the expand button takes them */}
        <div className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 rounded-b-3xl px-4 pt-10 pb-3 ${TITLE_BAND}`}>
          <p className="text-sm font-semibold text-white">{card.title}</p>
          <a
            href={largeImageUrl(card.image)}
            data-lightbox
            aria-label={`View larger: ${label}, before and after`}
            className={`pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-md transition-colors hover:bg-mist ${FOCUS}`}
          >
            <Expand className="size-5" aria-hidden />
          </a>
        </div>
      </div>
    )
  }

  return (
    <a href={largeImageUrl(card.image)} data-lightbox aria-label={`View larger: ${label}`} className={`group relative block aspect-4/3 overflow-hidden bg-mist ${FRAME} ${FOCUS}`}>
      <SanityImage
        image={card.image}
        fill
        sizes={SIZES}
        loading={loading}
        deferred={!eager}
        preload={preload}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        style={{ objectPosition: hotspotPosition(card.image) }}
      />
      {card.title && <span className={`absolute inset-x-0 bottom-0 px-4 pt-10 pb-3 text-sm font-semibold text-white ${TITLE_BAND}`}>{card.title}</span>}
    </a>
  )
}

/**
 * Lightbox body: the photo at its natural shape, or a large before/after slider. Rendered on the
 * server for every card but mounted only when opened, so the images must stay lazy: React adds a
 * <link rel="preload"> for every non-lazy <img> it renders, which would download all of them on load.
 * Inside the open dialog they're on screen, so lazy loading starts them immediately.
 */
export function WorkCardLarge({ card }: { card: Card }) {
  const sizes = '(min-width: 1200px) 1100px, 100vw'
  if (card.before) {
    const ratio = card.image.asset.metadata?.dimensions?.aspectRatio ?? 4 / 3
    return (
      // As wide as fits, but never taller than 70% of the screen
      <div className="mx-auto" style={{ width: `min(100%, calc(70dvh * ${ratio}))`, aspectRatio: ratio }}>
        <BeforeAfterSlider
          className="size-full"
          before={<SanityImage image={card.before} fill sizes={sizes} className="object-cover" draggable={false} />}
          after={<SanityImage image={card.image} fill sizes={sizes} className="object-cover" draggable={false} />}
        />
      </div>
    )
  }
  return <SanityImage image={card.image} sizes={sizes} className="mx-auto h-auto max-h-[70dvh] w-auto max-w-full rounded-2xl" />
}
