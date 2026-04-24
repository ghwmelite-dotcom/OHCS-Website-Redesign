//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { parseBody } from '../../../../_shared/validate';
import { all, run } from '../../../../_shared/db';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { z } from 'zod';

const Body = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  subject: z.string().min(1).max(300),
  body_text: z.string().min(1).max(20000),
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

function genId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;

  const rows = await all<TemplateRow>(
    env,
    'SELECT id, name, description, subject, body_text, body_html, sms_body, created_at, updated_at FROM comm_templates ORDER BY name ASC',
  );
  return json({ data: rows });
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin' && auth.admin.role !== 'recruitment_admin') {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;
  const now = Date.now();
  const id = genId();

  await run(
    env,
    'INSERT INTO comm_templates (id, name, description, subject, body_text, body_html, sms_body, created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id,
    v.name,
    v.description ?? null,
    v.subject,
    v.body_text,
    v.body_html ?? null,
    v.sms_body ?? null,
    now,
    auth.admin.email,
    now,
    auth.admin.email,
  );

  return json({ data: { id, name: v.name } }, { status: 201 });
};
