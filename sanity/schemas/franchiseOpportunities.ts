import {defineArrayMember, defineField, defineType} from 'sanity'
import {altField} from './objects/altField'
import {Rocket} from 'lucide-react'

export const franchiseOpportunities = defineType({
  name: 'franchiseOpportunities',
  title: 'Franchise Opportunities',
  type: 'document',
  icon: Rocket,
  fields: [
    defineField({name: 'heroHeadline', type: 'string', validation: (rule) => rule.required(), description: 'Main heading at the top of the page. (Page not on the site yet.)'}),
    defineField({name: 'heroSubheadline', type: 'text', rows: 2, description: 'One or two sentences under the heading.'}),
    defineField({name: 'heroImage', type: 'image', options: {hotspot: true}, fields: [altField], description: 'Large background photo, landscape, at least 1920px wide.'}),
    defineField({name: 'ctaLabel', type: 'string', description: 'Button text, e.g. "Find Your Local Painter".'}),
    defineField({name: 'ctaUrl', type: 'string', description: 'Button link: a path like "/locations" or a full URL.'}),
    defineField({
      name: 'benefits',
      type: 'array',
      description: 'Benefit cards (title + short text).',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'benefit',
          fields: [
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required(), description: 'Benefit heading, e.g. "Low startup cost".'}),
            defineField({name: 'description', type: 'text', rows: 3, description: 'One or two sentences.'}),
          ],
        }),
      ],
    }),
    defineField({name: 'sections', type: 'array', of: [defineArrayMember({type: 'pageSection'})], description: 'Content sections below the hero, in order.'}),
    defineField({name: 'metaTitle', type: 'string', description: 'Browser tab and search result title (max ~60 characters).'}),
    defineField({name: 'metaDescription', type: 'text', rows: 3, description: 'Search result description (max ~160 characters).'}),
  ],
  preview: {prepare: () => ({title: 'Franchise Opportunities'})},
})
