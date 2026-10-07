import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {ExternalLink} from 'lucide-react'

import type {LivePage} from '../lib/live-pages'
import {pageUrl} from './useSiteData'

/** A list of live page links (new tab), or a note when there are none */
export function PageLinks({pages, empty}: {pages: LivePage[] | null; empty: string}) {
  if (!pages) return <Text muted size={1}>Loading…</Text>
  if (!pages.length) return <Text muted size={1}>{empty}</Text>
  return (
    <Stack gap={2}>
      {pages.map((page) => (
        <Card key={page.path} as="a" href={pageUrl(page.path)} target="_blank" rel="noopener noreferrer" padding={3} radius={2} border tone="default" style={{textDecoration: 'none'}}>
          <Flex align="center" gap={3}>
            <Box flex={1}>
              <Stack gap={2}>
                <Text weight="semibold" size={1}>
                  {page.label}
                </Text>
                <Text muted size={1}>
                  {page.path}
                </Text>
              </Stack>
            </Box>
            <Text muted>
              <ExternalLink size={16} aria-hidden />
            </Text>
          </Flex>
        </Card>
      ))}
    </Stack>
  )
}
