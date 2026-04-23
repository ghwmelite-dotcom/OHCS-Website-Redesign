// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from '../../../functions/api/admin/applications/[id]/vetting';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'admin@ohcs.gov.gh',
  'X-Admin-User-Role': 'super_admin',
};

function ctx(req: Request, db?: D1Database) {
  return {
    request: req,
    env: mockEnv({ db }),
    params: { id: 'OHCS-2026-00001' },
    waitUntil: () => {},
    data: {},
  };
}

describe('POST /api/admin/applications/[id]/vetting', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('rolls up to vetting_passed when all decisions are accepted', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status, exercise_id, email, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { status: 'under_review', exercise_id: 'ex-001', email: 'kofi@example.com', form_data: null },
      },
      {
        sql:
          'INSERT INTO document_review_decisions (id, application_id, document_type_id, reviewer_email, decision, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'INSERT INTO application_review_decisions (id, application_id, reviewer_email, outcome, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'UPDATE applications SET status = ?, review_claimed_by = NULL, review_claimed_at = NULL WHERE id = ?',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001/vetting', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        document_decisions: [
          { document_type_id: 'national_id', decision: 'accepted' },
          { document_type_id: 'first_degree', decision: 'accepted' },
        ],
        notes: 'All clean.',
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { outcome: string } };
    expect(body.data.outcome).toBe('vetting_passed');
  });

  it('rolls up to requires_action when some decisions are needs_better_scan and none rejected', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status, exercise_id, email, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { status: 'under_review', exercise_id: 'ex-001', email: 'kofi@example.com', form_data: null },
      },
      {
        sql:
          'INSERT INTO document_review_decisions (id, application_id, document_type_id, reviewer_email, decision, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'INSERT INTO application_review_decisions (id, application_id, reviewer_email, outcome, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'UPDATE applications SET status = ?, review_claimed_by = NULL, review_claimed_at = NULL WHERE id = ?',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001/vetting', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        document_decisions: [
          { document_type_id: 'national_id', decision: 'accepted' },
          { document_type_id: 'first_degree', decision: 'needs_better_scan', reason: 'Blurry image' },
        ],
        notes: 'One re-upload needed.',
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { outcome: string } };
    expect(body.data.outcome).toBe('requires_action');
  });

  it('rolls up to vetting_failed when any decision is rejected', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status, exercise_id, email, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { status: 'under_review', exercise_id: 'ex-001', email: 'kofi@example.com', form_data: null },
      },
      {
        sql:
          'INSERT INTO document_review_decisions (id, application_id, document_type_id, reviewer_email, decision, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'INSERT INTO application_review_decisions (id, application_id, reviewer_email, outcome, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'UPDATE applications SET status = ?, review_claimed_by = NULL, review_claimed_at = NULL WHERE id = ?',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001/vetting', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        document_decisions: [
          { document_type_id: 'national_id', decision: 'rejected', reason: 'Wrong document' },
        ],
        notes: 'Rejected.',
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { outcome: string } };
    expect(body.data.outcome).toBe('vetting_failed');
  });

  it('rejects 400 when a non-accept decision lacks a reason', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status, exercise_id, email, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { status: 'under_review', exercise_id: 'ex-001', email: 'kofi@example.com', form_data: null },
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001/vetting', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        document_decisions: [{ document_type_id: 'national_id', decision: 'rejected' }],
        notes: '',
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(400);
  });

  it('rejects when application is not under_review', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status, exercise_id, email, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { status: 'submitted', exercise_id: 'ex-001', email: 'kofi@example.com', form_data: null },
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001/vetting', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        document_decisions: [{ document_type_id: 'national_id', decision: 'accepted' }],
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(409);
  });
});
