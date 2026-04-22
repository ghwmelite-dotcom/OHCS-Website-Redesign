import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { run } from '../../../_shared/db';
import { readSessionCookie, buildClearSessionCookie } from '../../../_shared/cookies';

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const sid = readSessionCookie(request);
  if (sid) {
    await run(env, 'DELETE FROM application_sessions WHERE session_id = ?', sid);
  }
  const res = json({ data: { logged_out: true } });
  res.headers.set('Set-Cookie', buildClearSessionCookie());
  return res;
};
