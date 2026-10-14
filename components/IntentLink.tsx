'use client'

import NextLink from 'next/link'
import { useState, type ComponentProps } from 'react'

// next/link that prefetches on intent (hover, keyboard focus, touch) instead of as soon as the link is on
// screen. A prefetched page brings its own LCP image with it (React preloads eager images from the
// prefetched payload), so viewport prefetching made every page download the home page's hero right after
// load, and the footer pulled in every service page's hero. Pattern from Next's prefetching guide.
export default function IntentLink({ onMouseEnter, onFocus, onTouchStart, ...props }: ComponentProps<typeof NextLink>) {
  const [intent, setIntent] = useState(false)
  return (
    <NextLink
      {...props}
      prefetch={intent ? null : false}
      onMouseEnter={(e) => {
        setIntent(true)
        onMouseEnter?.(e)
      }}
      onFocus={(e) => {
        setIntent(true)
        onFocus?.(e)
      }}
      onTouchStart={(e) => {
        setIntent(true)
        onTouchStart?.(e)
      }}
    />
  )
}
