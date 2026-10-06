import GallerySlider from '../GallerySlider'
import SanityImage from '../SanityImage'
import Section from '../Section'
import { hotspotPosition } from '@/lib/image'
import type { GalleryImage } from '@/sanity/lib/types'

/** Overlay text: the photo's title, else "{projectType}, {area}" with whichever parts exist */
export const slideTitle = (image: GalleryImage) => image.title?.trim() || [image.projectType, image.area].filter(Boolean).join(', ')

// Band behind the overlay text: 80–90% ink where the text sits (white text 7:1+ even over a white
// photo), fading out above it.
const BAND = 'bg-[linear-gradient(to_top,rgb(11_27_51/0.9)_0%,rgb(11_27_51/0.8)_55%,transparent_100%)]'

export default function RecentWork({ images, title, label }: { images: GalleryImage[]; title: string; label: string }) {
  const slides = images.map((image) => {
    const text = slideTitle(image)
    return (
      <figure key={image._key} className="relative aspect-4/3 overflow-hidden rounded-2xl bg-mist shadow-sm md:rounded-3xl">
        <SanityImage
          image={image}
          fill
          sizes="(min-width: 1280px) 410px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
          style={{ objectPosition: hotspotPosition(image) }}
        />
        {text && <figcaption className={`absolute inset-x-0 bottom-0 px-4 pt-10 pb-3 text-sm font-semibold text-white ${BAND}`}>{text}</figcaption>}
      </figure>
    )
  })

  return (
    <Section eyebrow="Recent Work" title={title}>
      <GallerySlider label={label} slides={slides} />
    </Section>
  )
}
