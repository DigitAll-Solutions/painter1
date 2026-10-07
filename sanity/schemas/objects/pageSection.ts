import {defineField, defineType} from 'sanity'
import {altField} from './altField'

export const pageSection = defineType({
  name: 'pageSection',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({name: 'heading', type: 'string', description: 'Section heading.'}),
    defineField({name: 'body', type: 'blockContent', description: 'Section text.'}),
    defineField({name: 'image', type: 'image', options: {hotspot: true}, fields: [altField], description: 'Optional photo for the section.'}),
  ],
  preview: {select: {title: 'heading', media: 'image'}},
})
