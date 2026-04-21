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
