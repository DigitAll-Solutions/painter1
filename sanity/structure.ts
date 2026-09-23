import type {StructureResolver} from 'sanity/structure'

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type).title(title))

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('location').title('Locations'),
      S.divider(),
      singleton(S, 'franchisePage', 'Corporate Homepage'),
      singleton(S, 'locationsPage', 'Locations Directory'),
      singleton(S, 'franchiseOpportunities', 'Franchise Opportunities'),
    ])
