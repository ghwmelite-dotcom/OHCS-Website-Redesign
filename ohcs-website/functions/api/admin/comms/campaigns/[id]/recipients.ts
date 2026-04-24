//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../../../_shared/types';
import { json } from '../../../../../_shared/json';
import { all } from '../../../../../_shared/db';
import { requireAdmin } from '../../../../../_shared/admin-auth';

interface RecipientRow {
  application_id: string;
  email: string;
  phone: string | null;
  email_status: string;
  email_error: string | null;
  sms_status: string | null;
  sms_error: string | null;
  created_at: number;
}

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;

  const rows = await all<RecipientRow>(
    env,
    'SELECT application_id, email, phone, email_status, email_error, sms_status, sms_error, created_at FROM comm_campaign_recipients WHERE campaign_id = ? ORDER BY created_at ASC',
    params.id,
  );
  return json({ data: rows });
};
