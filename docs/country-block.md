# Country block on Vercel's firewall (plan, not applied)

Rick approved: **United States only**. Vercel Firewall custom rules, project **painter1** → **Firewall → Configure**. Changes take effect within seconds, with no redeploy, and can be restored from the audit log (**… → View Audit Log → Restore**).

## Rules, in this order (the order matters)

| # | Name | If | Then |
|---|---|---|---|
| 1 | Sanity webhook and cron | Request Path **equals** `/api/revalidate` **OR** Request Path **starts with** `/api/cron/` | **Bypass** |
| 2 | Developer bypass | Cookie `p1_dev` **equals** `<secret>` | **Bypass** |
| 3 | US only | Hostname **matches expression** `^(www\.)?painter1\.com$\|^staging\.painter1\.com$` **AND** Country **does not equal** United States | **Log** first, then **Deny** |

- **Bypass** skips the remaining custom rules, so rules 1 and 2 must sit above rule 3. Vercel's DDoS protection still applies.
- **Rule 3 scope:** the hostname condition limits it to www, the apex and staging. `painter1.vercel.app` and preview URLs don't match, so they stay open. If the hostname field has no regex operator, make three copies of rule 3, one per host, each with `Hostname equals <host> AND Country does not equal United States`. Vercel doesn't document how mixed AND/OR conditions group, so one AND per rule avoids guessing.
- **US territories:** Puerto Rico, Guam and the US Virgin Islands are separate country codes, so this blocks them. Add them to rule 3 if Rick wants them.
- **Plan limits:** Pro allows 40 custom rules. This uses 3, or 5 with the per-host copies.

## Why each exception

- **`/api/revalidate`:** Sanity documents its webhook source IPs at https://www.sanity.io/files/webhooks-egress-ips.txt. Today's file lists `34.79.12.229`, `35.205.99.116` and `35.190.215.189`, which are Google Cloud addresses in Europe. Sanity says the list can change without notice. So the bypass matches on the path, not the IPs. The route already rejects requests without Sanity's signature (`SANITY_REVALIDATE_SECRET`), so leaving it open from every country is safe.
- **`/api/cron/*`:** Vercel's own cron calls (`cleanup-leads`, daily). The route checks `CRON_SECRET`.
- **`/studio`:** Rick passes the block as a US visitor, and you pass it with the cookie. Once loaded, Studio talks to `api.sanity.io` directly from the browser, not through Vercel, so publishing isn't affected. Publishing then calls `/api/revalidate` (rule 1).

## Developer bypass (you, from India)

1. Generate a secret once, e.g. `node -e "console.log(crypto.randomUUID())"`. Put it in rule 2 and in the team password manager. Don't put it in the repo.
2. In Chrome, open https://www.painter1.com. You'll see Vercel's block page, which is fine because it's still the right site. Press **F12 → Console** and run:
   ```js
   document.cookie = "p1_dev=<secret>; domain=painter1.com; path=/; max-age=31536000; secure; samesite=lax"
   ```
   Reload. `domain=painter1.com` covers www, the apex and staging in one go. Clearing site data removes it; set it again the same way.
3. For curl: `curl -H "Cookie: p1_dev=<secret>" …`. For the smoke test: `P1_DEV_COOKIE=<secret> node scripts/smoke-launch.ts https://www.painter1.com`.
4. **To rotate the secret:** change the value in rule 2. Old cookies stop working immediately.

The cookie only gets you past Vercel. Proxied WordPress pages still answer "unavailable in your region" until Really Simple Security Pro's country block is off (see "On launch day" below). The WordPress checks therefore still need a US VPN until then.

## Search engines

- Vercel's verified-bot handling (IP and reverse-DNS checks) only exempts bots from its managed **Bot Protection** ruleset. Custom rules run before managed rulesets, and Vercel has no "verified bot" condition for custom rules. **So rule 3 denies a verified Googlebot that crawls from outside the US.**
- In practice, Googlebot and Bingbot crawl almost entirely from US IPs. So do AdsBot (Google Ads landing-page checks) and Google's testing tools (Rich Results, URL Inspection). Google crawls from other countries only occasionally, for sites that change content by country, which this one doesn't.
- **Don't add a User-Agent bypass for crawlers.** Anyone can send `Googlebot` as their user agent, so it would be an open door through the block.
- **Check it with the Log phase:** run rule 3 as **Log** for 3–7 days before switching it to **Deny**. Firewall → filter rule 3 → group by User Agent. If Googlebot or Bingbot appear from outside the US, tell us before switching it to Deny. After the switch, watch **Search Console → Settings → Crawl stats** for a rise in 403s.

## Rehearsal on staging

1. Add rules 1–3 with rule 3 as **Log**.
2. Check from a US VPN, from India without the cookie (rule 3 logs it), and from India with the cookie (rule 2 matches).
3. Switch rule 3 to **Deny**, then repeat: India without the cookie gets 403, with the cookie gets 200, and from the US gets 200. Also check that publishing in Studio still updates the page (rule 1).
4. Confirm `painter1.vercel.app` is still reachable from India without the cookie.

## Can it live in code?

Partly, and not well enough to use.
- `vercel.json` `routes[].mitigate` supports only `deny` or `challenge`, with no `log` or `bypass`. It can't express rules 1 and 2 or the Log phase. It also mixes the legacy `routes` with Next's own routing.
- The REST API ("Update firewall configuration") and Terraform (`vercel_firewall_config`) can hold firewall configuration. I haven't confirmed they cover every custom-rule condition used here. That's worth it only if the firewall setup is managed for several projects.

**Recommendation:** use the dashboard, with this page as the record.

## On launch day

1. After DNS points to Vercel, switch rule 3 to **Deny**, or keep it on **Log** for the first days as planned above.
2. Ask Rick to **turn off Really Simple Security Pro's country block**, so blocking happens in one place. Behind Vercel, WordPress sees Vercel's servers, not the visitor, so it would block or allow by the wrong country.
3. Remove `staging.painter1.com` from rule 3, and from the project's domains, when staging is retired.
