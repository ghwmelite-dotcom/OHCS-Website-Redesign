import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from '../../../../functions/api/admin/auth/start';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

function startReq(body: unknown): Request {
  return new Request('https://x/api/admin/auth/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/auth/start', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('issues a hashed token and sends email when admin exists', async () => {
    const db = makeD1([
      {
        sql: 'SELECT email FROM admin_users WHERE email = ? AND is_active = 1',
        first: { email: 'admin@ohcs.gov.gh' },
      },
      {
        sql:
          'SELECT COUNT(*) AS n FROM admin_magic_tokens WHERE email = ? AND created_at > ?',
        first: { n: 0 },
      },
      {
        sql:
          'INSERT INTO admin_magic_tokens (token, email, created_at, expires_at, ip_address) VALUES (?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const res = await onRequestPost(ctx(startReq({ email: 'admin@ohcs.gov.gh' }), db));
    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('returns 200 (NOT 404) when email is not in allowlist (no enumeration leak)', async () => {
    const db = makeD1([
      {
        sql: 'SELECT email FROM admin_users WHERE email = ? AND is_active = 1',
      },
    ]);
    const res = await onRequestPost(ctx(startReq({ email: 'attacker@example.com' }), db));
    expect(res.status).toBe(200);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limit exceeded (3 in 15 minutes)', async () => {
    const db = makeD1([
      {
        sql: 'SELECT email FROM admin_users WHERE email = ? AND is_active = 1',
        first: { email: 'admin@ohcs.gov.gh' },
      },
      {
        sql:
          'SELECT COUNT(*) AS n FROM admin_magic_tokens WHERE email = ? AND created_at > ?',
        first: { n: 3 },
      },
    ]);
    const res = await onRequestPost(ctx(startReq({ email: 'admin@ohcs.gov.gh' }), db));
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('returns 400 on invalid email', async () => {
    const res = await onRequestPost(ctx(startReq({ email: 'not-an-email' })));
    expect(res.status).toBe(400);
  });
});
