import {defineArrayMember, defineField, defineType} from 'sanity'
import {Rocket} from 'lucide-react'

export const franchiseOpportunities = defineType({
  name: 'franchiseOpportunities',
  title: 'Franchise Opportunities',
  type: 'document',
  icon: Rocket,
  fields: [
    defineField({name: 'heroHeadline', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'heroSubheadline', type: 'text', rows: 2}),
    defineField({name: 'heroImage', type: 'image', options: {hotspot: true}, fields: [defineField({name: 'alt', type: 'string'})]}),
    defineField({name: 'ctaLabel', type: 'string'}),
    defineField({name: 'ctaUrl', type: 'string'}),
    defineField({
      name: 'benefits',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'benefit',
          fields: [
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'description', type: 'text', rows: 3}),
          ],
        }),
      ],
    }),
    defineField({name: 'sections', type: 'array', of: [defineArrayMember({type: 'pageSection'})]}),
    defineField({name: 'metaTitle', type: 'string'}),
    defineField({name: 'metaDescription', type: 'text', rows: 3}),
  ],
  preview: {prepare: () => ({title: 'Franchise Opportunities'})},
})
