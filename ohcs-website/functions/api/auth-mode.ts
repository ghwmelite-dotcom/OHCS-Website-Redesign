// Public, auth-free endpoint that exposes ONLY whether admin demo mode is
// enabled. The full /api/admin/site-config endpoint requires super_admin
// (which a user on the login page doesn't have yet), so the login page
// uses this lightweight read to decide whether to show the demo-mode
// Quick Sign-In panel and tabs.
//
// Returns: { data: { demo_mode_enabled: boolean } }
//
// No PII, no secrets, no other config leaked — just the one boolean the
// login UI needs.

import type { PagesFunction } from '../_shared/types';
import { json } from '../_shared/json';
import { first } from '../_shared/db';

export const onRequestGet: PagesFunction = async ({ env }) => {
  // In production, demo mode is forced off regardless of site_config to
  // mirror the defence-in-depth behaviour in requireAdmin().
  if (env.APP_ENV === 'production') {
    return json({ data: { demo_mode_enabled: false } });
  }

  const row = await first<{ value: string }>(
    env,
    'SELECT value FROM site_config WHERE key = ?',
    'admin_demo_mode_enabled',
  );
  return json({ data: { demo_mode_enabled: row?.value === 'true' } });
};
