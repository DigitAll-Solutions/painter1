/**
 * Launch smoke test (docs/launch-rehearsal.md): our Knoxville pages, legacy redirects, indexing rules and,
 * on the painter1.com hosts, the WordPress pages proxied behind Vercel (no redirect loop, no wp.painter1.com
 * links, never cached by Vercel's CDN; /atlanta/ and the Xagio sitemaps link only to the host tested). Read-only:
 * GET requests only, no form is submitted.
 *
 *   node scripts/smoke-launch.ts https://staging.painter1.com
 *   node scripts/smoke-launch.ts https://www.painter1.com            (launch day)
 *   VERCEL_AUTOMATION_BYPASS_SECRET=… node scripts/smoke-launch.ts https://<preview>.vercel.app
 *
 * The bypass secret (Vercel → Settings → Deployment Protection → Protection Bypass for Automation) opens
 * a protected preview. WordPress refuses some countries: run the WordPress checks from a US connection.
 */
import { isProductionHost } from '../lib/indexing.ts'
import { WORDPRESS_PROXY_HOST_PATTERN } from '../lib/wordpress-proxy.ts'

const base = new URL(process.argv[2] ?? 'https://staging.painter1.com')
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const headers: Record<string, string> = { 'user-agent': 'Mozilla/5.0 (painter1 launch smoke test)', ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}), ...(process.env.P1_DEV_COOKIE ? { cookie: `p1_dev=${process.env.P1_DEV_COOKIE}` } : {}) }
const production = isProductionHost(base.host)
const proxiesWordPress = new RegExp(`^${WORDPRESS_PROXY_HOST_PATTERN}$`).test(base.hostname)

let failures = 0
const check = (ok: boolean, label: string, detail = '') => {
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`)
}

const get = (path: string) => fetch(new URL(path, base), { headers, redirect: 'manual' })

/** WordPress's sitemap index (Xagio SEO; the live site's Link rel="sitemap" header) */
const WORDPRESS_SITEMAP = '/sitemap-xag.xml'

/** The painter1.com hosts a page links to (absolute, protocol-relative or JSON-escaped URLs), with up to 3 example URLs each */
function painter1Links(body: string) {
  const hosts = new Map<string, { count: number; examples: string[] }>()
  for (const m of body.matchAll(/(?:https?:)?(?:\\?\/){2}((?:[a-z0-9-]+\.)*painter1\.com)(?![a-z0-9.-])[^\s"'<>)\\]*/gi)) {
    const host = m[1].toLowerCase()
    const entry = hosts.get(host) ?? { count: 0, examples: [] }
    entry.count++
    if (entry.examples.length < 3 && !entry.examples.includes(m[0])) entry.examples.push(m[0])
    hosts.set(host, entry)
  }
  return hosts
}

/** Every painter1.com link is on the host being tested (staging or www), and there is at least one */
function linksOnBaseHost(body: string, label: string) {
  const links = painter1Links(body)
  const own = links.get(base.host)?.count ?? 0
  const others = [...links].filter(([host]) => host !== base.host)
  const detail = [`${base.host}=${own}`, ...others.map(([host, { count, examples }]) => `${host}=${count} (e.g. ${examples.join(' ')})`)].join(', ')
  check(own > 0 && others.length === 0, `${label}: links on ${base.host} only`, detail)
}

/** Follows up to 5 redirects; the hops taken and the final response */
async function follow(path: string) {
  const hops: string[] = []
  let url = new URL(path, base)
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers, redirect: 'manual' })
    const location = res.headers.get('location')
    if (res.status < 300 || res.status >= 400 || !location) return { res, hops, url }
    url = new URL(location, url)
    hops.push(`${res.status} ${url.href}`)
  }
  return { res: undefined, hops, url }
}

/** Follows the 308s (at most 3: the trailing slash comes off first, see proxy.ts) and checks where they end */
async function redirectsTo(path: string, to: string) {
  const target = new URL(to, base).href
  const hops: string[] = []
  let current = new URL(path, base).href
  for (let i = 0; i < 3 && current !== target; i++) {
    const res = await get(current)
    if (res.status !== 308) {
      hops.push(String(res.status))
      break
    }
    current = new URL(res.headers.get('location') ?? '', current).href
    hops.push(`308 ${current.replace(base.origin, '')}`)
  }
  check(current === target, `${path} → ${to}`, hops.join(' → '))
}

// Our pages and the legacy redirects
for (const path of ['/knoxville', '/knoxville/interior-painting', '/knoxville/free-estimate', '/knoxville/our-work']) {
  const res = await get(path)
  check(res.status === 200, `${path} is ours`, String(res.status))
}
await redirectsTo('/knoxville/', '/knoxville')
await redirectsTo('/knoxville/brick-painting/', '/knoxville/exterior-painting#brick')
await redirectsTo('/knoxville/cabinet-refinishing', '/knoxville/cabinet-painting')
await redirectsTo('/knoxville/maryville/', '/knoxville')

// Indexing: only www.painter1.com / painter1.com may be indexed
const robots = await (await get('/robots.txt')).text()
const knoxville = await get('/knoxville')
const tag = knoxville.headers.get('x-robots-tag') ?? ''
if (production) {
  check(!tag.includes('noindex'), 'production: no X-Robots-Tag noindex', tag)
  check(/Sitemap: .*\/sitemap\.xml/.test(robots) && /Sitemap: .*\/sitemap-xag\.xml/.test(robots), 'robots.txt lists our sitemap and WordPress’s')
} else {
  check(tag.includes('noindex'), `${base.host}: X-Robots-Tag noindex`, tag)
  check(/Disallow: \/\s*$/m.test(robots), `${base.host}: robots.txt disallows everything`)
}
const sitemap = await get('/sitemap.xml')
const sitemapXml = await sitemap.text()
check(sitemap.status === 200 && sitemapXml.includes('/knoxville<') && !sitemapXml.includes('/slc<'), '/sitemap.xml: live locations only')

// WordPress behind the proxy
if (proxiesWordPress) {
  for (const path of ['/', '/atlanta/', '/wp-login.php', '/wp-json/', WORDPRESS_SITEMAP]) {
    const { res, hops, url } = await follow(path)
    if (!res) {
      check(false, `WordPress ${path}`, `redirect loop: ${hops.join(' → ')}`)
      continue
    }
    const body = await res.text()
    check(res.status === 200 && url.host === base.host, `WordPress ${path}`, [res.status, ...hops].join(' → '))
    check(!body.includes('wp.painter1.com'), `WordPress ${path}: no wp.painter1.com links`)
    if (!production) check((res.headers.get('x-robots-tag') ?? '').includes('noindex'), `WordPress ${path}: noindex on ${base.host}`)
    check(res.headers.get('x-vercel-cache') !== 'HIT', `WordPress ${path}: not served from Vercel's cache`, res.headers.get('x-vercel-cache') ?? 'no x-vercel-cache')
    if (path === '/atlanta/') linksOnBaseHost(body, `WordPress ${path}`)
  }

  // The sitemap index and its sub-sitemaps (their names come from the index): XML, every URL on this host
  const index = await follow(WORDPRESS_SITEMAP)
  const indexXml = index.res ? await index.res.text() : ''
  const isXml = (res: Response) => /xml/.test(res.headers.get('content-type') ?? '')
  check(!!index.res && index.res.status === 200 && isXml(index.res), `${WORDPRESS_SITEMAP}: XML`, index.res ? `${index.res.status} ${index.res.headers.get('content-type')}` : 'redirect loop')
  linksOnBaseHost(indexXml, WORDPRESS_SITEMAP)
  const locs = [...indexXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'))
  if (indexXml.includes('<sitemapindex')) {
    check(locs.length > 0, `${WORDPRESS_SITEMAP}: lists sub-sitemaps`, String(locs.length))
    for (const loc of locs.slice(0, 12)) {
      const { pathname, search } = new URL(loc, base)
      const sub = await follow(pathname + search)
      if (!sub.res) {
        check(false, `Sitemap ${pathname}`, `redirect loop: ${sub.hops.join(' → ')}`)
        continue
      }
      const xml = await sub.res.text()
      check(sub.res.status === 200 && isXml(sub.res) && sub.url.host === base.host, `Sitemap ${pathname}: XML on ${base.host}`, [sub.res.status, sub.res.headers.get('content-type'), ...sub.hops].join(' → '))
      linksOnBaseHost(xml, `Sitemap ${pathname}`)
      check(sub.res.headers.get('x-vercel-cache') !== 'HIT', `Sitemap ${pathname}: not served from Vercel's cache`, sub.res.headers.get('x-vercel-cache') ?? 'no x-vercel-cache')
    }
    if (locs.length > 12) console.log(`--    ${locs.length - 12} more sub-sitemaps not fetched`)
  } else {
    check(locs.length > 0, `${WORDPRESS_SITEMAP}: lists URLs`, String(locs.length))
  }
} else {
  console.log(`--    ${base.host} doesn't proxy WordPress (only www, the apex and staging do): WordPress checks skipped`)
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exitCode = failures ? 1 : 0
