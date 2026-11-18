# Knoxville launch: Tuesday Nov 24, 2026, 10:00 ET (20:30 IST)

The dated version of the runbook in `docs/go-live-plan.md` ("Launch-day runbook (option (a))" and "Rollback plan"). Those sections explain the why; this page is the when, who and how to check.

- **Me:** Sagar (India, IST). Vercel, Sanity, Turnstile, NitroPack, the checks.
- **Rick:** GoDaddy, Cloudways (Cloudflare add-on, Varnish), GTM, Really Simple Security, Client Tether (with Keith).
- **Time:** Nov 24 is Eastern **Standard** Time (UTC−5). IST = ET + 10:30.
- **Rick's steps** in plain words: `docs/handoff/Rick-launch-steps.html` (not in git).
- Nothing on this page has been done yet unless it says so.

## Pre-launch checklist (Nov 19–23)

| Date | Who | Item | How to verify |
| --- | --- | --- | --- |
| Thu Nov 19 | Rick | **GoDaddy DNS snapshot:** a screenshot of every record, with the `www` and `@` rows readable (type, value, TTL), plus GoDaddy's export (DNS → ⋯ → Export zone file). Send both to me. | I can read the `www` and `@` type, value and TTL in the screenshot. Saved in `docs/handoff/` (not in git). These are the rollback values. |
| Thu Nov 19 | me | **Vercel → Domains:** add `www.painter1.com` (the project's main domain) and `painter1.com` (redirect to `www.painter1.com`, 308). No DNS change: both show "Invalid Configuration" until launch day, which is expected, and no traffic moves. If Vercel says a domain is in use elsewhere, it asks for a `_vercel` TXT record: send it to Rick. | Both domains are listed on the project. `www.painter1.com` and `painter1.com` still load WordPress (`curl -sI https://www.painter1.com/` has no `x-vercel-id`). Note the `A` and `CNAME` values Vercel shows for launch day. |
| Thu Nov 19 | me | **Certificates ahead of time:** in each domain's panel, use "pre-generate SSL certificates" if Vercel offers it; it gives `_acme-challenge` TXT records. Send them to Rick. TXT records don't move any traffic. If it isn't offered, Vercel issues the certificates over HTTP right after the switch (usually a minute or two); plan for a short window of certificate errors at 10:00 ET. | After Rick adds them (Nov 20): the domain panel shows a certificate, and `curl --resolve www.painter1.com:443:76.76.21.21 -sI https://www.painter1.com/knoxville` (the IP Vercel shows) answers 200 with a valid certificate. |
| Fri Nov 20 | Rick | Add the TXT records I send (if any) at GoDaddy. Don't change any other record. | `Resolve-DnsName _acme-challenge.www.painter1.com -Type TXT -Server 8.8.8.8` returns the value. The site still loads WordPress. |
| Thu Nov 19 | me | **Production env vars** (Vercel → Settings → Environment Variables → Production). Look only; the changes are made on Nov 23 (below). | Each row matches: |
| | | `NEXT_PUBLIC_SITE_URL` | `https://www.painter1.com` (set Nov 23 if not). |
| | | `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Present. In Cloudflare → Turnstile → the widget → Hostnames: `www.painter1.com`, `staging.painter1.com` and `painter1.vercel.app` are listed (the apex redirects, so it needs no entry). |
| | | `BREVO_SMTP_USER`, `BREVO_SMTP_KEY`, `LEAD_FROM_EMAIL` | Present (`docs/email-setup.md` §3, §8). `scripts/brevo-blocklist.ts knoxville` shows every recipient as "ok". |
| | | `P1_PROXY_KEY` | Present in Production and Preview. It matches wp-config.php when the curl checks in `docs/cloudways-wp-config.md` step 7 pass (with the key: `/atlanta/` 200 with www links). Never print or compare the value itself. |
| | | `LEAD_TEST_RECIPIENT` | Today: my own address. Nov 23: the Client Tether parse address only (`docs/email-setup.md` §8 step 3), for the launch-day test. |
| | | `LEAD_SEND_LIVE` | **Unset** until launch-day step L6. |
| | | `NEXT_PUBLIC_GTM_ID` | Today `GTM-PVDK2ZFJ`. Nov 23, just before the merge: `GTM-5LG3XH7S` (`docs/go-live-plan.md` step 4). |
| Thu Nov 19 | me | **Sanity:** sanity.io/manage → API → CORS origins: `https://www.painter1.com` with credentials allowed. Studio host for `https://www.painter1.com/studio` (`docs/go-live-plan.md` step 7). | Both entries are listed. On launch day `www.painter1.com/studio` logs in and shows documents. |
| Thu Nov 19 | me | **Firewall ready:** Vercel → Firewall, rules 1–3 in order (`docs/country-block.md`). Rule 3 "US only" covers `www.painter1.com`, `painter1.com` and `staging.painter1.com` and is still on **Log**. | The rules list shows 1 Bypass, 2 Bypass, 3 Log. Firewall → Traffic shows rule 3 logging non-US staging visits. The `p1_dev` cookie is saved in my browser (I'm outside the US; I'll need it after L10). |
| Thu Nov 19 | me | **NitroPack purge access:** wp-admin → NitroPack → Purge cache is available to my login (Rick's login as the backup). Don't purge yet. | I can see the Purge button. Rick confirms he can too. |
| Fri Nov 20 | Rick | Confirm he's free Tue 09:30–13:30 ET with access to GoDaddy, Cloudways, GTM (GTM-PVDK2ZFJ), Really Simple Security and Client Tether (or Keith on hand for Client Tether). | Rick's reply. |
| by Sun Nov 22 | Rick | **TTL:** set `www` and `@` to **600** seconds (10 min) at GoDaddy. Only the TTL; the values stay. | Mon Nov 23: `Resolve-DnsName www.painter1.com -Server 8.8.8.8` and the same for `painter1.com` show TTL ≤ 600, and the values match the Nov 19 screenshot. |
| Mon Nov 23 | me | **Final staging smoke:** `node scripts/smoke-launch.ts https://staging.painter1.com` (or the staging-smoke workflow) on the `launch-knoxville` branch; then the rehearsal spot checks in `docs/launch-rehearsal.md` (WP home, a location, WP admin login, `/knoxville`, a legacy redirect). | 0 failures (known warnings only). |
| Mon Nov 23 | me | **Country block dry run, 2 minutes** (so L10 holds no surprise): Vercel → Firewall → rule 3 "US only" **Log → Deny** → Review Changes → Publish; run the two checks in "Country block dry run" below; then rule 3 **Deny → Log** → Publish. Only staging is affected: `www` and `painter1.com` don't reach Vercel yet. | With the `p1_dev` cookie: **200**. Without it, from India: **403**. Afterwards the rules list shows rule 3 on **Log** again, and the check without the cookie answers 200. |
| Mon Nov 23 | me | **Go/no-go A:** smoke clean, country block dry run passed (rule 3 back on Log), DNS snapshot saved, TTL 600, domains added (certificates ready or the short window accepted), Rick confirmed. No-go → move the launch; nothing to undo. | All of the above are checked. |
| Mon Nov 23 | me | **Merge the launch PR (#44):** set Production `NEXT_PUBLIC_GTM_ID=GTM-5LG3XH7S`, `NEXT_PUBLIC_SITE_URL` (if needed) and `LEAD_TEST_RECIPIENT` = the Client Tether parse address; save **without redeploying**; merge. The merge's build picks up all three. | `painter1.vercel.app/knoxville` loads only GTM-PVDK2ZFJ, `/bozeman` no GTM (`docs/analytics.md`). `www.painter1.com` still loads WordPress. No test request on production until L5 (it would reach Client Tether). |
| Mon Nov 23 | me | Send Rick the launch-day sheet and a calendar hold for 09:30–13:30 ET. | Rick confirms. |

### Country block dry run (Nov 23)

PowerShell, with `curl.exe` (not PowerShell's `curl` alias). The cookie value is typed at a hidden prompt and read from `$env:P1_DEV`, so it never appears on screen or in the command history (history keeps `$env:P1_DEV`, not the value):

```powershell
# Once per session: type the p1_dev value at the hidden prompt
$env:P1_DEV = [Net.NetworkCredential]::new('', (Read-Host 'p1_dev' -AsSecureString)).Password

# With the cookie: expect 200
curl.exe -s -o NUL -w "%{http_code}`n" -H "Cookie: p1_dev=$env:P1_DEV" https://staging.painter1.com/knoxville

# Without it, from India: expect 403
curl.exe -s -o NUL -w "%{http_code}`n" https://staging.painter1.com/knoxville

# When done
Remove-Item Env:P1_DEV
```

Use the same two checks at L10, with `https://www.painter1.com/knoxville`.

## Launch day: Tuesday Nov 24

Have open: the DNS screenshot (rollback values), Vercel's DNS values, Vercel → Domains, Logs and Firewall, Sanity Studio, this page. Rick on a call from 09:45 ET.

| ET | IST | Who | Step | Verify | Rollback |
| --- | --- | --- | --- | --- | --- |
| 08:30 | 19:00 | me | **L0 Pre-flight:** Production deployment is the #44 merge; env vars as in the checklist (`LEAD_SEND_LIVE` unset); `curl --resolve` check for www (certificate); staging smoke again. | All pass. | Nothing changed yet. |
| 09:00 | 19:30 | Rick | **L1 Freeze:** no WordPress edits, plugin updates or cache settings until 13:30 ET. Varnish stays off. | Rick confirms; Cloudways shows Varnish off. | – |
| **09:45** | **20:15** | me + Rick | **GO/NO-GO 1:** L0 passed, Rick on the call, WordPress healthy. | – | **No-go:** postpone. Nothing to undo. |
| 10:00 | 20:30 | Rick | **L2 DNS switch:** at GoDaddy, `www` (CNAME) and `@` (A) to Vercel's values. Nothing else. | Vercel → Domains: both "Valid Configuration". `Resolve-DnsName www.painter1.com -Server 8.8.8.8` gives Vercel. `curl -sI https://www.painter1.com/knoxville` has `x-vercel-id` and a valid certificate. | Rick sets `www` and `@` back to the screenshot values. Visitors return in 10–30 min (TTL 600). |
| 10:05 | 20:35 | me | **L3 Purge NitroPack** (wp-admin → NitroPack → Purge cache). | NitroPack confirms. A WordPress page's links are `www.painter1.com`. | None needed. |
| 10:10 | 20:40 | me (VPN), Rick (phone network) | **L4 Checks** (`docs/go-live-plan.md` step 10): `/knoxville`, `/`, 3 other locations, `/knoxville/brick-painting/` (legacy), WP admin login, one Fluent Form on another location, `/robots.txt`, `/sitemap.xml`, no `X-Robots-Tag` on www, `noindex` still on `painter1.vercel.app`. Then `node scripts/smoke-launch.ts https://www.painter1.com`. | All pass; smoke 0 failures. | DNS rollback (L2). |
| **10:25** | **20:55** | me + Rick | **GO/NO-GO 2:** L4 all green. A rollback trigger (below) that lasts 10 min → no-go. | – | **No-go:** DNS rollback (L2). Nothing else has changed yet. |
| 10:30 | 21:00 | me, then Rick + Keith | **L5 Client Tether test** (`docs/email-setup.md` §8 step 3): no ad blocker; open `https://www.painter1.com/knoxville/interior-painting?utm_source=golive-test&utm_medium=cpc&utm_campaign=golive`, reach the form through the site's button, submit "Client Tether Test". In Studio → the lead → Email → Body: `Ga Source: golive-test`, `Ga Medium: cpc`, `Ga Campaign: golive`, and a filled `PARSER:` line. Rick or Keith check Client Tether. | The email went only to the parse address, subject `[TEST]`. Client Tether shows the lead with every field in the right place, and the same source and channel. | – |
| **10:45** | **21:15** | me + Rick | **GO/NO-GO 3:** `PARSER:` filled and Client Tether fields right. | – | **Empty `PARSER:` or wrong fields:** DNS rollback (L2). Leads stay safe in Sanity. Fix (Postmark if the fields are wrong, `docs/email-setup.md` §8.3.4), new date. |
| 10:50 | 21:20 | me, Rick | **L6 Leads live:** remove `LEAD_TEST_RECIPIENT`, set `LEAD_SEND_LIVE=true`, redeploy Production. Delete the test lead in Studio; Rick or Keith delete it in Client Tether. Remind Keith's team: never "Unsubscribe" or "Report spam" on lead emails. | The new deployment is Ready and serves `www.painter1.com`. No test email to real recipients: the first real request shows email "sent" in Studio. **After:** Rick asks Keith to confirm the first real lead reached him (his email and Client Tether), and tells me. | Set `LEAD_TEST_RECIPIENT` back, unset `LEAD_SEND_LIVE`, redeploy. Requests are still saved; Keith works them from Studio. |
| 11:00 | 21:30 | Rick | **L7 Cloudflare off:** Cloudways → Cloudflare add-on: turn it off for `www.painter1.com` and `painter1.com` only. | `www.painter1.com/` and `/knoxville` still 200 with `x-vercel-id`. Rick confirms nothing else changed in the add-on. | Rick turns it back on for both. **Before any DNS rollback after this point, this goes first.** |
| 11:10 | 21:40 | Rick | **L8 GTM:** in **GTM-PVDK2ZFJ only**, pause "Click to Call" and "Schedule Page btn", then Publish. Never in GTM-5LG3XH7S or another location's container. | Tag Assistant on `www.painter1.com/knoxville` (me): a call click fires "GA4 - phone_click" once and not "Click to Call". | Rick unpauses both and publishes. |
| 11:20 | 21:50 | me | **L9 Sanity webhook** → `https://www.painter1.com/api/revalidate`. Publish a small harmless change, then revert it. | The change shows on www within a minute; the webhook's attempts log shows 200. | Point it back at `painter1.vercel.app`. |
| 11:30 | 22:00 | me, then Rick | **L10 Country block** (`docs/country-block.md`, "On launch day"): check the `p1_dev` cookie is in my browser; rule 3 **Log → Deny**, Review Changes → Publish. **Then** Rick turns off Really Simple Security's country block. | From India without the cookie: 403; with it: 200. Rick, from the US: a WordPress location page and `/knoxville` 200. | In reverse: Rick turns the RSS country block back on, then rule 3 back to Log. |
| 11:40–13:40 | 22:10–00:10 | me | **L11 Watch 2 h:** Vercel → Logs and Observability (External Origins: WordPress errors), Firewall (rule 3 denies), WordPress error log, Studio (new leads "sent"). | No rollback trigger. | Full rollback (below). |
| 13:40 | 00:10 (Nov 25) | me + Rick | **Done:** freeze lifted. Next: the "After" steps in `docs/go-live-plan.md` (16–20). | Rick told. | – |

## Rollback

**Triggers** (any lasting more than 10 minutes): WordPress pages error or loop; WP admin can't log in; forms on other locations fail; certificate errors. **Immediate:** an empty `PARSER:` line or wrong Client Tether fields at go/no-go 3.

**Order** (only the steps already done; full list in `docs/go-live-plan.md`, "Rollback plan"):
1. L7 done → Rick turns Cloudflare back on for `www` and `@` **first**.
2. Rick sets `www` and `@` at GoDaddy back to the Nov 19 screenshot values.
3. L10 done → Rick turns the RSS country block back on (rule 3 can stay; it no longer sees www traffic).
4. L8 done → Rick unpauses the two GTM tags in GTM-PVDK2ZFJ and publishes.
5. L9 done → webhook back to `painter1.vercel.app`.
6. Leads: requests on `painter1.vercel.app` stay live (L6); WordPress's own forms take Knoxville again.
7. Don't revert #44 on main for a DNS rollback. If it is reverted, set `NEXT_PUBLIC_GTM_ID` back to `GTM-PVDK2ZFJ` first (`docs/go-live-plan.md`, rollback step 8).
