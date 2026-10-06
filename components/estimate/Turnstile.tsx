'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
    }
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// Invisible Cloudflare Turnstile ("interaction-only": it only shows itself if Cloudflare needs the
// visitor to click). It writes its token into a hidden "cf-turnstile-response" input inside the form.
// The script loads when the browser is idle, so it never competes with the page's first paint.
export default function Turnstile({ siteKey }: { siteKey: string }) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let widgetId: string | undefined
    let cancelled = false

    const render = () => {
      if (cancelled || !box.current || !window.turnstile || widgetId) return
      widgetId = window.turnstile.render(box.current, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        'refresh-expired': 'auto',
        'response-field-name': 'cf-turnstile-response',
      })
    }

    const load = () => {
      if (window.turnstile) return render()
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`)
      if (!script) {
        script = document.createElement('script')
        script.src = SCRIPT
        script.async = true
        document.head.appendChild(script)
      }
      script.addEventListener('load', render, { once: true })
    }

    const hasIdle = typeof window.requestIdleCallback === 'function'
    const idle = hasIdle ? window.requestIdleCallback(load, { timeout: 3000 }) : window.setTimeout(load, 1500)

    return () => {
      cancelled = true
      if (hasIdle) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [siteKey])

  return <div ref={box} />
}
