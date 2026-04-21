//
// ─── INTERIM ADMIN AUTH (Phase 1) ──────────────────────────────────────────
// This is NOT real authentication. It trusts X-Admin-User-* request headers
// sent by the React admin client. A determined caller could spoof these
// headers from any origin. The whole admin section is currently behind
// client-side demo passwords (src/lib/admin-auth.ts), and this module
// matches that security posture.
//
// REPLACE BEFORE PRODUCTION LAUNCH with a real session-token check. See
// the recruitment spec § 9.1 for the target authentication model.
// ──────────────────────────────────────────────────────────────────────────
import { json } from './json';

const ADMIN_ROLES = new Set(['super_admin', 'recruitment_admin']);

export interface AdminContext {
  email: string;
  role: string;
}

export type AdminAuthResult =
  | { kind: 'ok'; admin: AdminContext }
  | { kind: 'reject'; response: Response };

export function requireAdmin(request: Request): AdminAuthResult {
  const email = request.headers.get('X-Admin-User-Email')?.trim() ?? '';
  const role = request.headers.get('X-Admin-User-Role')?.trim() ?? '';

  if (!email || !role) {
    return {
      kind: 'reject',
      response: json(
        { error: 'authentication required', code: 'AUTH_MISSING' },
        { status: 401 },
      ),
    };
  }

  if (!ADMIN_ROLES.has(role)) {
    return {
      kind: 'reject',
      response: json(
        { error: 'admin role required', code: 'AUTH_FORBIDDEN' },
        { status: 403 },
      ),
    };
  }

  return { kind: 'ok', admin: { email, role } };
}
