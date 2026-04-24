import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/admin/site-config/index';
import { onRequestPut } from '../../../../functions/api/admin/site-config/[key]';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../../_helpers/d1-mock';

const SUPER = { 'X-Admin-User-Email': 's@ohcs.gov.gh', 'X-Admin-User-Role': 'super_admin' };
const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };

function ctx(req: Request, db?: D1Database, params: Record<string, string> = {}) {
  return { request: req, env: mockEnv({ db }), params, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/site-config', () => {
  it('returns all config rows for super_admin', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql: 'SELECT key, value, updated_at, updated_by FROM site_config ORDER BY key ASC',
        all: {
          results: [
            { key: 'admin_demo_mode_enabled', value: 'true', updated_at: 1, updated_by: null },
          ],
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/site-config', { headers: SUPER }), db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { key: string; value: string }[] };
    expect(body.data[0]?.key).toBe('admin_demo_mode_enabled');
  });

  it('rejects 403 for non-super_admin', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/site-config', { headers: VIEWER }), db),
    );
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/admin/site-config/[key]', () => {
  it('updates an existing key for super_admin', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'INSERT INTO site_config (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by',
        run: {},
      },
    ]);
    const res = await onRequestPut(
      ctx(
        new Request('https://x/api/admin/site-config/admin_demo_mode_enabled', {
          method: 'PUT',
          headers: { ...SUPER, 'content-type': 'application/json' },
          body: JSON.stringify({ value: 'false' }),
        }),
        db,
        { key: 'admin_demo_mode_enabled' },
      ),
    );
    expect(res.status).toBe(200);
  });

  it('rejects 400 when value is not a string', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestPut(
      ctx(
        new Request('https://x/api/admin/site-config/x', {
          method: 'PUT',
          headers: { ...SUPER, 'content-type': 'application/json' },
          body: JSON.stringify({ value: 123 }),
        }),
        db,
        { key: 'x' },
      ),
    );
    expect(res.status).toBe(400);
  });

  it('rejects 403 for non-super_admin', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestPut(
      ctx(
        new Request('https://x/api/admin/site-config/x', {
          method: 'PUT',
          headers: { ...VIEWER, 'content-type': 'application/json' },
          body: JSON.stringify({ value: 'y' }),
        }),
        db,
        { key: 'x' },
      ),
    );
    expect(res.status).toBe(403);
  });
});
