//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseBody } from '../../../_shared/validate';
import { run } from '../../../_shared/db';
import { requireAdmin } from '../../../_shared/admin-auth';
import { z } from 'zod';

const ROLES = ['super_admin', 'recruitment_admin', 'content_manager', 'viewer'] as const;

const PatchBody = z.object({
  role: z.enum(ROLES).optional(),
  display_name: z.string().min(1).max(120).optional(),
  is_active: z.boolean().optional(),
});

export const onRequestPatch: PagesFunction<Env, 'email'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, PatchBody);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;
  const now = Date.now();

  await run(
    env,
    'UPDATE admin_users SET role = COALESCE(?, role), display_name = COALESCE(?, display_name), is_active = COALESCE(?, is_active), updated_at = ? WHERE email = ?',
    v.role ?? null,
    v.display_name ?? null,
    v.is_active === undefined ? null : v.is_active ? 1 : 0,
    now,
    params.email,
  );

  // Role change OR deactivation invalidates active sessions.
  if (v.role || v.is_active === false) {
    await run(env, 'DELETE FROM admin_sessions WHERE email = ?', params.email);
  }

  return json({ data: { email: params.email } });
};

export const onRequestDelete: PagesFunction<Env, 'email'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }
  if (params.email === auth.admin.email) {
    return json({ error: 'cannot deactivate yourself' }, { status: 409 });
  }

  const now = Date.now();
  await run(
    env,
    'UPDATE admin_users SET is_active = 0, updated_at = ? WHERE email = ?',
    now,
    params.email,
  );
  await run(env, 'DELETE FROM admin_sessions WHERE email = ?', params.email);

  return json({ data: { email: params.email, deactivated: true } });
};
