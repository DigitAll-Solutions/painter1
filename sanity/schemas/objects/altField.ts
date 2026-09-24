import {defineField} from 'sanity'

export const altField = defineField({
  name: 'alt',
  title: 'Alt text',
  type: 'string',
  description: 'Describe the image for screen readers and search engines.',
  validation: (rule) => rule.required(),
})
