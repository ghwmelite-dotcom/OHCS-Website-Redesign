import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/applications/magic/[token]';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function ctx(req: Request, token: string, db?: D1Database) {
  return {
    request: req,
    env: mockEnv({ db }),
    params: { token },
    waitUntil: () => {},
    data: {},
  };
}

describe('GET /api/applications/magic/[token]', () => {
  it('consumes a valid token, creates an application + session, sets cookie, redirects', async () => {
    const now = Date.now();
    const db = makeD1([
      {
        sql: 'SELECT * FROM magic_link_tokens WHERE token = ?',
        first: {
          token: 'valid-token',
          email: 'kofi@example.com',
          exercise_id: 'ex-001',
          application_id: null,
          created_at: now - 1000,
          expires_at: now + 60_000,
          used_at: null,
        },
      },
      // Reference number generation
      { sql: 'INSERT OR IGNORE INTO sequences (key, last) VALUES (?, 0)', run: {} },
      {
        sql: 'UPDATE sequences SET last = last + 1 WHERE key = ? RETURNING last',
        first: { last: 1 },
      },
      // Application upsert (create-or-get for this email+exercise)
      { sql: 'SELECT id FROM applications WHERE exercise_id = ? AND email = ?' },
      {
        sql:
          'INSERT INTO applications (id, exercise_id, email, status, form_data, created_at, last_saved_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      // Session create
      {
        sql:
          'INSERT INTO application_sessions (session_id, application_id, created_at, expires_at, last_used_at) VALUES (?, ?, ?, ?, ?)',
        run: {},
      },
      // Mark token used + bind application_id
      {
        sql: 'UPDATE magic_link_tokens SET used_at = ?, application_id = ? WHERE token = ?',
        run: {},
      },
    ]);

    const res = await onRequestGet(
      ctx(new Request('https://ohcs.pages.dev/api/applications/magic/valid-token'), 'valid-token', db),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/apply/form/?step=1');
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toMatch(/^session_id=[^;]+;/);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
  });

  it('reuses an existing application for the same email + exercise', async () => {
    const now = Date.now();
    const db = makeD1([
      {
        sql: 'SELECT * FROM magic_link_tokens WHERE token = ?',
        first: {
          token: 'valid-token-2',
          email: 'kofi@example.com',
          exercise_id: 'ex-001',
          application_id: null,
          created_at: now - 1000,
          expires_at: now + 60_000,
          used_at: null,
        },
      },
      {
        sql: 'SELECT id FROM applications WHERE exercise_id = ? AND email = ?',
        first: { id: 'OHCS-2026-00001' },
      },
      {
        sql:
          'INSERT INTO application_sessions (session_id, application_id, created_at, expires_at, last_used_at) VALUES (?, ?, ?, ?, ?)',
        run: {},
      },
      { sql: 'UPDATE magic_link_tokens SET used_at = ?, application_id = ? WHERE token = ?', run: {} },
    ]);

    const res = await onRequestGet(
      ctx(new Request('https://x/api/applications/magic/valid-token-2'), 'valid-token-2', db),
    );
    expect(res.status).toBe(302);
  });

  it('returns 410 when token is expired', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM magic_link_tokens WHERE token = ?',
        first: {
          token: 'expired',
          email: 'kofi@example.com',
          exercise_id: 'ex-001',
          application_id: null,
          created_at: 0,
          expires_at: 1,
          used_at: null,
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/applications/magic/expired'), 'expired', db),
    );
    expect(res.status).toBe(410);
  });

  it('returns 410 when token already used', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM magic_link_tokens WHERE token = ?',
        first: {
          token: 'used',
          email: 'k@x',
          exercise_id: 'ex-001',
          application_id: 'OHCS-2026-00001',
          created_at: 0,
          expires_at: Date.now() + 60_000,
          used_at: 1,
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/applications/magic/used'), 'used', db),
    );
    expect(res.status).toBe(410);
  });

  it('returns 404 when token does not exist', async () => {
    const db = makeD1([
      { sql: 'SELECT * FROM magic_link_tokens WHERE token = ?' },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/applications/magic/ghost'), 'ghost', db),
    );
    expect(res.status).toBe(404);
  });
});
