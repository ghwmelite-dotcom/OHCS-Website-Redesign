import type {
  DocumentType,
  ExerciseRequirement,
  ConditionalTrigger,
  AiCheckType,
} from '@/types/recruitment';

const USER_KEY = 'ohcs_admin_user';

interface StoredUser { email?: string; role?: string }

function adminHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return {};
    const u = JSON.parse(raw) as StoredUser;
    return {
      'X-Admin-User-Email': u.email ?? '',
      'X-Admin-User-Role': u.role ?? '',
    };
  } catch {
    return {};
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...adminHeaders(),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ─── Document Types ──────────────────────────────────────────────────────

export async function listDocumentTypes(): Promise<DocumentType[]> {
  const { data } = await request<{ data: DocumentType[] }>('/api/admin/document-types');
  return data;
}

export interface CreateDocumentTypeInput {
  id: string;
  label: string;
  description?: string | null;
  default_max_mb: number;
  accepted_mimes: string[];
  ai_check_type?: AiCheckType;
}

export async function createDocumentType(input: CreateDocumentTypeInput): Promise<DocumentType> {
  const { data } = await request<{ data: DocumentType }>('/api/admin/document-types', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data;
}

export async function patchDocumentType(
  id: string,
  patch: Partial<CreateDocumentTypeInput>,
): Promise<void> {
  await request(`/api/admin/document-types/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deactivateDocumentType(id: string): Promise<void> {
  await request(`/api/admin/document-types/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── Exercise Requirements ───────────────────────────────────────────────

export async function getExerciseRequirements(
  exerciseId: string,
): Promise<ExerciseRequirement[]> {
  const { data } = await request<{ data: ExerciseRequirement[] }>(
    `/api/admin/exercises/${encodeURIComponent(exerciseId)}/requirements`,
  );
  return data;
}

export interface RequirementInput {
  document_type_id: string;
  is_required: boolean;
  conditional_on: ConditionalTrigger | null;
  display_order: number;
  max_mb_override: number | null;
}

export async function putExerciseRequirements(
  exerciseId: string,
  requirements: RequirementInput[],
): Promise<{ count: number }> {
  const { data } = await request<{ data: { count: number } }>(
    `/api/admin/exercises/${encodeURIComponent(exerciseId)}/requirements`,
    { method: 'PUT', body: JSON.stringify({ requirements }) },
  );
  return data;
}

// ─── Exercises (Phase 3.5 — moved out of localStorage into D1) ──────────

export type ExerciseStatus = 'draft' | 'active' | 'closed' | 'completed';

export interface AdminExercise {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: ExerciseStatus;
  positions: number;
  applications: number;
}

export async function listExercises(): Promise<AdminExercise[]> {
  const { data } = await request<{ data: AdminExercise[] }>('/api/admin/exercises');
  return data;
}

export interface CreateExerciseInput {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  positions?: number;
}

export async function createExercise(input: CreateExerciseInput): Promise<AdminExercise> {
  const { data } = await request<{ data: AdminExercise }>('/api/admin/exercises', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data;
}

export async function patchExercise(
  id: string,
  patch: Partial<CreateExerciseInput> & { status?: ExerciseStatus },
): Promise<void> {
  await request(`/api/admin/exercises/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// ─── Reviewer Pipeline (Sub-project A) ───────────────────────────────────

import type {
  AdminApplicationListItem,
  AdminApplicationDetail,
  DocDecision,
  AppealResolution,
} from '@/types/recruitment';

export async function listApplications(filters?: {
  status?: string;
  exercise_id?: string;
  search?: string;
  claimed_by_me?: boolean;
}): Promise<AdminApplicationListItem[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.exercise_id) params.set('exercise_id', filters.exercise_id);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.claimed_by_me) params.set('claimed_by_me', '1');
  const qs = params.toString();
  const { data } = await request<{ data: AdminApplicationListItem[] }>(
    `/api/admin/applications${qs ? `?${qs}` : ''}`,
  );
  return data;
}

export async function getApplicationDetail(id: string): Promise<AdminApplicationDetail> {
  const { data } = await request<{ data: AdminApplicationDetail }>(
    `/api/admin/applications/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function claimApplication(id: string): Promise<void> {
  await request(`/api/admin/applications/${encodeURIComponent(id)}/claim`, { method: 'POST' });
}

export async function releaseApplication(id: string): Promise<void> {
  await request(`/api/admin/applications/${encodeURIComponent(id)}/claim`, { method: 'DELETE' });
}

export async function getDocumentSignedUrl(
  applicationId: string,
  docTypeId: string,
): Promise<string> {
  const { data } = await request<{ data: { url: string } }>(
    `/api/admin/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(docTypeId)}/url`,
  );
  return data.url;
}

export interface DocDecisionInput {
  document_type_id: string;
  decision: DocDecision;
  reason?: string;
}

export async function submitVettingDecision(
  applicationId: string,
  body: { document_decisions: DocDecisionInput[]; notes?: string },
): Promise<{ outcome: 'vetting_passed' | 'vetting_failed' | 'requires_action' }> {
  const { data } = await request<{
    data: { outcome: 'vetting_passed' | 'vetting_failed' | 'requires_action' };
  }>(`/api/admin/applications/${encodeURIComponent(applicationId)}/vetting`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data;
}

export async function listAppeals(): Promise<AdminApplicationListItem[]> {
  const { data } = await request<{ data: AdminApplicationListItem[] }>(
    '/api/admin/applications/appeals',
  );
  return data;
}

export async function resolveAppeal(
  applicationId: string,
  resolution: AppealResolution,
): Promise<void> {
  await request(
    `/api/admin/applications/${encodeURIComponent(applicationId)}/appeals/resolve`,
    { method: 'POST', body: JSON.stringify(resolution) },
  );
}
