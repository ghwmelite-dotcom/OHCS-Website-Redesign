import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { first, all } from '../../../_shared/db';
import { requireApplicant } from '../../../_shared/applicant-session';
import type {
  ApplicantRequirementsView,
  RequirementWithUpload,
  AiCheckType,
  AiVerdict,
  ConditionalTrigger,
} from '../../../../src/types/recruitment';

interface FlagsRow {
  has_professional_qualification: number;
  is_pwd: number;
}

interface RequirementRow {
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

interface UploadRow {
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

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;

  const flags = await first<FlagsRow>(
    env,
    'SELECT has_professional_qualification, is_pwd FROM applications WHERE id = ?',
    auth.application.id,
  );
  if (!flags) return json({ error: 'application not found' }, { status: 404 });

  const reqs = await all<RequirementRow>(
    env,
    'SELECT r.document_type_id, r.is_required, r.conditional_on, r.display_order, r.max_mb_override, t.label, t.description, t.default_max_mb, t.accepted_mimes, t.ai_check_type FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? ORDER BY r.display_order ASC',
    auth.application.exercise_id,
  );

  const uploads = await all<UploadRow>(
    env,
    'SELECT id, document_type_id, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, ai_reason, applicant_confirmed FROM application_documents WHERE application_id = ?',
    auth.application.id,
  );
  const uploadByType = new Map(uploads.map((u) => [u.document_type_id, u]));

  const hasPro = flags.has_professional_qualification === 1;
  const isPwd = flags.is_pwd === 1;

  const requirements: RequirementWithUpload[] = reqs.map((r) => {
    const conditional = (r.conditional_on as ConditionalTrigger | null) ?? null;
    const visible =
      conditional === null
        ? true
        : conditional === 'has_professional_qualification'
          ? hasPro
          : conditional === 'is_pwd'
            ? isPwd
            : true;
    const u = uploadByType.get(r.document_type_id);
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
      upload: u
        ? {
            id: u.id,
            document_type_id: u.document_type_id,
            original_filename: u.original_filename,
            size_bytes: u.size_bytes,
            mime_type: u.mime_type,
            sha256: u.sha256,
            uploaded_at: u.uploaded_at,
            ai_verdict: u.ai_verdict,
            ai_reason: u.ai_reason,
            applicant_confirmed: u.applicant_confirmed === 1,
          }
        : null,
      visible,
    };
  });

  const data: ApplicantRequirementsView = {
    exercise_id: auth.application.exercise_id,
    has_professional_qualification: hasPro,
    is_pwd: isPwd,
    requirements,
  };
  return json({ data });
};
