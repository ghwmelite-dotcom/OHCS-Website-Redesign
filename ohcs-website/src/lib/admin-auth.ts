import type { AdminSession, AdminUser } from '@/types';
import { audit } from '@/lib/audit-logger';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
const TOKEN_KEY = 'ohcs_admin_token';
const USER_KEY = 'ohcs_admin_user';

// Reads from localStorage — controlled by Super Admin in Settings page
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('ohcs_auth_demo_mode');
  return stored === null ? true : stored === 'true';
}

const DEMO_USERS: Record<string, { password: string; user: AdminUser }> = {
  'admin@ohcs.gov.gh': {
    password: 'changeme123',
    user: { id: 'demo-001', email: 'admin@ohcs.gov.gh', name: 'Kwame Mensah', role: 'super_admin' },
  },
  'content@ohcs.gov.gh': {
    password: 'content123',
    user: { id: 'demo-002', email: 'content@ohcs.gov.gh', name: 'Abena Osei', role: 'content_manager' },
  },
  'recruitment@ohcs.gov.gh': {
    password: 'recruit123',
    user: { id: 'demo-003', email: 'recruitment@ohcs.gov.gh', name: 'Kofi Adjei', role: 'recruitment_admin' },
  },
  'viewer@ohcs.gov.gh': {
    password: 'viewer123',
    user: { id: 'demo-004', email: 'viewer@ohcs.gov.gh', name: 'Ama Darko', role: 'viewer' },
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

  if (isDemoMode()) {
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
    audit('login', 'session', demoUser.user.id, demoUser.user.name, 'Logged in');
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
  audit('logout', 'session', '', '', 'Logged out');

  // 1) Magic-link session — POST to /logout endpoint, server clears cookie.
  try {
    await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // Best effort.
  }

  // 2) Demo fallback — clear localStorage.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function getAdminUser(): Promise<AdminUser | null> {
  // 1) Cookie-backed session (magic-link path) — preferred
  try {
    const res = await fetch('/api/admin/auth/me', { credentials: 'include' });
    if (res.ok) {
      const body = (await res.json()) as { data: { email: string; role: string } };
      const rawRole = body.data.role;
      const validRoles: AdminUser['role'][] = ['super_admin', 'content_manager', 'recruitment_admin', 'viewer'];
      const role = validRoles.includes(rawRole as AdminUser['role'])
        ? (rawRole as AdminUser['role'])
        : 'viewer';
      return {
        id: `cookie-${body.data.email}`,
        email: body.data.email,
        name: body.data.email.split('@')[0] ?? body.data.email,
        role,
      };
    }
  } catch {
    // Fall through to demo path.
  }

  // 2) Demo fallback (localStorage)
  if (isDemoMode()) {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AdminUser;
    } catch {
      return null;
    }
  }

  return null;
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
