import { defineQuery } from 'next-sanity'

const image = `alt, hotspot, crop, asset->{_id, metadata{lqip, dimensions{width, height, aspectRatio}}}`

const service = `{
  title, summary, description, cardBullets, highlights, process, transformationBody,
  heroImage{${image}},
  beforeImage{${image}},
  afterImage{${image}},
  subServices[]{_key, title, description, image{${image}}},
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
  warrantyGraphic{${image}},
  galleryImages[]{_key, caption, title, projectType, area, "services": services[]._ref, ${image}},
  reviews[]{..., "services": services[]._ref},
  services{
    interior${service},
    exterior${service},
    cabinet${service}
  }
}`)

export const LOCATION_SLUGS_QUERY = defineQuery(`*[_type == "location" && defined(slug.current)].slug.current`)

export const SERVICE_QUERY = defineQuery(`*[_type == "service" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, shortName, locationKey, metaDescription, ownerCardVariant,
  heroSubtitle, heroImage{${image}},
  transformationHeading, transformationBody,
  processIntro, prepIntro, prepBullets, materialsBody, materialsBlocks[]{_key, title, body}, warrantyBannerBody,
  whatWePaint[]{_key, icon, title, description},
  faqs[]{_key, question, answer}
}`)

export const SERVICE_SLUGS_QUERY = defineQuery(`*[_type == "service" && defined(slug.current)].slug.current`)

export const LOCATION_PAGES_QUERY = defineQuery(`*[_type == "location" && defined(slug.current)]{"slug": slug.current, locationType}`)

// The location's own survey, else the default one (copy only; merged with built-in defaults in code)
export const ESTIMATE_SURVEY_QUERY = defineQuery(
  `coalesce(*[_type == "location" && slug.current == $slug][0].estimateSurvey->, *[_id == "estimate-survey-default"][0])`,
)
