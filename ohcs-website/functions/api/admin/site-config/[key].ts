//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseBody } from '../../../_shared/validate';
import { run } from '../../../_shared/db';
import { requireAdmin } from '../../../_shared/admin-auth';
import { z } from 'zod';

const Body = z.object({ value: z.string().min(1).max(2000) });

export const onRequestPut: PagesFunction<Env, 'key'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;

  const now = Date.now();
  await run(
    env,
    'INSERT INTO site_config (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by',
    params.key,
    parsed.value.value,
    now,
    auth.admin.email,
  );
  return json({ data: { key: params.key, value: parsed.value.value } });
};
