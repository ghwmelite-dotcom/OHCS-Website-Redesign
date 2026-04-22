import { describe, it, expect } from 'vitest';
import { onRequestPost } from '../../../functions/api/applications/me/logout';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('POST /api/applications/me/logout', () => {
  it('deletes the session row and returns a clear-cookie header', async () => {
    const db = makeD1([
      { sql: 'DELETE FROM application_sessions WHERE session_id = ?', binds: ['sess-abc'], run: {} },
    ]);
    const req = new Request('https://x/api/applications/me/logout', {
      method: 'POST',
      headers: { Cookie: 'session_id=sess-abc' },
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toMatch(/^session_id=;/);
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });

  it('still returns 200 even when no cookie is present (idempotent)', async () => {
    const res = await onRequestPost(
      ctx(new Request('https://x/api/applications/me/logout', { method: 'POST' })),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });
});
