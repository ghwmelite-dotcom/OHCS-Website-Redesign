import type { PagesFunction } from '../../../_shared/types';
import { parseAdminSessionId, buildClearAdminSessionCookie } from '../../../_shared/admin-cookies';
import { deleteAdminSession } from '../../../_shared/admin-session';
import { json } from '../../../_shared/json';

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const sessionId = parseAdminSessionId(request);
  if (sessionId) await deleteAdminSession(env, sessionId);

  return json({ data: { ok: true } }, {
    headers: {
      'Set-Cookie': buildClearAdminSessionCookie(),
    },
  });
};
