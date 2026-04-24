import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseAdminSessionId } from '../../../_shared/admin-cookies';
import { readAdminSession } from '../../../_shared/admin-session';

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const sessionId = parseAdminSessionId(request);
  if (!sessionId) return json({ error: 'unauthenticated' }, { status: 401 });

  const session = await readAdminSession(env, sessionId);
  if (!session) return json({ error: 'unauthenticated' }, { status: 401 });

  return json({ data: { email: session.email, role: session.role } });
};
