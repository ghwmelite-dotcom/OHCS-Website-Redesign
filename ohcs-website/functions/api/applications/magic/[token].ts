import type { PagesFunction, Env } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { first, run } from '../../../_shared/db';
import { buildSetSessionCookie } from '../../../_shared/cookies';
import { generateReference } from '../../../_shared/reference-number';
import { hashToken } from '../../../_shared/hash-token';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

interface TokenRow {
  token: string;
  email: string;
  exercise_id: string;
  application_id: string | null;
  created_at: number;
  expires_at: number;
  used_at: number | null;
}

function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const onRequestGet: PagesFunction<Env, 'token'> = async ({ env, params }) => {
  // Tokens are stored hashed at rest; hash the inbound value before lookup.
  const tokenHash = await hashToken(params.token);
  const tokenRow = await first<TokenRow>(
    env,
    'SELECT * FROM magic_link_tokens WHERE token = ?',
    tokenHash,
  );

  if (!tokenRow) return json({ error: 'token not found' }, { status: 404 });

  const now = Date.now();
  if (tokenRow.used_at) return json({ error: 'token already used' }, { status: 410 });
  if (tokenRow.expires_at <= now) return json({ error: 'token expired' }, { status: 410 });

  // Find existing application or create one
  let applicationId: string;
  const existing = await first<{ id: string }>(
    env,
    'SELECT id FROM applications WHERE exercise_id = ? AND email = ?',
    tokenRow.exercise_id,
    tokenRow.email,
  );

  if (existing) {
    applicationId = existing.id;
  } else {
    const year = new Date(now).getFullYear();
    applicationId = await generateReference(env, tokenRow.exercise_id, year);
    await run(
      env,
      'INSERT INTO applications (id, exercise_id, email, status, form_data, created_at, last_saved_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      applicationId,
      tokenRow.exercise_id,
      tokenRow.email,
      'draft',
      '{}',
      now,
      now,
    );
  }

  // Create session
  const sessionId = generateSessionId();
  const sessionExpires = now + SESSION_TTL_SECONDS * 1000;
  await run(
    env,
    'INSERT INTO application_sessions (session_id, application_id, created_at, expires_at, last_used_at) VALUES (?, ?, ?, ?, ?)',
    sessionId,
    applicationId,
    now,
    sessionExpires,
    now,
  );

  // Mark token used + bind application_id
  await run(
    env,
    'UPDATE magic_link_tokens SET used_at = ?, application_id = ? WHERE token = ?',
    now,
    applicationId,
    tokenHash,
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/apply/form/?step=1',
      'Set-Cookie': buildSetSessionCookie(sessionId, SESSION_TTL_SECONDS),
    },
  });
};
