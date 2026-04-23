//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { first, all } from '../../../_shared/db';
import type {
  AiCheckType,
  AiVerdict,
  ConditionalTrigger,
} from '../../../../src/types/recruitment';

interface AppRow {
  id: string;
  exercise_id: string;
  email: string;
  status: string;
  has_professional_qualification: number;
  is_pwd: number;
  form_data: string | null;
  appeal_reason: string | null;
}

interface DocRow {
  id: string;
  document_type_id: string;
  original_filename: string;
  size_bytes: number;
  mime_type: string;
  sha256: string;
  uploaded_at: number;
  ai_verdict: AiVerdict;
  ai_reason: string | null;
  applicant_confirmed: number;
}

interface ReqRow {
  document_type_id: string;
  is_required: number;
  conditional_on: string | null;
  display_order: number;
  max_mb_override: number | null;
  label: string;
  description: string | null;
  default_max_mb: number;
  accepted_mimes: string;
  ai_check_type: AiCheckType;
}

interface DecisionRow {
  document_type_id: string;
  decision: string;
  reason: string | null;
  reviewer_email: string;
  created_at: number;
}

interface ReviewRow {
  outcome: string;
  notes: string | null;
  reviewer_email: string;
  created_at: number;
}

interface TransitionRow {
  from_status: string;
  to_status: string;
  actor_email: string | null;
  actor_role: string | null;
  reason: string | null;
  created_at: number;
}

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const app = await first<AppRow>(
    env,
    'SELECT id, exercise_id, email, status, has_professional_qualification, is_pwd, form_data, appeal_reason FROM applications WHERE id = ?',
    params.id,
  );
  if (!app) return json({ error: 'application not found' }, { status: 404 });

  const documents = await all<DocRow>(
    env,
    'SELECT id, document_type_id, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, ai_reason, applicant_confirmed FROM application_documents WHERE application_id = ?',
    params.id,
  );

  const reqs = await all<ReqRow>(
    env,
    'SELECT r.document_type_id, r.is_required, r.conditional_on, r.display_order, r.max_mb_override, t.label, t.description, t.default_max_mb, t.accepted_mimes, t.ai_check_type FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? ORDER BY r.display_order ASC',
    app.exercise_id,
  );

  const decisions = await all<DecisionRow>(
    env,
    'SELECT document_type_id, decision, reason, reviewer_email, created_at FROM document_review_decisions WHERE application_id = ? ORDER BY created_at DESC',
    params.id,
  );

  const reviews = await all<ReviewRow>(
    env,
    'SELECT outcome, notes, reviewer_email, created_at FROM application_review_decisions WHERE application_id = ? ORDER BY created_at DESC',
    params.id,
  );

  const history = await all<TransitionRow>(
    env,
    'SELECT from_status, to_status, actor_email, actor_role, reason, created_at FROM status_transitions WHERE application_id = ? ORDER BY created_at ASC',
    params.id,
  );

  // Latest decision per document_type_id (the active one)
  const latestPerDoc = new Map<string, DecisionRow>();
  for (const d of decisions) {
    if (!latestPerDoc.has(d.document_type_id)) latestPerDoc.set(d.document_type_id, d);
  }

  const hasPro = app.has_professional_qualification === 1;
  const isPwd = app.is_pwd === 1;
  const requirements = reqs.map((r) => {
    const conditional = (r.conditional_on as ConditionalTrigger | null) ?? null;
    const visible =
      conditional === null
        ? true
        : conditional === 'has_professional_qualification'
          ? hasPro
          : conditional === 'is_pwd'
            ? isPwd
            : true;
    const upload = documents.find((d) => d.document_type_id === r.document_type_id) ?? null;
    return {
      document_type_id: r.document_type_id,
      label: r.label,
      description: r.description,
      is_required: r.is_required === 1,
      conditional_on: conditional,
      display_order: r.display_order,
      max_mb: r.max_mb_override ?? r.default_max_mb,
      accepted_mimes: JSON.parse(r.accepted_mimes) as string[],
      ai_check_type: r.ai_check_type,
      upload: upload
        ? {
            id: upload.id,
            document_type_id: upload.document_type_id,
            original_filename: upload.original_filename,
            size_bytes: upload.size_bytes,
            mime_type: upload.mime_type,
            sha256: upload.sha256,
            uploaded_at: upload.uploaded_at,
            ai_verdict: upload.ai_verdict,
            ai_reason: upload.ai_reason,
            applicant_confirmed: upload.applicant_confirmed === 1,
          }
        : null,
      visible,
    };
  });

  return json({
    data: {
      id: app.id,
      exercise_id: app.exercise_id,
      email: app.email,
      status: app.status,
      has_professional_qualification: hasPro,
      is_pwd: isPwd,
      form_data: app.form_data ? (JSON.parse(app.form_data) as Record<string, unknown>) : {},
      documents: documents.map((d) => ({
        id: d.id,
        document_type_id: d.document_type_id,
        original_filename: d.original_filename,
        size_bytes: d.size_bytes,
        mime_type: d.mime_type,
        sha256: d.sha256,
        uploaded_at: d.uploaded_at,
        ai_verdict: d.ai_verdict,
        ai_reason: d.ai_reason,
        applicant_confirmed: d.applicant_confirmed === 1,
      })),
      requirements,
      decisions: Array.from(latestPerDoc.values()),
      reviews,
      history,
      appeal_reason: app.appeal_reason,
    },
  });
};
