//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { first } from '../../../_shared/db';
import { requireAdmin } from '../../../_shared/admin-auth';

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  if (!status) return json({ error: 'status required' }, { status: 400 });

  if (status === 'single') {
    const applicationId = url.searchParams.get('application_id');
    if (!applicationId) return json({ error: 'application_id required for single' }, { status: 400 });
    const row = await first<{ n: number }>(
      env,
      'SELECT COUNT(*) AS n FROM applications WHERE id = ?',
      applicationId,
    );
    return json({ data: { count: row?.n ?? 0 } });
  }

  const exerciseId = url.searchParams.get('exercise_id');
  if (!exerciseId) return json({ error: 'exercise_id required' }, { status: 400 });

  const row = await first<{ n: number }>(
    env,
    'SELECT COUNT(*) AS n FROM applications WHERE exercise_id = ? AND status = ?',
    exerciseId,
    status,
  );
  return json({ data: { count: row?.n ?? 0 } });
};
