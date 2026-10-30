import type { NextRequest } from 'next/server'

// skipTrailingSlashRedirect (next.config.ts) stops Next.js from 308ing /atlanta/ to /atlanta: WordPress
// URLs end with a slash and WordPress would redirect straight back (a loop). So the slash is removed here,
// and only on our own pages (the live locations and the Studio), as Next.js did before; the legacy
// redirects then apply as before (/knoxville/brick-painting/ → /knoxville/brick-painting → …#brick).
// The matcher lists LIVE_LOCATIONS literally (Next reads it at build time); wordpress-proxy.test.ts
// fails when a live location is missing from it.
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return Response.redirect(new URL(`${pathname.replace(/\/+$/, '') || '/'}${search}`, request.url), 308)
  }
}

export const config = {
  matcher: ['/knoxville/:path*', '/studio/:path*'],
}
