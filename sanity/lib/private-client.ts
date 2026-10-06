import { createClient, type SanityClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

// Token-authenticated clients for the free-estimate server action only. Never import these from a
// component: the tokens are server-side env vars. Return null when the token isn't configured.
const withToken = (token: string | undefined): SanityClient | null =>
  token ? createClient({ projectId, dataset, apiVersion, token, useCdn: false, perspective: 'published' }) : null

/** Writes private lead documents (lead.<uuid>) */
export const leadWriteClient = () => withToken(process.env.SANITY_API_WRITE_TOKEN)

/** Reads private recipients (leads.<location id>) */
export const leadReadClient = () => withToken(process.env.SANITY_API_READ_TOKEN)
