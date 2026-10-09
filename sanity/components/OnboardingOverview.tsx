import {useEffect, useState} from 'react'
import {Badge, Box, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'

import {locationChecklist, missing, type LocationDoc} from '../../lib/location-checklist'
import {useChecklistData} from './LaunchChecklist'
import {STUDIO_API_VERSION} from './useSiteData'

type Row = LocationDoc & {_id: string}

/** Locations → Onboarding overview: one row per location with what's still missing (migration board) */
export function OnboardingOverview() {
  const client = useClient({apiVersion: STUDIO_API_VERSION})
  const [locations, setLocations] = useState<Row[] | null>(null)
  useEffect(() => {
    // Drafts win over published, so the board reflects work in progress
    client.fetch<Row[]>(`*[_type == "location"]`).then((docs) => {
      const byId = new Map<string, Row>()
      for (const doc of docs) {
        const id = doc._id.replace(/^drafts\./, '')
        if (doc._id.startsWith('drafts.') || !byId.has(id)) byId.set(id, {...doc, _id: id})
      }
      setLocations([...byId.values()].sort((a, b) => (a.address?.state ?? '').localeCompare(b.address?.state ?? '') || (a.name ?? '').localeCompare(b.name ?? '')))
    })
  }, [client])
  const data = useChecklistData((locations ?? []).map((l) => l._id))

  if (!locations || !data) return <Box padding={4}><Text muted>Loading…</Text></Box>
  const rows = locations.map((location) => {
    const items = locationChecklist(location, data.recipients[location._id] ?? 0, data.serviceKeys, data.warranty[location._id] ?? 0)
    return {location, required: missing(items, 'required'), recommended: missing(items, 'recommended')}
  })
  const ready = rows.filter((r) => !r.required.length).length

  return (
    <Box padding={4}>
      <Stack gap={4}>
        <Stack gap={3}>
          <Heading size={1}>Onboarding overview</Heading>
          <Text size={1} muted>
            {locations.length} location{locations.length === 1 ? '' : 's'} · {ready} with every required item · drafts included. Open a location for its full Launch checklist.
          </Text>
        </Stack>
        <Card radius={2} border>
          <Flex padding={3} gap={3} style={{borderBottom: '1px solid var(--card-border-color)'}}>
            <Box flex={3}><Text size={1} weight="bold">Location</Text></Box>
            <Box flex={1}><Text size={1} weight="bold">State</Text></Box>
            <Box flex={1}><Text size={1} weight="bold">Type</Text></Box>
            <Box flex={4}><Text size={1} weight="bold">Required missing</Text></Box>
            <Box flex={1.5}><Text size={1} weight="bold">Recommended</Text></Box>
            <Box flex={1.2}><Text size={1} weight="bold">Recipients</Text></Box>
          </Flex>
          {rows.map(({location, required, recommended}) => (
            <Flex key={location._id} padding={3} gap={3} align="center" style={{borderBottom: '1px solid var(--card-border-color)'}}>
              <Box flex={3}>
                <IntentLink intent="edit" params={{id: location._id, type: 'location'}} style={{color: 'inherit'}}>
                  <Text size={1} weight="semibold">{location.name ?? 'Untitled location'}</Text>
                </IntentLink>
              </Box>
              <Box flex={1}><Text size={1}>{location.address?.state ?? '—'}</Text></Box>
              <Box flex={1}><Text size={1}>{location.locationType === 'maintenance' ? 'Maintenance' : 'Growth'}</Text></Box>
              <Box flex={4}>
                {required.length ? (
                  <Text size={1}>{required.map((item) => item.label).join(', ')}</Text>
                ) : (
                  <Badge tone="positive" fontSize={0}>Ready</Badge>
                )}
              </Box>
              <Box flex={1.5}><Badge tone={recommended.length ? 'caution' : 'positive'} fontSize={0}>{recommended.length}</Badge></Box>
              <Box flex={1.2}><Text size={1}>{data.recipients[location._id] ? `${data.recipients[location._id]}` : 'None'}</Text></Box>
            </Flex>
          ))}
        </Card>
      </Stack>
    </Box>
  )
}
