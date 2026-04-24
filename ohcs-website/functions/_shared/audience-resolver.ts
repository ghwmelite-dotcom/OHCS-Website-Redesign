import type { Env } from './types';
import { all, first } from './db';
import { extractPhone, extractFullName } from './form-data';

export interface Recipient {
  applicationId: string;
  email: string;
  phone: string | null;
  fullName: string | null;
}

export type AudienceFilter =
  | { kind: 'status'; exerciseId: string; status: string }
  | { kind: 'single'; applicationId: string };

interface Row {
  id: string;
  email: string;
  form_data: string | null;
}

export async function resolveAudience(env: Env, filter: AudienceFilter): Promise<Recipient[]> {
  if (filter.kind === 'single') {
    const row = await first<Row>(
      env,
      'SELECT id, email, form_data FROM applications WHERE id = ?',
      filter.applicationId,
    );
    return row ? [toRecipient(row)] : [];
  }

  const rows = await all<Row>(
    env,
    'SELECT id, email, form_data FROM applications WHERE exercise_id = ? AND status = ?',
    filter.exerciseId,
    filter.status,
  );
  return rows.map(toRecipient);
}

function toRecipient(row: Row): Recipient {
  return {
    applicationId: row.id,
    email: row.email,
    phone: extractPhone(row.form_data),
    fullName: extractFullName(row.form_data),
  };
}
