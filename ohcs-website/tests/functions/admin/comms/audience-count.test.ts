import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/admin/comms/audience-count';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../../_helpers/d1-mock';

const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/comms/audience-count', () => {
  it('returns count for status filter', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT COUNT(*) AS n FROM applications WHERE exercise_id = ? AND status = ?',
        first: { n: 42 },
      },
    ]);
    const res = await onRequestGet(
      ctx(
        new Request('https://x/api/admin/comms/audience-count?exercise_id=ex-001&status=vetting_passed', {
          headers: VIEWER,
        }),
        db,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { count: number } };
    expect(body.data.count).toBe(42);
  });

  it('returns 1 for status=single (no D1 lookup needed beyond demo mode)', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql: 'SELECT COUNT(*) AS n FROM applications WHERE id = ?',
        first: { n: 1 },
      },
    ]);
    const res = await onRequestGet(
      ctx(
        new Request('https://x/api/admin/comms/audience-count?application_id=OHCS-2026-00001&status=single', {
          headers: VIEWER,
        }),
        db,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { count: number } };
    expect(body.data.count).toBe(1);
  });

  it('rejects 400 when status missing', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestGet(
      ctx(
        new Request('https://x/api/admin/comms/audience-count?exercise_id=ex-001', {
          headers: VIEWER,
        }),
        db,
      ),
    );
    expect(res.status).toBe(400);
  });
});
