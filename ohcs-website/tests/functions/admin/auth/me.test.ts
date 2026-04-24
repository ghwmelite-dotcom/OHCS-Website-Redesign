import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/admin/auth/me';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/auth/me', () => {
  it('returns 401 when no admin_session cookie', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/admin/auth/me')));
    expect(res.status).toBe(401);
  });

  it('returns the admin email + role when session is valid', async () => {
    const now = Date.now();
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
        first: {
          session_id: 'sess-abc',
          email: 'admin@ohcs.gov.gh',
          created_at: now - 1000,
          expires_at: now + 60_000,
          last_used_at: now - 500,
          role: 'super_admin',
        },
      },
      {
        sql:
          'UPDATE admin_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/admin/auth/me', {
      headers: { Cookie: 'admin_session=sess-abc' },
    });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { email: string; role: string } };
    expect(body.data.email).toBe('admin@ohcs.gov.gh');
    expect(body.data.role).toBe('super_admin');
  });
});
