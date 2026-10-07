import {Card, Stack, Text} from '@sanity/ui'
import {type SlugInputProps, useCurrentUser, useEditState, useFormValue} from 'sanity'

/**
 * The location slug is its live URL (painter1.com/<slug>). Once the location has been published,
 * only administrators can change it: a new slug breaks every live link and needs redirects.
 */
export function LockedSlugInput(props: SlugInputProps) {
  const id = String(useFormValue(['_id']) ?? '').replace(/^drafts\./, '')
  const {published} = useEditState(id, 'location')
  const user = useCurrentUser()
  const isAdmin = Boolean(user?.roles.some((role) => role.name === 'administrator'))
  const publishedSlug = (published as {slug?: {current?: string}} | null)?.slug?.current
  const locked = Boolean(publishedSlug) && !isAdmin

  return (
    <Stack gap={3}>
      {props.renderDefault({...props, readOnly: locked || props.readOnly})}
      {publishedSlug && (
        <Card padding={3} radius={2} tone={locked ? 'transparent' : 'caution'} border>
          <Text size={1} muted={locked}>
            {locked
              ? `Locked: this location is live at /${publishedSlug}. Ask an administrator if the URL must change (it needs redirects).`
              : `This location is live at /${publishedSlug}. Changing the slug breaks every existing link to it: add redirects before publishing a new one.`}
          </Text>
        </Card>
      )}
    </Stack>
  )
}
