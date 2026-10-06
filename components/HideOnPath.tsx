'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/** Renders nothing on pages whose path ends with `suffix` (e.g. the estimate page hides its own CTAs) */
export default function HideOnPath({ suffix, children }: { suffix: string; children: ReactNode }) {
  return usePathname()?.endsWith(suffix) ? null : children
}
