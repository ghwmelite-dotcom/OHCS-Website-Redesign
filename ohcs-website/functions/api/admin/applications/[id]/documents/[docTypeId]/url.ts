//
// SECURITY: see functions/_shared/admin-auth.ts header.
//
// Returns a one-shot HMAC-signed URL the browser uses to fetch the actual
// file through the sibling `/file` endpoint. Token TTL = 60s.
// SYSTEM_CRON_SECRET is used as the HMAC signing key.

import type { PagesFunction, Env } from '../../../../../../_shared/types';
import { json } from '../../../../../../_shared/json';
import { requireAdmin } from '../../../../../../_shared/admin-auth';
import { first } from '../../../../../../_shared/db';

const TTL_SECONDS = 60;

async function hmacToken(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

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

  const p = params as unknown as ParamsLocal;
  const exists = await first<{ r2_key: string }>(
    env,
    'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
    p.id,
    p.docTypeId,
  );
  if (!exists) return json({ error: 'document not found' }, { status: 404 });

  const expiry = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const secret = env.SYSTEM_CRON_SECRET ?? 'dev-secret-not-for-prod';
  const payload = `${p.id}:${p.docTypeId}:${expiry}`;
  const sig = await hmacToken(secret, payload);

  const url = `/api/admin/applications/${encodeURIComponent(p.id)}/documents/${encodeURIComponent(p.docTypeId)}/file?expires=${expiry}&sig=${sig}`;
  return json({ data: { url, expires_at: expiry * 1000 } });
};
