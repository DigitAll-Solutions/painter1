import {defineField, defineType} from 'sanity'
import {altField} from './altField'

export const pageSection = defineType({
  name: 'pageSection',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({name: 'heading', type: 'string'}),
    defineField({name: 'body', type: 'blockContent'}),
    defineField({name: 'image', type: 'image', options: {hotspot: true}, fields: [altField]}),
  ],
  preview: {select: {title: 'heading', media: 'image'}},
})
