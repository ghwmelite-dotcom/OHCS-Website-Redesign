import type { Env } from './types';
import { json } from './json';
import { first, run } from './db';
import { readSessionCookie } from './cookies';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface ApplicantContext {
  id: string;
  exercise_id: string;
  email: string;
  status: string;
}

export interface SessionContext {
  session_id: string;
  expires_at: number;
}

export type ApplicantAuthResult =
  | { kind: 'ok'; application: ApplicantContext; session: SessionContext }
  | { kind: 'reject'; response: Response };

interface JoinedRow {
  session_id: string;
  application_id: string;
  expires_at: number;
  exercise_id: string;
  email: string;
  status: string;
}

export async function requireApplicant(request: Request, env: Env): Promise<ApplicantAuthResult> {
  const sessionId = readSessionCookie(request);
  if (!sessionId) {
    return {
      kind: 'reject',
      response: json({ error: 'authentication required', code: 'AUTH_MISSING' }, { status: 401 }),
    };
  }

  const now = Date.now();
  const row = await first<JoinedRow>(
    env,
    'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
    sessionId,
    now,
  );

  if (!row) {
    return {
      kind: 'reject',
      response: json({ error: 'session expired or invalid', code: 'AUTH_SESSION_INVALID' }, { status: 401 }),
    };
  }

  // Sliding session: bump last_used_at + push expires_at forward.
  const newExpires = now + SESSION_TTL_SECONDS * 1000;
  await run(
    env,
    'UPDATE application_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
    now,
    newExpires,
    sessionId,
  );

  return {
    kind: 'ok',
    application: {
      id: row.application_id,
      exercise_id: row.exercise_id,
      email: row.email,
      status: row.status,
    },
    session: { session_id: row.session_id, expires_at: newExpires },
  };
}
