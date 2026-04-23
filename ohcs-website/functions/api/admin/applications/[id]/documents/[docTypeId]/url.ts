//
// SECURITY: see functions/_shared/admin-auth.ts header.
//
// Returns a one-shot HMAC-signed URL the browser uses to fetch the actual
// file through the sibling `/file` endpoint. Token TTL = 60s.
// SYSTEM_CRON_SECRET is used as the HMAC signing key — it MUST be set in
// production; the endpoint hard-fails (500) if it isn't.

import type { PagesFunction, Env } from '../../../../../../_shared/types';
import { json } from '../../../../../../_shared/json';
import { requireAdmin } from '../../../../../../_shared/admin-auth';
import { first } from '../../../../../../_shared/db';
import { hmacSign } from '../../../../../../_shared/hmac';
import { requireSecret, MissingSecretError } from '../../../../../../_shared/secrets';

const TTL_SECONDS = 60;

interface ParamsLocal {
  id: string;
  docTypeId: string;
}

export const onRequestGet: PagesFunction<
  Env & { SYSTEM_CRON_SECRET?: string },
  keyof ParamsLocal
> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  let secret: string;
  try {
    secret = requireSecret(env as unknown as Record<string, unknown>, 'SYSTEM_CRON_SECRET');
  } catch (err) {
    if (err instanceof MissingSecretError) {
      console.error(err.message);
      return json({ error: 'server misconfigured' }, { status: 500 });
    }
    throw err;
  }

  const p = params as unknown as ParamsLocal;
  const exists = await first<{ r2_key: string }>(
    env,
    'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
    p.id,
    p.docTypeId,
  );
  if (!exists) return json({ error: 'document not found' }, { status: 404 });

  const expiry = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${p.id}:${p.docTypeId}:${expiry}`;
  const sig = await hmacSign(secret, payload);

  const url = `/api/admin/applications/${encodeURIComponent(p.id)}/documents/${encodeURIComponent(p.docTypeId)}/file?expires=${expiry}&sig=${sig}`;
  return json({ data: { url, expires_at: expiry * 1000 } });
};
