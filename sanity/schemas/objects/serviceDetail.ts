import {defineArrayMember, defineField, defineType} from 'sanity'

export const serviceDetail = defineType({
  name: 'serviceDetail',
  title: 'Service',
  type: 'object',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'description', type: 'text', rows: 4}),
    defineField({
      name: 'highlights',
      title: "What's included",
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'process',
      title: 'Process steps',
      type: 'array',
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
      description: 'Shown as tabs on the service page, e.g. Home Siding and Stucco under Exterior.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'subService',
          fields: [
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'description', type: 'text', rows: 4}),
            defineField({name: 'image', type: 'image', options: {hotspot: true}, fields: [defineField({name: 'alt', type: 'string'})]}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: [defineField({name: 'alt', type: 'string'})],
        }),
      ],
    }),
  ],
})
