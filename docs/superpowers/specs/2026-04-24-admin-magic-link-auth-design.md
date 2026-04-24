# Admin Magic-Link Authentication — Design Spec

**Date:** 2026-04-24
**Status:** Draft — awaiting user review
**Sub-project:** Replaces the interim header-based admin gate with a real
session-backed authentication system, using a magic-link flow that mirrors
the applicant pipeline.

---

## 1. Goal

Replace `functions/_shared/admin-auth.ts`'s interim trust-the-headers
admin gate, and the client-side hardcoded demo passwords in
`src/lib/admin-auth.ts`, with a real magic-link authentication system
backed by a D1-stored allowlist and HttpOnly session cookies — without
breaking the demo-mode workflow we still use day-to-day until the team
is ready for production cutover.

## 2. Why

The audit on 2026-04-23 identified the existing admin auth as the single
biggest blocker before the portal can serve real applicants. The current
state allows anyone to spoof admin headers (`curl -H 'X-Admin-User-Role:
super_admin' …`) and read all applicant PII, run vetting decisions, and
download any signed-URL document. This must be replaced before the
portal handles real recruitment exercises.

## 3. Locked-in decisions (from 2026-04-24 brainstorm)

| # | Decision | Choice |
|---|---|---|
| 1 | Allowlist source of truth | **D1 table `admin_users`** — managed via Settings page UI |
| 2 | Initial admin emails | **Deferred** — to be supplied at production cutover |
| 3 | Session TTL | **Sliding 4-hour** — auto-extends on activity |
| 4 | Demo mode fate | **Coexist as a Super-Admin toggleable fallback** in the Settings page |
| 5 | Scope | **Auth + Settings UI** for super_admin to add/remove/change-role for other admins |

## 4. Out of scope

- Password support (magic link only — no password recovery flows)
- 2FA / TOTP (a future hardening item — Cloudflare Access SSO would
  bring this for free if/when we go that route)
- SSO providers (Google/Microsoft OAuth)
- Audit-log UI for admin authentication events (the events get written
  to the existing `audit_logs` table; viewer can be added later if
  needed beyond what `/admin/audit-log` already shows)
- Per-resource permissions beyond the 4 existing roles
  (super_admin / recruitment_admin / content_manager / viewer)

## 5. Architecture

### 5.1 Schema additions (`migrations/0010_admin_auth.sql`)

```sql
-- The allowlist of who is allowed to log in as an admin and at what role.
CREATE TABLE IF NOT EXISTS admin_users (
  email         TEXT PRIMARY KEY,         -- lowercase, full email
  role          TEXT NOT NULL,            -- super_admin | recruitment_admin | content_manager | viewer
  display_name  TEXT,                     -- "Kwame Mensah" — optional, nice-to-have for the audit log
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL,
  created_by    TEXT,                     -- email of the super_admin who added them
  updated_at    INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Magic-link tokens for admin login. Hashed at rest exactly like
-- magic_link_tokens (see migration 0008).
CREATE TABLE IF NOT EXISTS admin_magic_tokens (
  token        TEXT PRIMARY KEY,          -- SHA-256 hex digest of raw token
  email        TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  used_at      INTEGER,
  ip_address   TEXT                       -- captured for audit
);

CREATE INDEX IF NOT EXISTS idx_admin_magic_tokens_email
  ON admin_magic_tokens(email, created_at);

-- Active admin sessions. Sliding 4-hour TTL.
CREATE TABLE IF NOT EXISTS admin_sessions (
  session_id    TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  last_used_at  INTEGER NOT NULL,
  ip_address    TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_email
  ON admin_sessions(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires
  ON admin_sessions(expires_at);

-- Site config — used to toggle demo mode on/off without a redeploy.
CREATE TABLE IF NOT EXISTS site_config (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL,
  updated_at    INTEGER NOT NULL,
  updated_by    TEXT
);

INSERT OR IGNORE INTO site_config (key, value, updated_at)
  VALUES ('admin_demo_mode_enabled', 'true', strftime('%s','now')*1000);
```

### 5.2 Token + session lifecycle

| Phase | Storage | TTL | Notes |
|---|---|---|---|
| Magic-link request | `admin_magic_tokens` (hashed) | 15 minutes | Shorter than applicant 30-min — admins should respond quickly. Single-use. |
| Active session | `admin_sessions` | Sliding 4 hours | `last_used_at` updates on every authenticated request; `expires_at` slides forward by 4h on each request. Hard cap of 7 days from `created_at` to prevent indefinite renewal. |

### 5.3 New API endpoints

| Method + path | Purpose | Auth |
|---|---|---|
| `POST /api/admin/auth/start` | Request a magic link. Body: `{email}`. Rate-limited per email (3/15min). Validates email is in `admin_users` AND `is_active=1`. Returns 200 either way to prevent email enumeration. | None |
| `GET /api/admin/auth/magic/[token]` | Consume a magic-link token. Hashes the token, looks up the row, marks `used_at`, creates an `admin_sessions` row, sets HttpOnly cookie, 302 to `/admin`. | None |
| `GET /api/admin/auth/me` | Returns the current admin's email + role. Used by the admin shell for client-side role gating. | Cookie session |
| `POST /api/admin/auth/logout` | Invalidates the session (delete row + clear cookie). | Cookie session |
| `GET /api/admin/users` | List all admin users. | super_admin |
| `POST /api/admin/users` | Add a new admin. Body: `{email, role, display_name?}`. | super_admin |
| `PATCH /api/admin/users/[email]` | Update role / is_active / display_name. | super_admin |
| `DELETE /api/admin/users/[email]` | Soft-delete (sets is_active=0 + invalidates all sessions for that email). | super_admin |
| `GET /api/admin/site-config` | Reads the site_config table (currently just `admin_demo_mode_enabled`). | super_admin |
| `PUT /api/admin/site-config/[key]` | Updates a site_config value. | super_admin |

### 5.4 Updated `_shared/admin-auth.ts`

```typescript
export async function requireAdmin(
  request: Request,
  env: Env,
  options?: { roles?: AdminRole[] }
): Promise<AdminAuthResult> {
  // 1. Try cookie session first.
  const session = await readAdminSessionCookie(request, env);
  if (session) {
    if (options?.roles && !options.roles.includes(session.role)) {
      return reject('admin role not authorised', 403);
    }
    await slideSession(env, session.sessionId);  // Update last_used_at + expires_at
    return { kind: 'ok', admin: session };
  }

  // 2. Demo mode fallback (if enabled in site_config AND APP_ENV !== 'production').
  if (await isDemoModeEnabled(env) && env.APP_ENV !== 'production') {
    return readHeaderBasedAdminContext(request, options);
  }

  // 3. Reject.
  return reject('authentication required', 401);
}
```

The header-based path is preserved BUT only honoured when:
- `site_config.admin_demo_mode_enabled = 'true'`, AND
- `APP_ENV !== 'production'` (defence in depth — even if someone fat-fingers the toggle on a production deploy, the env gate stops them)

### 5.5 Frontend changes

**Login page (`src/app/admin/login/page.tsx`)** — restructured:

- If demo mode is enabled (queried from `/api/admin/site-config`):
  - Show two tabs: **"Magic Link"** (default) and **"Demo Login"** (existing email+password form, unchanged)
- If demo mode is disabled:
  - Show only the magic-link form (one email field + "Send link" button)
  - Then a "Check your inbox" success state with the email address echoed back

**Admin shell (`src/app/admin/layout.tsx`)** — calls `/api/admin/auth/me` on mount; if 401, redirects to `/admin/login`. Already mostly the case for the demo flow.

**New: Settings → Admin Users tab (`src/app/admin/settings/users/page.tsx`)** — table with:
- Add admin button → modal with email + role + optional display name
- Per-row: change role dropdown, deactivate button, "send fresh magic link" button
- Visible only to `super_admin` role

**New: Settings → Auth Mode (`src/app/admin/settings/auth/page.tsx`)** — single toggle:
- Demo mode ON / OFF (with warning copy: "Demo mode allows anyone with knowledge of the demo passwords to log in as admin. Disable before going live to citizens.")
- Disabled (greyed out) when `APP_ENV === 'production'` server-side

### 5.6 Security considerations

- **Token hashing**: SHA-256 hex digest, exactly the pattern from `_shared/hash-token.ts` shipped in security batch 1
- **Constant-time compare**: session_id cookie compared via `constantTimeEquals` from `_shared/hmac.ts`
- **Rate limit**: 3 magic-link requests per email per 15-minute window (stored as count of recent admin_magic_tokens rows, same approach as applicant start endpoint)
- **Cookie**: `Set-Cookie: admin_session=<id>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=14400`
- **Email enumeration**: `/api/admin/auth/start` always returns 200 with the same response shape, regardless of whether the email is in the allowlist
- **Session invalidation**: When an admin's `is_active` flips to 0 OR their role changes, all their `admin_sessions` rows are deleted in the same SQL transaction
- **CSRF**: Not strictly needed (SameSite=Lax cookies + GET-safe magic link consumption) but worth a CSRF token on POST/PATCH/DELETE in a future pass
- **No password storage anywhere** — the existing demo passwords stay client-side only and only work when demo mode is on

## 6. File layout

```
ohcs-website/
├── migrations/
│   └── 0010_admin_auth.sql                    [new]
├── functions/
│   ├── _shared/
│   │   ├── admin-auth.ts                      [rewrite — cookie + demo fallback]
│   │   ├── admin-cookies.ts                   [new — small wrapper for the admin_session cookie]
│   │   └── admin-session.ts                   [new — slideSession, readAdminSessionCookie]
│   └── api/admin/
│       ├── auth/
│       │   ├── start.ts                       [new]
│       │   ├── magic/[token].ts               [new]
│       │   ├── me.ts                          [new]
│       │   └── logout.ts                      [new]
│       ├── users/
│       │   ├── index.ts                       [new — GET list, POST create]
│       │   └── [email].ts                     [new — PATCH, DELETE]
│       └── site-config/
│           ├── index.ts                       [new — GET]
│           └── [key].ts                       [new — PUT]
├── src/
│   ├── app/admin/
│   │   ├── login/page.tsx                     [rewrite — tabs for magic / demo]
│   │   └── settings/
│   │       ├── users/page.tsx                 [new]
│   │       └── auth/page.tsx                  [new]
│   ├── components/admin/
│   │   ├── magic-link-form.tsx                [new]
│   │   └── admin-users-table.tsx              [new]
│   └── lib/
│       └── admin-auth.ts                      [rewrite — fetch /api/admin/auth/me, no localStorage]
└── tests/functions/
    ├── _shared/
    │   ├── admin-cookies.test.ts              [new]
    │   └── admin-session.test.ts              [new]
    └── admin/auth/
        ├── start.test.ts                      [new]
        ├── magic.test.ts                      [new]
        ├── me.test.ts                         [new]
        ├── logout.test.ts                     [new]
        ├── users-crud.test.ts                 [new]
        └── site-config.test.ts                [new]
```

## 7. Cutover plan (for production day)

1. Super_admin logs in (still using demo creds at this stage)
2. Settings → Admin Users → add real admin emails one by one with their roles
3. Each new admin receives a magic-link email immediately with a "welcome" subject
4. Each new admin clicks the link, gets a session, confirms they can see the admin shell
5. Settings → Auth Mode → toggle Demo Mode OFF
6. Demo creds stop working immediately on next request; existing demo sessions remain until their cookies expire (sliding 4h, hard cap 7d)
7. Super_admin re-logs-in via magic link to verify
8. Done. No deploy required.

## 8. Migration safety

- Migration 0010 is purely additive (new tables only) — no risk to existing data
- Migration is idempotent (`CREATE TABLE IF NOT EXISTS`, `INSERT OR IGNORE`)
- Demo mode defaults to ENABLED on first install so existing demo workflow never breaks
- Header-based fallback only honoured when BOTH the toggle is on AND `APP_ENV !== 'production'` — production deploys are safe even before the cutover ceremony

## 9. Tests to ship (TDD)

Following Sub-project A's pattern:

| File | Coverage |
|---|---|
| `_shared/admin-cookies.test.ts` | parse/build admin_session cookie; HttpOnly + Secure + SameSite attrs |
| `_shared/admin-session.test.ts` | slideSession extends expires_at and last_used_at; hard cap at 7d from created_at |
| `auth/start.test.ts` | 200 always; rate limit 3/15min; only sends when email is active in allowlist; SHA-256 hashing of token |
| `auth/magic.test.ts` | hashes inbound token; rejects expired / used / unknown; sets cookie; updates last_login_at |
| `auth/me.test.ts` | returns session admin; 401 when missing cookie; slides session |
| `auth/logout.test.ts` | deletes session row + clears cookie |
| `users-crud.test.ts` | only super_admin can list/add/update/delete; deactivation cascades to admin_sessions |
| `site-config.test.ts` | only super_admin can write; values persist; reading is super_admin-only too |
| Integration: existing admin endpoint tests | All endpoints under `/api/admin/**` continue to gate via the new `requireAdmin()` |

Existing admin endpoint tests will need their mocks updated from header-based admin context to cookie-based session lookup, OR (simpler) we keep the header path active in tests by leaving demo mode default-on in `mockEnv`.

## 10. What this delivers

Once merged and deployed:

- Anyone with super_admin role can manage the admin allowlist via the Settings page — no SQL needed
- Magic-link login works end-to-end the moment Resend is configured for `ohcs.gov.gh`
- Demo mode remains as a fallback usable up until the cutover toggle flip
- The cutover from demo to production is **a single toggle in the UI**, not a code change or deploy
- Closes the highest-priority pre-launch security item from the 2026-04-23 audit

## 11. Open questions — RESOLVED 2026-04-24

- **Initial seeded super_admin in migration 0010**: ✅ **YES.** Migration 0010 inserts `Ohcsghana.main@gmail.com` with `role='super_admin'`, `is_active=1`, `created_by='system_bootstrap'`. Provides a guaranteed escape hatch the moment demo mode is disabled.
- **Session ip_address binding**: ❌ **NO** — sessions are not IP-bound. The `ip_address` column in `admin_sessions` is captured for audit only, never used for authorisation. Avoids breaking admins who hop between WiFi and mobile data.
- **Magic-link email branding**: ✅ **YES.** New helper `_shared/admin-magic-link-email.ts` with subject "OHCS Admin Sign-In Link — action required" and copy that visually distinguishes it from the applicant flow ("OHCS Recruitment — secure magic link").
