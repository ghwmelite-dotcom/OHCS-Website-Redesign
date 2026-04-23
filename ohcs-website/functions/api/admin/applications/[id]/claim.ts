//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { first, run } from '../../../../_shared/db';

const CLAIM_TTL_MS = 30 * 60 * 1000;

export const onRequestPost: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const now = Date.now();
  const row = await first<{
    review_claimed_by: string | null;
    review_claimed_at: number | null;
    status: string;
  }>(
    env,
    'SELECT review_claimed_by, review_claimed_at, status FROM applications WHERE id = ?',
    params.id,
  );
  if (!row) return json({ error: 'not found' }, { status: 404 });
  if (row.status !== 'submitted' && row.status !== 'under_review') {
    return json(
      { error: 'application is not in a reviewable state', status: row.status },
      { status: 409 },
    );
  }

  if (
    row.review_claimed_by &&
    row.review_claimed_by !== auth.admin.email &&
    row.review_claimed_at !== null &&
    now - row.review_claimed_at < CLAIM_TTL_MS
  ) {
    return json(
      {
        error: 'already claimed',
        claimed_by: row.review_claimed_by,
        claimed_at: row.review_claimed_at,
      },
      { status: 409 },
    );
  }

  await run(
    env,
    'UPDATE applications SET review_claimed_by = ?, review_claimed_at = ?, status = ? WHERE id = ?',
    auth.admin.email,
    now,
    'under_review',
    params.id,
  );

  if (row.status === 'submitted') {
    await run(
      env,
      'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      `tx_${now}_${Math.random().toString(36).slice(2, 10)}`,
      params.id,
      'submitted',
      'under_review',
      auth.admin.email,
      auth.admin.role,
      'Reviewer claimed application',
      now,
    );
  }

  return json({ data: { claimed_by: auth.admin.email, claimed_at: now } });
};

export const onRequestDelete: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  await run(
    env,
    'UPDATE applications SET review_claimed_by = NULL, review_claimed_at = NULL WHERE id = ? AND review_claimed_by = ?',
    params.id,
    auth.admin.email,
  );
  return new Response(null, { status: 204 });
};
