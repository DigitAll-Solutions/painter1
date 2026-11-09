# Cloudways: getting WordPress ready for the new site

**Why:** after launch, www.painter1.com is served by the new site (Vercel). Pages that stay on WordPress are fetched by Vercel from `wp.painter1.com`. This tells WordPress to answer those requests as www.painter1.com (or staging.painter1.com for the rehearsal), with the visitor's real IP, and to send anyone who opens `wp.painter1.com` directly to www.

**How WordPress knows a request came from Vercel:** Cloudways' nginx replaces the usual `X-Forwarded-Host`, `X-Forwarded-For` and `X-Real-IP` headers with its own values (our Nov 9 probe), so WordPress can't use them. Vercel adds two headers of its own instead: `X-P1-Proxy-Key`, a secret only Vercel and wp-config.php know (Vercel's `P1_PROXY_KEY` setting), and `X-P1-Host`, the address the visitor asked for. The visitor's IP comes in Vercel's `X-Vercel-Forwarded-For`, which nginx leaves alone. wp-config.php trusts all three only when the key matches.

It takes about 20 minutes. Visitors see no change until DNS is switched on launch day.

**Status (Nov 9, 2026):** the step 3 block is live on Cloudways, `P1_PROXY_KEY` is set in Vercel Production and Preview, and Varnish is off. NitroPack is still on: purge it on launch day, right after the switch. The `p1-headers.php` probe has been deleted from the server. Still open: step 6 (Rick).

Do the steps in order. A typo in wp-config.php takes the whole site down until it's fixed, so make the backup in step 2 first, and keep the file window open until step 7 passes.

## 1. Logins and domains (Cloudways)

1. Log in at platform.cloudways.com → **Applications** → the painter1.com WordPress app.
2. **Application Management → Access Details → Application Credentials.** Note the **Public IP**, **Username** and **Password**. If there's no username yet, create one there.
   - Alternative: **Servers → the server → Master Credentials** has a login that works the same way and a **Launch SSH Terminal** button.
3. **Domain Management:** `wp.painter1.com` must be listed, together with `www.painter1.com` and `painter1.com`. If it's missing: **Add Domain → `wp.painter1.com`**.
4. **SSL Certificate:** the certificate must include `wp.painter1.com`. If it doesn't, add it to the domain list there and click **Install Certificate**.

## 2. Open wp-config.php and make a backup

**With FileZilla (SFTP):**
1. Host `sftp://<Public IP>`, the username and password from step 1, port `22` → Quickconnect.
2. Open the `public_html` folder. With Master Credentials the path is `applications/<app folder>/public_html`.
3. Right-click `wp-config.php` → **Download**. That's your backup: keep it.
4. Right-click `wp-config.php` → **View/Edit**. FileZilla uploads it again when you save.

**Or with SSH (Launch SSH Terminal):**
```sh
cd ~/applications/<app folder>/public_html     # with Application Credentials: cd public_html
cp wp-config.php wp-config.php.bak-before-vercel
nano wp-config.php                               # Ctrl+O, Enter to save; Ctrl+X to exit
```

Please don't use a plugin to edit this file. If an edit breaks the site, the plugin breaks with it and you can't undo from WordPress.

## 3. The wp-config.php change

1. **Remove the lines added earlier for Vercel** (the ones that mention `HTTP_X_FORWARDED_HOST`), if they are there.
2. **Find the existing `WP_HOME` and `WP_SITEURL` lines**, if they exist, and replace them with these two lines. If they aren't in the file, skip this step.
   ```php
   defined('WP_HOME') || define('WP_HOME', 'https://www.painter1.com');
   defined('WP_SITEURL') || define('WP_SITEURL', 'https://www.painter1.com');
   ```
3. **Paste the block below** directly **above** those two lines. If there were none, paste it just above the line `/* That's all, stop editing! Happy blogging. */`. It must be below the first line `<?php`. Then replace `PASTE_P1_PROXY_KEY_HERE` (it appears once, in `$p1_proxy_key = '…';`) with the `P1_PROXY_KEY` value from Vercel, exactly, between the quotes: 64 characters, 0-9 and a-f. Until it holds such a value, the block trusts nothing: direct visits still go to www, and requests from Vercel get a 403. Never paste the key in email or chat.
   ```php
   /* Painter1: WordPress behind Vercel (docs/cloudways-wp-config.md in the website repo). Vercel proxies
      www/staging.painter1.com to wp.painter1.com. Cloudways' nginx overwrites X-Forwarded-Host, X-Forwarded-For
      and X-Real-IP, so Vercel sends its own headers: X-P1-Proxy-Key (a shared secret, P1_PROXY_KEY in Vercel)
      and X-P1-Host (the host the visitor asked for). Only a request with the right key is trusted. */
   $p1_proxy_key = 'PASTE_P1_PROXY_KEY_HERE';
   $p1_host = isset($_SERVER['HTTP_HOST']) ? strtolower(preg_replace('/:\d+$/', '', (string) $_SERVER['HTTP_HOST'])) : '';
   if ($p1_host === 'wp.painter1.com') {
     $p1_given = isset($_SERVER['HTTP_X_P1_PROXY_KEY']) ? (string) $_SERVER['HTTP_X_P1_PROXY_KEY'] : '';
     // Set = 64 hex characters (the placeholder isn't), so nothing is trusted until the key is pasted in
     $p1_valid = strlen($p1_proxy_key) === 64 && ctype_xdigit($p1_proxy_key) && hash_equals($p1_proxy_key, $p1_given);
     $p1_target = isset($_SERVER['HTTP_X_P1_HOST']) ? strtolower(trim((string) $_SERVER['HTTP_X_P1_HOST'])) : '';
     if ($p1_valid && ($p1_target === 'www.painter1.com' || $p1_target === 'staging.painter1.com')) {
       // Through Vercel: answer as the host the visitor asked for, over https
       $_SERVER['HTTP_HOST'] = $p1_target;
       $_SERVER['HTTPS'] = 'on';
       $_SERVER['SERVER_PORT'] = 443;
       // The visitor's IP: the first entry of Vercel's own X-Vercel-Forwarded-For (REMOTE_ADDR is a Vercel IP).
       // X-Forwarded-For and X-Real-IP get it too, for plugins that read those.
       $p1_ip = isset($_SERVER['HTTP_X_VERCEL_FORWARDED_FOR']) ? trim(explode(',', (string) $_SERVER['HTTP_X_VERCEL_FORWARDED_FOR'])[0]) : '';
       if (filter_var($p1_ip, FILTER_VALIDATE_IP)) {
         $_SERVER['REMOTE_ADDR'] = $p1_ip;
         $_SERVER['HTTP_X_FORWARDED_FOR'] = $p1_ip;
         $_SERVER['HTTP_X_REAL_IP'] = $p1_ip;
       }
       if ($p1_target === 'staging.painter1.com') {
         // Rehearsal: links, login and admin stay on staging, and staging is never indexed
         define('WP_HOME', 'https://staging.painter1.com');
         define('WP_SITEURL', 'https://staging.painter1.com');
         header('X-Robots-Tag: noindex, nofollow');
       }
     } elseif (isset($_SERVER['HTTP_X_P1_HOST']) || isset($_SERVER['HTTP_X_VERCEL_ID'])) {
       // From Vercel but without the right key (P1_PROXY_KEY missing or different from this file's): a 301 to
       // www would come straight back here (www -> Vercel -> here -> www), so stop with a 403 instead
       http_response_code(403);
       header('Cache-Control: no-store');
       exit;
     } elseif (strpos(isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '', '/wp-cron.php') !== 0) {
       // wp.painter1.com opened directly: a duplicate of the site, so send visitors and search engines to www
       header('Cache-Control: no-store');
       header('Location: https://www.painter1.com' . (isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/'), true, 301);
       exit;
     }
   }
   ```
4. Save. In FileZilla, confirm the upload when it asks.
5. Open https://www.painter1.com in a browser. If it shows the site as usual, the file is fine. If it's blank or shows an error, undo now (step 9).

## 4. The homepage redirect

Our test through the new site found that the homepage (and `/wp-sitemap.xml`) sends visitors to www instead of showing the page. Other pages, like `/atlanta/`, are fine. Through the new site on launch day, that would send www visitors in a circle.

The redirect comes from **inside WordPress** (the response says `X-Redirect-By: WordPress`), not from Cloudways' server settings. **Don't change nginx or `.htaccess` for this.** WordPress, or a plugin, sees the request arrive at `wp.painter1.com` while the site's address is `www.painter1.com`, and sends it to www. The block from step 3 makes those requests arrive as www (or staging), so the redirect should stop by itself. Check 5 in step 7 confirms it.

**Only if check 5 still shows `301` and `location: https://www.painter1.com/`:**
1. **Tools → Redirection:** look for a redirect with source `/`, a regular expression covering the whole site (like `^/(.*)`), or one that matches on the domain ("URL and server"). Disable it. Don't delete it, so it can be switched back on.
2. **Xagio SEO → settings:** turn off any "force www", "redirect to main/primary domain" or domain-redirect option. Keep the http → https setting as it is.
3. Run check 5 again and send us the result, with the name of the setting you changed.

## 5. Turn Varnish off for the rehearsal

**Why it must be off:** Varnish sits in front of WordPress and stores each page by the address it was reached at (the `Host`) plus the path. It doesn't look at `X-P1-Host`. Every request from the new site reaches `wp.painter1.com`, whether the visitor asked for www or staging, and so does anyone who opens `wp.painter1.com` directly. Varnish keeps all three under the one key `wp.painter1.com/<path>` and hands whichever copy it stored first to everyone. Our Nov 7 test showed exactly that: the same pages answered differently a few seconds apart, and `/sitemap_index.xml` (an address the site doesn't use; its sitemap is Xagio's `/sitemap-xag.xml`) came back as a cached 404 (`x-cache: HIT`).

What that mix-up can do:
- a staging copy (staging links, `noindex`) shown to www visitors and to Google
- the "go to www" redirect, meant only for direct visitors, served to the new site, which sends www visitors in a circle
- cached pages served before WordPress's own checks run, including the country block

The wp-config.php block from step 3 can't fix this. It runs inside WordPress, after Varnish has already answered.

1. **Application Management → Application Settings → General → Varnish** → turn it **off**.
2. If a page-cache plugin is active (NitroPack, Breeze, WP Rocket, W3 Total Cache…), purge it now.

Done Nov 9: Varnish is off. NitroPack stays on and is purged on launch day, right after the switch (it runs inside WordPress, after the step 3 block, so it keeps www and staging apart).

**Behind the new site, Varnish stays off.** For it to be safe again, its cache key would have to include `X-P1-Host`, and it would have to stop caching redirects. Cloudways' panel only switches Varnish on or off and sets exclusions; the cache key is in their server config, which only Cloudways support could change. It isn't worth it: the new site serves Knoxville itself, and a page-cache plugin such as Breeze still works with Varnish off. Breeze runs inside WordPress after the step 3 block, so it sees the right address (www or staging) and keeps the copies apart.

## 6. Wordfence and Really Simple Security: the visitor's IP (must check)

**Why:** behind Vercel, every request reaches WordPress from a Vercel server, so PHP's own `REMOTE_ADDR` (and the `X-Forwarded-For` / `X-Real-IP` that nginx fills in) is a Vercel IP, the same few addresses for every visitor. The step 3 block puts the real visitor IP into `REMOTE_ADDR`, `X-Forwarded-For` and `X-Real-IP`, but only from wp-config.php onwards. A security plugin that reads the IP earlier, or from another source, sees Vercel. Then one bad visitor's rate limit or block hits Vercel, which means **everyone**: the whole WordPress part of www goes down for all visitors.

**Wordfence (wp-admin):**
1. **Wordfence → All Options → General Wordfence Options → "How does Wordfence get IPs"**: set it to **"Use PHP's built-in REMOTE_ADDR"** and save. Don't choose X-Forwarded-For, X-Real-IP or Cloudflare: through Cloudways' nginx those hold Vercel's IP. Note what it was set to before, and tell us.
2. **The firewall doesn't load before wp-config.php** (checked Nov 9: the server's `auto_prepend_file` is Really Simple Security's `advanced-headers.php`, not `wordfence-waf.php`). So Wordfence's firewall runs inside WordPress and, with step 1, sees the real visitor IP. Nothing more to do there. If Wordfence ever offers to "optimize" the firewall (Extended Protection), say no: it would then run before wp-config.php and see Vercel's IP.
3. **Never allowlist Vercel's or Amazon's IP ranges** in Wordfence (Firewall → Allowlisted IP addresses). Every visitor arrives through them, attackers included, so that would switch the firewall off for everyone.
4. **After the rehearsal:** browse a few staging WordPress pages, then open **Wordfence → Tools → Live Traffic**. The entries must show your own IP (whatismyip.com shows it), not an Amazon/Vercel address. **Wordfence → Firewall → Blocking** (and the "Blocked IPs" list) must not list a Vercel/Amazon address. If one is listed, unblock it and tell us.

**Really Simple Security:**
1. It loads first (`advanced-headers.php`, PHP's `auto_prepend_file`, before wp-config.php), so its firewall sees Vercel's IP. Under **Really Simple Security → Settings → Firewall**, turn **automatic IP blocking** (for example blocking IPs that cause too many 404s) **off**, or it blocks Vercel, and with it everyone. Tell us which firewall options are still on.
2. **Limit Login Attempts** (Settings → Login Protection), if on: it runs at login, after wp-config.php, so it should see the real IP. After the rehearsal, log in once through staging, then check its list of IPs: it must show your IP, not a Vercel/Amazon one.
3. **The country block** still sees the real visitor through the new site (Nov 9: a request from India through staging got its "unavailable in your region" 403). It is switched off on launch day (`docs/go-live-plan.md` step 14); blocking then happens on Vercel.

## 7. Check it (any computer in the US: Terminal on a Mac)

Set the key once in the window, then run the checks. On Windows Command Prompt use `set KEY=the-key` and write `%KEY%` wherever `$KEY` appears.

```sh
KEY='the P1_PROXY_KEY value'   # the same value as in wp-config.php

# 1. Opened directly: must send you to www (301, Location: https://www.painter1.com/atlanta/)
curl -sI https://wp.painter1.com/atlanta/

# 2. Looks like Vercel but has no key: 403 (not a 301, which would send www visitors in a circle)
curl -sI -H "X-P1-Host: www.painter1.com" https://wp.painter1.com/atlanta/

# 3. A wrong key: 403
curl -sI -H "X-P1-Proxy-Key: wrong" -H "X-P1-Host: www.painter1.com" https://wp.painter1.com/atlanta/

# 4. As Vercel asks for www: the page itself (200), no Location line
curl -sI -H "X-P1-Proxy-Key: $KEY" -H "X-P1-Host: www.painter1.com" https://wp.painter1.com/atlanta/

# 5. The homepage, as Vercel asks for www: 200, no Location line (this was a 301 to www before step 4)
curl -sI -H "X-P1-Proxy-Key: $KEY" -H "X-P1-Host: www.painter1.com" https://wp.painter1.com/

# 6. As staging: 200, and a line "X-Robots-Tag: noindex, nofollow"
curl -sI -H "X-P1-Proxy-Key: $KEY" -H "X-P1-Host: staging.painter1.com" https://wp.painter1.com/

# 7. The sitemap (Xagio SEO), as Vercel asks for www: 200 and an XML content type
curl -sI -H "X-P1-Proxy-Key: $KEY" -H "X-P1-Host: www.painter1.com" https://wp.painter1.com/sitemap-xag.xml

# 8. The www page must not contain staging links: prints 0
curl -s -H "X-P1-Proxy-Key: $KEY" -H "X-P1-Host: www.painter1.com" https://wp.painter1.com/atlanta/ | grep -c staging.painter1.com

# 9. Through the new site itself: 200 and "X-Robots-Tag: noindex, nofollow"
curl -sI https://staging.painter1.com/atlanta/
```

Send us the output of all nine, **with the key removed** (it isn't in the output; just don't copy the `KEY=` line). We then run the full test on staging from our side.

If check 7 is still a 404, open **Settings → Permalinks** in WordPress admin and click **Save Changes** without changing anything. That rebuilds the sitemap's address rules. Run check 7 again. If it's still a 404, check that Xagio SEO's sitemap is switched on, and tell us the sitemap address it shows. The live site announces `/sitemap-xag.xml` (its `Link: rel="sitemap"` header), and the new robots.txt lists it.

## 8. After the rehearsal (we'll tell you when)

1. **Leave Varnish off** for good (see step 5 for why). If it was switched back on, turn it off again before the switch on launch day and **Purge**.
2. **On launch day, right after the switch, purge NitroPack**, so no page it stored before the switch is served.
3. Really Simple Security's automatic IP blocking stays off, and Wordfence stays on REMOTE_ADDR (step 6).
4. **Leave the country block (Really Simple Security Pro) on.** We'll ask you to turn it off on launch day, right after the switch to the new site, so blocking happens in one place.

## 9. Undo

- **wp-config.php:** upload your downloaded copy over the one on the server (FileZilla), or `cp wp-config.php.bak-before-vercel wp-config.php` (SSH).
- **A Redirection or Xagio SEO setting** (if step 4 changed one): switch it back on in the plugin.

The site is back as it was immediately.
