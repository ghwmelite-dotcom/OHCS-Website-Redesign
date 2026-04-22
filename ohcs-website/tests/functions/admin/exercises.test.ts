import { describe, it, expect } from 'vitest';
import {
  onRequestGet,
  onRequestPost,
} from '../../../functions/api/admin/exercises/index';
import { onRequestPatch } from '../../../functions/api/admin/exercises/[id]';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'admin@ohcs.gov.gh',
  'X-Admin-User-Role': 'super_admin',
};

function ctx(req: Request, db?: D1Database, params: Record<string, string> = {}) {
  return { request: req, env: mockEnv({ db }), params, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/exercises', () => {
  it('returns the list of exercises with application counts', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT e.id, e.name, e.description, e.start_date, e.end_date, e.status, e.positions, (SELECT COUNT(*) FROM applications WHERE exercise_id = e.id) AS applications FROM recruitment_exercises e ORDER BY e.created_at DESC',
        all: {
          results: [
            {
              id: 'ex-001',
              name: '2026 Graduate Entrance Examination',
              description: null,
              start_date: '2026-03-15',
              end_date: '2026-04-30',
              status: 'active',
              positions: 24,
              applications: 1,
            },
          ],
        },
      },
    ]);
    const req = new Request('https://x/api/admin/exercises', { headers: ADMIN_HEADERS });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; applications: number }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.applications).toBe(1);
  });

  it('rejects non-admin', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/admin/exercises')));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/admin/exercises', () => {
  it('creates a new exercise with status=draft', async () => {
    const db = makeD1([
      {
        sql:
          'INSERT INTO recruitment_exercises (id, name, description, start_date, end_date, status, positions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/admin/exercises', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Exercise',
        description: 'A test',
        start_date: '2026-06-01',
        end_date: '2026-07-31',
        positions: 5,
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { id: string; status: string } };
    expect(body.data.status).toBe('draft');
    expect(body.data.id).toMatch(/^ex-/);
  });

  it('400 on missing required fields', async () => {
    const req = new Request('https://x/api/admin/exercises', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Just a name' }),
    });
    const res = await onRequestPost(ctx(req));
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/admin/exercises/[id]', () => {
  it('transitions status from draft to active and deactivates any other active exercise', async () => {
    const db = makeD1([
      {
        sql: "UPDATE recruitment_exercises SET status = 'closed', updated_at = ? WHERE status = 'active' AND id != ?",
        run: {},
      },
      {
        sql: 'UPDATE recruitment_exercises SET status = ?, updated_at = ? WHERE id = ?',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/admin/exercises/ex-003', {
      method: 'PATCH',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });
    const res = await onRequestPatch(ctx(req, db, { id: 'ex-003' }));
    expect(res.status).toBe(200);
  });

  it('400 on invalid status', async () => {
    const req = new Request('https://x/api/admin/exercises/ex-003', {
      method: 'PATCH',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'bogus' }),
    });
    const res = await onRequestPatch(ctx(req, undefined, { id: 'ex-003' }));
    expect(res.status).toBe(400);
  });
});
