import SanityImage from './SanityImage'
import type { GalleryImage } from '@/sanity/lib/types'

type Props = {
  images: GalleryImage[]
  /** 4 = service-page "Recent Work" grid (2 columns on phones, 4 from tablet) */
  columns?: 3 | 4
  /** Show "{projectType}, {area}" under each photo when set */
  captions?: boolean
}

const layouts = {
  3: { grid: 'grid-cols-2 gap-3 md:grid-cols-3 md:gap-5', sizes: '(min-width: 1280px) 410px, (min-width: 768px) 33vw, 50vw' },
  4: { grid: 'grid-cols-2 gap-3 md:grid-cols-4 md:gap-5', sizes: '(min-width: 1280px) 300px, (min-width: 768px) 25vw, 50vw' },
}

export const galleryCaption = (image: GalleryImage) => [image.projectType, image.area].filter(Boolean).join(', ')

export default function GalleryGrid({ images, columns = 3, captions = false }: Props) {
  const { grid, sizes } = layouts[columns]

  return (
    <ul className={`grid ${grid}`}>
      {images.map((image) => {
        const caption = captions ? galleryCaption(image) : ''
        return (
          <li key={image._key}>
            <figure>
              <div className="group overflow-hidden rounded-2xl bg-mist shadow-sm md:rounded-3xl">
                <SanityImage
                  image={image}
                  aspect={1}
                  sizes={sizes}
                  className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {caption && <figcaption className="mt-2 text-sm font-semibold text-slate-600">{caption}</figcaption>}
            </figure>
          </li>
        )
      })}
    </ul>
  )
}
