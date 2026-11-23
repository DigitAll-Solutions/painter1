# Country block on Vercel's firewall

Rick approved (Nov 7): **United States only**, as a single condition, "Country is not US → Deny". His list of 242 country codes isn't used; one negative condition does the same job and stays short. Vercel Firewall custom rules, project **painter1**. Changes take effect within seconds, with no redeploy, and can be restored from the audit log (**Firewall → ⋯ → View Audit Log → Restore**).

**Status:** rules 1–3 are created now (Nov 7) with rule 3 on **Log**. Rule 3 is switched to **Deny** on launch day (`docs/go-live-plan.md`, step 14).

## US territories and DC (Rick, Nov 9: the 50 states only)

Rick's answer: allow the **50 states and DC**, and keep the US territories blocked. Rule 3 already does exactly that, so nothing changes:
- **Territories stay blocked.** Puerto Rico (PR), Guam (GU), the US Virgin Islands (VI), American Samoa (AS), the Northern Mariana Islands (MP) and the US Minor Outlying Islands (UM) have their own ISO country codes, so "Country does not equal United States" denies them.
- **DC is allowed.** Washington, DC is a region inside the country code US, not a country of its own, so it passes like any state.

Don't add a territory to rule 3 unless Rick changes his answer. If he does, edit rule 3's country condition only:
- Change it to **Country · is not any of · United States, Puerto Rico, Guam, …** (the codes he wants).
- If the Country field has no "is not any of" operator, add one condition per territory instead, joined with **AND**: `… AND Country does not equal Puerto Rico AND Country does not equal Guam`.

## Rules, in this order (the order matters)

| # | Name | If | Then |
|---|---|---|---|
| 1 | Sanity webhook and cron | Request Path **equals** `/api/revalidate` **OR** Request Path **starts with** `/api/cron/` | **Bypass** |
| 2 | Developer bypass | Cookie `p1_dev` **equals** `<secret>` | **Bypass** |
| 3 | US only | Hostname **is any of** `www.painter1.com`, `painter1.com`, `staging.painter1.com` **AND** Country **does not equal** United States | **Log** (now) → **Deny** (launch day) |

- **Bypass** skips the remaining custom rules, so rules 1 and 2 must sit above rule 3. Vercel's DDoS protection still applies.
- **Rule 3 scope:** `painter1.vercel.app` and preview URLs don't match the hostname condition, so they stay open.
- **AND/OR:** in the dashboard, each condition after the first is joined to the one before it with AND or OR. There are no brackets, so keep each rule to one kind of join: rule 1 uses only OR, rule 3 only AND.
- **Plan limits:** Pro allows 40 custom rules. This uses 3, or 5 with the per-host fallback below.

## Dashboard steps

### 0. Generate the developer secret (once)

In PowerShell or any terminal:
```sh
node -e "console.log(crypto.randomUUID())"
```
Save it in the team password manager as "painter1 firewall p1_dev". Don't put it in the repo, in Slack or in a ticket.

### 1. Open the firewall editor

vercel.com → the team that owns **painter1** → project **painter1** → **Firewall** (top tabs or sidebar) → **⋯** (top right) → **Configure**.

### 2. Rule 1: Sanity webhook and cron

1. **Add New… → Rule.**
2. Name: `Sanity webhook and cron`.
3. **If:** `Request Path` · `Equals` · `/api/revalidate`.
4. Add a second condition, set the join to **OR**: `Request Path` · `Starts with` · `/api/cron/`.
5. **Then:** `Bypass`.
6. **Save Rule.**

### 3. Rule 2: Developer bypass

1. **Add New… → Rule.**
2. Name: `Developer bypass`.
3. **If:** `Cookie` · key `p1_dev` · `Equals` · the secret from step 0.
   - If the Cookie parameter has no key field, use `Header` · key `cookie` · `Contains` · `p1_dev=<secret>`.
4. **Then:** `Bypass`.
5. **Save Rule.**

### 4. Rule 3: US only (Log)

1. **Add New… → Rule.**
2. Name: `US only`.
3. **If:** `Hostname` · `Is any of` · `www.painter1.com`, `painter1.com`, `staging.painter1.com`.
4. Add a second condition, join **AND**: `Country` · `Does not equal` · `United States`.
5. **Then:** `Log`. Not Deny.
6. **Save Rule.**

**Fallback** if Hostname has no "is any of" operator: make three copies of this rule (`US only – www`, `US only – apex`, `US only – staging`), each with `Hostname · Equals · <host>` **AND** `Country · Does not equal · United States`, all on Log.

### 5. Order and publish

1. In the custom rules list, drag the rules into the order **1, 2, 3** (the bypasses on top).
2. **Review Changes** → check the three rules and the order → **Publish**.

## Set the cookie in your browser

1. In Chrome, open https://staging.painter1.com/knoxville (any painter1.com page works, even a block page).
2. Press **F12 → Console** and run, with your secret:
   ```js
   document.cookie = "p1_dev=<secret>; domain=painter1.com; path=/; max-age=31536000; secure; samesite=lax"
   ```
3. Reload. `domain=painter1.com` covers www, the apex and staging for one year. Clearing site data removes it; set it again the same way.

**Other tools:**
- curl: `curl -H "Cookie: p1_dev=<secret>" …`
- The smoke test: `P1_DEV_COOKIE=<secret> node scripts/smoke-launch.ts https://www.painter1.com`.

**To rotate the secret:** change the value in rule 2 and publish. Old cookies stop working immediately.

The cookie only gets you past Vercel. Proxied WordPress pages still answer "unavailable in your region" until Really Simple Security Pro's country block is off on launch day. Until then, the WordPress checks need a US connection (the GitHub Actions "Staging smoke test" workflow).

## Check it works (right after publishing)

1. **Firewall** → time range **Live**.
2. From India, open https://staging.painter1.com/knoxville **without** the cookie, e.g. in an Incognito window. The request shows under **US only**, action Log, and the page still loads.
3. With the cookie (a normal window), the request shows under **Developer bypass**.
4. Publish a small change in Studio. The `/api/revalidate` call shows under **Sanity webhook and cron**, and the page updates.

## Check the logs after a few days

Do this once a day for 3–7 days before launch. The firewall view goes back 24 hours, so a daily look covers everything.

1. **Firewall** → time range **Last 24 hours**.
2. Pick **US only** in the rule drop-down above the graph.
3. Group by **Country**: what would be blocked. Expect India (you without the cookie) and scattered bots.
4. Group by **User Agents**: look for **Googlebot**, **Bingbot**, **AdsBot-Google** or other real customers' tools. If a search engine shows up from outside the US, tell us before launch day. See "Search engines" below.
5. Group by **Request Paths**: nothing under `/api/` should show here. If it does, rule 1 isn't matching.
6. Pick **Sanity webhook and cron** and check it has hits after each publish and the daily cron (`cleanup-leads`).

Until launch, only staging traffic reaches these rules. www and the apex still point to WordPress, so the log stays small.

## Why each exception

- **`/api/revalidate`:** Sanity documents its webhook source IPs at https://www.sanity.io/files/webhooks-egress-ips.txt. Today's file lists `34.79.12.229`, `35.205.99.116` and `35.190.215.189`, which are Google Cloud addresses in Europe. Sanity says the list can change without notice, so the bypass matches on the path, not the IPs. The route already rejects requests without Sanity's signature (`SANITY_REVALIDATE_SECRET`), so it's safe to leave open from every country.
- **`/api/cron/*`:** Vercel's own cron calls (`cleanup-leads`, daily). The route checks `CRON_SECRET`.
- **`/studio`:** Rick passes the block as a US visitor, and you pass it with the cookie. Once loaded, Studio talks to `api.sanity.io` directly from the browser, not through Vercel, so publishing isn't affected. Publishing then calls `/api/revalidate` (rule 1).

## Search engines

- **Verified bots aren't exempt from custom rules.** Vercel's verified-bot handling (IP and reverse-DNS checks) only exempts bots from its managed **Bot Protection** ruleset. Custom rules run before managed rulesets, and there's no "verified bot" condition for them. So once it's on Deny, rule 3 blocks a verified Googlebot that crawls from outside the US.
- **In practice:** Googlebot and Bingbot crawl almost entirely from US IPs. So do AdsBot and Google's testing tools (Rich Results, URL Inspection). Google crawls from other countries only for sites that change content by country, which this one doesn't.
- **No User-Agent bypass for crawlers.** Anyone can send `Googlebot` as their user agent, so it would be an open door through the block.
- **After the switch to Deny:** watch **Search Console → Settings → Crawl stats** for a rise in 403s.

## Can it live in code?

Partly, and not well enough to use:
- `vercel.json` `routes[].mitigate` supports only `deny` or `challenge`, with no `log` or `bypass`. It can't express rules 1 and 2 or the Log phase.
- The REST API and Terraform (`vercel_firewall_config`) can hold firewall configuration, but that's only worth it if firewalls are managed for several projects.

**Decision:** the dashboard, with this page as the record.

## On launch day

In `docs/go-live-plan.md`, step 14:
1. After DNS points to Vercel and the checks pass, switch rule 3 (all copies, if you used the fallback) from **Log** to **Deny** → **Review Changes → Publish**. Check from India without the cookie: 403. With the cookie, and from the US: 200.
2. **Then** ask Rick to turn off Really Simple Security Pro's country block, so blocking happens in one place. Behind Vercel, WordPress sees Vercel's servers, not the visitor, so it would block or allow by the wrong country. Doing it in this order means there's no window with no block at all.
3. When staging is retired, remove `staging.painter1.com` from rule 3 and from the project's domains.

**Rollback (DNS back to WordPress):** Rick turns Really Simple Security's country block back on, because WordPress again serves visitors directly. The Vercel rules can stay; they no longer see www traffic.
