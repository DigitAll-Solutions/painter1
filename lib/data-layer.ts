declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

/** Push an analytics event; works whether or not GTM is loaded (GTM reads the queue when it starts) */
export function pushDataLayer(event: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(event)
}
