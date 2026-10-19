// Old WordPress URL /<location>/schedule/ (the live site's booking calendar). It goes to the location's
// booking page whenever Studio has one, otherwise to the free-estimate survey (lib/location.ts
// scheduleTarget), with the visitor's UTM tags and click IDs. 307, not permanent: the target changes
// when a booking page is added in Studio, and browsers would keep a permanent redirect forever.
// The trailing-slash form /knoxville/schedule/ reaches here through Next's own 308.
import { type NextRequest, NextResponse } from 'next/server'

import { scheduleTarget } from '@/lib/location'
import { getLocation } from '@/sanity/lib/fetch'

export async function GET(req: NextRequest, ctx: RouteContext<'/[location]/schedule'>) {
  const location = await getLocation((await ctx.params).location)
  if (!location) return new NextResponse('Not found', { status: 404 })
  return NextResponse.redirect(new URL(scheduleTarget(location, req.nextUrl.search), req.url), 307)
}
