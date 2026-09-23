import {defineField, defineType} from 'sanity'

export const pageSection = defineType({
  name: 'pageSection',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({name: 'heading', type: 'string'}),
    defineField({name: 'body', type: 'blockContent'}),
    defineField({name: 'image', type: 'image', options: {hotspot: true}, fields: [defineField({name: 'alt', type: 'string'})]}),
  ],
  preview: {select: {title: 'heading', media: 'image'}},
})
