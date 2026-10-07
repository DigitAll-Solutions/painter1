import {useEffect, useState} from 'react'
import {Box, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'

import {locationPages, type SiteLocation} from '../lib/live-pages'
import {PageLinks} from './PageLinks'
import {STUDIO_API_VERSION, useSiteData} from './useSiteData'

/** Location folder → "Live pages": links to every published page of this location */
export function LivePagesPane({options}: {options?: Record<string, unknown>}) {
  const locationId = String(options?.locationId ?? '')
  const client = useClient({apiVersion: STUDIO_API_VERSION})
  const site = useSiteData()
  const [location, setLocation] = useState<SiteLocation | null | undefined>(undefined)
  useEffect(() => {
    client
      .fetch<SiteLocation | null>(`*[_id == $id][0]{_id, name, "slug": slug.current, locationType}`, {id: locationId.replace(/^drafts\./, '')})
      .then(setLocation)
  }, [client, locationId])

  const pages = site && location !== undefined ? (location ? locationPages(location, site.services) : []) : null
  return (
    <Box padding={4}>
      <Stack gap={4}>
        <Text size={1} muted>
          The published pages of {location?.name ?? 'this location'}, opened on this site.
        </Text>
        <PageLinks pages={pages} empty="Not published yet: publish the location to put it online." />
      </Stack>
    </Box>
  )
}
