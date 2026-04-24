//
// ─── ADMIN AUTH (Phase 2 — magic-link sessions + demo fallback) ─────────
// Tries cookie-backed admin_sessions first. Falls back to header-based
// context only when (a) site_config.admin_demo_mode_enabled = 'true'
// AND (b) APP_ENV !== 'production'. Defence in depth: even if the
// toggle is misconfigured, a production deploy will refuse the
// header path.
//
// See migration 0010 and the design spec at
// docs/superpowers/specs/2026-04-24-admin-magic-link-auth-design.md.
// ─────────────────────────────────────────────────────────────────────────
import type { Env } from './types';
import { json } from './json';
import { first } from './db';
import { parseAdminSessionId } from './admin-cookies';
import { readAdminSession } from './admin-session';

// Roles permitted to call admin APIs. Per-route role checks (e.g.
// recruitment_admin only for appeals/resolve) are still enforced inline
// by the route handlers themselves. 'viewer' is read-only — endpoints
// that mutate data must add their own role gate above 'viewer'.
const ADMIN_ROLES = new Set(['super_admin', 'recruitment_admin', 'content_manager', 'viewer']);

export interface AdminContext {
  email: string;
  role: string;
}

export type AdminAuthResult =
  | { kind: 'ok'; admin: AdminContext }
  | { kind: 'reject'; response: Response };

async function isDemoModeEnabled(env: Env): Promise<boolean> {
  if (env.APP_ENV === 'production') return false;
  const row = await first<{ value: string }>(
    env,
    'SELECT value FROM site_config WHERE key = ?',
    'admin_demo_mode_enabled',
  );
  return row?.value === 'true';
}

function readHeaderContext(request: Request): AdminAuthResult {
  const email = request.headers.get('X-Admin-User-Email')?.trim() ?? '';
  const role = request.headers.get('X-Admin-User-Role')?.trim() ?? '';
  if (!email || !role) {
    return {
      kind: 'reject',
      response: json({ error: 'authentication required', code: 'AUTH_MISSING' }, { status: 401 }),
    };
  }
  if (!ADMIN_ROLES.has(role)) {
    return {
      kind: 'reject',
      response: json({ error: 'admin role required', code: 'AUTH_FORBIDDEN' }, { status: 403 }),
    };
  }
  return { kind: 'ok', admin: { email, role } };
}

export async function requireAdmin(
  request: Request,
  env: Env,
): Promise<AdminAuthResult> {
  // 1) Cookie session.
  const sessionId = parseAdminSessionId(request);
  if (sessionId) {
    const session = await readAdminSession(env, sessionId);
    if (session) {
      if (!ADMIN_ROLES.has(session.role)) {
        return {
          kind: 'reject',
          response: json({ error: 'admin role required', code: 'AUTH_FORBIDDEN' }, { status: 403 }),
        };
      }
      return { kind: 'ok', admin: { email: session.email, role: session.role } };
    }
  }

  // 2) Demo-mode header fallback (only when toggle is on AND not production).
  if (await isDemoModeEnabled(env)) {
    return readHeaderContext(request);
  }

  // 3) Reject.
  return {
    kind: 'reject',
    response: json({ error: 'authentication required', code: 'AUTH_MISSING' }, { status: 401 }),
  };
}
