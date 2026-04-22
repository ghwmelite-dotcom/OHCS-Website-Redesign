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
