//
// SECURITY: see functions/_shared/admin-auth.ts header. This endpoint
// trusts X-Admin-User-Role headers — replace before production launch.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { parseBody } from '../../../_shared/validate';
import { all, run } from '../../../_shared/db';
import { z } from 'zod';
import {
  rowToDocumentType,
  type DocumentTypeRow,
} from '../../../../src/types/recruitment';

const CreateSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/, 'lowercase letters, numbers, underscores only'),
  label: z.string().min(1).max(200),
  description: z.string().max(500).nullable().optional(),
  default_max_mb: z.number().int().min(1).max(50),
  accepted_mimes: z.array(z.string().min(1)).min(1),
  ai_check_type: z.enum(['certificate', 'photo', 'identity']).nullable().optional(),
});

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const rows = await all<DocumentTypeRow>(env, 'SELECT * FROM document_types ORDER BY label');
  return json({ data: rows.map(rowToDocumentType) });
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const body = await parseBody(request, CreateSchema);
  if (body.kind === 'reject') return body.response;
  const v = body.value;

  const now = Date.now();
  await run(
    env,
    'INSERT INTO document_types (id, label, description, default_max_mb, accepted_mimes, ai_check_type, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
    v.id,
    v.label,
    v.description ?? null,
    v.default_max_mb,
    JSON.stringify(v.accepted_mimes),
    v.ai_check_type ?? null,
    now,
    now,
  );

  return json(
    {
      data: {
        id: v.id,
        label: v.label,
        description: v.description ?? null,
        default_max_mb: v.default_max_mb,
        accepted_mimes: v.accepted_mimes,
        ai_check_type: v.ai_check_type ?? null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    },
    { status: 201 },
  );
};
