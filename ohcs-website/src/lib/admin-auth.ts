import type { AdminSession, AdminUser } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
const TOKEN_KEY = 'ohcs_admin_token';

export async function adminLogin(
  email: string,
  password: string,
): Promise<AdminSession> {
  const res = await fetch(`${API_BASE}/api/v1/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({
      error: { message: 'Login failed' },
    }))) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? 'Login failed');
  }

  const { data } = (await res.json()) as { data: AdminSession };
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function adminLogout(): Promise<void> {
  const token = getToken();
  if (token) {
    await fetch(`${API_BASE}/api/v1/admin/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  localStorage.removeItem(TOKEN_KEY);
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    const { data } = (await res.json()) as { data: AdminUser };
    return data;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthorized(
  userRole: string,
  requiredRoles: string[],
): boolean {
  return requiredRoles.includes(userRole);
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  content_manager: 'Content Manager',
  recruitment_admin: 'Recruitment Admin',
  viewer: 'Viewer',
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-800',
  content_manager: 'bg-blue-100 text-blue-800',
  recruitment_admin: 'bg-amber-100 text-amber-800',
  viewer: 'bg-gray-100 text-gray-700',
};
