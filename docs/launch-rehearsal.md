# Launch rehearsal on staging.painter1.com

For us, Rick and his WordPress host. Written Oct 30, 2026, with the launch PR (branch `launch-knoxville`, option (a) of `docs/go-live-plan.md`). The rehearsal runs the launch PR on `staging.painter1.com` exactly as `www.painter1.com` will run on launch day: Knoxville from this site, everything else proxied to WordPress at `wp.painter1.com`. `www.painter1.com` is not touched.

## What the launch PR changes

- **WordPress proxy** (`lib/wordpress-proxy.ts`, `next.config.ts`): on `www.painter1.com`, `painter1.com` and `staging.painter1.com`, every path that isn't a live location (`LIVE_LOCATIONS`: `knoxville`) or one of our paths (`/studio`, `/api`, `/_next`, `/_vercel`, `/sanity-img`, `robots.txt`, `sitemap.xml`, `public/` files) goes to `https://wp.painter1.com`, path, trailing slash and query unchanged. Vercel's CDN never caches those responses (`x-vercel-enable-rewrite-caching: 0`).
  - `painter1.vercel.app`, previews and localhost don't proxy: every Sanity location still renders there, so Rick keeps previewing the ones he is filling in.
- **Trailing slashes:** `skipTrailingSlashRedirect`, plus `proxy.ts`, which 308s `/knoxville/…/` and `/studio/…/` to the path without the slash. WordPress URLs keep theirs. Old Knoxville URLs with a slash now reach their new page in one hop.
- **`/` → `/knoxville` is gone on painter1.com:** the homepage there is WordPress. It stays on `painter1.vercel.app`, which has no homepage of its own.
- **robots.txt (production only):** our sitemap and WordPress's Yoast sitemap (`/sitemap_index.xml`), and WordPress's own disallow rules (`/*?*`, `/?*`, `*/page/*`). Ours stays `/sitemap.xml` because WordPress uses `/sitemap_index.xml`. Every other host still gets `Disallow: /`.
- **GTM per location:** Studio → location → Leads & consent → "GTM container ID" (optional, only `GTM-XXXXXXX`). That location's pages load it instead of `NEXT_PUBLIC_GTM_ID`, never both, still on `lazyOnload`. WordPress pages keep whatever they load today.

## 1. The host: wp-config.php (replaces the 4 lines in the go-live plan)

`wp.painter1.com` already resolves to the WordPress server (161.35.184.151). Add this to `wp-config.php` above `/* That's all, stop editing! */`, and **above** any existing `WP_HOME` / `WP_SITEURL` lines. Change those existing lines to `defined('WP_HOME') || define('WP_HOME', 'https://www.painter1.com');` (same for `WP_SITEURL`), so the staging values below can take over on staging requests.

```php
/* Painter1: WordPress behind Vercel. Vercel proxies www/staging.painter1.com to wp.painter1.com and sends
   the visitor's host in X-Forwarded-Host. */
$p1_host = isset($_SERVER['HTTP_HOST']) ? strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'])) : '';
$p1_forwarded = isset($_SERVER['HTTP_X_FORWARDED_HOST']) ? strtolower(trim(explode(',', $_SERVER['HTTP_X_FORWARDED_HOST'])[0])) : '';
if ($p1_host === 'wp.painter1.com') {
  if ($p1_forwarded === 'www.painter1.com' || $p1_forwarded === 'staging.painter1.com') {
    // Through Vercel: answer as the host the visitor asked for
    $_SERVER['HTTP_HOST'] = $p1_forwarded;
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
    if ($p1_forwarded === 'staging.painter1.com') {
      // Rehearsal: links, login and admin stay on staging, and staging is never indexed
      define('WP_HOME', 'https://staging.painter1.com');
      define('WP_SITEURL', 'https://staging.painter1.com');
      header('X-Robots-Tag: noindex, nofollow');
    }
  } elseif (($p1_forwarded === '' || $p1_forwarded === 'wp.painter1.com') && strpos($_SERVER['REQUEST_URI'], '/wp-cron.php') !== 0) {
    // wp.painter1.com opened directly: a duplicate of the site, so send visitors and search engines to www.
    // Loop check: requests from Vercel always carry X-Forwarded-Host www/staging.painter1.com, so they
    // never get here; a request that did would loop www → Vercel → here → www.
    header('Cache-Control: no-store');
    header('Location: https://www.painter1.com' . $_SERVER['REQUEST_URI'], true, 301);
    exit;
  }
}
```

Vercel documents that external rewrites send `x-forwarded-host` (the host the visitor requested), `x-forwarded-proto`, `x-forwarded-for` and `x-real-ip` ([Vercel: rewrites to external origins](https://vercel.com/docs/rewrites#identifying-the-visitor-at-your-origin)). Checked locally: a rewrite of `/atlanta/our-work?service=interior` reaches the origin unchanged with `X-Forwarded-Host: www.painter1.com`, and so do a POST with cookies and a 6 MB upload.

**Also for the host:**
- **Page cache:** the server page cache (responses carry `X-Cache`) must key on `X-Forwarded-Host` for `wp.painter1.com`, or skip caching when it is `staging.painter1.com`. Otherwise a staging page (staging links) can be served to www visitors after launch, and a cached 301 to a Vercel request makes the loop above.
- **Visitor IPs:** security plugins and the firewall trust `X-Forwarded-For` / `X-Real-IP` from Vercel (go-live plan, option (a) step 3).
- **Country blocking:** WordPress answers "This website is unavailable in your region" (403) to requests from India, for `www` and `wp` alike (robots.txt excepted). Behind Vercel, the server sees Vercel's IP, so the block must use the visitor IP from those headers. Otherwise it blocks or allows by Vercel's location. Our team must rehearse over a US VPN.
- **WP cron:** if the host calls `https://wp.painter1.com/wp-cron.php` from a server cron, it keeps working (exempt above).

**Host check, from a US connection:**
```sh
curl -sI -H "X-Forwarded-Host: www.painter1.com" -H "X-Forwarded-Proto: https" https://wp.painter1.com/atlanta/      # 200, no Location
curl -sI -H "X-Forwarded-Host: staging.painter1.com" -H "X-Forwarded-Proto: https" https://wp.painter1.com/atlanta/  # 200, X-Robots-Tag: noindex
curl -sI https://wp.painter1.com/atlanta/                                                                         # 301 → https://www.painter1.com/atlanta/
curl -s -H "X-Forwarded-Host: www.painter1.com" https://wp.painter1.com/atlanta/ | grep -c staging.painter1.com      # 0, also after staging was visited
```

## 2. Staging domain

**DNS at GoDaddy (Rick):** one new record. Nothing else changes.

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `staging` | the value Vercel shows for `staging.painter1.com` after step 1 below (this project's own target, like `d1d4fc829fe7bc7c.vercel-dns-017.com`) | 600 seconds (or GoDaddy's default) |

If Vercel also asks for a TXT record at `_vercel`, add that too, exactly as shown.

**Vercel (us), project painter1:**
1. **Settings → Domains → Add Domain** → `staging.painter1.com` → environment **Preview**, Git branch **`launch-knoxville`** → Save. Copy the CNAME value it shows and send it to Rick. When the record resolves, the domain shows "Valid Configuration" and Vercel issues the certificate.
2. **Settings → Deployment Protection → Deployment Protection Exceptions** → add `staging.painter1.com`. Standard Protection covers every non-production domain, so without this the staging site asks for a Vercel login. That would stop Rick and his host, and WordPress's own requests.
3. **Settings → Environment Variables, Preview:** `LEAD_TEST_RECIPIENT` set (leads go only to that address), `LEAD_SEND_LIVE` not `true`. `NEXT_PUBLIC_GTM_ID` as wanted. If `TURNSTILE_SITE_KEY` is set for Preview, the Turnstile widget's hostnames in Cloudflare must cover `staging.painter1.com`. Redeploy the branch after any change.
4. Each push to `launch-knoxville` updates staging. Remove the domain after launch.

**Never indexed (confirmed):** `staging.painter1.com` isn't a production host (`lib/indexing.ts`, tested in `indexing.test.ts`). So our pages send `X-Robots-Tag: noindex, nofollow` and robots.txt is `Disallow: /`. Proxied WordPress pages get the same header from Vercel and from wp-config. The `X-Robots-Tag` on proxied pages and the CDN cache bypass come from Vercel's routing. `next start` doesn't apply them to external rewrites, so they're checked on staging (below).

## 3. Rehearsal checklist (staging.painter1.com, US connection)

First: `node scripts/smoke-launch.ts https://staging.painter1.com` (read-only; all `ok`).

**Staging WordPress is the live WordPress:** every edit, upload and form entry is real. Edit a draft or a test page, upload to the Media Library only (don't insert it into a live page: its URL would be a staging one), and delete what you add.

| # | Check | Expected |
|---|---|---|
| 1 | `staging.painter1.com/` | WordPress home, styled; links and menus stay on `staging.painter1.com`; no redirect to `www` |
| 2 | 3 other locations, e.g. `/atlanta/`, `/miami/` and one more, each with and without the trailing slash | 200; with the slash, no redirect; without it, WordPress's own redirect to the slash URL, once |
| 3 | A corporate page (e.g. franchise opportunities) | WordPress page, 200 |
| 4 | A blog post | 200, images load |
| 5 | One Fluent Form on another location (name "TEST staging", our email) | success message; entry in WordPress; notification email arrives; delete the entry |
| 6 | `/wp-admin/` login, edit and save a draft, upload one typical photo (2–5 MB) to the Media Library | login stays on staging; save and upload succeed; delete the photo |
| 7 | `/knoxville`, `/knoxville/interior-painting`, `/knoxville/our-work`, `/knoxville/about-us` | new site; `/knoxville/` 308s to `/knoxville` |
| 8 | Legacy redirects: `/knoxville/brick-painting/`, `/knoxville/cabinet-refinishing`, `/knoxville/maryville/`, `/knoxville/contact/` | 308 to `/knoxville/exterior-painting#brick`, `/knoxville/cabinet-painting`, `/knoxville`, `/knoxville/free-estimate` |
| 9 | `/knoxville/free-estimate`: submit one estimate | thank-you; the email arrives **only** at `LEAD_TEST_RECIPIENT`; lead in Studio marked test |
| 10 | `/robots.txt` | `Disallow: /` (staging); production content is checked on launch day |
| 11 | `/sitemap.xml` | Knoxville URLs only; `/sitemap_index.xml` is WordPress's |
| 12 | `curl -sI https://staging.painter1.com/atlanta/` | `x-robots-tag: noindex, nofollow`; `x-vercel-cache` not `HIT` on a second request |
| 13 | `curl -sIL --max-redirs 5 https://staging.painter1.com/atlanta` | ends 200 on staging (no loop) |
| 14 | Vercel → Observability → External Origins | WordPress requests, no error spike |

Anything that fails: fix it, push to `launch-knoxville`, repeat until clean. Then follow the go-live plan's launch-day runbook. On launch day, the same smoke test against `https://www.painter1.com` checks robots.txt, both sitemaps and the missing noindex.
