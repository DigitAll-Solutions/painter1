import GallerySlider from '../GallerySlider'
import SanityImage from '../SanityImage'
import Section from '../Section'
import { photoTitle, TITLE_BAND as BAND } from '@/lib/gallery'
import { hotspotPosition } from '@/lib/image'
import type { GalleryImage } from '@/sanity/lib/types'

export default function RecentWork({ images, title, label }: { images: GalleryImage[]; title: string; label: string }) {
  const slides = images.map((image) => {
    const text = photoTitle(image)
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
