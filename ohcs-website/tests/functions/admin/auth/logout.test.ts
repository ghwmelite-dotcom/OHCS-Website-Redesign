import { describe, it, expect } from 'vitest';
import { onRequestPost } from '../../../../functions/api/admin/auth/logout';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('POST /api/admin/auth/logout', () => {
  it('deletes the session row + clears cookie when authenticated', async () => {
    const db = makeD1([
      { sql: 'DELETE FROM admin_sessions WHERE session_id = ?', run: {} },
    ]);
    const req = new Request('https://x/api/admin/auth/logout', {
      method: 'POST',
      headers: { Cookie: 'admin_session=sess-abc' },
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toContain('admin_session=;');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('returns 200 even with no session cookie (idempotent)', async () => {
    const req = new Request('https://x/api/admin/auth/logout', { method: 'POST' });
    const res = await onRequestPost(ctx(req));
    expect(res.status).toBe(200);
  });
});
