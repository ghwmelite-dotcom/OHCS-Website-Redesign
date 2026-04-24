import { describe, it, expect } from 'vitest';
import { onRequestPatch, onRequestDelete } from '../../../../functions/api/admin/users/[email]';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../../_helpers/d1-mock';

const SUPER = { 'X-Admin-User-Email': 's@ohcs.gov.gh', 'X-Admin-User-Role': 'super_admin' };
const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };

function ctx(req: Request, email: string, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: { email }, waitUntil: () => {}, data: {} };
}

describe('PATCH /api/admin/users/[email]', () => {
  it('updates role', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'UPDATE admin_users SET role = COALESCE(?, role), display_name = COALESCE(?, display_name), is_active = COALESCE(?, is_active), updated_at = ? WHERE email = ?',
        run: {},
      },
      // role change cascades to existing sessions
      { sql: 'DELETE FROM admin_sessions WHERE email = ?', run: {} },
    ]);
    const res = await onRequestPatch(
      ctx(
        new Request('https://x/api/admin/users/x@ohcs.gov.gh', {
          method: 'PATCH',
          headers: { ...SUPER, 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'recruitment_admin' }),
        }),
        'x@ohcs.gov.gh',
        db,
      ),
    );
    expect(res.status).toBe(200);
  });

  it('rejects 403 for non-super_admin', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestPatch(
      ctx(
        new Request('https://x/api/admin/users/x@ohcs.gov.gh', {
          method: 'PATCH',
          headers: { ...VIEWER, 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'super_admin' }),
        }),
        'x@ohcs.gov.gh',
        db,
      ),
    );
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/admin/users/[email]', () => {
  it('soft-deletes (is_active=0) and wipes sessions', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'UPDATE admin_users SET is_active = 0, updated_at = ? WHERE email = ?',
        run: {},
      },
      { sql: 'DELETE FROM admin_sessions WHERE email = ?', run: {} },
    ]);
    const res = await onRequestDelete(
      ctx(
        new Request('https://x/api/admin/users/x@ohcs.gov.gh', {
          method: 'DELETE',
          headers: SUPER,
        }),
        'x@ohcs.gov.gh',
        db,
      ),
    );
    expect(res.status).toBe(200);
  });

  it('refuses to delete the caller themselves', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestDelete(
      ctx(
        new Request('https://x/api/admin/users/s@ohcs.gov.gh', {
          method: 'DELETE',
          headers: SUPER,
        }),
        's@ohcs.gov.gh',
        db,
      ),
    );
    expect(res.status).toBe(409);
  });
});
