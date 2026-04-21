# Email Setup (MailChannels) for OHCS Recruitment

The recruitment system sends transactional email (magic links, status
notifications) via Cloudflare's free MailChannels integration. For the
sender domain `ohcs.gov.gh` to be accepted by MailChannels and not
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
