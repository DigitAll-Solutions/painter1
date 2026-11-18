import { defineQuery } from 'next-sanity'

const image = `alt, hotspot, crop, asset->{_id, metadata{lqip, dimensions{width, height, aspectRatio}}}`

// An image field whose file was removed in Studio keeps its alt text ({_type, alt}, no asset): return
// null for it, so `location.heroImage ? urlFor(...)` and the like never get an image without a file
const img = (field: string, extra = '') => `"${field}": select(defined(${field}.asset) => ${field}{${extra}${image}})`

// The location's own photo, else the shared one in Shared → Brand photos (document "brand-photos").
// Only for general photos (hero, warranty); never people or projects, which show only when the location adds its own.
const ownOrBrand = (field: string) =>
  `"${field}": coalesce(select(defined(${field}.asset) => ${field}{${image}}), *[_id == "brand-photos" && defined(${field}.asset)][0].${field}{${image}})`

const service = (key: string) => `{
  title, summary, cardBullets, transformationBody, metaTitle, metaDescription,
  ${img('heroImage')},
  transformations[]{_key, title, projectType, area, ${img('before')}, ${img('after')}},
  surfacePhotos[defined(surface) && defined(image.asset)]{_key, surface, image{${image}}},
  images[defined(asset)]{_key, ${image}},
  // The shared service's hero (Shared → Services): the homepage service card's last fallback
  "sharedHeroImage": *[_type == "service" && locationKey == "${key}" && !(_id in path("drafts.**")) && defined(heroImage.asset)][0].heroImage{${image}}
}`

export const LOCATION_QUERY = defineQuery(`*[_type == "location" && slug.current == $slug][0]{
  ...,
  "slug": slug.current,
  // "City and state only": the street and ZIP never leave Sanity (page HTML, RSC payload, schema, footer)
  "address": select(addressDisplay == "cityState" => address{city, state}, address),
  ${img('ownerPhoto')},
  ${img('ownerActionPhoto', 'caption, ')},
  teamMembers[]{_key, name, jobTitle, withOwnerSince, bio, namedInReviews, ${img('photo')}},
  ${ownOrBrand('heroImage')},
  ${img('transformationBeforeImage')},
  ${img('transformationAfterImage')},
  heroVideo{asset->{url, mimeType}},
  ${ownOrBrand('warrantyImage')},
  ${ownOrBrand('warrantyPageImage')},
  warrantyPdf{asset->{url, originalFilename}},
  ${ownOrBrand('warrantyGraphic')},
  galleryImages[defined(asset)]{
    _key, caption, title, projectType, area, city, "geo": geo{lat, lng}, "services": services[]._ref,
    notLocalProject, commercial, projectId, role, ${image}
  },
  reviews[]{..., "services": services[]._ref},
  services{
    interior${service('interior')},
    exterior${service('exterior')},
    cabinet${service('cabinet')}
  }
}`)

export const LOCATION_SLUGS_QUERY = defineQuery(`*[_type == "location" && defined(slug.current)].slug.current`)

// $slugs: the public slug plus any old slug the document may still have (lib/service-slugs.ts)
export const SERVICE_QUERY = defineQuery(`*[_type == "service" && slug.current in $slugs][0]{
  _id, title, "slug": slug.current, shortName, locationKey, metaDescription,
  heroSubtitle, ${img('heroImage')},
  transformationHeading, transformationBody,
  processIntro, prepIntro, prepBullets, materialsBody, materialsBlocks[]{_key, title, body}, warrantyBannerBody,
  whatWePaintTitle, whatWePaint[]{_key, icon, title, description, "slug": slug.current, body, ${img('defaultImage')}},
  faqs[]{_key, question, answer}
}`)

export const SERVICE_SLUGS_QUERY = defineQuery(`*[_type == "service" && defined(slug.current)].slug.current`)

// Service _id → locationKey (interior | exterior | cabinet), for the Our Work filters
export const SERVICE_KEYS_QUERY = defineQuery(`*[_type == "service" && defined(locationKey) && !(_id in path("drafts.**"))]{_id, locationKey}`)

// hasWorkPhotos: the location has at least one photo Our Work may show (the same rule as lib/gallery.ts localPhotos)
export const LOCATION_PAGES_QUERY = defineQuery(
  `*[_type == "location" && defined(slug.current)]{"slug": slug.current, locationType, "hasWorkPhotos": count(galleryImages[defined(asset) && notLocalProject != true]) > 0}`,
)

// The location's own survey, else the default one (copy only; merged with built-in defaults in code)
export const ESTIMATE_SURVEY_QUERY = defineQuery(
  `coalesce(*[_type == "location" && slug.current == $slug][0].estimateSurvey->, *[_id == "estimate-survey-default"][0])`,
)

// The network warranty terms (one document for every location's /warranty page)
export const WARRANTY_TERMS_QUERY = defineQuery(`*[_id == "warranty-terms"][0]`)

// The franchise-wide privacy notice (one document for every location)
export const PRIVACY_POLICY_QUERY = defineQuery(`*[_id == "privacy-policy"][0]{title, body}`)
