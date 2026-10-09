import {useEffect, useState} from 'react'
import {Card, Select, Stack, Text} from '@sanity/ui'
import {set, unset, useClient, type StringInputProps} from 'sanity'

import {STUDIO_API_VERSION} from './useSiteData'

type Surface = {_key: string; title?: string}

/**
 * Picks one of the shared service's "What we paint" surfaces for a location photo. Stores the
 * surface's key (not its title), so renaming a surface keeps the photo attached. The service comes
 * from the field's path: services.<interior|exterior|cabinet>.surfacePhotos[…].surface
 */
export function SurfaceSelectInput(props: StringInputProps) {
  const {value, onChange, path, readOnly, elementProps} = props
  const serviceKey = String(path[path.indexOf('services') + 1] ?? '')
  const client = useClient({apiVersion: STUDIO_API_VERSION})
  const [surfaces, setSurfaces] = useState<Surface[] | null>(null)

  useEffect(() => {
    let live = true
    client
      .fetch<Surface[] | null>(`*[_type == "service" && locationKey == $key && !(_id in path("drafts.**"))][0].whatWePaint[]{_key, title}`, {key: serviceKey})
      .then((result) => live && setSurfaces(result ?? []))
    return () => {
      live = false
    }
  }, [client, serviceKey])

  const known = !value || !surfaces || surfaces.some((surface) => surface._key === value)
  return (
    <Stack gap={2}>
      <Select
        {...elementProps}
        value={value ?? ''}
        disabled={readOnly || !surfaces}
        onChange={(event) => onChange(event.currentTarget.value ? set(event.currentTarget.value) : unset())}
      >
        <option value="">{surfaces ? 'Choose a surface…' : 'Loading surfaces…'}</option>
        {(surfaces ?? []).map((surface) => (
          <option key={surface._key} value={surface._key}>
            {surface.title || surface._key}
          </option>
        ))}
        {!known && <option value={value}>{value} (no longer a surface)</option>}
      </Select>
      {!known && (
        <Card padding={3} radius={2} tone="caution" border>
          <Text size={1}>This surface was removed from Shared → Services, so the photo isn’t shown. Pick another surface or remove the photo.</Text>
        </Card>
      )}
    </Stack>
  )
}
