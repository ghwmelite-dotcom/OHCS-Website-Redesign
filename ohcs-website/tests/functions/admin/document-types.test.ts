import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../functions/api/admin/document-types/index';
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

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'admin@ohcs.gov.gh',
  'X-Admin-User-Role': 'super_admin',
};

describe('GET /api/admin/document-types', () => {
  it('returns the active master library', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM document_types ORDER BY label',
        all: {
          results: [
            {
              id: 'national_id',
              label: 'National ID (Ghana Card)',
              description: null,
              default_max_mb: 5,
              accepted_mimes: '["application/pdf","image/jpeg","image/png"]',
              ai_check_type: 'identity',
              is_active: 1,
              created_at: 1,
              updated_at: 1,
            },
          ],
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/document-types', { headers: ADMIN_HEADERS }), db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; accepted_mimes: string[]; is_active: boolean }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.id).toBe('national_id');
    expect(body.data[0]!.accepted_mimes).toEqual(['application/pdf', 'image/jpeg', 'image/png']);
    expect(body.data[0]!.is_active).toBe(true);
  });

  it('rejects without admin headers', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/admin/document-types')));
    expect(res.status).toBe(401);
  });

  it('rejects with viewer role', async () => {
    const headers = { 'X-Admin-User-Email': 'v@x.gh', 'X-Admin-User-Role': 'viewer' };
    const res = await onRequestGet(ctx(new Request('https://x/api/admin/document-types', { headers })));
    expect(res.status).toBe(403);
  });
});

describe('POST /api/admin/document-types', () => {
  it('creates a new document type', async () => {
    const db = makeD1([
      {
        // `binds` omitted → wildcard match (impl uses Date.now() so we cannot predict binds).
        sql:
          'INSERT INTO document_types (id, label, description, default_max_mb, accepted_mimes, ai_check_type, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
        run: { meta: { changes: 1 } },
      },
    ]);

    const req = new Request('https://x/api/admin/document-types', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'custom_letter',
        label: 'Endorsement Letter',
        description: 'Required for senior roles only',
        default_max_mb: 3,
        accepted_mimes: ['application/pdf'],
        ai_check_type: null,
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { id: string } };
    expect(body.data.id).toBe('custom_letter');
  });

  it('rejects invalid payload', async () => {
    const req = new Request('https://x/api/admin/document-types', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({ label: '', default_max_mb: -1 }),
    });
    const res = await onRequestPost(ctx(req));
    expect(res.status).toBe(400);
  });
});
