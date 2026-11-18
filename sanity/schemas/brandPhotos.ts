import {defineField, defineType} from 'sanity'
import {Images} from 'lucide-react'

import {altField} from './objects/altField'

// Help text on every "our work" field (gallery, before/after, project photos)
export const WORK_NOTE = "Only this location's own projects. Don't use another location's photos."

export const BRAND_NOTE = 'Shared placeholders used when a location has no photo of its own. Never shown as a project.'

const photo = (name: string, title: string, description: string) =>
  defineField({name, title, type: 'image', fieldset: 'photos', options: {hotspot: true}, fields: [altField], description: `${description} Alt text: describe the scene; don’t name a location, crew or person.`})

// One document for the network (ID "brand-photos"). LOCATION_QUERY uses each photo only when the location's
// own field is empty, so a location's own photo always wins. Never people (owner, team) or projects (gallery,
// before/after): those show only when the location adds its own.
export const brandPhotos = defineType({
  name: 'brandPhotos',
  title: 'Brand photos',
  type: 'document',
  icon: Images,
  description: BRAND_NOTE,
  // A fieldset shows its description at the top of the form, so the rule is visible while editing
  fieldsets: [{name: 'photos', title: 'Brand photos', description: BRAND_NOTE}],
  fields: [
    photo('heroImage', 'Homepage hero', 'Homepage hero background (and the share image) for a location with no hero of its own. Landscape, at least 1920px wide.'),
    photo('warrantyImage', 'Homepage warranty: photo', 'Beside the warranty banner on the homepage, for a location with none of its own.'),
    photo('warrantyGraphic', 'Homepage warranty: graphic', 'Beside the warranty copy on the homepage. Empty: the blue paint fan-deck illustration.'),
    photo('warrantyPageImage', 'Warranty page: photo', 'Top of the warranty page, beside the 2-year shield, for a location with none of its own. Empty: the shield alone.'),
  ],
  preview: {prepare: () => ({title: 'Brand photos', subtitle: BRAND_NOTE})},
})
