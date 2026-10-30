/**
 * Launch smoke test (docs/launch-rehearsal.md): our Knoxville pages, legacy redirects, indexing rules and,
 * on the painter1.com hosts, the WordPress pages proxied behind Vercel (no redirect loop, no wp.painter1.com
 * links, never cached by Vercel's CDN). Read-only: GET requests only, no form is submitted.
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
const headers: Record<string, string> = { 'user-agent': 'Mozilla/5.0 (painter1 launch smoke test)', ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}) }
const production = isProductionHost(base.host)
const proxiesWordPress = new RegExp(`^${WORDPRESS_PROXY_HOST_PATTERN}$`).test(base.hostname)

let failures = 0
const check = (ok: boolean, label: string, detail = '') => {
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`)
}

const get = (path: string) => fetch(new URL(path, base), { headers, redirect: 'manual' })

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

async function redirectsTo(path: string, to: string) {
  const res = await get(path)
  const location = res.headers.get('location') ?? ''
  check(res.status === 308 && new URL(location, base).href === new URL(to, base).href, `${path} → ${to}`, `${res.status} ${location}`)
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
  check(/Sitemap: .*\/sitemap\.xml/.test(robots) && /Sitemap: .*\/sitemap_index\.xml/.test(robots), 'robots.txt lists our sitemap and WordPress’s')
} else {
  check(tag.includes('noindex'), `${base.host}: X-Robots-Tag noindex`, tag)
  check(/Disallow: \/\s*$/m.test(robots), `${base.host}: robots.txt disallows everything`)
}
const sitemap = await get('/sitemap.xml')
const sitemapXml = await sitemap.text()
check(sitemap.status === 200 && sitemapXml.includes('/knoxville<') && !sitemapXml.includes('/slc<'), '/sitemap.xml: live locations only')

// WordPress behind the proxy
if (proxiesWordPress) {
  for (const path of ['/', '/atlanta/', '/wp-login.php', '/wp-json/', '/sitemap_index.xml']) {
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
  }
} else {
  console.log(`--    ${base.host} doesn't proxy WordPress (only www, the apex and staging do): WordPress checks skipped`)
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exitCode = failures ? 1 : 0
