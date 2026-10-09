import {useEffect, useState} from 'react'
import {Badge, Box, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {Circle, CircleCheck, CircleX, TriangleAlert} from 'lucide-react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import type {UserViewComponent} from 'sanity/structure'

import {locationChecklist, missing, type CheckItem, type LocationDoc} from '../../lib/location-checklist'
import {STUDIO_API_VERSION} from './useSiteData'

/** Lead and warranty recipient counts (never the addresses) and service id → key, for the checklist */
export function useChecklistData(locationIds: string[]) {
  const client = useClient({apiVersion: STUDIO_API_VERSION})
  const [data, setData] = useState<{recipients: Record<string, number>; warranty: Record<string, number>; serviceKeys: Record<string, string>} | null>(null)
  const key = locationIds.join(',')
  useEffect(() => {
    let live = true
    const ids = key ? key.split(',').map((id) => `leads.${id.replace(/^drafts\./, '')}`) : []
    client
      .fetch<{recipients: {_id: string; n: number; w: number}[]; services: {_id: string; locationKey: string}[]}>(
        `{"recipients": *[_id in $ids]{_id, "n": count(leadRecipients), "w": count(warrantyRecipients)}, "services": *[_type == "service" && !(_id in path("drafts.**"))]{_id, locationKey}}`,
        {ids},
      )
      .then((result) => {
        if (!live) return
        setData({
          recipients: Object.fromEntries(result.recipients.map((r) => [r._id.replace(/^leads\./, ''), r.n ?? 0])),
          warranty: Object.fromEntries(result.recipients.map((r) => [r._id.replace(/^leads\./, ''), r.w ?? 0])),
          serviceKeys: Object.fromEntries(result.services.map((s) => [s._id, s.locationKey])),
        })
      })
    return () => {
      live = false
    }
  }, [client, key])
  return data
}

const STATUS = {
  ok: {icon: CircleCheck, tone: 'positive'},
  required: {icon: CircleX, tone: 'critical'},
  recommended: {icon: TriangleAlert, tone: 'caution'},
  optional: {icon: Circle, tone: 'default'},
} as const

function Row({item, documentId}: {item: CheckItem; documentId: string}) {
  const status = item.ok ? STATUS.ok : STATUS[item.level]
  const Icon = status.icon
  const label = (
    <Text size={1} weight={item.ok ? 'regular' : 'semibold'}>
      {item.label}
    </Text>
  )
  return (
    <Card padding={3} radius={2} tone={item.ok ? 'default' : status.tone} border>
      <Flex align="center" gap={3}>
        <Text size={2}>
          <Icon size={18} aria-hidden />
        </Text>
        <Box flex={1}>
          <Stack gap={2}>
            {item.path ? (
              <IntentLink intent="edit" params={{id: documentId, type: 'location', path: item.path}} style={{color: 'inherit'}}>
                {label}
              </IntentLink>
            ) : (
              label
            )}
            {item.detail && (
              <Text size={1} muted>
                {item.detail}
              </Text>
            )}
          </Stack>
        </Box>
        {!item.ok && (
          <Badge tone={status.tone} fontSize={0}>
            {item.level}
          </Badge>
        )}
      </Flex>
    </Card>
  )
}

/** Document view on a location: what onboarding still needs (red = required, amber = recommended) */
export const LaunchChecklist: UserViewComponent = ({document, documentId}) => {
  const id = documentId.replace(/^drafts\./, '')
  const data = useChecklistData([id])
  if (!data) return <Box padding={4}><Text muted>Checking…</Text></Box>

  const items = locationChecklist(document.displayed as LocationDoc, data.recipients[id] ?? 0, data.serviceKeys, data.warranty[id] ?? 0)
  const required = missing(items, 'required').length
  const recommended = missing(items, 'recommended').length
  const areas = [...new Set(items.map((item) => item.area))]

  return (
    <Box padding={4}>
      <Stack gap={5}>
        <Card padding={4} radius={3} tone={required ? 'critical' : recommended ? 'caution' : 'positive'} border>
          <Stack gap={3}>
            <Heading size={1}>{required ? `${required} required item${required === 1 ? '' : 's'} missing` : 'Ready to launch'}</Heading>
            <Text size={1} muted>
              {recommended} recommended item{recommended === 1 ? '' : 's'} still open. Checks the version you are editing; click an item to open its field.
            </Text>
          </Stack>
        </Card>
        {areas.map((area) => (
          <Stack key={area} gap={2}>
            <Text size={1} weight="bold">
              {area}
            </Text>
            {items
              .filter((item) => item.area === area)
              .map((item) => (
                <Row key={item.id} item={item} documentId={id} />
              ))}
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}
