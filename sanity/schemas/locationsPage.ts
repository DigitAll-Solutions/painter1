import {defineField, defineType} from 'sanity'
import {Globe} from 'lucide-react'

export const locationsPage = defineType({
  name: 'locationsPage',
  title: 'Locations Directory',
  type: 'document',
  icon: Globe,
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'intro', type: 'text', rows: 4}),
    defineField({name: 'metaTitle', type: 'string'}),
    defineField({name: 'metaDescription', type: 'text', rows: 3}),
  ],
  preview: {prepare: () => ({title: 'Locations Directory'})},
})
