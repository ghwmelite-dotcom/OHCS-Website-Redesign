import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseBody } from '../../../_shared/validate';
import { run } from '../../../_shared/db';
import { requireApplicant } from '../../../_shared/applicant-session';
import { z } from 'zod';

const APPEALABLE = new Set(['vetting_failed', 'exam_failed', 'rejected']);

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (!APPEALABLE.has(auth.application.status)) {
    return json(
      { error: 'application is not in an appealable state', status: auth.application.status },
      { status: 409 },
    );
  }

  const Body = z.object({ reason: z.string().min(20).max(4000) });
  const body = await parseBody(request, Body);
  if (body.kind === 'reject') return body.response;

  const now = Date.now();

  await run(
    env,
    'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    `tx_${now}_${Math.random().toString(36).slice(2, 10)}`,
    auth.application.id,
    auth.application.status,
    'appeal_under_review',
    auth.application.email,
    'applicant',
    'Appeal submitted',
    now,
  );
  await run(
    env,
    'UPDATE applications SET status = ?, appeal_submitted_at = ?, appeal_reason = ? WHERE id = ?',
    'appeal_under_review',
    now,
    body.value.reason,
    auth.application.id,
  );

  return json({ data: { status: 'appeal_under_review' } });
};
