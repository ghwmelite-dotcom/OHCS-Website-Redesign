import type { PagesFunction } from '../../_shared/types';
import { json } from '../../_shared/json';
import { parseBody } from '../../_shared/validate';
import { first, run } from '../../_shared/db';
import { requireApplicant } from '../../_shared/applicant-session';
import { z } from 'zod';

interface ApplicationRow {
  id: string;
  exercise_id: string;
  email: string;
  status: string;
  has_professional_qualification: number;
  is_pwd: number;
  form_data: string | null;
  created_at: number;
  submitted_at: number | null;
  last_saved_at: number;
}

const PatchSchema = z
  .object({
    form_patch: z.record(z.string(), z.unknown()).optional(),
    has_professional_qualification: z.boolean().optional(),
    is_pwd: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'at least one field required' });

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;

  const row = await first<ApplicationRow>(
    env,
    'SELECT id, exercise_id, email, status, has_professional_qualification, is_pwd, form_data, created_at, submitted_at, last_saved_at FROM applications WHERE id = ?',
    auth.application.id,
  );
  if (!row) return json({ error: 'application not found' }, { status: 404 });

  return json({
    data: {
      id: row.id,
      exercise_id: row.exercise_id,
      email: row.email,
      status: row.status,
      has_professional_qualification: row.has_professional_qualification === 1,
      is_pwd: row.is_pwd === 1,
      form_data: row.form_data ? (JSON.parse(row.form_data) as Record<string, unknown>) : {},
      created_at: row.created_at,
      submitted_at: row.submitted_at,
      last_saved_at: row.last_saved_at,
    },
  });
};

export const onRequestPatch: PagesFunction = async ({ request, env }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.application.status !== 'draft') {
    return json(
      { error: 'application is not editable', code: 'NOT_DRAFT', status: auth.application.status },
      { status: 409 },
    );
  }

  const parsed = await parseBody(request, PatchSchema);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;

  // Build dynamic UPDATE — only set columns the patch actually touches.
  const sets: string[] = [];
  const binds: unknown[] = [];

  if (v.form_patch) {
    const cur = await first<{ form_data: string | null }>(
      env,
      'SELECT form_data FROM applications WHERE id = ?',
      auth.application.id,
    );
    const curObj = cur?.form_data ? (JSON.parse(cur.form_data) as Record<string, unknown>) : {};
    const merged = { ...curObj, ...v.form_patch };
    sets.push('form_data = ?');
    binds.push(JSON.stringify(merged));
  }

  if (v.has_professional_qualification !== undefined) {
    sets.push('has_professional_qualification = ?');
    binds.push(v.has_professional_qualification ? 1 : 0);
  }

  if (v.is_pwd !== undefined) {
    sets.push('is_pwd = ?');
    binds.push(v.is_pwd ? 1 : 0);
  }

  const now = Date.now();
  sets.push('last_saved_at = ?');
  binds.push(now);
  binds.push(auth.application.id);

  await run(env, `UPDATE applications SET ${sets.join(', ')} WHERE id = ?`, ...binds);

  return json({ data: { last_saved_at: now } });
};
