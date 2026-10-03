import {defineArrayMember, defineType} from 'sanity'

// Plain paragraphs where the only formatting is bold, e.g. "We paint exclusively with **Sherwin-Williams**".
export const boldText = defineType({
  name: 'boldText',
  title: 'Text (bold allowed)',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [],
      marks: {decorators: [{title: 'Bold', value: 'strong'}], annotations: []},
    }),
  ],
})
