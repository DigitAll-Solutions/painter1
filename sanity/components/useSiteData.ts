import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {SITE_DATA_QUERY, type SiteLocation, type SiteService} from '../lib/live-pages'

export const STUDIO_API_VERSION = '2025-01-01'

/** Published locations and services (for page links), fetched once per pane */
export function useSiteData() {
  const client = useClient({apiVersion: STUDIO_API_VERSION})
  const [data, setData] = useState<{locations: SiteLocation[]; services: SiteService[]} | null>(null)
  useEffect(() => {
    let live = true
    client.fetch<{locations: SiteLocation[]; services: SiteService[]}>(SITE_DATA_QUERY).then((result) => live && setData(result))
    return () => {
      live = false
    }
  }, [client])
  return data
}

/** Pages open on the Studio's own origin (Vercel preview or production) */
export const pageUrl = (path: string) => `${typeof window === 'undefined' ? '' : window.location.origin}${path}`
