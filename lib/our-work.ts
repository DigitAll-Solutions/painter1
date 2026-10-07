import { businessNode, cityName } from './seo'
import { absoluteUrl } from './site'
import { fillTokens, tokenValues } from './tokens'
import { urlFor } from '@/sanity/lib/image'
import type { GalleryImage, Location } from '@/sanity/lib/types'
import { ourWorkPath, type WorkCard } from './work-cards.ts'

export { activeFilter, ourWorkPath, workCards, workChips, type WorkCard } from './work-cards.ts'

/** Large version for the lightbox and the no-JavaScript image link */
export const largeImageUrl = (image: GalleryImage) => urlFor(image).width(1600).fit('max').quality(80).auto('format').url()

// Defaults when the location's "Our Work page" fields are empty (live gallery intro, verbatim)
const DEFAULT_INTRO =
  'Discover the transformative power of color and craftsmanship from Painter1. Check out our project gallery below showcasing some of our most recent painting jobs!'

export function ourWorkCopy(location: Location) {
  const { city } = tokenValues(location)
  const page = location.ourWorkPage
  const fill = (text?: string) => (text?.trim() ? fillTokens(text.trim(), location) : undefined)
  return {
    heading: `Our Work in ${cityName(location)}`,
    intro: fill(page?.intro) ?? DEFAULT_INTRO,
    metaTitle: fill(page?.metaTitle) ?? `Our Work in ${cityName(location)} | Painter1 of ${city}`,
    metaDescription:
      fill(page?.metaDescription) ??
      `Before-and-after photos of recent interior, exterior, cabinet and commercial painting projects by Painter1 of ${city}. Get your free estimate.`,
  }
}

/** schema.org ImageGallery with one ImageObject per photo (pairs give two) */
export function imageGallerySchema(location: Location, cards: WorkCard[], name: string) {
  const business = businessNode(location)
  const { state } = tokenValues(location)
  const photo = (image: GalleryImage, title: string, role?: 'before' | 'after') => {
    const dims = image.asset.metadata?.dimensions
    const city = image.city?.trim() || location.address?.city
    return {
      '@type': 'ImageObject',
      contentUrl: largeImageUrl(image),
      width: dims?.width,
      height: dims?.height,
      name: title ? `${title}${role ? ` (${role})` : ''}` : undefined,
      caption: image.caption || undefined,
      description: image.alt || undefined,
      creator: { '@type': 'Organization', name: location.name },
      creditText: location.name,
      contentLocation: {
        '@type': 'Place',
        name: image.area || city,
        address: { '@type': 'PostalAddress', addressLocality: city, addressRegion: state || undefined, addressCountry: 'US' },
        geo: image.geo ? { '@type': 'GeoCoordinates', latitude: image.geo.lat, longitude: image.geo.lng } : undefined,
      },
    }
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name,
    url: absoluteUrl(ourWorkPath(location)),
    provider: business,
    image: cards.flatMap((card) => (card.before ? [photo(card.before, card.title, 'before'), photo(card.image, card.title, 'after')] : [photo(card.image, card.title)])),
  }
}
