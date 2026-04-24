import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../../functions/api/admin/users/index';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../../_helpers/d1-mock';

const SUPER = { 'X-Admin-User-Email': 's@ohcs.gov.gh', 'X-Admin-User-Role': 'super_admin' };
const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/users', () => {
  it('lists admins for super_admin', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT email, role, display_name, is_active, created_at, last_login_at FROM admin_users ORDER BY created_at ASC',
        all: {
          results: [
            {
              email: 's@ohcs.gov.gh',
              role: 'super_admin',
              display_name: 'Bootstrap',
              is_active: 1,
              created_at: 1,
              last_login_at: 2,
            },
          ],
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/users', { headers: SUPER }), db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { email: string }[] };
    expect(body.data).toHaveLength(1);
  });

  it('returns 403 for non-super_admin', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/users', { headers: VIEWER }), db),
    );
    expect(res.status).toBe(403);
  });
});

describe('POST /api/admin/users', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('creates a new admin and sends them a welcome magic link', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'INSERT INTO admin_users (email, role, display_name, is_active, created_at, created_by, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'INSERT INTO admin_magic_tokens (token, email, created_at, expires_at, ip_address) VALUES (?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/users', {
          method: 'POST',
          headers: { ...SUPER, 'content-type': 'application/json' },
          body: JSON.stringify({
            email: 'new@ohcs.gov.gh',
            role: 'recruitment_admin',
            display_name: 'New Admin',
          }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(201);
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('rejects 400 when role is invalid', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/users', {
          method: 'POST',
          headers: { ...SUPER, 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'x@ohcs.gov.gh', role: 'god_mode' }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(400);
  });

  it('rejects 403 for non-super_admin', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/users', {
          method: 'POST',
          headers: { ...VIEWER, 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'x@ohcs.gov.gh', role: 'viewer' }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(403);
  });
});
