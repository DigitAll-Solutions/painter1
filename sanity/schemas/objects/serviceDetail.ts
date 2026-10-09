import {defineArrayMember, defineField, defineType} from 'sanity'
import {altField} from './altField'

export const serviceDetail = defineType({
  name: 'serviceDetail',
  title: 'Service',
  type: 'object',
  fieldsets: [{name: 'notOnSite', title: 'Not on the site (imported copy)', options: {collapsible: true, collapsed: true}}],
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
    defineField({name: 'description', type: 'text', rows: 4, fieldset: 'notOnSite', description: 'Imported description; the service pages use the shared service copy.'}),
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
    // Legacy single pair: copied into "Before/after pairs" by scripts/seed-oct8.ts and kept until the
    // previous site version is gone (it reads only these); removed with --remove-legacy. Hidden once empty.
    defineField({
      name: 'beforeImage',
      type: 'image',
      options: {hotspot: true},
      fields: [altField],
      readOnly: true,
      description: 'Old single pair, kept until launch and then removed. Edit "Before/after pairs" instead: once it has a pair, this one is ignored.',
      hidden: ({value}) => !value,
    }),
    defineField({
      name: 'afterImage',
      type: 'image',
      options: {hotspot: true},
      fields: [altField],
      readOnly: true,
      description: 'Old single pair, kept until launch and then removed. Edit "Before/after pairs" instead: once it has a pair, this one is ignored.',
      hidden: ({value}) => !value,
    }),
    defineField({
      name: 'transformationBody',
      type: 'text',
      rows: 5,
      description:
        'Optional. Replaces the service page’s default text beside the before/after slider for this location. Tokens: {city}, {state}, {owner} (owner first name).',
    }),
    defineField({
      name: 'highlights',
      title: "What's included",
      type: 'array',
      fieldset: 'notOnSite',
      description: 'Imported list; the service pages use the shared service process.',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'process',
      title: 'Process steps',
      type: 'array',
      fieldset: 'notOnSite',
      description: 'Imported steps; the service pages use the shared service process.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'processStep',
          fields: [
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'description', type: 'text', rows: 3}),
            defineField({name: 'items', type: 'array', of: [defineArrayMember({type: 'string'})]}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'subServices',
      title: 'Sub-services',
      description: 'Shown as sections on the service page, e.g. Home Siding and Stucco under Exterior.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'subService',
          fields: [
            defineField({name: 'title', type: 'string', description: 'Section heading, e.g. "Home Siding Painting".', validation: (rule) => rule.required()}),
            defineField({
              name: 'anchor',
              type: 'string',
              description: 'Link target on the service page, e.g. "siding" → /knoxville/exterior-painting#siding. Lowercase letters, numbers and dashes.',
              validation: (rule) => rule.regex(/^[a-z0-9-]+$/, {name: 'anchor'}),
            }),
            defineField({name: 'description', type: 'text', rows: 4, description: 'Section text.'}),
            defineField({name: 'image', type: 'image', options: {hotspot: true}, fields: [altField], description: 'Optional photo beside the text (a real local job).'}),
          ],
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
