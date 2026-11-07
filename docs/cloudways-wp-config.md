# Cloudways: the wp-config.php change for the new site

**Why:** after launch, www.painter1.com is served by the new site (Vercel). Pages that stay on WordPress are fetched by Vercel from `wp.painter1.com`. This change tells WordPress to answer those requests as www.painter1.com (or staging.painter1.com for the rehearsal) and to send anyone who opens `wp.painter1.com` directly to www. It takes about 10 minutes. The site is unchanged for visitors until DNS is switched on launch day.

A typo in wp-config.php takes the whole site down until it is fixed. Follow the backup step first, and keep the file window open until the checks pass.

## 1. Get the login details (Cloudways)

1. Log in at platform.cloudways.com → **Applications** → the painter1.com WordPress app.
2. **Application Management → Access Details → Application Credentials.** Note the **Public IP**, **Username** and **Password**. If there's no username yet, create one there.
   - Alternative: **Servers → the server → Master Credentials** has a login that works the same way and a **Launch SSH Terminal** button.
3. While in **Access Details**, look under **Application URL / Domain Management** and note which domains are listed. `wp.painter1.com` must be listed there, as primary or additional, together with `www.painter1.com` and `painter1.com`. If it's missing, add it: **Domain Management → Add Domain → `wp.painter1.com`**.
4. **SSL Certificate** (same app): the Let's Encrypt certificate must include `wp.painter1.com`. If it doesn't, add it to the domain list there and click **Install Certificate**.

## 2. Open the file and make a backup

**With FileZilla (SFTP):**
1. Host `sftp://<Public IP>`, the username and password from step 1, port `22` → Quickconnect.
2. Open the `public_html` folder. With Master Credentials the path is `applications/<app folder>/public_html`.
3. Right-click `wp-config.php` → **Download** to your computer. That's your backup: keep it.
4. Right-click `wp-config.php` → **View/Edit**. It opens in a text editor, and FileZilla uploads it again when you save.

**Or with SSH (Launch SSH Terminal):**
```sh
cd ~/applications/<app folder>/public_html     # with Application Credentials: cd public_html
cp wp-config.php wp-config.php.bak-before-vercel
nano wp-config.php                               # Ctrl+O, Enter to save; Ctrl+X to exit
```

Please don't use a plugin to edit wp-config.php. If the edit breaks the site, the plugin breaks with it and you can't undo from WordPress.

## 3. Make the change

1. **Remove the lines added earlier for Vercel** (the ones that mention `HTTP_X_FORWARDED_HOST`), if they are there.
2. **Find the existing `WP_HOME` and `WP_SITEURL` lines**, if they exist, and replace them with these two lines. If they aren't in the file, skip this step.
   ```php
   defined('WP_HOME') || define('WP_HOME', 'https://www.painter1.com');
   defined('WP_SITEURL') || define('WP_SITEURL', 'https://www.painter1.com');
   ```
3. **Paste the block below** directly **above** those two lines. If there were none, paste it just above the line `/* That's all, stop editing! Happy publishing. */`. It must be below the first line `<?php`.
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
5. Open https://www.painter1.com in a browser. If it shows the site as usual, the file is fine. If it's blank or shows an error, undo now (step 6).

## 4. Cloudways settings to check

- **Varnish (Application Settings → General):** Varnish stores pages by the address WordPress was reached at. Every Vercel request reaches `wp.painter1.com`, so a staging page (with staging links) could be stored and later shown to www visitors. **Turn Varnish off while we rehearse on staging.** After the rehearsal, purge it (**Application Settings → Purge**) before turning it back on.
- **Breeze / other page-cache plugin:** purge it after the rehearsal for the same reason.
- **Redirects:** Cloudways' primary domain setting doesn't redirect by itself. Redirects come from three places, and we need to know which one sends wp.painter1.com to www today. The first check below shows it:
  - **Enforce HTTPS** in the SSL tab (http → https). That's fine to keep on.
  - WordPress itself.
  - A plugin or `.htaccess` rule. Please tell us if you have any www/non-www or domain redirect rule, for example in **Really Simple Security → Settings**, in a Redirection plugin, or in `.htaccess` in `public_html`.
- **Country block (Really Simple Security Pro):** leave it on for now. We'll tell you when to turn it off on launch day, because Vercel then does the blocking.

## 5. Verify (any computer in the US: Terminal on a Mac, or Command Prompt on Windows)

```sh
# Opened directly: must send you to www (301, Location: https://www.painter1.com/atlanta/)
curl -sI https://wp.painter1.com/atlanta/

# As Vercel asks: must be the page itself (200) with no Location line
curl -sI -H "X-Forwarded-Host: www.painter1.com" -H "X-Forwarded-Proto: https" https://wp.painter1.com/atlanta/

# As staging: 200, and a line "X-Robots-Tag: noindex, nofollow"
curl -sI -H "X-Forwarded-Host: staging.painter1.com" -H "X-Forwarded-Proto: https" https://wp.painter1.com/atlanta/

# The www page must not contain staging links: prints 0
curl -s -H "X-Forwarded-Host: www.painter1.com" https://wp.painter1.com/atlanta/ | grep -c staging.painter1.com
```

Please send us the output of all four. If the first one already returned a 301 **before** your change, it also shows a line `X-Redirect-By:`. Tell us what it says (e.g. `WordPress` or a plugin name).

## 6. Undo

- **FileZilla:** upload the `wp-config.php` you downloaded in step 2 over the one on the server.
- **SSH:** `cp wp-config.php.bak-before-vercel wp-config.php`

The site is back as it was immediately. Nothing else was changed.
