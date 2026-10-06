'use client'

import { useEffect } from 'react'

import { ATTRIBUTION_STORAGE_KEY, URL_ATTRIBUTION } from '@/lib/estimate-form'

// Keeps utm_* / gclid from the landing URL for this browser session, so they still reach the
// estimate form after the visitor browses to it (the live site only read the form page's own URL).
export default function AttributionCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const found = Object.fromEntries(URL_ATTRIBUTION.flatMap((key) => (params.get(key) ? [[key, params.get(key) as string]] : [])))
    if (!Object.keys(found).length) return
    try {
      const stored = JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? '{}')
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify({ ...stored, ...found }))
    } catch {
      // storage unavailable
    }
  }, [])
  return null
}
