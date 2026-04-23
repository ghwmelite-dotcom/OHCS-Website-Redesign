// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { onRequestPost } from '../../../functions/api/system/run-deadlines';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const EXPIRED_SELECT_SQL =
  "SELECT a.id FROM applications a JOIN application_review_decisions ard ON ard.application_id = a.id JOIN recruitment_exercises e ON e.id = a.exercise_id WHERE a.status = 'requires_action' AND ard.outcome = 'requires_action' AND ard.created_at + (e.vetting_window_days * 86400000) < ?";
const RELEASE_STALE_SQL =
  'UPDATE applications SET review_claimed_by = NULL, review_claimed_at = NULL WHERE review_claimed_at IS NOT NULL AND review_claimed_at < ?';

interface SecretEnv {
  SYSTEM_CRON_SECRET?: string;
}

function ctx(req: Request, env: ReturnType<typeof mockEnv> & SecretEnv) {
  return { request: req, env, params: {}, waitUntil: () => {}, data: {} };
}

function withSecret(extra: { db?: D1Database } = {}): ReturnType<typeof mockEnv> & SecretEnv {
  return { ...mockEnv(extra), SYSTEM_CRON_SECRET: 'real-secret' };
}

describe('POST /api/system/run-deadlines', () => {
  it('returns 401 when SYSTEM_CRON_SECRET is unset', async () => {
    const env = mockEnv({});
    const req = new Request('https://x/api/system/run-deadlines', {
      method: 'POST',
      headers: { Authorization: 'Bearer anything' },
    });
    const res = await onRequestPost(ctx(req, env));
    expect(res.status).toBe(401);
  });

  it('returns 401 on a wrong Bearer (constant-time path)', async () => {
    const env = withSecret({});
    const req = new Request('https://x/api/system/run-deadlines', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const res = await onRequestPost(ctx(req, env));
    expect(res.status).toBe(401);
  });

  it('writes a status_transitions row for every expired requires_action app', async () => {
    const db = makeD1([
      { sql: RELEASE_STALE_SQL, run: {} },
      {
        sql: EXPIRED_SELECT_SQL,
        all: { results: [{ id: 'OHCS-2026-00100' }, { id: 'OHCS-2026-00101' }] },
      },
      {
        sql:
          'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          "UPDATE applications SET status = 'vetting_failed' WHERE id = ? AND status = 'requires_action'",
        run: {},
      },
    ]);
    const env = withSecret({ db });
    const req = new Request('https://x/api/system/run-deadlines', {
      method: 'POST',
      headers: { Authorization: 'Bearer real-secret' },
    });
    const res = await onRequestPost(ctx(req, env));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { ran_at: number; expired_count: number } };
    expect(body.data.expired_count).toBe(2);
  });

  it('reports zero expired when no requires_action apps are past deadline', async () => {
    const db = makeD1([
      { sql: RELEASE_STALE_SQL, run: {} },
      { sql: EXPIRED_SELECT_SQL, all: { results: [] } },
    ]);
    const env = withSecret({ db });
    const req = new Request('https://x/api/system/run-deadlines', {
      method: 'POST',
      headers: { Authorization: 'Bearer real-secret' },
    });
    const res = await onRequestPost(ctx(req, env));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { expired_count: number } };
    expect(body.data.expired_count).toBe(0);
  });
});
