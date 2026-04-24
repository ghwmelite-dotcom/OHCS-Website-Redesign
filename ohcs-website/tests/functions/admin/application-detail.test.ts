import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/admin/applications/[id]';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../_helpers/d1-mock';

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

describe('GET /api/admin/applications/[id]', () => {
  it('returns the full application detail', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT id, exercise_id, email, status, has_professional_qualification, is_pwd, form_data, appeal_reason FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: {
          id: 'OHCS-2026-00001',
          exercise_id: 'ex-001',
          email: 'kofi@example.com',
          status: 'submitted',
          has_professional_qualification: 0,
          is_pwd: 0,
          form_data: '{"full_name":"Kofi"}',
          appeal_reason: null,
        },
      },
      {
        sql:
          'SELECT id, document_type_id, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, ai_reason, applicant_confirmed FROM application_documents WHERE application_id = ?',
        binds: ['OHCS-2026-00001'],
        all: { results: [] },
      },
      {
        sql:
          'SELECT r.document_type_id, r.is_required, r.conditional_on, r.display_order, r.max_mb_override, t.label, t.description, t.default_max_mb, t.accepted_mimes, t.ai_check_type FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? ORDER BY r.display_order ASC',
        binds: ['ex-001'],
        all: { results: [] },
      },
      {
        sql:
          'SELECT document_type_id, decision, reason, reviewer_email, created_at FROM document_review_decisions WHERE application_id = ? ORDER BY created_at DESC',
        binds: ['OHCS-2026-00001'],
        all: { results: [] },
      },
      {
        sql:
          'SELECT outcome, notes, reviewer_email, created_at FROM application_review_decisions WHERE application_id = ? ORDER BY created_at DESC',
        binds: ['OHCS-2026-00001'],
        all: { results: [] },
      },
      {
        sql:
          'SELECT from_status, to_status, actor_email, actor_role, reason, created_at FROM status_transitions WHERE application_id = ? ORDER BY created_at ASC',
        binds: ['OHCS-2026-00001'],
        all: { results: [] },
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001', {
      headers: ADMIN_HEADERS,
    });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string; form_data: { full_name: string } } };
    expect(body.data.id).toBe('OHCS-2026-00001');
    expect(body.data.form_data.full_name).toBe('Kofi');
  });

  it('returns 404 when application not found', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT id, exercise_id, email, status, has_professional_qualification, is_pwd, form_data, appeal_reason FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001', {
      headers: ADMIN_HEADERS,
    });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(404);
  });
});
