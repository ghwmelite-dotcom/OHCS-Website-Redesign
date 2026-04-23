import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from '../../../functions/api/applications/start';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function ctx(req: Request, db?: D1Database) {
  return {
    request: req,
    env: mockEnv({ db }),
    params: {},
    waitUntil: () => {},
    data: {},
  };
}

function startReq(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://x/api/applications/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/applications/start', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('issues a magic-link token and sends email when input is valid', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status FROM recruitment_exercises WHERE id = ?',
        binds: ['ex-001'],
        first: { status: 'active' },
      },
      {
        sql: 'SELECT COUNT(*) AS n FROM magic_link_tokens WHERE email = ? AND created_at > ?',
        first: { n: 0 },
      },
      {
        sql: 'INSERT INTO magic_link_tokens (token, email, exercise_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const res = await onRequestPost(
      ctx(startReq({ email: 'kofi@example.com', exercise_id: 'ex-001' }), db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { sent: boolean; exercise_id: string } };
    expect(body.data.sent).toBe(true);
    expect(body.data.exercise_id).toBe('ex-001');
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('returns 400 on invalid email', async () => {
    const res = await onRequestPost(ctx(startReq({ email: 'not-an-email', exercise_id: 'ex-001' })));
    expect(res.status).toBe(400);
  });

  it('returns 400 on missing exercise_id', async () => {
    const res = await onRequestPost(ctx(startReq({ email: 'kofi@example.com' })));
    expect(res.status).toBe(400);
  });

  it('returns 404 when exercise does not exist', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status FROM recruitment_exercises WHERE id = ?',
        binds: ['ex-ghost'],
      },
    ]);
    const res = await onRequestPost(
      ctx(startReq({ email: 'kofi@example.com', exercise_id: 'ex-ghost' }), db),
    );
    expect(res.status).toBe(404);
  });

  it('returns 429 when the per-email rate limit is exceeded', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status FROM recruitment_exercises WHERE id = ?',
        binds: ['ex-001'],
        first: { status: 'active' },
      },
      {
        sql: 'SELECT COUNT(*) AS n FROM magic_link_tokens WHERE email = ? AND created_at > ?',
        first: { n: 3 },
      },
    ]);
    const res = await onRequestPost(
      ctx(startReq({ email: 'kofi@example.com', exercise_id: 'ex-001' }), db),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('returns 409 when exercise is not active', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status FROM recruitment_exercises WHERE id = ?',
        binds: ['ex-002'],
        first: { status: 'completed' },
      },
    ]);
    const res = await onRequestPost(
      ctx(startReq({ email: 'kofi@example.com', exercise_id: 'ex-002' }), db),
    );
    expect(res.status).toBe(409);
  });
});
