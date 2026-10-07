import type { GalleryImage, Location, SanityImage } from '@/sanity/lib/types'

/** The location's gallery photos the site may show: "Hide: not a local project" photos never appear */
export const localPhotos = (location: Pick<Location, 'galleryImages'>) => (location.galleryImages ?? []).filter((image) => !image.notLocalProject)

/** Overlay text: the photo's title, else "{projectType}, {area}" with whichever parts exist */
export const photoTitle = (image: GalleryImage) => image.title?.trim() || [image.projectType, image.area].filter(Boolean).join(', ')

/** Asset ids of a before/after slider's photos, so the same page's gallery can skip them */
export const sliderAssets = (...images: (SanityImage | undefined)[]) => new Set(images.flatMap((image) => (image ? [image.asset._id] : [])))

// Band behind overlay text: 80–90% ink where the text sits (white text 7:1+ even over a white
// photo), fading out above it.
export const TITLE_BAND = 'bg-[linear-gradient(to_top,rgb(11_27_51/0.9)_0%,rgb(11_27_51/0.8)_55%,transparent_100%)]'
