import type {StructureResolver} from 'sanity/structure'

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type).title(title))

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('location').title('Locations'),
      S.documentTypeListItem('service').title('Services'),
      S.divider(),
      S.listItem()
        .title('Estimate survey')
        .id('estimate-survey')
        .child(
          S.list()
            .title('Estimate survey')
            .items([
              S.listItem().title('Default survey').id('estimate-survey-default').child(S.document().schemaType('estimateSurvey').documentId('estimate-survey-default')),
              S.documentTypeListItem('estimateSurvey').title('All surveys'),
            ]),
        ),
      // Private documents: ID "leads.<location id>" (dot = never served publicly)
      S.listItem()
        .title('Lead recipients')
        .id('lead-recipients')
        .child(
          S.documentTypeList('location')
            .title('Lead recipients by location')
            .child((locationId) => S.document().schemaType('leadSettings').documentId(`leads.${locationId.replace(/^drafts\./, '')}`)),
        ),
      S.listItem()
        .title('Leads')
        .id('leads')
        .child(S.documentTypeList('lead').title('Leads').defaultOrdering([{field: 'submittedAt', direction: 'desc'}])),
      S.divider(),
      singleton(S, 'franchisePage', 'Corporate Homepage'),
      singleton(S, 'locationsPage', 'Locations Directory'),
      singleton(S, 'franchiseOpportunities', 'Franchise Opportunities'),
    ])
