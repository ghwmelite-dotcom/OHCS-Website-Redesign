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
  review_claimed_by: string | null;
  doc_count: number;
  doc_required_count: number;
  ai_flag_count: number;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const exerciseId = url.searchParams.get('exercise_id');
  const search = url.searchParams.get('search');
  const claimedByMe = url.searchParams.get('claimed_by_me') === '1';

  // First bind is for the ai_flag_count subquery ('flagged'); subsequent
  // binds populate the dynamic WHERE clauses (default excludes drafts).
  const wheres: string[] = ['a.status != ?'];
  const binds: unknown[] = ['flagged', 'draft'];
  if (status) {
    wheres[0] = 'a.status = ?';
    binds[1] = status;
  }
  if (exerciseId) {
    wheres.push('a.exercise_id = ?');
    binds.push(exerciseId);
  }
  if (search) {
    wheres.push('(a.id LIKE ? OR a.email LIKE ?)');
    binds.push(`%${search}%`, `%${search}%`);
  }
  if (claimedByMe) {
    wheres.push('a.review_claimed_by = ?');
    binds.push(auth.admin.email);
  }

  const sql = `SELECT a.id, a.exercise_id, a.email, a.status, a.submitted_at, a.review_claimed_by, (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id) AS doc_count, (SELECT COUNT(*) FROM exercise_document_requirements WHERE exercise_id = a.exercise_id AND is_required = 1) AS doc_required_count, (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id AND ai_verdict = ?) AS ai_flag_count FROM applications a WHERE ${wheres.join(' AND ')} ORDER BY a.submitted_at DESC LIMIT 50`;

  const rows = await all<Row>(env, sql, ...binds);
  return json({ data: rows });
};
