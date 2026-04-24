//
// SECURITY: see functions/_shared/admin-auth.ts header.
// Issues a magic-link admin sign-in. SHA-256 hashed tokens, 15-min TTL,
// per-email rate limit (3 in rolling 15 min). Returns 200 even when the
// email is not in the allowlist — prevents enumeration.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseBody } from '../../../_shared/validate';
import { first, run } from '../../../_shared/db';
import { sendEmail } from '../../../_shared/email';
import { hashToken } from '../../../_shared/hash-token';
import { adminMagicLinkEmail } from '../../../_shared/admin-magic-link-email';
import { z } from 'zod';

const TOKEN_TTL_MS = 15 * 60 * 1000;
const TOKEN_TTL_MIN = 15;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

const Body = z.object({
  email: z.string().email().toLowerCase(),
});

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;
  const { email } = parsed.value;
  const now = Date.now();

  const admin = await first<{ email: string }>(
    env,
    'SELECT email FROM admin_users WHERE email = ? AND is_active = 1',
    email,
  );
  if (!admin) {
    return json({ data: { sent: true } });
  }

  const recent = await first<{ n: number }>(
    env,
    'SELECT COUNT(*) AS n FROM admin_magic_tokens WHERE email = ? AND created_at > ?',
    email,
    now - RATE_LIMIT_WINDOW_MS,
  );
  if (recent && recent.n >= RATE_LIMIT_MAX) {
    return json(
      { error: 'too many sign-in requests; please try again later' },
      { status: 429, headers: { 'retry-after': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) } },
    );
  }

  const token = generateToken();
  const tokenHash = await hashToken(token);
  const ipAddress = request.headers.get('cf-connecting-ip') ?? null;

  await run(
    env,
    'INSERT INTO admin_magic_tokens (token, email, created_at, expires_at, ip_address) VALUES (?, ?, ?, ?, ?)',
    tokenHash,
    email,
    now,
    now + TOKEN_TTL_MS,
    ipAddress,
  );

  const origin = new URL(request.url).origin;
  const resumeUrl = `${origin}/api/admin/auth/magic/${encodeURIComponent(token)}`;
  const body = adminMagicLinkEmail(resumeUrl, TOKEN_TTL_MIN);

  try {
    await sendEmail(env, { to: email, subject: body.subject, html: body.html, text: body.text });
  } catch (err) {
    console.error('admin magic link email failed', err);
    return json({ error: 'email send failed' }, { status: 502 });
  }

  return json({ data: { sent: true } });
};
