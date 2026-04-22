// @vitest-environment node
// Pages Functions run in Workers runtime (not jsdom). jsdom's Request
// does not support formData(); switch this file to node so multipart
// parsing actually works.
import { describe, it, expect, vi } from 'vitest';
import {
  onRequestPost,
  onRequestDelete,
} from '../../../functions/api/applications/me/documents/[docTypeId]';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';
import type { Env } from '../../../functions/_shared/types';

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

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);

function makeR2Mock(): R2Bucket {
  const store = {
    put: vi.fn(async () => ({}) as R2Object),
    delete: vi.fn(async () => undefined),
  };
  return store as unknown as R2Bucket;
}

function ctx(req: Request, docTypeId: string, db?: D1Database, envOverrides?: Partial<Env>) {
  return {
    request: req,
    env: { ...mockEnv({ db }), ...envOverrides },
    params: { docTypeId },
    waitUntil: () => {},
    data: {},
  };
}

function buildUploadRequest(body: Uint8Array, mime: string, path = 'national_id'): Request {
  const fd = new FormData();
  // `body as BlobPart` — Uint8Array IS a valid BlobPart at runtime; the
  // strict-tsc complaint is about ArrayBufferLike vs ArrayBuffer (Shared
  // ArrayBuffer narrowing) which doesn't apply here.
  fd.append('file', new Blob([body as BlobPart], { type: mime }), 'card.pdf');
  return new Request(`https://x/api/applications/me/documents/${path}`, {
    method: 'POST',
    headers: { Cookie: SESSION_COOKIE },
    body: fd,
  });
}

describe('POST /api/applications/me/documents/[docTypeId]', () => {
  it('writes the file to R2, records metadata, returns 201', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql:
          'SELECT r.is_required, r.max_mb_override, t.accepted_mimes, t.default_max_mb FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? AND r.document_type_id = ?',
        binds: ['ex-001', 'national_id'],
        first: {
          is_required: 1,
          max_mb_override: null,
          accepted_mimes: '["application/pdf"]',
          default_max_mb: 5,
        },
      },
      {
        sql: 'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
        binds: ['OHCS-2026-00001', 'national_id'],
      },
      {
        sql:
          'INSERT INTO application_documents (id, application_id, document_type_id, r2_key, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, applicant_confirmed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(application_id, document_type_id) DO UPDATE SET r2_key=excluded.r2_key, original_filename=excluded.original_filename, size_bytes=excluded.size_bytes, mime_type=excluded.mime_type, sha256=excluded.sha256, uploaded_at=excluded.uploaded_at, ai_verdict=excluded.ai_verdict, ai_reason=NULL, ai_confidence=NULL, ai_prompt_version=NULL, manual_flag=NULL, applicant_confirmed=0',
        run: {},
      },
    ]);
    const r2 = makeR2Mock();
    const req = buildUploadRequest(PDF_BYTES, 'application/pdf');
    const res = await onRequestPost(ctx(req, 'national_id', db, { UPLOADS: r2 }));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { document_type_id: string; size_bytes: number } };
    expect(body.data.document_type_id).toBe('national_id');
    expect(body.data.size_bytes).toBe(PDF_BYTES.length);
  });

  it('returns 400 when MIME is wrong', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql:
          'SELECT r.is_required, r.max_mb_override, t.accepted_mimes, t.default_max_mb FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? AND r.document_type_id = ?',
        binds: ['ex-001', 'national_id'],
        first: {
          is_required: 1,
          max_mb_override: null,
          accepted_mimes: '["application/pdf"]',
          default_max_mb: 5,
        },
      },
    ]);
    const r2 = makeR2Mock();
    const req = buildUploadRequest(PDF_BYTES, 'image/gif');
    const res = await onRequestPost(ctx(req, 'national_id', db, { UPLOADS: r2 }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when docTypeId is not in the exercise requirements', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql:
          'SELECT r.is_required, r.max_mb_override, t.accepted_mimes, t.default_max_mb FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? AND r.document_type_id = ?',
        binds: ['ex-001', 'unknown_doc'],
      },
    ]);
    const r2 = makeR2Mock();
    const res = await onRequestPost(
      ctx(buildUploadRequest(PDF_BYTES, 'application/pdf', 'unknown_doc'), 'unknown_doc', db, { UPLOADS: r2 }),
    );
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/applications/me/documents/[docTypeId]', () => {
  it('deletes the R2 object and the metadata row', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
        binds: ['OHCS-2026-00001', 'national_id'],
        first: { r2_key: 'ex-001/OHCS-2026-00001/national_id.pdf' },
      },
      {
        sql: 'DELETE FROM application_documents WHERE application_id = ? AND document_type_id = ?',
        binds: ['OHCS-2026-00001', 'national_id'],
        run: {},
      },
    ]);
    const r2 = makeR2Mock();
    const req = new Request('https://x/api/applications/me/documents/national_id', {
      method: 'DELETE',
      headers: { Cookie: SESSION_COOKIE },
    });
    const res = await onRequestDelete(ctx(req, 'national_id', db, { UPLOADS: r2 }));
    expect(res.status).toBe(204);
  });
});
