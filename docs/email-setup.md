# Email setup: Brevo

For Rick. The website sends two kinds of email through Brevo: estimate requests (to each location's lead recipients, including Client Tether) and warranty requests (to the warranty recipients, never Client Tether). Both are plain text. Nothing reaches real recipients until launch: see "Safety switches" below.

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

## 3. API key → Vercel

1. In Brevo: **SMTP & API → API Keys → Generate a new API key**. Name it "painter1.com website". Copy it (it's shown once).
2. In Vercel: project **painter1** → **Settings → Environment Variables**. Add, for **Production** (and Preview only if you want previews to send):

| Variable | Value |
|---|---|
| `BREVO_API_KEY` | the key (server-side only; never in a `NEXT_PUBLIC_` variable) |
| `LEAD_FROM_EMAIL` | the verified sender, e.g. `leads@painter1.com` |
| `LEAD_FROM_NAME` | optional; empty = "Painter1" |

3. Redeploy (Deployments → … → Redeploy) so the new values are used.

Without `BREVO_API_KEY` (or without `LEAD_FROM_EMAIL`) nothing is sent: each request is still saved in the Studio with its email marked "skipped" and the exact text it would have sent.

## 4. Safety switches (unchanged)

| `LEAD_TEST_RECIPIENT` | `LEAD_SEND_LIVE` | Who gets the email |
|---|---|---|
| set | anything | **only** that address, subject starts with `[TEST]` |
| empty | `true` | the real recipients (launch only) |
| empty | anything else | nobody (saved as "skipped") |

Before launch keep `LEAD_TEST_RECIPIENT` set to your own address in every environment. At go-live: empty it and set `LEAD_SEND_LIVE=true`, then send one real test request per location.

## 5. Free plan limit vs expected volume

- **The free plan allows 300 emails per day** (per Brevo's pricing as reported in 2026 reviews; confirm on your account's plan page).
- **Brevo counts each recipient.** One estimate request to Knoxville goes to 7 addresses (6 staff + Client Tether), so it uses 7 of the 300. A warranty request to Knoxville uses 6.
- **That's about 40 estimate requests a day across the whole network** on the free plan. With 30 full locations, an average of 2 requests per location per day is 60 requests ≈ 420 emails, over the limit.
- **When the limit is hit, emails stop for the rest of the day** (the request is still saved in the Studio, marked "failed").
- **Recommendation:** start on the free plan while one or two locations are live, and move to a paid plan (no daily cap, billed per month) before most locations launch. Fewer recipients per location also lowers the count.

## 6. Settings that could change the email text

Client Tether reads the estimate email line by line, so its text must arrive exactly as the website builds it (it ends with the `PARSER: …` line, including a trailing space). The website sends text only; check these in Brevo:

- **Click tracking:** Brevo can rewrite links to go through its own tracking address. In a plain-text email that would change the `Url:` line. Brevo's documentation doesn't say whether it rewrites links in text-only emails, so **test it** (below). If links are rewritten, ask Brevo support to turn click tracking off for transactional email (they decide case by case).
- **Open tracking:** adds an invisible image to HTML emails only. Our emails have no HTML part, so nothing is added.
- **Don't use a Brevo template** for these emails, and don't add a header/footer or unsubscribe block to transactional email: any of them would change the text.
- **Line wrapping:** long lines may be encoded for transport (quoted-printable). Email programs and Client Tether decode it back to the same text; this isn't a change.

**Test before launch:** with `LEAD_TEST_RECIPIENT` set to your address, submit one estimate request. In the email received, open "Show original" (Gmail) or "View source": the `Url:` line must be the plain page address, and the last line must be `PARSER: …` exactly as stored on the lead in the Studio (Leads → the request → Email → Body). Then do one live test into Client Tether at go-live and confirm the lead appears with its source fields.
