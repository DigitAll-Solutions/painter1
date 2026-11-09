import { NextResponse, type NextRequest } from 'next/server.js'

import { isWordpressPath, wordpressRequestHeaders } from './lib/wordpress-proxy.ts'

// Two jobs, split by path:
// - Our own pages (the live locations and the Studio): skipTrailingSlashRedirect (next.config.ts) stops
//   Next.js from 308ing /atlanta/ to /atlanta: WordPress URLs end with a slash and WordPress would redirect
//   straight back (a loop). So the slash is removed here, and only on our own pages, as Next.js did before;
//   the legacy redirects then apply as before (/knoxville/brick-painting/ → /knoxville/brick-painting → …#brick).
// - WordPress paths on the proxy hosts: add X-P1-Proxy-Key and X-P1-Host for wp-config.php
//   (lib/wordpress-proxy.ts). Proxy runs before next.config's afterFiles rewrite, which then proxies the
//   request with these headers; the slash and the query are left alone.
// The matcher is literal (Next reads it at build time): it lists LIVE_LOCATIONS and repeats wordpressSource
// and the proxy host pattern; wordpress-proxy.test.ts fails when they drift apart.
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (isWordpressPath(pathname)) {
    const host = request.headers.get('host') ?? request.nextUrl.host
    return NextResponse.next({ request: { headers: wordpressRequestHeaders(request.headers, host) } })
  }
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return Response.redirect(new URL(`${pathname.replace(/\/+$/, '') || '/'}${search}`, request.url), 308)
  }
}

export const config = {
  matcher: [
    '/knoxville/:path*',
    '/studio/:path*',
    {
      source: '/:path((?!(?:knoxville|studio|api|_next|_vercel|sanity-img)(?:/|$)).*)',
      has: [{ type: 'host', value: '(?:www\\.|staging\\.)?painter1\\.com' }],
    },
  ],
}
