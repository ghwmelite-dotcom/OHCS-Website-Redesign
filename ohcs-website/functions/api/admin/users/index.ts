//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseBody } from '../../../_shared/validate';
import { all, run } from '../../../_shared/db';
import { requireAdmin } from '../../../_shared/admin-auth';
import { sendEmail } from '../../../_shared/email';
import { hashToken } from '../../../_shared/hash-token';
import { adminMagicLinkEmail } from '../../../_shared/admin-magic-link-email';
import { z } from 'zod';

const ROLES = ['super_admin', 'recruitment_admin', 'content_manager', 'viewer'] as const;

const Body = z.object({
  email: z.string().email().toLowerCase(),
  role: z.enum(ROLES),
  display_name: z.string().min(1).max(120).optional(),
});

const TOKEN_TTL_MS = 15 * 60 * 1000;
const TOKEN_TTL_MIN = 15;

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

interface AdminRow {
  email: string;
  role: string;
  display_name: string | null;
  is_active: number;
  created_at: number;
  last_login_at: number | null;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }

  const rows = await all<AdminRow>(
    env,
    'SELECT email, role, display_name, is_active, created_at, last_login_at FROM admin_users ORDER BY created_at ASC',
  );
  return json({ data: rows });
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;
  const now = Date.now();

  await run(
    env,
    'INSERT INTO admin_users (email, role, display_name, is_active, created_at, created_by, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)',
    v.email,
    v.role,
    v.display_name ?? null,
    now,
    auth.admin.email,
    now,
  );

  const token = generateToken();
  const tokenHash = await hashToken(token);
  await run(
    env,
    'INSERT INTO admin_magic_tokens (token, email, created_at, expires_at, ip_address) VALUES (?, ?, ?, ?, ?)',
    tokenHash,
    v.email,
    now,
    now + TOKEN_TTL_MS,
    null,
  );

  const origin = new URL(request.url).origin;
  const resumeUrl = `${origin}/api/admin/auth/magic/${encodeURIComponent(token)}`;
  const body = adminMagicLinkEmail(resumeUrl, TOKEN_TTL_MIN);
  try {
    await sendEmail(env, { to: v.email, subject: body.subject, html: body.html, text: body.text });
  } catch (err) {
    console.error('admin welcome email failed', err);
  }

  return json({ data: { email: v.email, role: v.role } }, { status: 201 });
};
