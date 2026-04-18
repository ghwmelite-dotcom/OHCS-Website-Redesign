import type { AdminSession, AdminUser } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
const TOKEN_KEY = 'ohcs_admin_token';
const USER_KEY = 'ohcs_admin_user';

// Demo mode — when the Worker API is not running, use local demo credentials
const DEMO_MODE = true; // Set to false when Worker is deployed

const DEMO_USERS: Record<string, { password: string; user: AdminUser }> = {
  'admin@ohcs.gov.gh': {
    password: 'changeme123',
    user: { id: 'demo-001', email: 'admin@ohcs.gov.gh', name: 'System Administrator', role: 'super_admin' },
  },
  'content@ohcs.gov.gh': {
    password: 'content123',
    user: { id: 'demo-002', email: 'content@ohcs.gov.gh', name: 'Content Manager', role: 'content_manager' },
  },
  'recruitment@ohcs.gov.gh': {
    password: 'recruit123',
    user: { id: 'demo-003', email: 'recruitment@ohcs.gov.gh', name: 'Recruitment Officer', role: 'recruitment_admin' },
  },
  'viewer@ohcs.gov.gh': {
    password: 'viewer123',
    user: { id: 'demo-004', email: 'viewer@ohcs.gov.gh', name: 'Senior Reviewer', role: 'viewer' },
  },
};

export async function adminLogin(
  email: string,
  password: string,
): Promise<AdminSession> {
  // Enforce @ohcs.gov.gh
  if (!email.endsWith('@ohcs.gov.gh')) {
    throw new Error('Only @ohcs.gov.gh email addresses are permitted.');
  }

  if (DEMO_MODE) {
    const demoUser = DEMO_USERS[email.toLowerCase()];
    if (!demoUser || demoUser.password !== password) {
      throw new Error('Invalid email or password.');
    }

    const token = `demo-token-${Date.now()}`;
    const session: AdminSession = {
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user: demoUser.user,
    };

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser.user));
    return session;
  }

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
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function adminLogout(): Promise<void> {
  const token = getToken();

  if (!DEMO_MODE && token) {
    await fetch(`${API_BASE}/api/v1/admin/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const token = getToken();
  if (!token) return null;

  if (DEMO_MODE) {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AdminUser;
    } catch {
      return null;
    }
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
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
