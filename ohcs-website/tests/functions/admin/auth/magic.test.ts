import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/admin/auth/magic/[token]';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

function ctx(req: Request, token: string, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: { token }, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/auth/magic/[token]', () => {
  it('consumes valid token, creates session, sets cookie, redirects to /admin', async () => {
    const now = Date.now();
    const db = makeD1([
      {
        sql: 'SELECT * FROM admin_magic_tokens WHERE token = ?',
        first: {
          token: 'hash-of-real-token',
          email: 'admin@ohcs.gov.gh',
          created_at: now - 1000,
          expires_at: now + 60_000,
          used_at: null,
          ip_address: '1.2.3.4',
        },
      },
      {
        sql:
          'INSERT INTO admin_sessions (session_id, email, created_at, expires_at, last_used_at, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql: 'UPDATE admin_magic_tokens SET used_at = ? WHERE token = ?',
        run: {},
      },
      {
        sql: 'UPDATE admin_users SET last_login_at = ? WHERE email = ?',
        run: {},
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/auth/magic/raw-token'), 'raw-token', db),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/admin');
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toMatch(/^admin_session=[^;]+;/);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
  });

  it('returns 404 when token unknown', async () => {
    const db = makeD1([
      { sql: 'SELECT * FROM admin_magic_tokens WHERE token = ?' },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/auth/magic/ghost'), 'ghost', db),
    );
    expect(res.status).toBe(404);
  });

  it('returns 410 when token expired', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM admin_magic_tokens WHERE token = ?',
        first: {
          token: 'h',
          email: 'admin@ohcs.gov.gh',
          created_at: 0,
          expires_at: 1,
          used_at: null,
          ip_address: null,
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/auth/magic/expired'), 'expired', db),
    );
    expect(res.status).toBe(410);
  });

  it('returns 410 when token already used', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM admin_magic_tokens WHERE token = ?',
        first: {
          token: 'h',
          email: 'admin@ohcs.gov.gh',
          created_at: 0,
          expires_at: Date.now() + 60_000,
          used_at: Date.now() - 1000,
          ip_address: null,
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/auth/magic/used'), 'used', db),
    );
    expect(res.status).toBe(410);
  });
});
