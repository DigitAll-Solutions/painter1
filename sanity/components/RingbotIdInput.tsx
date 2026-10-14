import {TextInput} from '@sanity/ui'
import {set, unset, type StringInputProps} from 'sanity'

import {extractRingbotId} from '../../lib/ringbot'

/**
 * Web chat (Ringbot): an editor can paste the whole embed code, its URL or just the iID; only the iID is
 * stored. Anything that isn't one is kept as typed, so the field's validation can say what's wrong.
 */
export function RingbotIdInput(props: StringInputProps) {
  const {value, onChange, elementProps} = props
  return (
    <TextInput
      {...elementProps}
      value={value ?? ''}
      onChange={(event) => {
        const raw = event.currentTarget.value
        const next = extractRingbotId(raw) ?? raw.trim()
        onChange(next ? set(next) : unset())
      }}
    />
  )
}
