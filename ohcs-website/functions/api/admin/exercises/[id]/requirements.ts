//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { parseBody } from '../../../../_shared/validate';
import { all, run } from '../../../../_shared/db';
import { z } from 'zod';
import {
  rowToRequirement,
  type ExerciseRequirementRow,
} from '../../../../../src/types/recruitment';

const RequirementInput = z.object({
  document_type_id: z.string().min(1),
  is_required: z.boolean(),
  conditional_on: z.enum(['has_professional_qualification', 'is_pwd']).nullable(),
  display_order: z.number().int().nonnegative(),
  max_mb_override: z.number().int().min(1).max(50).nullable(),
});

const PutSchema = z.object({
  requirements: z
    .array(RequirementInput)
    .max(50)
    .refine(
      (rs) => new Set(rs.map((r) => r.document_type_id)).size === rs.length,
      { message: 'duplicate document_type_id in requirements list' },
    ),
});

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const rows = await all<ExerciseRequirementRow>(
    env,
    'SELECT * FROM exercise_document_requirements WHERE exercise_id = ? ORDER BY display_order ASC',
    params.id,
  );
  return json({ data: rows.map(rowToRequirement) });
};

export const onRequestPut: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const body = await parseBody(request, PutSchema);
  if (body.kind === 'reject') return body.response;
  const v = body.value;

  const now = Date.now();
  await run(env, 'DELETE FROM exercise_document_requirements WHERE exercise_id = ?', params.id);

  for (const r of v.requirements) {
    const id = `edr_${params.id}_${r.document_type_id}`;
    await run(
      env,
      'INSERT INTO exercise_document_requirements (id, exercise_id, document_type_id, is_required, conditional_on, display_order, max_mb_override, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      params.id,
      r.document_type_id,
      r.is_required ? 1 : 0,
      r.conditional_on,
      r.display_order,
      r.max_mb_override,
      now,
      now,
    );
  }

  return json({ data: { count: v.requirements.length, exercise_id: params.id } });
};
