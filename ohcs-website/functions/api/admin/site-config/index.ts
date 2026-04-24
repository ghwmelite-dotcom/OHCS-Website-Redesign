//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { all } from '../../../_shared/db';
import { requireAdmin } from '../../../_shared/admin-auth';

interface ConfigRow {
  key: string;
  value: string;
  updated_at: number;
  updated_by: string | null;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }

  const rows = await all<ConfigRow>(
    env,
    'SELECT key, value, updated_at, updated_by FROM site_config ORDER BY key ASC',
  );
  return json({ data: rows });
};
