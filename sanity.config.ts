'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {OPEN_PAGE_TYPES, OpenPageAction} from './sanity/actions/openPage'
import {NEW_LOCATION_DEFAULTS} from './sanity/lib/new-location-defaults'
import {noCreateTypes, schema, singletonTypes} from './sanity/schemas'
import {defaultDocumentNode, structure} from './sanity/structure'

const singletonActions = new Set(['publish', 'discardChanges', 'restore'])

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemas' folder
  schema: {
    ...schema,
    templates: (templates) => [
      // Singletons and private documents can't be created from the "new document" menu
      ...templates.filter(({schemaType, id}) => !singletonTypes.has(schemaType) && !noCreateTypes.has(schemaType) && id !== 'location'),
      // "New location": Knoxville's lead email and consent pattern ({locationName}), service titles, defaults
      {id: 'location', title: 'New location', schemaType: 'location', value: NEW_LOCATION_DEFAULTS},
    ],
  },
  document: {
    actions: (input, context) => {
      // Singletons can only be published, not duplicated or deleted
      const actions = singletonTypes.has(context.schemaType) ? input.filter(({action}) => action && singletonActions.has(action)) : input
      return OPEN_PAGE_TYPES.has(context.schemaType) ? [...actions, OpenPageAction] : actions
    },
  },
  plugins: [
    structureTool({structure, defaultDocumentNode}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
  // Vision runs queries with the user's own permissions (including private leads): administrators only
  tools: (tools, {currentUser}) =>
    currentUser?.roles.some((role) => role.name === 'administrator') ? tools : tools.filter((tool) => tool.name !== 'vision'),
})
