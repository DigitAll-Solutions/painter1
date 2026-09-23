import { type SchemaTypeDefinition } from 'sanity'

import { blockContent } from './objects/blockContent'
import { pageSection } from './objects/pageSection'
import { serviceDetail } from './objects/serviceDetail'
import { location } from './location'
import { franchisePage } from './franchisePage'
import { locationsPage } from './locationsPage'
import { franchiseOpportunities } from './franchiseOpportunities'

export const singletonTypes = new Set(['franchisePage', 'locationsPage', 'franchiseOpportunities'])

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContent,
    pageSection,
    serviceDetail,
    location,
    franchisePage,
    locationsPage,
    franchiseOpportunities,
  ],
}
