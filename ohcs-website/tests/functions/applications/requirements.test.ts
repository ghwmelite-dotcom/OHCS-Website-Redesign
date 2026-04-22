import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/applications/me/requirements';
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

describe('GET /api/applications/me/requirements', () => {
  it('merges exercise requirements with the applicant flags + uploads', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT has_professional_qualification, is_pwd FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { has_professional_qualification: 1, is_pwd: 0 },
      },
      {
        sql:
          'SELECT r.document_type_id, r.is_required, r.conditional_on, r.display_order, r.max_mb_override, t.label, t.description, t.default_max_mb, t.accepted_mimes, t.ai_check_type FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? ORDER BY r.display_order ASC',
        binds: ['ex-001'],
        all: {
          results: [
            {
              document_type_id: 'national_id',
              is_required: 1,
              conditional_on: null,
              display_order: 0,
              max_mb_override: null,
              label: 'National ID (Ghana Card)',
              description: null,
              default_max_mb: 5,
              accepted_mimes: '["application/pdf","image/jpeg","image/png"]',
              ai_check_type: 'identity',
            },
            {
              document_type_id: 'professional_cert',
              is_required: 1,
              conditional_on: 'has_professional_qualification',
              display_order: 1,
              max_mb_override: null,
              label: 'Professional Qualification',
              description: null,
              default_max_mb: 5,
              accepted_mimes: '["application/pdf"]',
              ai_check_type: 'certificate',
            },
            {
              document_type_id: 'medical_certificate_pwd',
              is_required: 1,
              conditional_on: 'is_pwd',
              display_order: 2,
              max_mb_override: null,
              label: 'Medical Certificate (PWD)',
              description: null,
              default_max_mb: 5,
              accepted_mimes: '["application/pdf"]',
              ai_check_type: 'certificate',
            },
          ],
        },
      },
      {
        sql:
          'SELECT id, document_type_id, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, ai_reason, applicant_confirmed FROM application_documents WHERE application_id = ?',
        binds: ['OHCS-2026-00001'],
        all: {
          results: [
            {
              id: 'doc-1',
              document_type_id: 'national_id',
              original_filename: 'card.pdf',
              size_bytes: 1024,
              mime_type: 'application/pdf',
              sha256: 'abc',
              uploaded_at: 1,
              ai_verdict: 'unchecked',
              ai_reason: null,
              applicant_confirmed: 0,
            },
          ],
        },
      },
    ]);

    const req = new Request('https://x/api/applications/me/requirements', { headers: { Cookie: SESSION_COOKIE } });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        exercise_id: string;
        has_professional_qualification: boolean;
        is_pwd: boolean;
        requirements: Array<{
          document_type_id: string;
          visible: boolean;
          upload: { document_type_id: string } | null;
          accepted_mimes: string[];
          max_mb: number;
        }>;
      };
    };
    expect(body.data.exercise_id).toBe('ex-001');
    expect(body.data.has_professional_qualification).toBe(true);
    expect(body.data.requirements).toHaveLength(3);
    expect(body.data.requirements[0]!.document_type_id).toBe('national_id');
    expect(body.data.requirements[0]!.visible).toBe(true);
    expect(body.data.requirements[0]!.upload?.document_type_id).toBe('national_id');
    expect(body.data.requirements[0]!.accepted_mimes).toEqual(['application/pdf', 'image/jpeg', 'image/png']);
    expect(body.data.requirements[0]!.max_mb).toBe(5);
    expect(body.data.requirements[1]!.visible).toBe(true);
    expect(body.data.requirements[2]!.visible).toBe(false);
  });

  it('returns 401 without session', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/applications/me/requirements')));
    expect(res.status).toBe(401);
  });
});
