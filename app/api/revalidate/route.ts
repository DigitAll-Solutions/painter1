// Called by the Sanity webhook when a document is published, changed or deleted (setup:
// docs/cms-guide.md). Expires only the cache tags that document affects (lib/revalidate.ts), so the
// next visit renders fresh content. Requests must be signed with SANITY_REVALIDATE_SECRET.
import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

import { tagsFor, type RevalidateBody } from '@/lib/revalidate'

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) return NextResponse.json({ message: 'SANITY_REVALIDATE_SECRET is not set' }, { status: 500 })

  // Checks the signature, then waits briefly so the published change is readable before pages re-render
  const { isValidSignature, body } = await parseBody<RevalidateBody>(req, secret, true)
  if (!isValidSignature) return NextResponse.json({ message: 'Invalid signature' }, { status: 401 })
  if (!body?._type) return NextResponse.json({ message: 'No document type in the body' }, { status: 400 })

  const tags = tagsFor(body)
  // { expire: 0 }: a webhook can't use updateTag, and owners expect the very next visit to be fresh
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
  return NextResponse.json({ type: body._type, revalidated: tags, now: Date.now() })
}
