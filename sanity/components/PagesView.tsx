import {Box, Card, Stack, Text} from '@sanity/ui'
import type {UserViewComponent} from 'sanity/structure'

import {pagesForDocument} from '../lib/live-pages'
import {PageLinks} from './PageLinks'
import {useSiteData} from './useSiteData'

/** Document view: every live page this document feeds (published content) */
export const PagesView: UserViewComponent = ({document, schemaType}) => {
  const site = useSiteData()
  const published = document.published as Parameters<typeof pagesForDocument>[1]
  const pages = site ? pagesForDocument(schemaType.name, published, site.locations, site.services) : null

  return (
    <Box padding={4}>
      <Stack gap={4}>
        <Text size={1} muted>
          Opens the published page in a new tab, on this site ({typeof window === 'undefined' ? '' : window.location.host}). Unpublished changes are not on the page yet.
        </Text>
        {!published && (
          <Card padding={3} radius={2} tone="caution" border>
            <Text size={1}>Not published yet: there is no live page.</Text>
          </Card>
        )}
        <PageLinks pages={published ? pages : []} empty={published ? 'This content isn’t on any page yet.' : 'Publish first.'} />
      </Stack>
    </Box>
  )
}
