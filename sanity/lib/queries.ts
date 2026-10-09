import { defineQuery } from 'next-sanity'

const image = `alt, hotspot, crop, asset->{_id, metadata{lqip, dimensions{width, height, aspectRatio}}}`

const service = `{
  title, summary, description, cardBullets, highlights, process, transformationBody, metaTitle, metaDescription,
  heroImage{${image}},
  beforeImage{${image}},
  afterImage{${image}},
  transformations[]{_key, title, projectType, area, before{${image}}, after{${image}}},
  subServices[]{_key, title, anchor, description, image{${image}}},
  images[]{_key, ${image}}
}`

export const LOCATION_QUERY = defineQuery(`*[_type == "location" && slug.current == $slug][0]{
  ...,
  "slug": slug.current,
  ownerPhoto{${image}},
  ownerActionPhoto{caption, ${image}},
  teamMembers[]{_key, name, jobTitle, withOwnerSince, bio, namedInReviews, photo{${image}}},
  heroImage{${image}},
  transformationBeforeImage{${image}},
  transformationAfterImage{${image}},
  heroVideo{asset->{url, mimeType}},
  warrantyImage{${image}},
  warrantyPdf{asset->{url, originalFilename}},
  warrantyGraphic{${image}},
  galleryImages[]{
    _key, caption, title, projectType, area, city, "geo": geo{lat, lng}, "services": services[]._ref,
    notLocalProject, commercial, projectId, role, ${image}
  },
  reviews[]{..., "services": services[]._ref},
  services{
    interior${service},
    exterior${service},
    cabinet${service}
  }
}`)

export const LOCATION_SLUGS_QUERY = defineQuery(`*[_type == "location" && defined(slug.current)].slug.current`)

// $slugs: the public slug plus any old slug the document may still have (lib/service-slugs.ts)
export const SERVICE_QUERY = defineQuery(`*[_type == "service" && slug.current in $slugs][0]{
  _id, title, "slug": slug.current, shortName, locationKey, metaDescription, ownerCardVariant,
  heroSubtitle, heroImage{${image}},
  transformationHeading, transformationBody,
  processIntro, prepIntro, prepBullets, materialsBody, materialsBlocks[]{_key, title, body}, warrantyBannerBody,
  whatWePaintTitle, whatWePaint[]{_key, icon, title, description, "slug": slug.current, body, image{${image}}},
  faqs[]{_key, question, answer}
}`)

export const SERVICE_SLUGS_QUERY = defineQuery(`*[_type == "service" && defined(slug.current)].slug.current`)

// Service _id → locationKey (interior | exterior | cabinet), for the Our Work filters
export const SERVICE_KEYS_QUERY = defineQuery(`*[_type == "service" && defined(locationKey) && !(_id in path("drafts.**"))]{_id, locationKey}`)

export const LOCATION_PAGES_QUERY = defineQuery(`*[_type == "location" && defined(slug.current)]{"slug": slug.current, locationType}`)

// The location's own survey, else the default one (copy only; merged with built-in defaults in code)
export const ESTIMATE_SURVEY_QUERY = defineQuery(
  `coalesce(*[_type == "location" && slug.current == $slug][0].estimateSurvey->, *[_id == "estimate-survey-default"][0])`,
)

// The network warranty terms (one document for every location's /warranty page)
export const WARRANTY_TERMS_QUERY = defineQuery(`*[_id == "warranty-terms"][0]`)

// The franchise-wide privacy notice (one document for every location)
export const PRIVACY_POLICY_QUERY = defineQuery(`*[_id == "privacy-policy"][0]{title, body}`)
