# Email Setup for OHCS Recruitment

The recruitment system sends transactional email (magic links, status
notifications). It supports two transports:

- **MailChannels** (free via Cloudflare, requires DNS setup on the
  sending domain — production target)
- **Resend** (free tier, sandbox sender works without DNS — current
  preview/dev configuration)

Selection is via the `EMAIL_PROVIDER` env var in `wrangler.toml`:
`'auto'` (default — MailChannels primary, Resend fallback),
`'resend'` (Resend only, skips MailChannels), or `'mailchannels'`
(MailChannels only, no fallback).

---

## Current state (preview / pre-launch)

`wrangler.toml` is set to:

    EMAIL_FROM = "onboarding@resend.dev"
    EMAIL_FROM_NAME = "OHCS Recruitment (Test)"
    EMAIL_PROVIDER = "resend"

`RESEND_API_KEY` is stored as a Cloudflare Pages secret. To rotate or
re-set:

    npx wrangler pages secret put RESEND_API_KEY --project-name=ohcs

**Limitation of the Resend sandbox sender:** Resend only delivers mail
from `onboarding@resend.dev` to email addresses that are verified on
the Resend account. To add OHCS staff for testing, log in at
https://resend.com/emails and verify their addresses individually.

A manual smoke-test endpoint exists at
`POST /api/admin/dev/test-email` (admin-gated) — useful for confirming
the pipeline works without waiting for the magic-link UI:

    curl -X POST \
      -H "X-Admin-User-Email: admin@ohcs.gov.gh" \
      -H "X-Admin-User-Role: super_admin" \
      -H "content-type: application/json" \
      -d '{"to":"you@example.com"}' \
      https://ohcs.pages.dev/api/admin/dev/test-email

---

## Switching to ohcs.gov.gh (production)

When the OHCS infra team has provisioned DNS on `ohcs.gov.gh`, switch
to either Resend-with-custom-domain (simpler) or MailChannels (free
via Cloudflare).

### Path A: Resend with custom domain (recommended)

1. Add `ohcs.gov.gh` at https://resend.com/domains
2. Resend gives 3 TXT records — paste them into the `ohcs.gov.gh` DNS
   zone (DKIM signing key, return-path CNAME, optional DMARC)
3. Wait 5-60 minutes for verification to flip to "Verified"
4. In `wrangler.toml`:

       EMAIL_FROM = "noreply@ohcs.gov.gh"
       EMAIL_FROM_NAME = "OHCS Recruitment"
       EMAIL_PROVIDER = "resend"

5. Redeploy. Send to any recipient now works.

### Path B: MailChannels (free, requires more DNS)

For the sender domain `ohcs.gov.gh` to be accepted by MailChannels and not
rejected as spam by recipients, the following DNS records must exist
on the `ohcs.gov.gh` zone.

## 1. SPF record

Add or update the TXT record at the apex `ohcs.gov.gh`:

    v=spf1 a mx include:relay.mailchannels.net ~all

If an SPF record already exists, append `include:relay.mailchannels.net`
into the existing record — do NOT publish two SPF records (RFC 7208
forbids it).

## 2. Domain Lockdown (MailChannels-specific)

To prevent other Cloudflare accounts from sending mail as
`@ohcs.gov.gh`, add this TXT record at `_mailchannels.ohcs.gov.gh`:

    v=mc1 cfid=ohcs.pages.dev

Replace `ohcs.pages.dev` with the actual production hostname if it
ever differs. This is REQUIRED — MailChannels began enforcing it
in 2024.

## 3. DKIM (recommended, not strictly required)

Generate a 2048-bit DKIM keypair (any tool — e.g. `opendkim-genkey`).
Publish the public key as TXT at `mailchannels._domainkey.ohcs.gov.gh`,
and store the private key as a Cloudflare Pages secret named
`DKIM_PRIVATE_KEY` (we will wire this into the email helper in a
future patch).

## Verification

After the DNS records propagate (5–60 minutes), confirm with:

    dig +short TXT ohcs.gov.gh                          # should include relay.mailchannels.net
    dig +short TXT _mailchannels.ohcs.gov.gh            # should include cfid=ohcs.pages.dev

A round-trip test will live at `/admin/recruitment/health` once Phase 6
ships. Until then, MailChannels delivery can be confirmed manually by
sending a test message via the helper (see `functions/_shared/email.ts`).

## Fallback: Resend

If MailChannels rejects the domain (e.g. shared-IP reputation issues),
sign up for Resend (https://resend.com), get an API key, and set it in
Cloudflare Pages env vars as `RESEND_API_KEY`. The email helper
auto-falls back when this var is set and MailChannels returns 4xx/5xx.
