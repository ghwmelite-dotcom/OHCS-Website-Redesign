// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from '../../../functions/api/applications/me/submit';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const SESSION_COOKIE = 'session_id=sess-abc';

function sessionLookupScript(status = 'draft') {
  return {
    sql:
      'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
    first: {
      session_id: 'sess-abc',
      application_id: 'OHCS-2026-00001',
      expires_at: Date.now() + 86_400_000,
      exercise_id: 'ex-001',
      email: 'kofi@example.com',
      status,
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

describe('POST /api/applications/me/submit', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('flips status to submitted, sends email, returns reference number', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT has_professional_qualification, is_pwd, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: {
          has_professional_qualification: 0,
          is_pwd: 0,
          form_data: JSON.stringify({
            holds_first_degree: true,
            full_name: 'Kofi',
            consent: { agreed: true, agreed_at: 1 },
            declaration: { agreed: true, agreed_at: 1 },
          }),
        },
      },
      {
        sql:
          'SELECT document_type_id, is_required, conditional_on FROM exercise_document_requirements WHERE exercise_id = ? AND is_required = 1',
        binds: ['ex-001'],
        all: { results: [{ document_type_id: 'national_id', is_required: 1, conditional_on: null }] },
      },
      {
        sql: 'SELECT document_type_id FROM application_documents WHERE application_id = ?',
        binds: ['OHCS-2026-00001'],
        all: { results: [{ document_type_id: 'national_id' }] },
      },
      { sql: 'UPDATE applications SET status = ?, submitted_at = ? WHERE id = ?', run: {} },
    ]);
    const req = new Request('https://x/api/applications/me/submit', {
      method: 'POST',
      headers: { Cookie: SESSION_COOKIE },
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { reference_number: string; status: string } };
    expect(body.data.reference_number).toBe('OHCS-2026-00001');
    expect(body.data.status).toBe('submitted');
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('rejects when a required document is missing', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT has_professional_qualification, is_pwd, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: {
          has_professional_qualification: 0,
          is_pwd: 0,
          form_data: JSON.stringify({
            holds_first_degree: true,
            full_name: 'Kofi',
            consent: { agreed: true, agreed_at: 1 },
            declaration: { agreed: true, agreed_at: 1 },
          }),
        },
      },
      {
        sql:
          'SELECT document_type_id, is_required, conditional_on FROM exercise_document_requirements WHERE exercise_id = ? AND is_required = 1',
        binds: ['ex-001'],
        all: { results: [{ document_type_id: 'national_id', is_required: 1, conditional_on: null }] },
      },
      {
        sql: 'SELECT document_type_id FROM application_documents WHERE application_id = ?',
        binds: ['OHCS-2026-00001'],
        all: { results: [] },
      },
    ]);
    const req = new Request('https://x/api/applications/me/submit', {
      method: 'POST',
      headers: { Cookie: SESSION_COOKIE },
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; missing: string[] };
    expect(body.missing).toContain('national_id');
  });

  it('rejects when declaration is not agreed', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT has_professional_qualification, is_pwd, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: {
          has_professional_qualification: 0,
          is_pwd: 0,
          form_data: JSON.stringify({
            holds_first_degree: true,
            consent: { agreed: true, agreed_at: 1 },
          }),
        },
      },
    ]);
    const req = new Request('https://x/api/applications/me/submit', {
      method: 'POST',
      headers: { Cookie: SESSION_COOKIE },
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(400);
  });

  it('rejects when status is already submitted', async () => {
    const db = makeD1([sessionLookupScript('submitted'), slidingUpdateScript()]);
    const req = new Request('https://x/api/applications/me/submit', {
      method: 'POST',
      headers: { Cookie: SESSION_COOKIE },
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(409);
  });
});
