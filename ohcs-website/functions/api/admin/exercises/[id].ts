//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { parseBody } from '../../../_shared/validate';
import { run } from '../../../_shared/db';
import { z } from 'zod';

const PatchSchema = z.object({
  status: z.enum(['draft', 'active', 'closed', 'completed']).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  positions: z.number().int().min(0).max(10000).optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'at least one field is required' });

export const onRequestPatch: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const body = await parseBody(request, PatchSchema);
  if (body.kind === 'reject') return body.response;
  const v = body.value;

  const now = Date.now();

  // Enforce single-active-exercise invariant: when transitioning to 'active',
  // close any other currently-active exercise first. This is what the public
  // /api/exercises/active endpoint relies on (it returns the first match).
  if (v.status === 'active') {
    await run(
      env,
      "UPDATE recruitment_exercises SET status = 'closed', updated_at = ? WHERE status = 'active' AND id != ?",
      now,
      params.id,
    );
  }

  const sets: string[] = [];
  const binds: unknown[] = [];
  if (v.status !== undefined) { sets.push('status = ?'); binds.push(v.status); }
  if (v.name !== undefined) { sets.push('name = ?'); binds.push(v.name); }
  if (v.description !== undefined) { sets.push('description = ?'); binds.push(v.description); }
  if (v.start_date !== undefined) { sets.push('start_date = ?'); binds.push(v.start_date); }
  if (v.end_date !== undefined) { sets.push('end_date = ?'); binds.push(v.end_date); }
  if (v.positions !== undefined) { sets.push('positions = ?'); binds.push(v.positions); }
  sets.push('updated_at = ?'); binds.push(now);
  binds.push(params.id);

  await run(env, `UPDATE recruitment_exercises SET ${sets.join(', ')} WHERE id = ?`, ...binds);
  return json({ data: { id: params.id, updated_at: now } });
};
