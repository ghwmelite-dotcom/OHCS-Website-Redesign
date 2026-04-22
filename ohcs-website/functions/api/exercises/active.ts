import type { PagesFunction } from '../../_shared/types';
import { json } from '../../_shared/json';
import { first } from '../../_shared/db';

interface ExerciseRow {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  positions: number;
}

export const onRequestGet: PagesFunction = async ({ env }) => {
  const row = await first<ExerciseRow>(
    env,
    "SELECT id, name, description, start_date, end_date, status, positions FROM recruitment_exercises WHERE status = 'active' LIMIT 1",
  );
  if (!row) {
    return json({ error: 'no active exercise', code: 'NO_ACTIVE_EXERCISE' }, { status: 404 });
  }
  return json({ data: row });
};
