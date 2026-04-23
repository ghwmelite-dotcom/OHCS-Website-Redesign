import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { first, run } from '../../../../_shared/db';
import { requireApplicant } from '../../../../_shared/applicant-session';
import { validateFile } from '../../../../_shared/file-validate';
import { applicationDocKey } from '../../../../_shared/r2-keys';

const MB = 1024 * 1024;
const HEAD_BYTES = 16;

interface RequirementRow {
  is_required: number;
  max_mb_override: number | null;
  accepted_mimes: string;
  default_max_mb: number;
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function sanitiseFilename(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'upload';
}

export const onRequestPost: PagesFunction<Env, 'docTypeId'> = async ({
  request,
  env,
  params,
  waitUntil,
}) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.application.status !== 'draft') {
    return json(
      { error: 'application not editable', status: auth.application.status },
      { status: 409 },
    );
  }

  const reqRow = await first<RequirementRow>(
    env,
    'SELECT r.is_required, r.max_mb_override, t.accepted_mimes, t.default_max_mb FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? AND r.document_type_id = ?',
    auth.application.exercise_id,
    params.docTypeId,
  );
  if (!reqRow) return json({ error: 'document type not in this exercise' }, { status: 404 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'multipart body expected' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return json({ error: 'missing "file" field in multipart body' }, { status: 400 });
  }

  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const head = bytes.slice(0, HEAD_BYTES);

  const accepted = JSON.parse(reqRow.accepted_mimes) as string[];
  const maxMb = reqRow.max_mb_override ?? reqRow.default_max_mb;
  const validated = validateFile({
    claimedMime: file.type,
    sizeBytes: file.size,
    acceptedMimes: accepted,
    maxBytes: maxMb * MB,
    head,
  });
  if (validated.kind === 'reject') return json({ error: validated.reason }, { status: 400 });

  const sha = await sha256Hex(buf);
  const key = applicationDocKey(
    auth.application.exercise_id,
    auth.application.id,
    params.docTypeId,
    file.type,
  );
  const originalFilename = sanitiseFilename(file.name);

  // Replace flow: delete previous R2 object if its key differs
  const existing = await first<{ r2_key: string }>(
    env,
    'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
    auth.application.id,
    params.docTypeId,
  );
  if (existing && existing.r2_key !== key) {
    await env.UPLOADS.delete(existing.r2_key);
  }

  await env.UPLOADS.put(key, buf, {
    httpMetadata: {
      contentType: file.type,
      contentDisposition: `attachment; filename="${originalFilename}"`,
    },
    customMetadata: {
      application_id: auth.application.id,
      document_type_id: params.docTypeId,
      sha256: sha,
    },
  });

  const id = `doc_${auth.application.id}_${params.docTypeId}`;
  const now = Date.now();
  await run(
    env,
    'INSERT INTO application_documents (id, application_id, document_type_id, r2_key, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, applicant_confirmed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(application_id, document_type_id) DO UPDATE SET r2_key=excluded.r2_key, original_filename=excluded.original_filename, size_bytes=excluded.size_bytes, mime_type=excluded.mime_type, sha256=excluded.sha256, uploaded_at=excluded.uploaded_at, ai_verdict=excluded.ai_verdict, ai_reason=NULL, ai_confidence=NULL, ai_prompt_version=NULL, manual_flag=NULL, applicant_confirmed=0',
    id,
    auth.application.id,
    params.docTypeId,
    key,
    originalFilename,
    file.size,
    file.type,
    sha,
    now,
    'unchecked',
  );

  // Async AI verification — fires after the response returns to the
  // applicant. Updates ai_verdict / ai_confidence / ai_reason in place.
  // Phase 4 absorbed into sub-project A.
  const docTypeRow = await first<{ ai_check_type: string | null }>(
    env,
    'SELECT ai_check_type FROM document_types WHERE id = ?',
    params.docTypeId,
  );
  if (docTypeRow?.ai_check_type) {
    const { verifyDocument } = await import('../../../../_shared/ai-verify');
    waitUntil(
      verifyDocument(env, {
        applicationId: auth.application.id,
        documentTypeId: params.docTypeId,
        checkType: docTypeRow.ai_check_type as 'identity' | 'photo' | 'certificate',
        r2Key: key,
        mimeType: file.type,
      }).catch((err) => console.error('ai-verify failed', err)),
    );
  }

  return json(
    {
      data: {
        id,
        document_type_id: params.docTypeId,
        original_filename: originalFilename,
        size_bytes: file.size,
        mime_type: file.type,
        sha256: sha,
        uploaded_at: now,
        ai_verdict: 'unchecked' as const,
      },
    },
    { status: 201 },
  );
};

export const onRequestDelete: PagesFunction<Env, 'docTypeId'> = async ({
  request,
  env,
  params,
}) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.application.status !== 'draft') {
    return json(
      { error: 'application not editable', status: auth.application.status },
      { status: 409 },
    );
  }

  const existing = await first<{ r2_key: string }>(
    env,
    'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
    auth.application.id,
    params.docTypeId,
  );
  if (existing) {
    await env.UPLOADS.delete(existing.r2_key);
    await run(
      env,
      'DELETE FROM application_documents WHERE application_id = ? AND document_type_id = ?',
      auth.application.id,
      params.docTypeId,
    );
  }
  return new Response(null, { status: 204 });
};
