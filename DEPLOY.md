# CampusCode — Coming Soon (Founder Pass) 🚀

Production launch page for **campuscode.co.in**. Finalized 2026-10-18.

## What's here

- `index.html` — the finalized Founder Pass page (self-contained, promo video embedded)
- `api/notify.js` — Vercel serverless function: saves signups to Brevo, returns live claim count

## How it works

1. Visitor clicks **Claim My Pass** → ticket gets stamped RESERVED with their pass number
2. They enter email → `POST /api/notify` → saved to Brevo list **"CampusCode Launch List"** (auto-created) with their pass number as a contact attribute
3. The "passes claimed" counter reads the **real** Brevo list count
4. Local preview (`file://`) falls back to a demo counter — the real wiring activates on Vercel

## DO TONIGHT (Monday, Oct 19) — no domain needed

These take ~10 minutes and make Tuesday smooth. Everything else needs the domain to exist first.

1. **ImprovMX account** — go to improvmx.com → sign up free. Stop there for now (adding the domain happens Tuesday).
2. **Brevo SMTP key** — Brevo dashboard → profile menu → **SMTP & API** → SMTP tab → generate a new SMTP key, save it somewhere safe. (This is separate from the API key you're rotating — you need both.)
3. **Log in and check**: GoDaddy (domain lives there now), Brevo dashboard, Vercel dashboard — make sure all three let you in, so Tuesday isn't spent resetting passwords.

## Tuesday deployment checklist (Dussehra, Oct 20)

1. ✅ **campuscode.co.in BOUGHT** on GoDaddy (₹116.82, UPI, 1 year; expires Oct 20 2027; Domain Lock ON). Auto-renew toggle errors — fix later, Sept 2027 renewal reminder set.
2. **Rotate the Brevo API key** — Brevo dashboard → SMTP & API → API Keys → generate a new key, save it. **Delete the old key** (it was pasted in chat before). Then update it in BOTH places that use it:
   - **Render** → your campus-code backend service → Environment → set `BREVO_API_KEY` to the new key → redeploy/restart. (The live backend reads `BREVO_API_KEY` in `mail.service.js` — skip this and the live app's emails break.)
   - **Vercel** (step 3 below) — set the new key as the env var there too.
3. **Deploy to Vercel**: dashboard → Add New Project → import this folder (via GitHub repo or drag-drop). Add env var `BREVO_API_KEY` = fresh key.
4. **Add domain**: Vercel project → Settings → Domains → add `campuscode.co.in` → Vercel shows DNS records.
5. **GoDaddy DNS**: add the records Vercel gives. They'll look exactly like this (standard Vercel values — follow whatever Vercel's screen shows if it differs, e.g. their newer CNAME-style apex):

   | Type | Name/Host | Value | Notes |
   |---|---|---|---|
   | A | `@` | `76.76.21.21` | apex → Vercel |
   | CNAME | `www` | `cname.vercel-dns.com` | www → Vercel |
   | MX | `@` | `mx1.improvmx.com` (priority 10) | receiving email |
   | MX | `@` | `mx2.improvmx.com` (priority 20) | receiving email |

   **Brevo domain auth** (Brevo → Senders & IP → Domains → add `campuscode.co.in` → copy the EXACT hostnames + values it shows — they're generated per account): 1× Brevo code TXT + 1× DKIM TXT + 1× DMARC TXT. Note: **Brevo does NOT require an SPF record on shared IPs** (their own docs say so) — so if Brevo only shows code/DKIM/DMARC, that's complete, nothing is missing. Skip adding a manual SPF include.

   **GoDaddy gotchas** (where first-timers lose an hour):
   - Delete any pre-added MX records (GoDaddy sometimes parks its own) BEFORE adding ImprovMX's.
   - In GoDaddy's DNS panel, type the hostname Brevo shows **exactly as shown** (e.g. `brevo-code` or `mail._domainkey` — don't append `.campuscode.co.in` yourself, GoDaddy adds it automatically).
   - Never two SPF records at one name — if you add one, it must be the only one.
   - Propagation: usually minutes to ~1 hour. Check with `whatsmydns.net` before assuming it's broken.
6. **Professional email (₹0)** — ImprovMX + Gmail + Brevo:
   - ImprovMX dashboard → Add domain → type `campuscode.co.in` → it shows 2 MX records (`mx1.improvmx.com`, `mx2.improvmx.com`).
   - GoDaddy → domain → DNS → add those 2 MX records. Delete any existing MX records first if GoDaddy pre-added some.
   - Back in ImprovMX → Aliases → add `hello` → forward to your Gmail address.
   - **Domain auth in Brevo** (keeps mail out of spam): Brevo → Senders & IP → Domains → add `campuscode.co.in` → copy the exact Brevo code TXT + DKIM TXT + DMARC TXT it shows (see the DNS table in step 5 above) → add them in GoDaddy DNS. No SPF record needed — Brevo's own docs confirm shared IPs don't require one.
   - Wait + test receiving: send a test mail from another account to `hello@campuscode.co.in` → it should land in Gmail (DNS can take minutes to a few hours).
   - **Gmail Send-As**: Gmail → ⚙️ Settings → See all settings → **Accounts and Import** → "Send mail as" → Add another email address → name `CampusCode`, address `hello@campuscode.co.in` → SMTP `smtp-relay.brevo.com`, port `587`, username = your Brevo login email, password = the SMTP key from tonight's step 2, TLS. Gmail sends a verification code to `hello@campuscode.co.in` → arrives via the forward → paste it → done.
7. **Test**: open campuscode.co.in → claim a pass → check Brevo contacts for the new entry.

## Notes

- No secrets in this folder — the Brevo key lives only as env vars (Vercel + Render)
- Zoho Mail is OUT (free plan not available in his region — quoted ₹3,500); email stack is ImprovMX → Gmail → Brevo SMTP, ₹0 total
- Pass numbers are first-come from the live counter (500 cap enforced in UI)
- Launch announcement: one Brevo campaign to the "CampusCode Launch List" on launch day
