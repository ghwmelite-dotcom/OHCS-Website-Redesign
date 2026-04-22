import type { Application, ApplicationFormData } from '@/types/recruitment';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    const err = new Error(`API ${res.status}: ${txt}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function startApplication(input: {
  email: string;
  exercise_id: string;
}): Promise<{ sent: true; exercise_id: string }> {
  const { data } = await request<{ data: { sent: true; exercise_id: string } }>(
    '/api/applications/start',
    { method: 'POST', body: JSON.stringify(input) },
  );
  return data;
}

export async function getDraft(): Promise<Application> {
  const { data } = await request<{ data: Application }>('/api/applications/me');
  return data;
}

export interface SaveDraftInput {
  form_patch?: Partial<ApplicationFormData>;
  has_professional_qualification?: boolean;
  is_pwd?: boolean;
}

export async function saveDraft(patch: SaveDraftInput): Promise<{ last_saved_at: number }> {
  const { data } = await request<{ data: { last_saved_at: number } }>('/api/applications/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return data;
}

export async function logout(): Promise<void> {
  await request('/api/applications/me/logout', { method: 'POST' });
}

// ─── Documents (Phase 3) ─────────────────────────────────────────────────

import type { ApplicantRequirementsView, ApplicationDocument } from '@/types/recruitment';

export async function getRequirements(): Promise<ApplicantRequirementsView> {
  const { data } = await request<{ data: ApplicantRequirementsView }>(
    '/api/applications/me/requirements',
  );
  return data;
}

export async function uploadDocument(
  docTypeId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ApplicationDocument> {
  // Use XHR (not fetch) so we get upload progress events
  const fd = new FormData();
  fd.append('file', file);
  return new Promise<ApplicationDocument>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/applications/me/documents/${encodeURIComponent(docTypeId)}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as { data: ApplicationDocument };
          resolve(parsed.data);
        } catch {
          reject(new Error(`bad response ${xhr.status}`));
        }
      } else {
        reject(new Error(`upload failed ${xhr.status}: ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error('network error during upload'));
    xhr.send(fd);
  });
}

export async function deleteDocument(docTypeId: string): Promise<void> {
  await request(`/api/applications/me/documents/${encodeURIComponent(docTypeId)}`, {
    method: 'DELETE',
  });
}

export async function submitApplication(): Promise<{
  reference_number: string;
  status: string;
  submitted_at: number;
}> {
  const { data } = await request<{
    data: { reference_number: string; status: string; submitted_at: number };
  }>('/api/applications/me/submit', { method: 'POST' });
  return data;
}

export async function trackApplication(
  ref: string,
  email: string,
): Promise<{
  reference_number: string;
  exercise_id: string;
  status: string;
  submitted_at: number | null;
  created_at: number;
}> {
  const params = new URLSearchParams({ ref, email });
  const { data } = await request<{
    data: {
      reference_number: string;
      exercise_id: string;
      status: string;
      submitted_at: number | null;
      created_at: number;
    };
  }>(`/api/applications/track?${params.toString()}`);
  return data;
}
