export type AiCheckType = 'certificate' | 'photo' | 'identity' | null;

export interface DocumentType {
  id: string;
  label: string;
  description: string | null;
  default_max_mb: number;
  accepted_mimes: string[];           // parsed JSON array
  ai_check_type: AiCheckType;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface DocumentTypeRow {
  id: string;
  label: string;
  description: string | null;
  default_max_mb: number;
  accepted_mimes: string;             // raw JSON string from D1
  ai_check_type: AiCheckType;
  is_active: number;                  // 0 / 1 from D1
  created_at: number;
  updated_at: number;
}

export type ConditionalTrigger = 'has_professional_qualification' | 'is_pwd';

export interface ExerciseRequirement {
  id: string;
  exercise_id: string;
  document_type_id: string;
  is_required: boolean;
  conditional_on: ConditionalTrigger | null;
  display_order: number;
  max_mb_override: number | null;
}

export interface ExerciseRequirementRow {
  id: string;
  exercise_id: string;
  document_type_id: string;
  is_required: number;
  conditional_on: string | null;
  display_order: number;
  max_mb_override: number | null;
  created_at: number;
  updated_at: number;
}

export function rowToDocumentType(row: DocumentTypeRow): DocumentType {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    default_max_mb: row.default_max_mb,
    accepted_mimes: JSON.parse(row.accepted_mimes) as string[],
    ai_check_type: row.ai_check_type,
    is_active: row.is_active === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function rowToRequirement(row: ExerciseRequirementRow): ExerciseRequirement {
  return {
    id: row.id,
    exercise_id: row.exercise_id,
    document_type_id: row.document_type_id,
    is_required: row.is_required === 1,
    conditional_on: (row.conditional_on as ConditionalTrigger | null) ?? null,
    display_order: row.display_order,
    max_mb_override: row.max_mb_override,
  };
}

// ─── Applicant ───────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'requires_action'
  | 'shortlisted'
  | 'rejected';

export interface ApplicationFormData {
  // Step 1
  full_name?: string;
  date_of_birth?: string;          // 'YYYY-MM-DD'
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  nia_number?: string;             // Ghana Card 'GHA-XXXXXXXXX-X'
  phone?: string;
  postal_address?: string;
  region?: string;
  consent?: { agreed: boolean; agreed_at: number; ip?: string };

  // Step 2 (eligibility — checkbox-only field stored in form_data)
  holds_first_degree?: boolean;

  // Step 3
  highest_qualification?: 'first_degree' | 'pg_diploma' | 'masters' | 'phd';
  field_of_study?: string;
  institution?: string;
  graduation_year?: number;
  class_of_degree?: 'first' | 'second_upper' | 'second_lower' | 'third' | 'pass';
  years_experience?: number;
  current_employment?: string;
  work_history?: string;
}

export interface Application {
  id: string;
  exercise_id: string;
  email: string;
  status: ApplicationStatus;
  has_professional_qualification: boolean;
  is_pwd: boolean;
  form_data: ApplicationFormData;
  created_at: number;
  submitted_at: number | null;
  last_saved_at: number;
}

// ─── Documents (Phase 3) ─────────────────────────────────────────────────

export type AiVerdict = 'passed' | 'flagged' | 'unchecked';

export interface ApplicationDocument {
  id: string;
  document_type_id: string;
  original_filename: string;
  size_bytes: number;
  mime_type: string;
  sha256: string;
  uploaded_at: number;
  ai_verdict: AiVerdict;
  ai_reason: string | null;
  applicant_confirmed: boolean;
}

export interface RequirementWithUpload {
  document_type_id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  conditional_on: ConditionalTrigger | null;
  display_order: number;
  max_mb: number;
  accepted_mimes: string[];
  ai_check_type: AiCheckType;
  upload: ApplicationDocument | null;
  visible: boolean;
}

export interface ApplicantRequirementsView {
  exercise_id: string;
  has_professional_qualification: boolean;
  is_pwd: boolean;
  requirements: RequirementWithUpload[];
}
