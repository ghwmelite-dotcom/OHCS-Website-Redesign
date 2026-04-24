import type { Env } from './types';
import { first, run } from './db';

export const ADMIN_SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4h sliding
export const ADMIN_SESSION_HARD_CAP_MS = 7 * 24 * 60 * 60 * 1000; // 7d total

export interface AdminSessionRow {
  sessionId: string;
  email: string;
  role: string;
  createdAt: number;
  expiresAt: number;
  lastUsedAt: number;
}

function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function createAdminSession(
  env: Env,
  input: { email: string; ipAddress?: string | null },
): Promise<string> {
  const id = generateSessionId();
  const now = Date.now();
  await run(
    env,
    'INSERT INTO admin_sessions (session_id, email, created_at, expires_at, last_used_at, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    input.email,
    now,
    now + ADMIN_SESSION_TTL_MS,
    now,
    input.ipAddress ?? null,
  );
  return id;
}

interface JoinedSessionRow {
  session_id: string;
  email: string;
  created_at: number;
  expires_at: number;
  last_used_at: number;
  role: string;
}

export async function readAdminSession(
  env: Env,
  sessionId: string,
): Promise<AdminSessionRow | null> {
  const now = Date.now();
  const row = await first<JoinedSessionRow>(
    env,
    'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
    sessionId,
    now,
  );
  if (!row) return null;

  // Hard cap: if more than 7 days since creation, force re-login.
  if (now - row.created_at > ADMIN_SESSION_HARD_CAP_MS) {
    await run(env, 'DELETE FROM admin_sessions WHERE session_id = ?', sessionId);
    return null;
  }

  // Slide: extend expires_at by 4h from now, update last_used_at.
  const newExpires = now + ADMIN_SESSION_TTL_MS;
  await run(
    env,
    'UPDATE admin_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
    now,
    newExpires,
    sessionId,
  );

  return {
    sessionId: row.session_id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    expiresAt: newExpires,
    lastUsedAt: now,
  };
}

export async function deleteAdminSession(
  env: Env,
  sessionId: string,
): Promise<void> {
  await run(env, 'DELETE FROM admin_sessions WHERE session_id = ?', sessionId);
}

export async function deleteAllSessionsForEmail(
  env: Env,
  email: string,
): Promise<void> {
  await run(env, 'DELETE FROM admin_sessions WHERE email = ?', email);
}
