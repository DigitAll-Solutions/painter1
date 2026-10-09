import {defineArrayMember, defineField, defineType} from 'sanity'
import {PaintRoller} from 'lucide-react'

import {SERVICE_ICON_OPTIONS} from '../../lib/service-icons'
import {altField} from './objects/altField'

const TOKENS = 'Tokens: {city}, {state}, {owner} (owner first name) are replaced with the location’s values.'

// One document per service (Interior Painting, Exterior Painting, …), shared by every location.
// Location-specific photos and copy live in location.services.<locationKey>.
export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  icon: PaintRoller,
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'transformation', title: 'Transformation'},
    {name: 'process', title: 'Process'},
    {name: 'paint', title: 'What we paint'},
    {name: 'faq', title: 'FAQ'},
  ],
  fields: [
    // Basics
    defineField({name: 'title', type: 'string', group: 'basics', description: 'E.g. "Interior Painting".', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'basics',
      description: 'URL segment, e.g. "interior-painting" → /knoxville/interior-painting. Changing it changes the page URL for every location: ask a developer first, so the old URL gets a redirect.',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'shortName', type: 'string', group: 'basics', description: 'E.g. "Interior". Used in "Interior Services" and "Interior Projects in {city}".', validation: (rule) => rule.required()}),
    defineField({
      name: 'locationKey',
      title: 'Location data key',
      type: 'string',
      group: 'basics',
      description: 'Which entry under each location’s "Services" holds this service’s before/after photos and transformation text.',
      options: {
        list: [
          {title: 'Interior', value: 'interior'},
          {title: 'Exterior', value: 'exterior'},
          {title: 'Cabinet', value: 'cabinet'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Hero subtitle',
      type: 'string',
      group: 'basics',
      description: `One line under the page heading. ${TOKENS}`,
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      group: 'basics',
      options: {hotspot: true},
      fields: [altField],
      description: 'Crew at work for this service, landscape, at least 1920x1080. Used when the location has no hero image of its own for this service.',
    }),
    defineField({name: 'metaDescription', type: 'text', rows: 3, group: 'basics', description: `Search result description. ${TOKENS}`}),
    defineField({
      name: 'ownerCardVariant',
      title: 'Owner card',
      type: 'string',
      group: 'basics',
      description: 'Featured: "Why {city} homeowners call {owner} first" heading with the owner photo. Compact: name and "Guaranteed by the owner" only.',
      options: {
        list: [
          {title: 'Featured', value: 'featured'},
          {title: 'Compact', value: 'compact'},
        ],
        layout: 'radio',
      },
      initialValue: 'featured',
    }),

    // Transformation
    defineField({name: 'transformationHeading', type: 'string', group: 'transformation', description: `E.g. "Real Interiors, Real Results". ${TOKENS}`}),
    defineField({
      name: 'transformationBody',
      type: 'text',
      rows: 5,
      group: 'transformation',
      description: `Default copy beside the before/after slider. A location can override it under Services. ${TOKENS}`,
    }),

    // Process
    defineField({name: 'processIntro', type: 'string', group: 'process', description: `Optional line under "Our {Service} Process". ${TOKENS}`}),
    defineField({name: 'prepIntro', title: 'Prep work: intro', type: 'text', rows: 2, group: 'process', description: TOKENS}),
    defineField({name: 'prepBullets', title: 'Prep work: checklist', type: 'array', group: 'process', description: 'Bullets under the prep intro on the service page.', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'materialsBody', title: 'Paint & materials: body', type: 'boldText', group: 'process', description: 'Paragraph beside the prep checklist. **Bold** for paint names.'}),
    defineField({
      name: 'materialsBlocks',
      title: 'Paint & materials: details',
      type: 'array',
      group: 'process',
      description: 'Optional sub-sections, e.g. "Typical Timeline" and "Weather Window".',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'materialsBlock',
          fields: [
            defineField({name: 'title', type: 'string', description: 'Small heading, e.g. "Typical Timeline".', validation: (rule) => rule.required()}),
            defineField({name: 'body', type: 'boldText', description: 'One short paragraph.'}),
          ],
          preview: {select: {title: 'title'}},
        }),
      ],
    }),
    defineField({
      name: 'warrantyBannerBody',
      title: 'Warranty banner: body',
      type: 'text',
      rows: 3,
      group: 'process',
      description: `Text in the navy "Backed by Our 2-Year Workmanship Warranty" banner. Keep it consistent with the homepage warranty. ${TOKENS}`,
    }),

    // What we paint: one item per surface = its card at the top AND its section further down the page
    defineField({
      name: 'whatWePaintTitle',
      title: 'What we paint: heading',
      type: 'string',
      group: 'paint',
      description: 'Leave empty for "What We Paint" (e.g. "What We Refinish" for cabinets).',
    }),
    defineField({
      name: 'whatWePaint',
      title: 'What we paint (surfaces)',
      type: 'array',
      group: 'paint',
      description:
        'One item per surface. Each shows as a card at the top of "What We Paint" (4 items: one row of 4; 6 items: two rows of 3) and as its own section below the cards, where the card’s "See details" link jumps to. Every location’s page shows the same surfaces and text; photos are per location (Location → Services → What We Paint photos).',
      validation: (rule) =>
        rule.custom((items: {slug?: {current?: string}}[] | undefined) => {
          const slugs = (items ?? []).map((item) => item.slug?.current).filter(Boolean)
          const repeated = slugs.find((slug, i) => slugs.indexOf(slug) !== i)
          return repeated ? `Two surfaces use the link name "${repeated}": each needs its own.` : true
        }),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'paintItem',
          title: 'Surface',
          fields: [
            defineField({name: 'title', title: 'Surface name', type: 'string', description: 'Card title and the heading of its section, e.g. "Siding" or "Trim & Doors". Just the name.', validation: (rule) => rule.required().max(40)}),
            defineField({
              name: 'slug',
              title: 'Link name',
              type: 'slug',
              description: 'The end of the link to this section, e.g. "siding" → /knoxville/exterior-painting#siding. Click Generate. Don’t change it after launch: other pages and old URLs may link to it.',
              options: {source: (_doc, {parent}) => (parent as {title?: string} | undefined)?.title ?? '', maxLength: 40},
              validation: (rule) =>
                rule.required().custom((value?: {current?: string}) =>
                  !value?.current || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.current) ? true : 'Lowercase letters, numbers and single dashes only, e.g. "trim-doors".',
                ),
            }),
            defineField({name: 'icon', type: 'string', description: 'Icon on the card.', options: {list: SERVICE_ICON_OPTIONS}, initialValue: 'PaintRoller'}),
            defineField({name: 'description', title: 'Card text', type: 'text', rows: 2, description: 'One sentence on the card.'}),
            defineField({
              name: 'body',
              title: 'Section text',
              type: 'array',
              description: `The text in this surface's section below the cards. Paragraphs and bullet lists; bold for short labels. Empty: the card text is shown there instead. ${TOKENS}`,
              of: [
                defineArrayMember({
                  type: 'block',
                  styles: [{title: 'Paragraph', value: 'normal'}],
                  lists: [{title: 'Bullets', value: 'bullet'}],
                  marks: {decorators: [{title: 'Bold', value: 'strong'}, {title: 'Italic', value: 'em'}], annotations: []},
                }),
              ],
            }),
            // Old shared photo: photos are per location now (location → Services → What We Paint photos).
            // Never shown on the site; hidden once empty, removed post-merge (seed-oct9 --remove-shared-photos).
            defineField({
              name: 'image',
              title: 'Old shared photo (not shown)',
              type: 'image',
              options: {hotspot: true},
              fields: [altField],
              readOnly: true,
              hidden: ({value}) => !value,
              description: 'No longer used: each location adds its own photo under Location → Services → What We Paint photos. Being removed.',
            }),
          ],
          preview: {select: {title: 'title', subtitle: 'slug.current'}, prepare: ({title, subtitle}) => ({title, subtitle: subtitle ? `#${subtitle}` : 'No link name yet'})},
        }),
      ],
    }),

    // FAQ
    defineField({
      name: 'faqs',
      description: 'Questions and answers on every service page (also FAQ search data). Tokens: {city}, {state}, {owner}.',
      title: 'FAQ',
      type: 'array',
      group: 'faq',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faq',
          fields: [
            defineField({name: 'question', type: 'string', description: 'As a homeowner would ask it.', validation: (rule) => rule.required()}),
            defineField({name: 'answer', type: 'text', rows: 3, description: TOKENS, validation: (rule) => rule.required()}),
          ],
          preview: {select: {title: 'question', subtitle: 'answer'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'slug.current'}},
})
