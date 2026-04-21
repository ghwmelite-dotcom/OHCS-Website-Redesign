const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';

interface ApiSuccess<T> {
  data: T;
  meta?: { page?: number; totalPages?: number; total?: number };
}

interface ApiError {
  error: { code: string; message: string; details?: unknown; requestId: string };
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiSuccess<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({
      error: { code: 'UNKNOWN', message: res.statusText, requestId: '' },
    }))) as ApiError;
    throw new Error(err.error.message);
  }

  return res.json();
}

export async function submitForm(type: string, data: Record<string, unknown>) {
  return request<{ referenceNumber: string; status: string; message: string }>(
    '/api/v1/submissions',
    { method: 'POST', body: JSON.stringify({ type, ...data }) },
  );
}

export async function trackSubmission(referenceNumber: string, contact: string) {
  return request<{
    referenceNumber: string;
    type: string;
    status: string;
    subject: string | null;
    createdAt: string;
    updatedAt: string;
    timeline: Array<{ id: string; status: string; note: string | null; created_at: string }>;
  }>('/api/v1/track', {
    method: 'POST',
    body: JSON.stringify({ referenceNumber, contact }),
  });
}
