import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/admin/applications/appeals';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'reviewer-b@ohcs.gov.gh',
  'X-Admin-User-Role': 'recruitment_admin',
};

const APPEALS_SQL =
  'SELECT a.id, a.exercise_id, a.email, a.status, a.submitted_at, a.appeal_submitted_at FROM applications a WHERE a.status = ? AND NOT EXISTS (SELECT 1 FROM application_review_decisions ard WHERE ard.application_id = a.id AND ard.reviewer_email = ? AND ard.created_at = (SELECT MAX(created_at) FROM application_review_decisions WHERE application_id = a.id)) ORDER BY a.appeal_submitted_at ASC';

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/applications/appeals', () => {
  it('returns appeals filtered to exclude self-as-latest-reviewer (the SQL fix)', async () => {
    const db = makeD1([
      { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } },
      {
        sql: APPEALS_SQL,
        binds: ['appeal_under_review', 'reviewer-b@ohcs.gov.gh'],
        all: {
          results: [
            {
              id: 'OHCS-2026-00010',
              exercise_id: 'ex-001',
              email: 'a@example.com',
              status: 'appeal_under_review',
              submitted_at: 1,
              appeal_submitted_at: 2,
            },
          ],
        },
      },
    ]);
    const req = new Request('https://x/api/admin/applications/appeals', {
      headers: ADMIN_HEADERS,
    });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string }[] };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]?.id).toBe('OHCS-2026-00010');
  });

  it('rejects 403 when caller is not recruitment_admin or super_admin', async () => {
    const db = makeD1([
      { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } },
    ]);
    const req = new Request('https://x/api/admin/applications/appeals', {
      headers: { 'X-Admin-User-Email': 'r@x', 'X-Admin-User-Role': 'reviewer' },
    });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(403);
  });

  it('returns 401 when admin headers are missing', async () => {
    const req = new Request('https://x/api/admin/applications/appeals');
    const res = await onRequestGet(ctx(req));
    expect(res.status).toBe(401);
  });
});
