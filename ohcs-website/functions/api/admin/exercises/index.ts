//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { parseBody } from '../../../_shared/validate';
import { all, run } from '../../../_shared/db';
import { z } from 'zod';

interface ExerciseRow {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  positions: number;
  applications: number;
}

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  positions: z.number().int().min(0).max(10000).optional(),
});

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const rows = await all<ExerciseRow>(
    env,
    'SELECT e.id, e.name, e.description, e.start_date, e.end_date, e.status, e.positions, (SELECT COUNT(*) FROM applications WHERE exercise_id = e.id) AS applications FROM recruitment_exercises e ORDER BY e.created_at DESC',
  );
  return json({ data: rows });
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const body = await parseBody(request, CreateSchema);
  if (body.kind === 'reject') return body.response;
  const v = body.value;

  const now = Date.now();
  const id = `ex-${String(now).slice(-9)}`;
  await run(
    env,
    'INSERT INTO recruitment_exercises (id, name, description, start_date, end_date, status, positions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id,
    v.name,
    v.description ?? null,
    v.start_date,
    v.end_date,
    'draft',
    v.positions ?? 0,
    now,
    now,
  );

  return json(
    {
      data: {
        id,
        name: v.name,
        description: v.description ?? null,
        start_date: v.start_date,
        end_date: v.end_date,
        status: 'draft',
        positions: v.positions ?? 0,
        applications: 0,
      },
    },
    { status: 201 },
  );
};
