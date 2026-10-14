import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Server-side page rendering only (Studio has its own client): read the API, not the CDN, so a
  // published change is there as soon as the publish webhook expires the page (lib/revalidate.ts)
  useCdn: false,
})
