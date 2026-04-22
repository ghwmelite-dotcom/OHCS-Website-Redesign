import type { PagesFunction } from '../../_shared/types';
import { json } from '../../_shared/json';
import { first } from '../../_shared/db';

interface Row {
  id: string;
  exercise_id: string;
  status: string;
  submitted_at: number | null;
  created_at: number;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref')?.trim() ?? '';
  const email = url.searchParams.get('email')?.trim().toLowerCase() ?? '';
  if (!ref || !email) {
    return json({ error: 'ref and email query params required' }, { status: 400 });
  }
  const row = await first<Row>(
    env,
    'SELECT id, exercise_id, status, submitted_at, created_at FROM applications WHERE id = ? AND email = ?',
    ref,
    email,
  );
  if (!row) {
    return json({ error: 'no application found for that reference and email' }, { status: 404 });
  }
  return json({
    data: {
      reference_number: row.id,
      exercise_id: row.exercise_id,
      status: row.status,
      submitted_at: row.submitted_at,
      created_at: row.created_at,
    },
  });
};
