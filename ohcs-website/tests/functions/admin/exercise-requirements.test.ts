import { describe, it, expect } from 'vitest';
import {
  onRequestGet,
  onRequestPut,
} from '../../../functions/api/admin/exercises/[id]/requirements';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'admin@ohcs.gov.gh',
  'X-Admin-User-Role': 'super_admin',
};

function ctx(req: Request, db?: D1Database) {
  return {
    request: req,
    env: mockEnv({ db }),
    params: { id: 'ex-001' },
    waitUntil: () => {},
    data: {},
  };
}

describe('GET /api/admin/exercises/[id]/requirements', () => {
  it('returns the ordered requirements list for an exercise', async () => {
    const db = makeD1([
      { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } },
      {
        sql:
          'SELECT * FROM exercise_document_requirements WHERE exercise_id = ? ORDER BY display_order ASC',
        binds: ['ex-001'],
        all: {
          results: [
            {
              id: 'r1',
              exercise_id: 'ex-001',
              document_type_id: 'national_id',
              is_required: 1,
              conditional_on: null,
              display_order: 0,
              max_mb_override: null,
              created_at: 1,
              updated_at: 1,
            },
          ],
        },
      },
    ]);
    const req = new Request('https://x/api/admin/exercises/ex-001/requirements', { headers: ADMIN_HEADERS });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ document_type_id: string; is_required: boolean }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.document_type_id).toBe('national_id');
    expect(body.data[0]!.is_required).toBe(true);
  });

  it('rejects non-admin', async () => {
    const req = new Request('https://x/api/admin/exercises/ex-001/requirements');
    const res = await onRequestGet(ctx(req));
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/exercises/[id]/requirements', () => {
  it('replaces the full list (validates input shape)', async () => {
    const db = makeD1([
      { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } },
      {
        sql: 'DELETE FROM exercise_document_requirements WHERE exercise_id = ?',
        binds: ['ex-001'],
        run: {},
      },
      {
        // binds omitted = wildcard for the per-row INSERT
        sql:
          'INSERT INTO exercise_document_requirements (id, exercise_id, document_type_id, is_required, conditional_on, display_order, max_mb_override, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
    ]);

    const req = new Request('https://x/api/admin/exercises/ex-001/requirements', {
      method: 'PUT',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        requirements: [
          {
            document_type_id: 'national_id',
            is_required: true,
            conditional_on: null,
            display_order: 0,
            max_mb_override: null,
          },
          {
            document_type_id: 'professional_cert',
            is_required: true,
            conditional_on: 'has_professional_qualification',
            display_order: 1,
            max_mb_override: null,
          },
        ],
      }),
    });
    const res = await onRequestPut(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { count: number } };
    expect(body.data.count).toBe(2);
  });

  it('400 on invalid conditional_on value', async () => {
    const db = makeD1([
      { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } },
    ]);
    const req = new Request('https://x/api/admin/exercises/ex-001/requirements', {
      method: 'PUT',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        requirements: [
          {
            document_type_id: 'national_id',
            is_required: true,
            conditional_on: 'something_invalid',
            display_order: 0,
            max_mb_override: null,
          },
        ],
      }),
    });
    const res = await onRequestPut(ctx(req, db));
    expect(res.status).toBe(400);
  });

  it('400 on duplicate document_type_id within the request', async () => {
    const db = makeD1([
      { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } },
    ]);
    const req = new Request('https://x/api/admin/exercises/ex-001/requirements', {
      method: 'PUT',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        requirements: [
          { document_type_id: 'national_id', is_required: true, conditional_on: null, display_order: 0, max_mb_override: null },
          { document_type_id: 'national_id', is_required: false, conditional_on: null, display_order: 1, max_mb_override: null },
        ],
      }),
    });
    const res = await onRequestPut(ctx(req, db));
    expect(res.status).toBe(400);
  });
});
