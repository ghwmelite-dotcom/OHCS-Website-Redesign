//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { parseBody } from '../../../../_shared/validate';
import { first, run } from '../../../../_shared/db';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { z } from 'zod';

const PatchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  subject: z.string().min(1).max(300).optional(),
  body_text: z.string().min(1).max(20000).optional(),
  body_html: z.string().max(40000).optional(),
  sms_body: z.string().max(320).optional(),
});

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  body_text: string;
  body_html: string | null;
  sms_body: string | null;
  created_at: number;
  updated_at: number;
}

function requireRecruitmentAdmin(role: string): boolean {
  return role === 'super_admin' || role === 'recruitment_admin';
}

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;

  const row = await first<TemplateRow>(
    env,
    'SELECT id, name, description, subject, body_text, body_html, sms_body, created_at, updated_at FROM comm_templates WHERE id = ?',
    params.id,
  );
  if (!row) return json({ error: 'not found' }, { status: 404 });
  return json({ data: row });
};

export const onRequestPatch: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (!requireRecruitmentAdmin(auth.admin.role)) {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, PatchBody);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;
  const now = Date.now();

  await run(
    env,
    'UPDATE comm_templates SET name = COALESCE(?, name), description = COALESCE(?, description), subject = COALESCE(?, subject), body_text = COALESCE(?, body_text), body_html = COALESCE(?, body_html), sms_body = COALESCE(?, sms_body), updated_at = ?, updated_by = ? WHERE id = ?',
    v.name ?? null,
    v.description ?? null,
    v.subject ?? null,
    v.body_text ?? null,
    v.body_html ?? null,
    v.sms_body ?? null,
    now,
    auth.admin.email,
    params.id,
  );

  return json({ data: { id: params.id } });
};

export const onRequestDelete: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (!requireRecruitmentAdmin(auth.admin.role)) {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  await run(env, 'DELETE FROM comm_templates WHERE id = ?', params.id);
  return json({ data: { id: params.id, deleted: true } });
};
