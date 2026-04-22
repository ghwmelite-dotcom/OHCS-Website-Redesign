import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestPatch } from '../../../functions/api/applications/me';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const SESSION_COOKIE = 'session_id=sess-abc';

function sessionLookupScript() {
  return {
    sql:
      'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
    first: {
      session_id: 'sess-abc',
      application_id: 'OHCS-2026-00001',
      expires_at: Date.now() + 86_400_000,
      exercise_id: 'ex-001',
      email: 'kofi@example.com',
      status: 'draft',
    },
  };
}

function slidingUpdateScript() {
  return {
    sql: 'UPDATE application_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
    run: {},
  };
}

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/applications/me', () => {
  it('returns the draft application for the current session', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql:
          'SELECT id, exercise_id, email, status, has_professional_qualification, is_pwd, form_data, created_at, submitted_at, last_saved_at FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: {
          id: 'OHCS-2026-00001',
          exercise_id: 'ex-001',
          email: 'kofi@example.com',
          status: 'draft',
          has_professional_qualification: 0,
          is_pwd: 0,
          form_data: '{"step":1}',
          created_at: 1,
          submitted_at: null,
          last_saved_at: 1,
        },
      },
    ]);
    const req = new Request('https://x/api/applications/me', { headers: { Cookie: SESSION_COOKIE } });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string; form_data: { step: number } } };
    expect(body.data.id).toBe('OHCS-2026-00001');
    expect(body.data.form_data).toEqual({ step: 1 });
  });

  it('returns 401 when no cookie', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/applications/me')));
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/applications/me', () => {
  it('merges patch into form_data and bumps last_saved_at', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { form_data: '{"step":1,"name":"Kofi"}' },
      },
      {
        sql:
          'UPDATE applications SET form_data = ?, has_professional_qualification = ?, last_saved_at = ? WHERE id = ?',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/applications/me', {
      method: 'PATCH',
      headers: { Cookie: SESSION_COOKIE, 'content-type': 'application/json' },
      body: JSON.stringify({ form_patch: { dob: '1990-01-15' }, has_professional_qualification: true }),
    });
    const res = await onRequestPatch(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { last_saved_at: number } };
    expect(typeof body.data.last_saved_at).toBe('number');
  });

  it('rejects when status is not draft', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
        first: {
          session_id: 'sess-abc',
          application_id: 'OHCS-2026-00001',
          expires_at: Date.now() + 86_400_000,
          exercise_id: 'ex-001',
          email: 'kofi@example.com',
          status: 'submitted',
        },
      },
      slidingUpdateScript(),
    ]);
    const req = new Request('https://x/api/applications/me', {
      method: 'PATCH',
      headers: { Cookie: SESSION_COOKIE, 'content-type': 'application/json' },
      body: JSON.stringify({ form_patch: { dob: '1990-01-15' } }),
    });
    const res = await onRequestPatch(ctx(req, db));
    expect(res.status).toBe(409);
  });
});
