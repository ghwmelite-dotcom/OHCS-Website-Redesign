import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/applications/track';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function ctx(url: string, db?: D1Database) {
  return {
    request: new Request(url),
    env: mockEnv({ db }),
    params: {},
    waitUntil: () => {},
    data: {},
  };
}

describe('GET /api/applications/track', () => {
  it('returns public status when ref + email match', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT id, exercise_id, status, submitted_at, created_at FROM applications WHERE id = ? AND email = ?',
        binds: ['OHCS-2026-00001', 'kofi@example.com'],
        first: {
          id: 'OHCS-2026-00001',
          exercise_id: 'ex-001',
          status: 'submitted',
          submitted_at: 1,
          created_at: 0,
        },
      },
    ]);
    const res = await onRequestGet(
      ctx('https://x/api/applications/track?ref=OHCS-2026-00001&email=kofi@example.com', db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { reference_number: string; status: string } };
    expect(body.data.reference_number).toBe('OHCS-2026-00001');
    expect(body.data.status).toBe('submitted');
  });

  it('returns 404 when no application matches', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT id, exercise_id, status, submitted_at, created_at FROM applications WHERE id = ? AND email = ?',
        binds: ['OHCS-2026-99999', 'ghost@example.com'],
      },
    ]);
    const res = await onRequestGet(
      ctx('https://x/api/applications/track?ref=OHCS-2026-99999&email=ghost@example.com', db),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when ref or email missing', async () => {
    const res = await onRequestGet(ctx('https://x/api/applications/track?ref=OHCS-2026-00001'));
    expect(res.status).toBe(400);
  });
});
