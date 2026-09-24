// Production origin used for canonical URLs, sitemap and structured data.
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.painter1.com').replace(/\/$/, '')

export const absoluteUrl = (path = '/') => `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
