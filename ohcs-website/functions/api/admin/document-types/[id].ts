//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { parseBody } from '../../../_shared/validate';
import { first, run } from '../../../_shared/db';
import { z } from 'zod';
import { rowToDocumentType, type DocumentTypeRow } from '../../../../src/types/recruitment';

const PatchSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  default_max_mb: z.number().int().min(1).max(50).optional(),
  accepted_mimes: z.array(z.string().min(1)).min(1).optional(),
  ai_check_type: z.enum(['certificate', 'photo', 'identity']).nullable().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'at least one field is required' });

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const row = await first<DocumentTypeRow>(env, 'SELECT * FROM document_types WHERE id = ?', params.id);
  if (!row) return json({ error: 'not found' }, { status: 404 });
  return json({ data: rowToDocumentType(row) });
};

export const onRequestPatch: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const body = await parseBody(request, PatchSchema);
  if (body.kind === 'reject') return body.response;
  const v = body.value;

  const now = Date.now();
  const sets: string[] = [];
  const binds: unknown[] = [];
  if (v.label !== undefined) { sets.push('label = ?'); binds.push(v.label); }
  if (v.description !== undefined) { sets.push('description = ?'); binds.push(v.description); }
  if (v.default_max_mb !== undefined) { sets.push('default_max_mb = ?'); binds.push(v.default_max_mb); }
  if (v.accepted_mimes !== undefined) { sets.push('accepted_mimes = ?'); binds.push(JSON.stringify(v.accepted_mimes)); }
  if (v.ai_check_type !== undefined) { sets.push('ai_check_type = ?'); binds.push(v.ai_check_type); }
  sets.push('updated_at = ?'); binds.push(now);
  binds.push(params.id);

  await run(env, `UPDATE document_types SET ${sets.join(', ')} WHERE id = ?`, ...binds);
  return json({ data: { id: params.id, updated_at: now } });
};

export const onRequestDelete: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  await run(env, 'UPDATE document_types SET is_active = 0, updated_at = ? WHERE id = ?', Date.now(), params.id);
  return new Response(null, { status: 204 });
};
