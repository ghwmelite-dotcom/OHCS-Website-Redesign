import { describe, it, expect } from 'vitest';
import { requireApplicant } from '../../../functions/_shared/applicant-session';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function reqWith(cookie?: string): Request {
  return new Request('https://x/api/applications/me', {
    headers: cookie ? { Cookie: cookie } : {},
  });
}

describe('requireApplicant', () => {
  it('returns ok with application context when session valid', async () => {
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
          status: 'draft',
        },
      },
      {
        sql: 'UPDATE application_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
        run: {},
      },
    ]);
    const result = await requireApplicant(reqWith('session_id=sess-abc'), mockEnv({ db }));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.application.id).toBe('OHCS-2026-00001');
      expect(result.application.email).toBe('kofi@example.com');
      expect(result.session.session_id).toBe('sess-abc');
    }
  });

  it('returns 401 when no cookie', async () => {
    const result = await requireApplicant(reqWith(), mockEnv());
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') expect(result.response.status).toBe(401);
  });

  it('returns 401 when session not found', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
      },
    ]);
    const result = await requireApplicant(reqWith('session_id=ghost'), mockEnv({ db }));
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') expect(result.response.status).toBe(401);
  });
});
