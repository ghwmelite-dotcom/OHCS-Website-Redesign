import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/admin/applications/index';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'admin@ohcs.gov.gh',
  'X-Admin-User-Role': 'super_admin',
};

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/applications', () => {
  it('returns the queue with default filters (no params)', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT a.id, a.exercise_id, a.email, a.status, a.submitted_at, a.review_claimed_by, (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id) AS doc_count, (SELECT COUNT(*) FROM exercise_document_requirements WHERE exercise_id = a.exercise_id AND is_required = 1) AS doc_required_count, (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id AND ai_verdict = ?) AS ai_flag_count FROM applications a WHERE a.status != ? ORDER BY a.submitted_at DESC LIMIT 50',
        binds: ['flagged', 'draft'],
        all: {
          results: [
            {
              id: 'OHCS-2026-00001',
              exercise_id: 'ex-001',
              email: 'kofi@example.com',
              status: 'submitted',
              submitted_at: 1,
              review_claimed_by: null,
              doc_count: 4,
              doc_required_count: 3,
              ai_flag_count: 0,
            },
          ],
        },
      },
    ]);
    const req = new Request('https://x/api/admin/applications', { headers: ADMIN_HEADERS });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.id).toBe('OHCS-2026-00001');
  });

  it('rejects without admin role', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/admin/applications')));
    expect(res.status).toBe(401);
  });
});
