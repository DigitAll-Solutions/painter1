# Email setup: Brevo

For Rick. The website sends one kind of email through Brevo: estimate requests, to each location's lead recipients (including Client Tether), as plain text, through Brevo's **SMTP relay** (not its API: see section 6). (The warranty request form was removed on Oct 14; the warranty page now offers Call, Text and Email instead.) Nothing reaches real recipients until launch: see "Safety switches" below.

## 1. Brevo account

1. Create a Brevo account under Painter1's ownership (not a personal or agency account), at brevo.com.
2. Turn on two-factor sign-in, and add a second admin so access doesn't depend on one person.

## 2. Authenticate painter1.com (sender domain)

In Brevo: **Senders, Domains & Dedicated IPs → Domains → Add a domain** → `painter1.com`. Brevo then shows the DNS records to add. **Copy the exact values from Brevo's screen**; the examples below only show their shape. Add them wherever painter1.com's DNS is managed:

| Record | Type | Host | Value (shape) | Notes |
|---|---|---|---|---|
| Brevo code | TXT | `@` (painter1.com) | `brevo-code:…` | Proves you own the domain. |
| DKIM | CNAME ×2 (newer accounts) or TXT ×1 (older) | `brevo1._domainkey`, `brevo2._domainkey` (or `mail._domainkey`) | `b1.painter1-com.dkim.brevo.com` … | Signs every email; the important one. |
| DMARC | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` | **painter1.com may already have one** (it sends email today). A domain must have only one: if it exists, keep it and add Brevo's `rua` address to it, don't add a second. |
| SPF | TXT | `@` | `include:spf.brevo.com` | **Only if Brevo's screen asks for it.** Never create a second SPF record: add the include inside the existing `v=spf1 … ~all` record. |

Then click **Authenticate this email domain**. DNS can take up to 48 hours. Brevo shows each record as verified when it's right.

**Sender address:** under **Senders**, add the address the emails come from, e.g. `leads@painter1.com`, name "Painter1". It doesn't need to be a real mailbox, but replies go to the customer anyway: every email's Reply-To is the customer's address.

## 3. SMTP key → Vercel

The website sends through Brevo's **SMTP relay**, which takes the email exactly as the website writes it: one plain-text part. Brevo's API is not used for sending (section 6 explains why).

1. In Brevo: **SMTP & API → SMTP** tab. It shows the server (`smtp-relay.brevo.com`, port `587`) and your **Login** (it looks like `xxxxxx@smtp-brevo.com`). Click **Generate a new SMTP key**, name it "painter1.com website", and copy it (it's shown once).
2. In Vercel: project **painter1** → **Settings → Environment Variables**. Add, for **Production** (and Preview only if you want previews to send):

| Variable | Value |
|---|---|
| `BREVO_SMTP_USER` | the **Login** from the SMTP tab |
| `BREVO_SMTP_KEY` | the SMTP key (server-side only; never in a `NEXT_PUBLIC_` variable) |
| `LEAD_FROM_EMAIL` | the verified sender, e.g. `leads@painter1.com` |
| `LEAD_FROM_NAME` | optional; empty = "Painter1" |

3. Redeploy (Deployments → … → Redeploy) so the new values are used.

Without `BREVO_SMTP_USER` and `BREVO_SMTP_KEY` (or without `LEAD_FROM_EMAIL`) nothing is sent: each request is still saved in the Studio with its email marked "skipped" and the exact text it would have sent.

**The API key** (`BREVO_API_KEY`, from **SMTP & API → API Keys**) is not used to send anything. Keep it only in `.env.local`, for the blocklist check (section 7). It can be removed from Vercel.

## 4. Safety switches (unchanged)

| `LEAD_TEST_RECIPIENT` | `LEAD_SEND_LIVE` | Who gets the email |
|---|---|---|
| set | anything | **only** that address, subject starts with `[TEST]` |
| empty | `true` | the real recipients (launch only) |
| empty | anything else | nobody (saved as "skipped") |

Before launch keep `LEAD_TEST_RECIPIENT` set to your own address in every environment. At go-live, follow the checklist in section 8.

## 5. Free plan limit vs expected volume

- **The free plan allows 300 emails per day** (per Brevo's pricing as reported in 2026 reviews; confirm on your account's plan page).
- **Brevo counts each recipient.** One estimate request to Knoxville goes to 7 addresses (6 staff + Client Tether), so it uses 7 of the 300.
- **That's about 40 estimate requests a day across the whole network** on the free plan. With 30 full locations, an average of 2 requests per location per day is 60 requests ≈ 420 emails, over the limit.
- **When the limit is hit, emails stop for the rest of the day** (the request is still saved in the Studio, marked "failed").
- **Recommendation:** start on the free plan while one or two locations are live, and move to a paid plan (no daily cap, billed per month) before most locations launch. Fewer recipients per location also lowers the count.

## 6. What Brevo can change in the email text

Client Tether reads the estimate email line by line, so its text must arrive exactly as the website builds it: plain text, ending with the `PARSER: …` line **including its trailing space** (Knoxville's template is 542 characters).

**Brevo's API changes it (tested Oct 16, 2026).** An email sent to the API as text only arrived as `text/html`: each newline became `<br/>`, `&` became `&amp;`, and a hidden open-tracking image was added. That is why the website doesn't send through the API.

**Open and click tracking can't be switched off in the account.** Brevo has no setting for transactional email tracking. Brevo support turns it off case by case, on request: write to them from the account (Help → Contact us), say these are transactional notifications read by a parser, and ask for open and click tracking to be disabled for transactional email. Sources: [Brevo community: no option to disable tracking](https://community.brevo.com/t/no-way-to-disable-by-option-tracking-in-transactional-e-mail/201), [Brevo community: SMTP relay and text/html](https://community.brevo.com/t/brevo-transactional-emails-simple-smtp-relay-forces-content-type-of-text-html/672).

**SMTP relay (tested Oct 16, 2026): Brevo converts it too.** The website sends one `text/plain` part and nothing else, and Brevo still delivered it as `text/html` with `<br/>` line breaks and a tracking image. So, with Brevo, Client Tether receives an HTML email whichever way the site sends.

**Decision (Oct 19): keep Brevo.** Fluent Forms may well send HTML to Client Tether today too, so the real test is whether Client Tether reads the fields correctly: one test lead to the Client Tether parse address on launch day (section 8). Only if that fails do we switch to Postmark (text-only sends, tracking off by default). The site sends through Brevo's SMTP relay (merged in PR #33); the `lead-email-smtp` branch is merged and can be deleted.

Also:

- **Don't use a Brevo template** for these emails, and don't add a header/footer or unsubscribe block to transactional email: any of them would change the text.
- **Encoding isn't a change:** on the way, every line ends with CR LF, the message ends with a line break, and long or accented lines are encoded (quoted-printable, the trailing space as `=20`). Email programs and Client Tether decode it back to the same text.

**Inspect a received email (optional):** with Brevo the check below fails on the HTML part, which is expected (see above). It's still the quickest way to see exactly what arrived: the structure, tracking images, List-Unsubscribe and SPF/DKIM/DMARC. With Postmark it should pass.

1. With `LEAD_TEST_RECIPIENT` set to your address, submit one estimate request.
2. Save the email as a file: in Gmail, ⋮ → **Download message** (or **Show original** → **Download original**). Don't copy it from the screen: that can drop the trailing space.
3. Run `node --env-file=.env.local scripts/check-lead-eml.ts <file.eml> --lead <lead id>`. It finds the lead (by `--lead`, the Message-ID or the subject) and passes only if the email is a single text/plain part identical to the body stored on the lead (Studio: Leads → the request → Email → Body), follows the location's template (trailing space included), and has no HTML part, tracking image or rewritten link. It also prints the List-Unsubscribe header and the SPF/DKIM/DMARC results.

## 7. List-Unsubscribe and the blocklist

**Brevo adds `List-Unsubscribe` and one-click `List-Unsubscribe-Post` headers to every email**, transactional and SMTP included, and signs them with painter1.com's DKIM key. It does this for Gmail's and Yahoo's sender rules. It can't be turned off; on Enterprise plans, Brevo support can replace it with a "list-help" header. Sources: [Brevo help: unsubscribe header](https://help.brevo.com/hc/en-us/articles/19100260472850), [Brevo community: transactional emails still unsubscribable](https://community.brevo.com/t/header-of-transactional-emails-with-no-unsubscribe-links-are-wrongly-still-unsubscribable/1251).

**Why it matters:** Gmail and Outlook show an **Unsubscribe** button next to the sender. If a staff member clicks it on a lead email, Brevo puts that address on its **transactional blocklist** and stops delivering to it, while the website still sees "sent". A hard bounce or a spam complaint does the same. A blocked staff member, or a blocked Client Tether parse address, silently stops getting leads.

**Tell lead recipients never to click "Unsubscribe" or "Report spam" on lead emails.**

**See and remove blocked addresses:**

- **Script (recommended):** `node --env-file=.env.local scripts/brevo-blocklist.ts knoxville` lists the location's lead recipients (masked) and flags any that are blocked, with the date and reason. To remove one: `node --env-file=.env.local scripts/brevo-blocklist.ts --unblock <email>` shows what would change; add `--apply` to remove it. It needs `BREVO_API_KEY` and `SANITY_API_READ_TOKEN` in `.env.local`.
- **API:** `GET https://api.brevo.com/v3/smtp/blockedContacts` lists blocked addresses with their reason; `DELETE https://api.brevo.com/v3/smtp/blockedContacts/<email>` removes one (answer 204). Both take the `api-key` header. ([list](https://developers.brevo.com/reference/get-transac-blocked-contacts), [remove](https://developers.brevo.com/reference/unblock-or-resubscribe-a-transactional-contact))
- **Brevo screen:** the transactional email section has a blocked contacts list with an unblock action per address. Before unblocking, ask the person why: if they unsubscribed by accident, unblock; if the address bounced, fix the address in the Studio first.

## 8. Go-live checklist (email)

For each location going live:

1. **Vercel Production** has `BREVO_SMTP_USER`, `BREVO_SMTP_KEY` and `LEAD_FROM_EMAIL` (section 3). Without the SMTP pair, leads are saved but their email is "skipped".
2. **Check the blocklist:** `scripts/brevo-blocklist.ts <location>` shows every lead recipient as "ok". For Knoxville that's **Keith's team** and the **Client Tether parse address**. Remove any blocked address (section 7) before going live.
3. **Client Tether test, before going live (Knoxville: `keith@parse.clienttether.com` only):**
   1. In Vercel Production set `LEAD_TEST_RECIPIENT` to the location's Client Tether parse address (nothing else), keep `LEAD_SEND_LIVE` unset, and redeploy. In test mode the email goes **only** to that address, and its subject starts with `[TEST]`.
   2. Submit one estimate request on the live page with an obviously fake name ("Client Tether Test").
   3. **Rick or Keith confirm in Client Tether** that the lead appeared and that every field landed in the right place: name, email, phone, address, city, state, zip, the message, and the source fields from the `PARSER:` line (channel and drill-downs). Ask them to check the `[TEST]` subject doesn't stop Client Tether from picking it up; if it does, repeat with live mode for one request.
   4. **Fields right:** keep Brevo; continue with step 4. **Fields wrong or missing:** don't go live with Brevo; switch the sender to **Postmark** (text-only, tracking off), then repeat this test.
   5. Delete the test lead in Client Tether and in the Studio.
4. Tell the recipients not to click "Unsubscribe" or "Report spam" on lead emails.
5. **Go live:** empty `LEAD_TEST_RECIPIENT`, set `LEAD_SEND_LIVE=true`, redeploy. The first real request should reach the staff and Client Tether.
6. A week after launch, run the blocklist check again.
