import { describe, it, expect } from 'vitest';
import { resolveAudience } from '../../../functions/_shared/audience-resolver';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

describe('resolveAudience', () => {
  it('returns recipients matching exercise_id + status', async () => {
    const db = makeD1([
      {
        sql: 'SELECT id, email, form_data FROM applications WHERE exercise_id = ? AND status = ?',
        all: {
          results: [
            { id: 'OHCS-2026-00001', email: 'a@example.com', form_data: '{"phone":"+233241111111","full_name":"A One"}' },
            { id: 'OHCS-2026-00002', email: 'b@example.com', form_data: null },
          ],
        },
      },
    ]);
    const result = await resolveAudience(mockEnv({ db }), {
      kind: 'status',
      exerciseId: 'ex-001',
      status: 'vetting_passed',
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      applicationId: 'OHCS-2026-00001',
      email: 'a@example.com',
      phone: '+233241111111',
      fullName: 'A One',
    });
    expect(result[1]?.phone).toBeNull();
  });

  it('returns single recipient when kind=single', async () => {
    const db = makeD1([
      {
        sql: 'SELECT id, email, form_data FROM applications WHERE id = ?',
        first: {
          id: 'OHCS-2026-00001',
          email: 'a@example.com',
          form_data: '{"full_name":"Akua","phone":"+233241000000"}',
        },
      },
    ]);
    const result = await resolveAudience(mockEnv({ db }), {
      kind: 'single',
      applicationId: 'OHCS-2026-00001',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.applicationId).toBe('OHCS-2026-00001');
  });

  it('returns empty array when no matches', async () => {
    const db = makeD1([
      {
        sql: 'SELECT id, email, form_data FROM applications WHERE exercise_id = ? AND status = ?',
        all: { results: [] },
      },
    ]);
    const result = await resolveAudience(mockEnv({ db }), {
      kind: 'status',
      exerciseId: 'ex-empty',
      status: 'vetting_passed',
    });
    expect(result).toEqual([]);
  });
});
