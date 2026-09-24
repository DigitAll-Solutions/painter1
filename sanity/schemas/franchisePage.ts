import {defineArrayMember, defineField, defineType} from 'sanity'
import {altField} from './objects/altField'
import {House} from 'lucide-react'

export const franchisePage = defineType({
  name: 'franchisePage',
  title: 'Corporate Homepage',
  type: 'document',
  icon: House,
  fields: [
    defineField({name: 'heroHeadline', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'heroSubheadline', type: 'text', rows: 2}),
    defineField({name: 'heroImage', type: 'image', options: {hotspot: true}, fields: [altField]}),
    defineField({name: 'ctaLabel', type: 'string'}),
    defineField({name: 'ctaUrl', type: 'string'}),
    defineField({name: 'sections', type: 'array', of: [defineArrayMember({type: 'pageSection'})]}),
    defineField({name: 'metaTitle', type: 'string'}),
    defineField({name: 'metaDescription', type: 'text', rows: 3}),
  ],
  preview: {prepare: () => ({title: 'Corporate Homepage'})},
})
