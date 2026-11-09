# Cloudways: getting WordPress ready for the new site

**Why:** after launch, www.painter1.com is served by the new site (Vercel). Pages that stay on WordPress are fetched by Vercel from `wp.painter1.com`. This tells WordPress to answer those requests as www.painter1.com (or staging.painter1.com for the rehearsal), and to send anyone who opens `wp.painter1.com` directly to www.

It takes about 20 minutes. Visitors see no change until DNS is switched on launch day.

Do the steps in order. A typo in wp-config.php takes the whole site down until it's fixed, so make the backup in step 2 first, and keep the file window open until step 6 passes.

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
3. **Paste the block below** directly **above** those two lines. If there were none, paste it just above the line `/* That's all, stop editing! Happy blogging. */`. It must be below the first line `<?php`.
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
4. Save. In FileZilla, confirm the upload when it asks.
5. Open https://www.painter1.com in a browser. If it shows the site as usual, the file is fine. If it's blank or shows an error, undo now (step 8).

## 4. The homepage redirect

Our test through the new site found that the homepage (and `/wp-sitemap.xml`) sends visitors to www instead of showing the page. Other pages, like `/atlanta/`, are fine. Through the new site on launch day, that would send www visitors in a circle.

The redirect comes from **inside WordPress** (the response says `X-Redirect-By: WordPress`), not from Cloudways' server settings. **Don't change nginx or `.htaccess` for this.** WordPress, or a plugin, sees the request arrive at `wp.painter1.com` while the site's address is `www.painter1.com`, and sends it to www. The block from step 3 makes those requests arrive as www (or staging), so the redirect should stop by itself. Check 3 in step 6 confirms it.

**Only if check 3 still shows `301` and `location: https://www.painter1.com/`:**
1. **Tools → Redirection:** look for a redirect with source `/`, a regular expression covering the whole site (like `^/(.*)`), or one that matches on the domain ("URL and server"). Disable it. Don't delete it, so it can be switched back on.
2. **Xagio SEO → settings:** turn off any "force www", "redirect to main/primary domain" or domain-redirect option. Keep the http → https setting as it is.
3. Run check 3 again and send us the result, with the name of the setting you changed.

## 5. Turn Varnish off for the rehearsal

**Why it must be off:** Varnish sits in front of WordPress and stores each page by the address it was reached at (the `Host`) plus the path. It doesn't look at `X-Forwarded-Host`. Every request from the new site reaches `wp.painter1.com`, whether the visitor asked for www or staging, and so does anyone who opens `wp.painter1.com` directly. Varnish keeps all three under the one key `wp.painter1.com/<path>` and hands whichever copy it stored first to everyone. Our Nov 7 test showed exactly that: the same pages answered differently a few seconds apart, and `/sitemap_index.xml` came back as a cached 404 (`x-cache: HIT`).

What that mix-up can do:
- a staging copy (staging links, `noindex`) shown to www visitors and to Google
- the "go to www" redirect, meant only for direct visitors, served to the new site, which sends www visitors in a circle
- cached pages served before WordPress's own checks run, including the country block

The wp-config.php block from step 3 can't fix this. It runs inside WordPress, after Varnish has already answered.

1. **Application Management → Application Settings → General → Varnish** → turn it **off**.
2. If a page-cache plugin is active (Breeze, WP Rocket, W3 Total Cache…), purge it now.

**Behind the new site, Varnish stays off.** For it to be safe again, its cache key would have to include `X-Forwarded-Host`, and it would have to stop caching redirects. Cloudways' panel only switches Varnish on or off and sets exclusions; the cache key is in their server config, which only Cloudways support could change. It isn't worth it: the new site serves Knoxville itself, and a page-cache plugin such as Breeze still works with Varnish off. Breeze runs inside WordPress after the step 3 block, so it sees the right address (www or staging) and keeps the copies apart.

## 6. Check it (any computer in the US: Terminal on a Mac, or Command Prompt on Windows)

```sh
# 1. Opened directly: must send you to www (301, Location: https://www.painter1.com/atlanta/)
curl -sI https://wp.painter1.com/atlanta/

# 2. As Vercel asks for www: the page itself (200), no Location line
curl -sI -H "X-Forwarded-Host: www.painter1.com" -H "X-Forwarded-Proto: https" https://wp.painter1.com/atlanta/

# 3. The homepage, as Vercel asks for www: 200, no Location line (this was a 301 to www before step 4)
curl -sI -H "X-Forwarded-Host: www.painter1.com" -H "X-Forwarded-Proto: https" https://wp.painter1.com/

# 4. As staging: 200, and a line "X-Robots-Tag: noindex, nofollow"
curl -sI -H "X-Forwarded-Host: staging.painter1.com" -H "X-Forwarded-Proto: https" https://wp.painter1.com/

# 5. The sitemap, as Vercel asks for www: 200 and an XML content type (it was a 404 through staging)
curl -sI -H "X-Forwarded-Host: www.painter1.com" -H "X-Forwarded-Proto: https" https://wp.painter1.com/sitemap_index.xml

# 6. The www page must not contain staging links: prints 0
curl -s -H "X-Forwarded-Host: www.painter1.com" https://wp.painter1.com/atlanta/ | grep -c staging.painter1.com
```

Send us the output of all six. We then run the full test on staging from our side.

If check 5 is still a 404, open **Settings → Permalinks** in WordPress admin and click **Save Changes** without changing anything. That rebuilds the sitemap's address rules. Run check 5 again. If it's still a 404, check that Xagio SEO's sitemap is switched on, and tell us the sitemap address it shows. The live robots.txt points search engines to `sitemap_index.xml`.

## 7. After the rehearsal (we'll tell you when)

1. **Purge Varnish:** Application Settings → **Purge**. If a page-cache plugin is active, purge that too.
2. Turn **Varnish back on** until launch day. Until then www still goes straight to WordPress, which Varnish keys under `www.painter1.com`, so it doesn't mix with anything.
3. **On launch day, turn Varnish off again before the switch** (Application Settings → General → Varnish → off, then **Purge**), and leave it off for good. See step 5 for why.
4. **Leave the country block (Really Simple Security Pro) on.** We'll ask you to turn it off on launch day, right after the switch to the new site, so blocking happens in one place.

## 8. Undo

- **wp-config.php:** upload your downloaded copy over the one on the server (FileZilla), or `cp wp-config.php.bak-before-vercel wp-config.php` (SSH).
- **A Redirection or Xagio SEO setting** (if step 4 changed one): switch it back on in the plugin.

The site is back as it was immediately.
