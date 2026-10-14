import {defineArrayMember, defineField, defineType} from 'sanity'
import {SurfaceSelectInput} from '../../components/SurfaceSelectInput'
import {altField} from './altField'

export const serviceDetail = defineType({
  name: 'serviceDetail',
  title: 'Service',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description: 'Label in the header menu and the homepage service card, e.g. "Interior Painting".',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'summary', type: 'text', rows: 2, description: 'Short blurb for service cards.'}),
    defineField({
      name: 'metaTitle',
      title: 'Service page meta title',
      type: 'string',
      description: 'Overrides the automatic "{Service} in {City}, {State} | Painter1 of {City}" for this location only.',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Service page meta description',
      type: 'text',
      rows: 3,
      description: "Overrides the service's default description for this location only (max ~160 characters).",
    }),
    defineField({
      name: 'cardBullets',
      title: 'Homepage card bullets',
      type: 'array',
      description: 'Up to 4 specifics shown with orange checkmarks, e.g. "Sherwin-Williams Emerald", "Most rooms done in 1–2 days".',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: {hotspot: true},
      fields: [altField],
      description: 'Crew at work for this service, landscape, at least 1920x1080. Overrides the service page hero for this location.',
    }),
    defineField({
      name: 'transformations',
      title: 'Before/after pairs',
      type: 'array',
      description:
        'Service page "See The Transformation" (the first pair also shows on the homepage service card). One pair shows beside the text; two or more show as a row of sliders. Recent Work never repeats these photos.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'transformation',
          fields: [
            defineField({name: 'before', type: 'image', options: {hotspot: true}, fields: [altField], description: 'Before photo.', validation: (rule) => rule.required()}),
            defineField({name: 'after', type: 'image', options: {hotspot: true}, fields: [altField], description: 'After photo from the same angle.', validation: (rule) => rule.required()}),
            defineField({name: 'title', type: 'string', description: 'Optional overlay text, e.g. "Kitchen cabinets, Farragut". Empty: "{project type}, {area}".', validation: (rule) => rule.max(60)}),
            defineField({name: 'projectType', type: 'string', description: 'E.g. "Kitchen Cabinets".'}),
            defineField({name: 'area', type: 'string', description: 'Neighborhood or town, e.g. "Farragut".'}),
          ],
          preview: {
            select: {title: 'title', projectType: 'projectType', area: 'area', media: 'after'},
            prepare: ({title, projectType, area, media}) => ({title: title || [projectType, area].filter(Boolean).join(', ') || 'Before/after pair', media}),
          },
        }),
      ],
    }),
    defineField({
      name: 'transformationBody',
      type: 'text',
      rows: 5,
      description:
        'Optional. Replaces the service page’s default text beside the before/after slider for this location. Tokens: {city}, {state}, {owner} (owner first name).',
    }),
    // This location's own photos for the shared "What we paint" surfaces, keyed to the surface's _key
    defineField({
      name: 'surfacePhotos',
      title: 'What We Paint photos',
      description:
        'This location’s own job photo for a surface section on this service page (e.g. a Siding job you did). Only shown on this location’s page, where it replaces the surface’s default photo. Surfaces without one show the default photo (Shared → Services → What we paint), or text only when there’s no default either. The surfaces and their text are in Shared → Services.',
      type: 'array',
      validation: (rule) =>
        rule.custom((items: {surface?: string}[] | undefined) => {
          const keys = (items ?? []).map((item) => item.surface).filter(Boolean)
          return keys.some((key, i) => keys.indexOf(key) !== i) ? 'One photo per surface: a surface is listed twice.' : true
        }),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'surfacePhoto',
          title: 'Surface photo',
          fields: [
            defineField({name: 'surface', type: 'string', description: 'Which surface this photo shows.', components: {input: SurfaceSelectInput}, validation: (rule) => rule.required()}),
            defineField({
              name: 'image',
              type: 'image',
              options: {hotspot: true},
              fields: [altField],
              description: 'A real job by this location. Alt text: describe the job (what was painted, colors), not "Painter1 painter".',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {surface: 'surface', alt: 'image.alt', media: 'image'},
            prepare: ({surface, alt, media}) => ({title: surface ? `#${surface}` : 'Choose a surface', subtitle: alt, media}),
          },
        }),
      ],
    }),
    defineField({
      name: 'images',
      type: 'array',
      description: 'Fallback photo for the homepage service card when there is no after photo (the best-sized one is used).',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [altField],
        }),
      ],
    }),
  ],
})
