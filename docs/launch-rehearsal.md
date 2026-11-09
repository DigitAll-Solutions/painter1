# Launch rehearsal on staging.painter1.com

For us, Rick and his WordPress host. Written Oct 30, 2026, with the launch PR (branch `launch-knoxville`, option (a) of `docs/go-live-plan.md`). The rehearsal runs the launch PR on `staging.painter1.com` exactly as `www.painter1.com` will run on launch day: Knoxville from this site, everything else proxied to WordPress at `wp.painter1.com`. `www.painter1.com` is not touched.

## What the launch PR changes

- **WordPress proxy** (`lib/wordpress-proxy.ts`, `next.config.ts`): on `www.painter1.com`, `painter1.com` and `staging.painter1.com`, every path that isn't a live location (`LIVE_LOCATIONS`: `knoxville`) or one of our paths (`/studio`, `/api`, `/_next`, `/_vercel`, `/sanity-img`, `robots.txt`, `sitemap.xml`, `public/` files) goes to `https://wp.painter1.com`, path, trailing slash and query unchanged. Vercel's CDN never caches those responses (`x-vercel-enable-rewrite-caching: 0`).
  - `painter1.vercel.app`, previews and localhost don't proxy: every Sanity location still renders there, so Rick keeps previewing the ones he is filling in.
- **Trailing slashes:** `skipTrailingSlashRedirect`, plus `proxy.ts`, which 308s `/knoxville/…/` and `/studio/…/` to the path without the slash. On WordPress paths, `proxy.ts` instead adds `X-P1-Proxy-Key` and `X-P1-Host` for wp-config.php (§1). WordPress URLs keep theirs. Old Knoxville URLs with a slash now reach their new page in one hop.
- **`/` → `/knoxville` is gone on painter1.com:** the homepage there is WordPress. It stays on `painter1.vercel.app`, which has no homepage of its own.
- **robots.txt (production only):** our sitemap and WordPress's Xagio SEO sitemap index (`/sitemap-xag.xml`, from the live site's `Link: rel="sitemap"` header), and WordPress's own disallow rules (`/*?*`, `/?*`, `*/page/*`). Ours stays `/sitemap.xml` because WordPress uses `/sitemap-xag.xml`. Every other host still gets `Disallow: /`.
- **GTM per location:** Studio → location → Leads & consent → "GTM container ID" (optional, only `GTM-XXXXXXX`). That location's pages load only it; a location without one loads no GTM. `NEXT_PUBLIC_GTM_ID` (corp, GTM-5LG3XH7S) is for corp pages only. Still on `lazyOnload`. WordPress pages keep whatever they load today.

## 1. The host: wp-config.php

`wp.painter1.com` already resolves to the WordPress server (161.35.184.151). The wp-config.php block and Rick's steps are in `docs/cloudways-wp-config.md` (step 3); that is the only copy of the block.

**How Vercel identifies itself (probe, Nov 9):** Cloudways' nginx overwrites `X-Forwarded-Host`, `X-Forwarded-For` and `X-Real-IP` with its own values: PHP sees `wp.painter1.com` and a Vercel IP there, even on requests from Vercel. So `proxy.ts` adds two headers to every proxied request (`lib/wordpress-proxy.ts`): `X-P1-Proxy-Key`, the `P1_PROXY_KEY` env var (Vercel Production and Preview; not in code), and `X-P1-Host`, the host the visitor asked for. Any `X-P1-*` header a visitor sends is replaced. Checked locally (`next dev` against an echo origin): both reach the origin through the afterFiles rewrite, and neither is in the response. The visitor's IP arrives in Vercel's `X-Vercel-Forwarded-For`, which nginx leaves alone. Vercel also sends `Forwarded` and `X-Vercel-*`.

**What the block does on `wp.painter1.com`:**
- **Right key** and `X-P1-Host` www or staging: `HTTP_HOST` = that host, `HTTPS` on, `SERVER_PORT` 443, `REMOTE_ADDR` (and `X-Forwarded-For`, `X-Real-IP`) = the first IP of `X-Vercel-Forwarded-For`. On staging, also `WP_HOME`/`WP_SITEURL` staging and `X-Robots-Tag: noindex`.
- **From Vercel without the right key** (`X-P1-Host` or `X-Vercel-Id` present): 403, so a missing or wrong `P1_PROXY_KEY` can't make a www → Vercel → wp → www loop.
- **Anything else** (opened directly): 301 to www, `wp-cron.php` exempt.

**Order:** set `P1_PROXY_KEY` in Vercel and redeploy before the new wp-config.php goes up. Until the block is on the server, WordPress ignores the headers.

**Status (Nov 9, 2026):** the block is live on Cloudways; `P1_PROXY_KEY` is set in Vercel Production and Preview; Varnish is off; NitroPack is still on (purge it on launch day, right after the switch); the `p1-headers.php` probe is deleted from the server. The staging smoke workflow passes, and www still serves the live WordPress pages unchanged (all 200).

**Must check before launch: the visitor's IP in security plugins** (`docs/cloudways-wp-config.md` step 6). Wordfence's firewall doesn't load before wp-config.php (the server's `auto_prepend_file` is Really Simple Security's `advanced-headers.php`), so Wordfence only needs "How does Wordfence get IPs" = REMOTE_ADDR. Really Simple Security's firewall does run first and sees Vercel's IP for every visitor, so its automatic IP blocking must be off, or one block would hit everyone. Rick checks both.
- [ ] Wordfence "How does Wordfence get IPs" = REMOTE_ADDR (Rick tells us the old value)
- [ ] No Vercel/Amazon IP range allowlisted in Wordfence
- [ ] Really Simple Security: automatic IP blocking (404 blocking etc.) turned off in its firewall (Rick)
- [ ] After the rehearsal: Wordfence Live Traffic shows our real IP, not a Vercel/Amazon one; no Vercel/Amazon IP in Wordfence's or Really Simple Security's blocked lists

**Also for the host:**
- **Page cache:** Varnish keys on `Host` only, so it stays off behind Vercel (`docs/cloudways-wp-config.md` step 5; off since Nov 9). NitroPack stays on; purge it on launch day.
- **Country blocking:** WordPress answers "This website is unavailable in your region" (403) to requests from India, for `www` and `wp` alike (robots.txt excepted). Behind Vercel it still sees the real visitor (Nov 9: India through staging got the same 403); it is switched off on launch day (go-live step 14) and blocking moves to Vercel. Our team must rehearse over a US VPN, or with the staging smoke workflow.
- **WP cron:** if the host calls `https://wp.painter1.com/wp-cron.php` from a server cron, it keeps working (exempt from the 301).

**Host check:** the nine curl checks in `docs/cloudways-wp-config.md` step 7, from a US connection.

## 2. Staging domain

**DNS at GoDaddy (Rick):** one new record. Nothing else changes.

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `staging` | the value Vercel shows for `staging.painter1.com` after step 1 below (this project's own target, like `d1d4fc829fe7bc7c.vercel-dns-017.com`) | 600 seconds (or GoDaddy's default) |

If Vercel also asks for a TXT record at `_vercel`, add that too, exactly as shown.

**Vercel (us), project painter1:**
1. **Settings → Domains → Add Domain** → `staging.painter1.com` → environment **Preview**, Git branch **`launch-knoxville`** → Save. Copy the CNAME value it shows and send it to Rick. When the record resolves, the domain shows "Valid Configuration" and Vercel issues the certificate.
2. **Settings → Deployment Protection → Deployment Protection Exceptions** → add `staging.painter1.com`. Standard Protection covers every non-production domain, so without this the staging site asks for a Vercel login. That would stop Rick and his host, and WordPress's own requests.
3. **Settings → Environment Variables, Preview:** `LEAD_TEST_RECIPIENT` set (leads go only to that address), `LEAD_SEND_LIVE` not `true`. `NEXT_PUBLIC_GTM_ID` = `GTM-5LG3XH7S` (corp). `P1_PROXY_KEY` set (the same value as in wp-config.php; §1). If `TURNSTILE_SITE_KEY` is set for Preview, the Turnstile widget's hostnames in Cloudflare must cover `staging.painter1.com`. Redeploy the branch after any change.
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
| 11 | `/sitemap.xml` | Knoxville URLs only; `/sitemap-xag.xml` is WordPress's (Xagio); its sub-sitemaps link to the host tested only |
| 12 | `curl -sI https://staging.painter1.com/atlanta/` | `x-robots-tag: noindex, nofollow`; `x-vercel-cache` not `HIT` on a second request |
| 13 | `curl -sIL --max-redirs 5 https://staging.painter1.com/atlanta` | ends 200 on staging (no loop) |
| 14 | Vercel → Observability → External Origins | WordPress requests, no error spike |

Anything that fails: fix it, push to `launch-knoxville`, repeat until clean. Then follow the go-live plan's launch-day runbook. On launch day, the same smoke test against `https://www.painter1.com` checks robots.txt, both sitemaps and the missing noindex.
