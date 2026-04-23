import { describe, it, expect } from 'vitest';
import { recordTransition } from '../../../functions/_shared/status-transition';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

describe('recordTransition', () => {
  it('inserts a status_transitions row and updates the application status', async () => {
    const db = makeD1([
      {
        sql: 'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql: 'UPDATE applications SET status = ? WHERE id = ?',
        binds: ['vetting_passed', 'OHCS-2026-00001'],
        run: {},
      },
    ]);
    await recordTransition(mockEnv({ db }), {
      applicationId: 'OHCS-2026-00001',
      fromStatus: 'under_review',
      toStatus: 'vetting_passed',
      actorEmail: 'admin@ohcs.gov.gh',
      actorRole: 'recruitment_admin',
      reason: 'Vetting decision: pass',
    });
    expect(true).toBe(true);
  });

  it('handles system-initiated transitions (no actor)', async () => {
    const db = makeD1([
      {
        sql: 'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      { sql: 'UPDATE applications SET status = ? WHERE id = ?', run: {} },
    ]);
    await recordTransition(mockEnv({ db }), {
      applicationId: 'OHCS-2026-00001',
      fromStatus: 'requires_action',
      toStatus: 'vetting_failed',
      actorRole: 'system',
      reason: 'Resubmission deadline expired',
    });
    expect(true).toBe(true);
  });
});
