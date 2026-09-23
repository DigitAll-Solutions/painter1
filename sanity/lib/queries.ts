import { defineQuery } from 'next-sanity'

const image = `alt, hotspot, crop, asset->{_id, metadata{lqip, dimensions{width, height, aspectRatio}}}`

const service = `{
  title, summary, description, highlights, process,
  subServices[]{_key, title, description, image{${image}}},
  images[]{_key, ${image}}
}`

export const LOCATION_QUERY = defineQuery(`*[_type == "location" && slug.current == $slug][0]{
  ...,
  "slug": slug.current,
  ownerPhoto{${image}},
  heroImage{${image}},
  galleryImages[]{_key, caption, serviceType, ${image}},
  services{
    interior${service},
    exterior${service},
    cabinet${service}
  }
}`)

export const LOCATION_SLUGS_QUERY = defineQuery(`*[_type == "location" && defined(slug.current)].slug.current`)
