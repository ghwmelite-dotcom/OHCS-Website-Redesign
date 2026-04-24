//
// Consumes an admin magic-link token. Hashes the inbound raw token,
// looks up by hash, marks used, creates an admin_sessions row, sets
// the cookie, redirects to /admin.

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { first, run } from '../../../../_shared/db';
import { hashToken } from '../../../../_shared/hash-token';
import { createAdminSession, ADMIN_SESSION_TTL_MS } from '../../../../_shared/admin-session';
import { buildSetAdminSessionCookie } from '../../../../_shared/admin-cookies';

interface TokenRow {
  token: string;
  email: string;
  created_at: number;
  expires_at: number;
  used_at: number | null;
  ip_address: string | null;
}

export const onRequestGet: PagesFunction<Env, 'token'> = async ({ request, env, params }) => {
  const tokenHash = await hashToken(params.token);
  const tokenRow = await first<TokenRow>(
    env,
    'SELECT * FROM admin_magic_tokens WHERE token = ?',
    tokenHash,
  );
  if (!tokenRow) return json({ error: 'token not found' }, { status: 404 });

  const now = Date.now();
  if (tokenRow.used_at) return json({ error: 'token already used' }, { status: 410 });
  if (tokenRow.expires_at <= now) return json({ error: 'token expired' }, { status: 410 });

  const ipAddress = request.headers.get('cf-connecting-ip') ?? null;
  const sessionId = await createAdminSession(env, {
    email: tokenRow.email,
    ipAddress,
  });

  await run(env, 'UPDATE admin_magic_tokens SET used_at = ? WHERE token = ?', now, tokenHash);
  await run(env, 'UPDATE admin_users SET last_login_at = ? WHERE email = ?', now, tokenRow.email);

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin',
      'Set-Cookie': buildSetAdminSessionCookie(sessionId, ADMIN_SESSION_TTL_MS / 1000),
    },
  });
};
