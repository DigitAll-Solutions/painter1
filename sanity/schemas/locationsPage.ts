import {defineField, defineType} from 'sanity'
import {Globe} from 'lucide-react'

export const locationsPage = defineType({
  name: 'locationsPage',
  title: 'Locations Directory',
  type: 'document',
  icon: Globe,
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required(), description: 'Page heading. (Page not on the site yet.)'}),
    defineField({name: 'intro', type: 'text', rows: 4, description: 'Text under the heading.'}),
    defineField({name: 'metaTitle', type: 'string', description: 'Browser tab and search result title (max ~60 characters).'}),
    defineField({name: 'metaDescription', type: 'text', rows: 3, description: 'Search result description (max ~160 characters).'}),
  ],
  preview: {prepare: () => ({title: 'Locations Directory'})},
})
