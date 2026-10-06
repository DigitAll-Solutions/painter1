import SanityImage from './SanityImage'
import type { GalleryImage } from '@/sanity/lib/types'

// Homepage "Our Work" grid. Service pages use GallerySlider instead.
export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
      {images.map((image) => (
        <li key={image._key}>
          <figure>
            <div className="group overflow-hidden rounded-2xl bg-mist shadow-sm md:rounded-3xl">
              <SanityImage
                image={image}
                aspect={1}
                sizes="(min-width: 1280px) 410px, (min-width: 768px) 33vw, 50vw"
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </figure>
        </li>
      ))}
    </ul>
  )
}
