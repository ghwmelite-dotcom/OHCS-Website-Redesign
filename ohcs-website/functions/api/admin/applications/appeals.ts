//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { all } from '../../../_shared/db';

interface Row {
  id: string;
  exercise_id: string;
  email: string;
  status: string;
  submitted_at: number | null;
  appeal_submitted_at: number | null;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'recruitment_admin' && auth.admin.role !== 'super_admin') {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  // Exclude appeals where the *latest* application_review_decisions row was
  // authored by the caller (so reviewers can't review their own decisions).
  // The previous version's `ORDER BY ... LIMIT 1` inside `NOT EXISTS` was a
  // no-op and excluded any application the caller had EVER reviewed.
  const rows = await all<Row>(
    env,
    'SELECT a.id, a.exercise_id, a.email, a.status, a.submitted_at, a.appeal_submitted_at FROM applications a WHERE a.status = ? AND NOT EXISTS (SELECT 1 FROM application_review_decisions ard WHERE ard.application_id = a.id AND ard.reviewer_email = ? AND ard.created_at = (SELECT MAX(created_at) FROM application_review_decisions WHERE application_id = a.id)) ORDER BY a.appeal_submitted_at ASC',
    'appeal_under_review',
    auth.admin.email,
  );
  return json({ data: rows });
};
