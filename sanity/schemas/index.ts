import { type SchemaTypeDefinition } from 'sanity'

import { blockContent } from './objects/blockContent'
import { pageSection } from './objects/pageSection'
import { boldText } from './objects/boldText'
import { consentText } from './objects/consentText'
import { serviceDetail } from './objects/serviceDetail'
import { location } from './location'
import { service } from './service'
import { estimateSurvey } from './estimateSurvey'
import { lead } from './lead'
import { leadSettings } from './leadSettings'
import { privacyPolicy } from './privacyPolicy'
import { franchisePage } from './franchisePage'
import { locationsPage } from './locationsPage'
import { franchiseOpportunities } from './franchiseOpportunities'

export const singletonTypes = new Set(['franchisePage', 'locationsPage', 'franchiseOpportunities', 'privacyPolicy'])
/** Created only with fixed private IDs (by Studio's structure or the server), never from the new-document menu */
export const noCreateTypes = new Set(['leadSettings', 'lead'])

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContent,
    boldText,
    consentText,
    pageSection,
    serviceDetail,
    location,
    service,
    estimateSurvey,
    leadSettings,
    lead,
    privacyPolicy,
    franchisePage,
    locationsPage,
    franchiseOpportunities,
  ],
}
