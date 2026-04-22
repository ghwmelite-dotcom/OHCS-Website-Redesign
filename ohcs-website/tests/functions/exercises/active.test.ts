import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/exercises/active';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function ctx(db?: D1Database) {
  return {
    request: new Request('https://x/api/exercises/active'),
    env: mockEnv({ db }),
    params: {},
    waitUntil: () => {},
    data: {},
  };
}

describe('GET /api/exercises/active', () => {
  it('returns the current active exercise', async () => {
    const db = makeD1([
      {
        sql:
          "SELECT id, name, description, start_date, end_date, status, positions FROM recruitment_exercises WHERE status = 'active' LIMIT 1",
        first: {
          id: 'ex-001',
          name: '2026 Graduate Entrance Examination',
          description: 'Civil Service Online Graduate Entrance Examination.',
          start_date: '2026-03-15',
          end_date: '2026-04-30',
          status: 'active',
          positions: 24,
        },
      },
    ]);
    const res = await onRequestGet(ctx(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string; status: string; end_date: string } };
    expect(body.data.id).toBe('ex-001');
    expect(body.data.status).toBe('active');
    expect(body.data.end_date).toBe('2026-04-30');
  });

  it('returns 404 when no exercise is active', async () => {
    const db = makeD1([
      {
        sql:
          "SELECT id, name, description, start_date, end_date, status, positions FROM recruitment_exercises WHERE status = 'active' LIMIT 1",
      },
    ]);
    const res = await onRequestGet(ctx(db));
    expect(res.status).toBe(404);
  });
});
