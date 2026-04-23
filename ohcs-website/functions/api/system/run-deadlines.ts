import type { PagesFunction, Env } from '../../_shared/types';
import { json } from '../../_shared/json';
import { run } from '../../_shared/db';

const STALE_CLAIM_MS = 30 * 60 * 1000;

export const onRequestPost: PagesFunction<Env & { SYSTEM_CRON_SECRET?: string }> = async ({
  request,
  env,
}) => {
  const auth = request.headers.get('Authorization');
  const expected = `Bearer ${env.SYSTEM_CRON_SECRET ?? ''}`;
  if (!env.SYSTEM_CRON_SECRET || auth !== expected) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = Date.now();

  // 1) Release stale claims
  await run(
    env,
    'UPDATE applications SET review_claimed_by = NULL, review_claimed_at = NULL WHERE review_claimed_at IS NOT NULL AND review_claimed_at < ?',
    now - STALE_CLAIM_MS,
  );

  // 2) requires_action past resubmission deadline → vetting_failed
  await run(
    env,
    "UPDATE applications SET status = 'vetting_failed' WHERE status = 'requires_action' AND id IN (SELECT a.id FROM applications a JOIN application_review_decisions ard ON ard.application_id = a.id JOIN recruitment_exercises e ON e.id = a.exercise_id WHERE a.status = 'requires_action' AND ard.outcome = 'requires_action' AND ard.created_at + (e.vetting_window_days * 86400000) < ?)",
    now,
  );

  return json({ data: { ran_at: now } });
};
