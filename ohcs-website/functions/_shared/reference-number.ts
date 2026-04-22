import type { Env } from './types';
import { first, run } from './db';

export function formatReference(year: number, seq: number): string {
  return `OHCS-${year}-${String(seq).padStart(5, '0')}`;
}

export async function generateReference(env: Env, exerciseId: string, year: number): Promise<string> {
  const key = `app_${exerciseId}_${year}`;
  // Two writes; D1 serializes them so the increment is atomic per session.
  await run(env, 'INSERT OR IGNORE INTO sequences (key, last) VALUES (?, 0)', key);
  const row = await first<{ last: number }>(
    env,
    'UPDATE sequences SET last = last + 1 WHERE key = ? RETURNING last',
    key,
  );
  if (!row) {
    throw new Error(`reference-number: sequence row for ${key} disappeared after INSERT OR IGNORE`);
  }
  return formatReference(year, row.last);
}
