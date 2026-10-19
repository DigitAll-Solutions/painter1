# Go-live plan: Knoxville on the new site, the rest of painter1.com on WordPress

For Rick, his WordPress host and us. Written Oct 19, 2026. Nothing here is built yet: this document compares the options and gives the runbook. The code changes it needs go in a separate launch PR (listed under "Launch PR").

## The situation

- **painter1.com DNS is at GoDaddy.** WordPress is hosted by Rick's host and serves the corporate pages and all 44 location sites at `www.painter1.com/<location>/…`.
- **Only Knoxville moves first.** The other 43 locations, the corporate pages and WordPress admin stay on WordPress for now. Each later location move must be a small, repeatable change.
- **The new site** (Next.js on Vercel, today at `painter1.vercel.app`) serves:
  - `/knoxville/…`
  - `/studio` (Sanity Studio)
  - `/api/…` (publish webhook, lead cleanup cron)
  - `/_next/…` and `/sanity-img/…` (scripts, styles, images)
  - `/robots.txt`, `/sitemap.xml`
  - a few root files: `/favicon.png`, `/painter1-logo*.svg`, `/warranty-graphic-B-fandeck.svg`
- **Email must not be touched in any option:** MX, SPF, the Brevo DKIM CNAMEs (`brevo1._domainkey`, `brevo2._domainkey`), the `brevo-code` TXT, DMARC (`p=reject`) and every verification TXT stay exactly as they are. With `p=reject`, a lost SPF or DKIM record means mail from painter1.com is rejected.

## Needed whatever the option

- **Knoxville ready:** Studio launch checklist green, booking URL decision, Turnstile production keys for `www.painter1.com`, lead email go-live checklist (`docs/email-setup.md` §8).
- **Redirects** for Knoxville's old WordPress URLs are in code (`lib/legacy-redirects.ts`, list in `docs/studio-plan.md` §7). Google Ads final URLs updated to `/knoxville/free-estimate`.
- **Sanity:**
  - add `https://www.painter1.com` to CORS origins with credentials, and register the Studio host
  - point the publish webhook at `https://www.painter1.com/api/revalidate`
- **Vercel:**
  - set `NEXT_PUBLIC_SITE_URL=https://www.painter1.com`
  - confirm the team is on a plan that allows commercial use (Pro; Hobby is non-commercial only), and its bandwidth and request allowance
- **WordPress keeps its Knoxville pages, unchanged, until the switch is stable** (at least two weeks). They are the rollback. Only afterwards: drop them from WordPress's sitemap and set them to noindex.

## Option (a): Vercel in front, WordPress behind an origin hostname

`www.painter1.com` points to Vercel. Next.js serves the live locations and its own paths. Every other request is proxied, invisibly, to WordPress at a second hostname, `wp.painter1.com`. This is the incremental-migration pattern Next.js and Vercel document: [Next.js rewrites, "Incremental adoption"](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites), [Vercel rewrites to external origins](https://vercel.com/docs/rewrites).

**Rick or the host must:**

1. Serve the same WordPress install at **`wp.painter1.com`** too (a server alias), with its own valid SSL certificate (Let's Encrypt on the host).
2. Make WordPress **not redirect `wp.painter1.com` to `www`**, and build its links with the visitor's host. Vercel sends the visitor's host in `X-Forwarded-Host` and the protocol in `X-Forwarded-Proto`. Add to `wp-config.php` (above "That's all"):
   ```php
   if (!empty($_SERVER['HTTP_X_FORWARDED_HOST']) && $_SERVER['HTTP_X_FORWARDED_HOST'] === 'www.painter1.com') {
     $_SERVER['HTTP_HOST'] = 'www.painter1.com';
     $_SERVER['HTTPS'] = 'on';
   }
   ```
   `WP_HOME` and `WP_SITEURL` stay `https://www.painter1.com`.
3. **Trust Vercel's visitor-IP headers** (`X-Forwarded-For`, `X-Real-IP`) in security and rate-limit plugins (e.g. Wordfence → Options → "How does Wordfence get IPs": X-Forwarded-For) and in any host firewall. Otherwise every visitor looks like a Vercel IP, and one lockout locks everyone out.
4. **Optional, later:** accept requests on `wp.painter1.com` only from Vercel, via a secret header ([Vercel: restricting your origin](https://vercel.com/docs/rewrites)).

**DNS at GoDaddy:**
- **New:** `wp` A → the WordPress server's IP.
- **Changed:**
  - `www` → the CNAME Vercel shows for the domain (typically `cname.vercel-dns.com`)
  - `@` → the A record Vercel shows (typically `76.76.21.21`); Vercel then redirects `painter1.com` → `www.painter1.com`
- **Everything else unchanged.** No nameserver change.

**How things behave:**

| | Behaviour |
|---|---|
| **SSL** | Vercel's certificates for `www` and the apex are **pre-generated** before the switch with a TXT `_acme-challenge` record ([Vercel: pre-generate SSL certs](https://vercel.com/docs/domains/pre-generating-ssl-certs)), so there is no certificate gap. The host keeps its own certificate for `wp.painter1.com`. |
| **WP admin** | `www.painter1.com/wp-admin` works through the proxy. Cookies stay on `www`, because the browser only ever sees `www`. Test a typical media upload in the rehearsal: very large uploads through a proxy are the most likely thing to fail. |
| **Forms on the other 43 locations** | Fluent Forms posts to `/wp-admin/admin-ajax.php` or the REST API. Both are proxied, and their notification emails still go out from WordPress. Test one form in the rehearsal. |
| **Sitemap, robots** | Next.js owns `/robots.txt` and `/sitemap.xml` (they are served before any rewrite). The launch PR makes our robots.txt list **both** our sitemap and WordPress's (check its URL first: Yoast uses `/sitemap_index.xml`; if WordPress uses `/sitemap.xml` itself, ours gets another name), and keep WordPress's own disallow rules. |
| **Caching** | Vercel caches a proxied WordPress page only if WordPress sends cache headers (default for projects created after Apr 6, 2026). Start with proxy caching **off** for WordPress paths, so a WordPress edit shows exactly as today. WordPress's own page cache keeps working. |
| **Studio CORS** | The Studio is served by Next.js at `www.painter1.com/studio`: add that origin (see above). Nothing else changes. |
| **Our app** | Same host as today, so server actions (the estimate form), the visitor IP used for rate limiting and consent, and the webhook all work unchanged. |

**Rollback:** at GoDaddy, put the old `www` and `@` records back (save them before the switch). With TTL lowered to 300 s beforehand, most visitors are back on WordPress within 5–30 minutes. WordPress still has its Knoxville pages. The `wp` record can stay.

**Risk to the other 43 locations:** **medium.** All their traffic now passes through Vercel. The things that can go wrong are WordPress-behind-a-proxy issues: a redirect loop, IP-based lockouts, admin uploads, a plugin that checks the host. All of them are found in a **rehearsal on a test hostname** before touching `www`, and the fix for any surprise on the day is the DNS rollback.

**Downtime:** **none expected.** Both servers answer during DNS propagation, and the certificates exist before the switch.

**Cost:** WordPress traffic now counts toward Vercel's edge requests and data transfer. Check the Vercel usage page in the first week.

## Option (b): WordPress stays the origin; its host forwards `/knoxville/*` to Vercel

DNS stays as it is. The WordPress server (nginx or Apache) proxies `/knoxville/…`, `/_next/…`, `/sanity-img/…`, `/studio…` and `/api/…` to the Vercel deployment.

- **Rick or the host must:** add reverse-proxy rules to the web server. **Many managed WordPress hosts don't allow this**; on a VPS it's a few nginx `location` blocks. The rules must forward the Host of a domain assigned to the Vercel project.
- **DNS:** no change. **SSL:** the host's certificate; Vercel is reached over HTTPS at its own domain.
- **What breaks or needs changes on our side:**
  - **Every visitor reaches Vercel from the host's IP.** Our estimate form's rate limit and the IP stored with each consent record would see one IP for everyone, and Vercel's firewall and bot protection would treat the host as a single client. Vercel supports a self-hosted nginx in front only with **Enterprise onboarding** and static egress IPs ([Vercel: proxy in front of Vercel](https://vercel.com/guides/can-i-use-a-proxy-on-top-of-my-vercel-deployment)).
  - **The estimate form** (a server action) rejects requests whose Origin (`www.painter1.com`) doesn't match the host it sees, unless we add `serverActions.allowedOrigins` ([Next.js docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)).
  - **Two caches:** the host's page cache doesn't know about our publish webhook, so Knoxville edits can show late unless the host never caches the proxied paths.
- **WP admin, forms, sitemap:** unchanged. WordPress's robots.txt must add our sitemap, and WordPress's sitemap must drop the Knoxville URLs.
- **Rollback:** remove the proxy rules and reload the web server (minutes).
- **Risk to the other locations:** low while the config is right. A typo in the web-server config can take all of WordPress down.
- **Downtime:** none (a config reload).
- **Verdict:** possible only if the host allows proxy rules, and it degrades our own site (IPs, firewall, caching).

## Option (c): something else

**(c1) Cloudflare in front, a Worker routing by path.**
- **How:** move painter1.com's nameservers from GoDaddy to Cloudflare (the registration stays at GoDaddy). A Worker on `www.painter1.com/*` sends our paths to Vercel and everything else to WordPress.
- **Downsides:**
  - Moving nameservers means re-creating **every** DNS record at Cloudflare; one missed SPF or DKIM record and painter1.com mail is rejected (`p=reject`).
  - Cloudflare's Free plan allows 100,000 Worker requests a day, and all 44 locations' traffic counts, so plan on Workers Paid. Host-header overrides without a Worker are Enterprise-only ([Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits), [Origin Rules](https://developers.cloudflare.com/rules/origin-rules)).
  - Vercel advises against a proxy in front: a separate cache, Bot Protection not working, and visitor IPs needing "Verified Proxy" setup ([Vercel guide](https://vercel.com/guides/can-i-use-a-proxy-on-top-of-my-vercel-deployment)).
- **Upsides:** per-path switching and an instant rollback (disable the Worker route).
- **Verdict:** worth it only if Rick already wants Cloudflare.

**(c2) A subdomain (`knoxville.painter1.com`) on Vercel.** No proxy at all, but every Knoxville URL changes. Search rankings and old links depend on redirects from WordPress, and each location move repeats that. Not recommended.

## Comparison

| | (a) Vercel in front | (b) WordPress host proxies | (c1) Cloudflare Worker |
|---|---|---|---|
| Who does the work | GoDaddy DNS + host: `wp.painter1.com`, SSL, 4 lines in wp-config, IP setting; us: launch PR | Host: proxy rules (if allowed) | Move nameservers, Worker code, Cloudflare account |
| DNS | `www` + `@` changed, `wp` added | none | all records move to Cloudflare |
| Email risk | none | none | **high** (records must be copied exactly) |
| Risk to the other 43 | medium, caught in rehearsal | low (config typo: high) | medium |
| Our site behind it | unchanged | degraded (IPs, firewall, caches; code change for the form) | needs Verified Proxy, separate cache |
| Rollback | 2 DNS records, 5–30 min | remove rules, minutes | disable route, seconds |
| Downtime | none | none | none if records are complete |
| Next locations | add a slug in code | add proxy rules each time | change the Worker each time |
| Extra cost | Vercel usage | none | Workers Paid ($5/month) |

## Recommendation: (a)

- **Only two DNS records change, at GoDaddy.** No nameserver move, so email is safe.
- **The host's part is small and standard.**
- **Our site keeps working exactly as tested.**
- **Rollback is putting two records back.**
- **Moving the next location is one line in our code.**

Its risk, WordPress behaving differently behind a proxy, is found in a rehearsal before anyone touches `www`.

## Launch PR (code for option (a), not built yet)

1. **WordPress proxy:** an `afterFiles` rewrite in `next.config.ts` that sends every path that is **not** a live location or one of our paths to WordPress, keeping the path and query:
   ```ts
   afterFiles: [{ source: '/:path((?!(?:knoxville|studio|api|_next|sanity-img)(?:/|$)).*)', destination: 'https://wp.painter1.com/:path' }]
   ```
   It must be `afterFiles`, not the `fallback` rewrite from the Next.js example: our dynamic `[location]` route matches `/atlanta/…` before `fallback` runs and would return our 404. `afterFiles` runs before dynamic routes and after our own files ([Next.js: rewrite order](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites)). The live slugs come from `LIVE_LOCATIONS` (`lib/legacy-redirects.ts`), so the next move updates both.
2. **Trailing slashes:**
   - **The problem:** WordPress URLs end with `/`, and Next.js normally 308s `/atlanta/` to `/atlanta` before any rewrite. WordPress would redirect it back: a loop.
   - **The fix:** set `skipTrailingSlashRedirect: true` ([docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/skipTrailingSlashRedirect)), and add a small `proxy.ts` that removes the trailing slash **only** for our own paths (live locations, `/studio`), so our pages and the legacy redirects keep working.
3. **Remove the temporary `/` → `/knoxville` redirect.** The painter1.com homepage stays WordPress.
4. **robots.txt:** list both sitemaps, and keep WordPress's disallow rules.
5. **Tests:** a WordPress location URL with and without the slash, `/`, `/wp-admin/`, `/wp-json/…`, a Knoxville page and a legacy redirect, against a preview deployment.

## Launch-day runbook (option (a))

**One to two weeks before**
1. Host: `wp.painter1.com` live with SSL, the wp-config lines, IP trust in security plugins. Check it the way Vercel will call it: `curl -sI -H "X-Forwarded-Host: www.painter1.com" -H "X-Forwarded-Proto: https" https://wp.painter1.com/atlanta/` must answer **200 with no redirect**, and the page's links must be `www.painter1.com`. Without that header, a redirect to `www` is expected and fine.
2. Find WordPress's sitemap URL and robots.txt rules.
3. **Merge the launch PR**, with the proxy pointed at `wp.painter1.com`.
4. **Rehearsal:**
   - Add `staging.painter1.com` to the Vercel project (CNAME at GoDaddy).
   - Through it, check:
     - the WordPress home, 3 other locations, a corporate page and a blog post
     - one form submission on another location (and its email)
     - a WP admin login, an edit and an image upload
     - `/knoxville`, a legacy redirect and the estimate form
   - Fix anything found. Repeat until clean.

**Two days before**
5. At GoDaddy, **save the current DNS records** (screenshot and export), then lower the TTL of `www` and `@` to 300 s.
6. In Vercel → Domains, add `www.painter1.com` and `painter1.com` and **pre-generate the certificates** (TXT `_acme-challenge` at GoDaddy). Verify with `curl --resolve www.painter1.com:443:76.76.21.21 https://www.painter1.com/knoxville` (use the IP Vercel shows).
7. Sanity: CORS origin and Studio host for `https://www.painter1.com`. Vercel: `NEXT_PUBLIC_SITE_URL`, Turnstile keys.

**Launch day (a quiet morning, US Eastern; not a Friday)**
8. Freeze WordPress edits for the morning (no plugin updates).
9. GoDaddy: change `www` (CNAME) and `@` (A) to Vercel's values. Don't touch anything else.
10. **Within 15 minutes, check over a phone network and a VPN:**
    - `www.painter1.com/knoxville` (new site)
    - `www.painter1.com/` and 3 other locations (WordPress)
    - a legacy URL such as `/knoxville/brick-painting/`
    - WP admin login
    - one Fluent Form on another location
    - the Knoxville estimate form, and its Client Tether test (`docs/email-setup.md` §8)
    - `/robots.txt`, `/sitemap.xml`
11. Point the Sanity webhook at `https://www.painter1.com/api/revalidate`, publish a small change, and see it live.
12. Watch for 2 hours: Vercel → Logs and Observability (External Origins: WordPress error rates), and WordPress's own error log.

**After**
13. Search Console:
    - submit our sitemap
    - URL-inspect `/knoxville` and two legacy redirects
    - watch coverage for a week
14. Google Ads: confirm the final URLs.
15. Two weeks stable: remove Knoxville from WordPress's sitemap, set its old pages to noindex, and raise the DNS TTL back to 1 hour.

## Rollback plan

**Roll back if any of these lasts more than 10 minutes:**
- WordPress pages error or loop
- WP admin can't log in
- forms on other locations fail
- certificate errors

**Steps:**
1. At GoDaddy, set `www` and `@` back to the saved values.
2. Tell Rick. Visitors move back within 5–30 minutes (TTL 300 s); some resolvers take longer.
3. WordPress serves everything again, including its old Knoxville pages.
4. Point the Sanity webhook back at `painter1.vercel.app`.

**Afterwards:** reproduce the problem on `staging.painter1.com`, fix it, and schedule a new launch day.

Data is safe either way. Leads are in Sanity, and WordPress was never changed except for the origin hostname and the wp-config lines, which are harmless while `www` points to WordPress.
