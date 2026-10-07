import type {DefaultDocumentNodeResolver, StructureBuilder, StructureResolver} from 'sanity/structure'
import {Building2, ClipboardList, FlaskConical, Globe2, Inbox, LayoutDashboard, Link2, MapPin, Share2, Users} from 'lucide-react'

import {LaunchChecklist} from './components/LaunchChecklist'
import {LivePagesPane} from './components/LivePagesPane'
import {OnboardingOverview} from './components/OnboardingOverview'
import {PagesView} from './components/PagesView'
import {STUDIO_API_VERSION} from './components/useSiteData'
import {stateName} from './lib/us-states'

const singleton = (S: StructureBuilder, type: string, title: string, note?: string) =>
  S.listItem()
    .title(note ? `${title} (${note})` : title)
    .id(type)
    .schemaType(type)
    .child(S.document().schemaType(type).documentId(type).title(title).views(documentViews(S, type)))

/** Views for a document: Edit, plus a launch checklist on locations and a "Pages" list where pages exist */
const documentViews = (S: StructureBuilder, schemaType: string) => {
  const edit = S.view.form().title('Edit')
  const pages = S.view.component(PagesView).title('Pages').id('pages')
  if (schemaType === 'location') return [edit, S.view.component(LaunchChecklist).title('Launch checklist').id('checklist'), pages]
  if (['service', 'privacyPolicy', 'estimateSurvey'].includes(schemaType)) return [edit, pages]
  return [edit]
}

// Documents opened from generated lists; documents built below with S.document() set their views explicitly
export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => S.document().views(documentViews(S, schemaType))

/** A location's folder: its document, private lead recipients, its leads (newest first), live pages */
const locationFolder = (S: StructureBuilder) => (locationId: string) => {
  const id = locationId.replace(/^drafts\./, '')
  return S.list()
    .id(`folder-${id}`)
    .title('Location')
    .items([
      S.listItem()
        .title('Location details')
        .id('details')
        .icon(MapPin)
        .child(S.document().schemaType('location').documentId(id).views(documentViews(S, 'location'))),
      // Private document "leads.<location id>" (dot = never served by the public API)
      S.listItem()
        .title('Lead recipients')
        .id('recipients')
        .icon(Users)
        .child(S.document().schemaType('leadSettings').documentId(`leads.${id}`).title('Lead recipients')),
      S.listItem()
        .title('Leads')
        .id('leads')
        .icon(Inbox)
        .child(
          S.documentList()
            .title('Leads')
            .schemaType('lead')
            .apiVersion(STUDIO_API_VERSION)
            .filter('_type == "lead" && location._ref == $id')
            .params({id})
            .defaultOrdering([{field: 'submittedAt', direction: 'desc'}]),
        ),
      S.listItem()
        .title('Live pages')
        .id('pages')
        .icon(Link2)
        .child(S.component(LivePagesPane).id(`pages-${id}`).title('Live pages').options({locationId: id})),
    ])
}

const locationsByFilter = (S: StructureBuilder, title: string, filter: string, params: Record<string, unknown> = {}) =>
  S.documentList()
    .title(title)
    .schemaType('location')
    .apiVersion(STUDIO_API_VERSION)
    .filter(`_type == "location" && ${filter}`)
    .params(params)
    .defaultOrdering([{field: 'name', direction: 'asc'}])
    .child(locationFolder(S))

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Locations')
        .id('locations')
        .icon(MapPin)
        .child(async () => {
          // One item per state that has locations (from address.state), A→Z
          const codes = await context
            .getClient({apiVersion: STUDIO_API_VERSION})
            .fetch<string[]>(`array::unique(*[_type == "location" && defined(address.state)].address.state)`)
          const states = [...codes].sort((a, b) => (stateName(a) ?? a).localeCompare(stateName(b) ?? b))
          return S.list()
            .title('Locations')
            .id('locations-root')
            .items([
              S.listItem()
                .title('Onboarding overview')
                .id('overview')
                .icon(LayoutDashboard)
                .child(S.component(OnboardingOverview).id('onboarding-overview').title('Onboarding overview')),
              S.divider(),
              ...states.map((code) =>
                S.listItem()
                  .title(stateName(code) ?? code)
                  .id(`state-${code}`)
                  .icon(Globe2)
                  .child(locationsByFilter(S, stateName(code) ?? code, 'address.state == $state', {state: code})),
              ),
              S.listItem().title('No state set').id('state-none').icon(Globe2).child(locationsByFilter(S, 'No state set', '!defined(address.state)')),
              S.divider(),
              S.listItem().title('All locations (A→Z)').id('all-locations').icon(MapPin).child(locationsByFilter(S, 'All locations', 'true')),
            ])
        }),

      S.listItem()
        .title('Shared')
        .id('shared')
        .icon(Share2)
        .child(
          S.list()
            .title('Shared')
            .items([
              S.documentTypeListItem('service').title('Services'),
              S.listItem()
                .title('Estimate survey')
                .id('estimate-survey')
                .icon(ClipboardList)
                .child(
                  S.list()
                    .title('Estimate survey')
                    .items([
                      S.listItem().title('Default survey').id('estimate-survey-default').child(S.document().schemaType('estimateSurvey').documentId('estimate-survey-default').views(documentViews(S, 'estimateSurvey'))),
                      S.documentTypeListItem('estimateSurvey').title('All surveys'),
                    ]),
                ),
              singleton(S, 'privacyPolicy', 'Privacy Policy'),
            ]),
        ),

      S.listItem()
        .title('Corporate')
        .id('corporate')
        .icon(Building2)
        .child(
          S.list()
            .title('Corporate')
            .items([
              singleton(S, 'franchisePage', 'Corporate Homepage', 'not on the site yet'),
              singleton(S, 'locationsPage', 'Locations Directory', 'not on the site yet'),
              singleton(S, 'franchiseOpportunities', 'Franchise Opportunities', 'not on the site yet'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('All leads')
        .id('all-leads')
        .icon(Inbox)
        .child(
          S.list()
            .title('All leads')
            .items([
              S.listItem()
                .title('Newest first')
                .id('leads-newest')
                .icon(Inbox)
                .child(S.documentTypeList('lead').title('All leads').defaultOrdering([{field: 'submittedAt', direction: 'desc'}])),
              S.listItem()
                .title('By location')
                .id('leads-by-location')
                .icon(MapPin)
                .child(
                  S.documentTypeList('location')
                    .title('Leads by location')
                    .defaultOrdering([{field: 'name', direction: 'asc'}])
                    .child((locationId) =>
                      S.documentList()
                        .title('Leads')
                        .schemaType('lead')
                        .apiVersion(STUDIO_API_VERSION)
                        .filter('_type == "lead" && location._ref == $id')
                        .params({id: locationId.replace(/^drafts\./, '')})
                        .defaultOrdering([{field: 'submittedAt', direction: 'desc'}]),
                    ),
                ),
              S.listItem()
                .title('Test leads')
                .id('leads-test')
                .icon(FlaskConical)
                .child(
                  S.documentList()
                    .title('Test leads')
                    .schemaType('lead')
                    .apiVersion(STUDIO_API_VERSION)
                    .filter('_type == "lead" && testMode == true')
                    .defaultOrdering([{field: 'submittedAt', direction: 'desc'}]),
                ),
            ]),
        ),
    ])
