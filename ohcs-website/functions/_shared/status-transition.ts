import type { Env } from './types';
import { run } from './db';

export interface TransitionInput {
  applicationId: string;
  fromStatus: string;
  toStatus: string;
  actorEmail?: string;
  actorRole?: 'recruitment_admin' | 'reviewer' | 'applicant' | 'system';
  reason?: string;
}

export async function recordTransition(env: Env, input: TransitionInput): Promise<void> {
  const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const now = Date.now();

  await run(
    env,
    'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    id,
    input.applicationId,
    input.fromStatus,
    input.toStatus,
    input.actorEmail ?? null,
    input.actorRole ?? null,
    input.reason ?? null,
    now,
  );

  await run(env, 'UPDATE applications SET status = ? WHERE id = ?', input.toStatus, input.applicationId);
}
