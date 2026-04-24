# Admin Magic-Link Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the spoofable header-based admin gate and the client-side demo passwords with a real magic-link authentication system, backed by a D1 allowlist, sliding 4-hour cookie sessions, and a Settings UI for super_admins to manage the allowlist — while keeping the existing demo workflow as a Super-Admin toggleable fallback for the dev phase.

**Architecture:** Migration 0010 introduces four new tables (`admin_users`, `admin_magic_tokens`, `admin_sessions`, `site_config`). New endpoints under `/api/admin/auth/*`, `/api/admin/users/*`, `/api/admin/site-config/*` follow the same shape as the applicant magic-link flow shipped in security batch 1 (SHA-256 hashed tokens, constant-time compare, rate-limited start endpoint). `requireAdmin()` is rewritten to (1) try cookie session, (2) fall back to header-based context only when `site_config.admin_demo_mode_enabled='true'` AND `APP_ENV !== 'production'`. Frontend gets a tabbed login page (Magic Link / Demo) and two new Settings pages.

**Tech Stack:** Next.js 16 App Router · React 19 · Cloudflare Pages Functions · D1 (SQLite) · Resend · Zod · Vitest 4 · Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-04-24-admin-magic-link-auth-design.md`

---

## Pre-flight

Set up the worktree before Task 1 begins (the subagent-driven-development skill handles this — required for isolation).

Branch name: `feat/admin-magic-link-auth`

---

### Task 1: Migration 0010 — admin auth schema

**Files:**
- Create: `ohcs-website/migrations/0010_admin_auth.sql`

- [ ] **Step 1: Write the migration**

Create `ohcs-website/migrations/0010_admin_auth.sql`:

```sql
-- ohcs-website/migrations/0010_admin_auth.sql
--
-- Replaces the interim header-based admin auth with a real
-- D1-backed allowlist + magic-link sessions. See design spec at
-- docs/superpowers/specs/2026-04-24-admin-magic-link-auth-design.md.

CREATE TABLE IF NOT EXISTS admin_users (
  email         TEXT PRIMARY KEY,
  role          TEXT NOT NULL,
  display_name  TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL,
  created_by    TEXT,
  updated_at    INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

CREATE TABLE IF NOT EXISTS admin_magic_tokens (
  token        TEXT PRIMARY KEY,
  email        TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  used_at      INTEGER,
  ip_address   TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_magic_tokens_email
  ON admin_magic_tokens(email, created_at);

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

CREATE TABLE IF NOT EXISTS site_config (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL,
  updated_at    INTEGER NOT NULL,
  updated_by    TEXT
);

INSERT OR IGNORE INTO site_config (key, value, updated_at)
  VALUES ('admin_demo_mode_enabled', 'true', strftime('%s','now')*1000);

-- Bootstrap super_admin so the system is never lockable-out.
-- Resolved 2026-04-24: seeded as the new account holder so magic-link
-- works the moment demo mode is disabled.
INSERT OR IGNORE INTO admin_users
  (email, role, display_name, is_active, created_at, created_by, updated_at)
VALUES
  ('ohcsghana.main@gmail.com', 'super_admin', 'OHCS Bootstrap Admin', 1,
   strftime('%s','now')*1000, 'system_bootstrap', strftime('%s','now')*1000);
```

- [ ] **Step 2: Apply locally to verify SQL is syntactically valid**

Run: `cd ohcs-website && npm run migrate`
Expected: `✅ Applied 1 migration(s).` (the new 0010)

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/migrations/0010_admin_auth.sql
git commit -m "feat(admin-auth): migration 0010 — admin auth schema + bootstrap super_admin"
```

---

### Task 2: Shared helper — admin cookies

**Files:**
- Create: `ohcs-website/functions/_shared/admin-cookies.ts`
- Create: `ohcs-website/tests/functions/_shared/admin-cookies.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/_shared/admin-cookies.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  buildSetAdminSessionCookie,
  buildClearAdminSessionCookie,
  parseAdminSessionId,
} from '../../../functions/_shared/admin-cookies';

describe('admin cookies', () => {
  describe('buildSetAdminSessionCookie', () => {
    it('produces a Secure HttpOnly SameSite=Lax cookie with Max-Age', () => {
      const v = buildSetAdminSessionCookie('sess-abc', 14400);
      expect(v).toContain('admin_session=sess-abc');
      expect(v).toContain('HttpOnly');
      expect(v).toContain('Secure');
      expect(v).toContain('SameSite=Lax');
      expect(v).toContain('Path=/');
      expect(v).toContain('Max-Age=14400');
    });
  });

  describe('buildClearAdminSessionCookie', () => {
    it('expires the cookie immediately', () => {
      const v = buildClearAdminSessionCookie();
      expect(v).toContain('admin_session=;');
      expect(v).toContain('Max-Age=0');
    });
  });

  describe('parseAdminSessionId', () => {
    it('extracts admin_session from a cookie header', () => {
      const req = new Request('https://x', {
        headers: { cookie: 'foo=bar; admin_session=abc123; baz=qux' },
      });
      expect(parseAdminSessionId(req)).toBe('abc123');
    });

    it('returns null when admin_session cookie missing', () => {
      const req = new Request('https://x', { headers: { cookie: 'foo=bar' } });
      expect(parseAdminSessionId(req)).toBeNull();
    });

    it('returns null when no Cookie header at all', () => {
      const req = new Request('https://x');
      expect(parseAdminSessionId(req)).toBeNull();
    });

    it('returns null when admin_session is empty string', () => {
      const req = new Request('https://x', {
        headers: { cookie: 'admin_session=' },
      });
      expect(parseAdminSessionId(req)).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd ohcs-website && npx vitest run tests/functions/_shared/admin-cookies.test.ts`
Expected: FAIL with "Cannot find module" or similar.

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/_shared/admin-cookies.ts`:

```typescript
const COOKIE_NAME = 'admin_session';

export function buildSetAdminSessionCookie(
  sessionId: string,
  maxAgeSeconds: number,
): string {
  return [
    `${COOKIE_NAME}=${sessionId}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

export function buildClearAdminSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function parseAdminSessionId(request: Request): string | null {
  const header = request.headers.get('cookie') ?? request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq);
    if (name === COOKIE_NAME) {
      const value = part.slice(eq + 1);
      return value.length > 0 ? value : null;
    }
  }
  return null;
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd ohcs-website && npx vitest run tests/functions/_shared/admin-cookies.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/_shared/admin-cookies.ts ohcs-website/tests/functions/_shared/admin-cookies.test.ts
git commit -m "feat(admin-auth): admin_session cookie helpers (HttpOnly/Secure/SameSite=Lax)"
```

---

### Task 3: Shared helper — admin session management

Implements `createAdminSession`, `readAdminSession` (looks up by cookie, validates not expired, slides), `deleteAdminSession`, `deleteAllSessionsForEmail`.

**Files:**
- Create: `ohcs-website/functions/_shared/admin-session.ts`
- Create: `ohcs-website/tests/functions/_shared/admin-session.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/_shared/admin-session.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  createAdminSession,
  readAdminSession,
  deleteAdminSession,
  deleteAllSessionsForEmail,
  ADMIN_SESSION_TTL_MS,
  ADMIN_SESSION_HARD_CAP_MS,
} from '../../../functions/_shared/admin-session';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

describe('admin session helpers', () => {
  it('createAdminSession inserts row and returns generated session id', async () => {
    const db = makeD1([
      {
        sql:
          'INSERT INTO admin_sessions (session_id, email, created_at, expires_at, last_used_at, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const id = await createAdminSession(mockEnv({ db }), {
      email: 'admin@ohcs.gov.gh',
      ipAddress: '1.2.3.4',
    });
    expect(id).toMatch(/^[A-Za-z0-9_-]{20,}$/);
  });

  it('readAdminSession returns row + slides expires_at when valid', async () => {
    const now = Date.now();
    const created = now - 60_000;
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
        first: {
          session_id: 'sess-abc',
          email: 'admin@ohcs.gov.gh',
          created_at: created,
          expires_at: now + 60_000,
          last_used_at: created,
          role: 'super_admin',
        },
      },
      {
        sql:
          'UPDATE admin_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
        run: {},
      },
    ]);
    const result = await readAdminSession(mockEnv({ db }), 'sess-abc');
    expect(result).not.toBeNull();
    expect(result?.email).toBe('admin@ohcs.gov.gh');
    expect(result?.role).toBe('super_admin');
  });

  it('readAdminSession returns null when session not found or expired', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
      },
    ]);
    const result = await readAdminSession(mockEnv({ db }), 'sess-ghost');
    expect(result).toBeNull();
  });

  it('readAdminSession does NOT slide past the hard cap (7d from created_at)', async () => {
    const now = Date.now();
    const created = now - (ADMIN_SESSION_HARD_CAP_MS + 1000);
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
        first: {
          session_id: 'sess-old',
          email: 'admin@ohcs.gov.gh',
          created_at: created,
          expires_at: now + 60_000,
          last_used_at: now - 1000,
          role: 'super_admin',
        },
      },
      {
        sql: 'DELETE FROM admin_sessions WHERE session_id = ?',
        run: {},
      },
    ]);
    const result = await readAdminSession(mockEnv({ db }), 'sess-old');
    expect(result).toBeNull();
  });

  it('deleteAdminSession removes the row by id', async () => {
    const db = makeD1([
      { sql: 'DELETE FROM admin_sessions WHERE session_id = ?', run: {} },
    ]);
    await deleteAdminSession(mockEnv({ db }), 'sess-abc');
    expect(true).toBe(true);
  });

  it('deleteAllSessionsForEmail wipes every active session for an email', async () => {
    const db = makeD1([
      { sql: 'DELETE FROM admin_sessions WHERE email = ?', run: {} },
    ]);
    await deleteAllSessionsForEmail(mockEnv({ db }), 'admin@ohcs.gov.gh');
    expect(true).toBe(true);
  });

  it('TTL constants match spec (sliding 4h, hard cap 7d)', () => {
    expect(ADMIN_SESSION_TTL_MS).toBe(4 * 60 * 60 * 1000);
    expect(ADMIN_SESSION_HARD_CAP_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd ohcs-website && npx vitest run tests/functions/_shared/admin-session.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/_shared/admin-session.ts`:

```typescript
import type { Env } from './types';
import { first, run } from './db';

export const ADMIN_SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4h sliding
export const ADMIN_SESSION_HARD_CAP_MS = 7 * 24 * 60 * 60 * 1000; // 7d total

export interface AdminSessionRow {
  sessionId: string;
  email: string;
  role: string;
  createdAt: number;
  expiresAt: number;
  lastUsedAt: number;
}

function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function createAdminSession(
  env: Env,
  input: { email: string; ipAddress?: string | null },
): Promise<string> {
  const id = generateSessionId();
  const now = Date.now();
  await run(
    env,
    'INSERT INTO admin_sessions (session_id, email, created_at, expires_at, last_used_at, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    input.email,
    now,
    now + ADMIN_SESSION_TTL_MS,
    now,
    input.ipAddress ?? null,
  );
  return id;
}

interface JoinedSessionRow {
  session_id: string;
  email: string;
  created_at: number;
  expires_at: number;
  last_used_at: number;
  role: string;
}

export async function readAdminSession(
  env: Env,
  sessionId: string,
): Promise<AdminSessionRow | null> {
  const now = Date.now();
  const row = await first<JoinedSessionRow>(
    env,
    'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
    sessionId,
    now,
  );
  if (!row) return null;

  // Hard cap: if more than 7 days since creation, force re-login.
  if (now - row.created_at > ADMIN_SESSION_HARD_CAP_MS) {
    await run(env, 'DELETE FROM admin_sessions WHERE session_id = ?', sessionId);
    return null;
  }

  // Slide: extend expires_at by 4h from now, update last_used_at.
  const newExpires = now + ADMIN_SESSION_TTL_MS;
  await run(
    env,
    'UPDATE admin_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
    now,
    newExpires,
    sessionId,
  );

  return {
    sessionId: row.session_id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    expiresAt: newExpires,
    lastUsedAt: now,
  };
}

export async function deleteAdminSession(
  env: Env,
  sessionId: string,
): Promise<void> {
  await run(env, 'DELETE FROM admin_sessions WHERE session_id = ?', sessionId);
}

export async function deleteAllSessionsForEmail(
  env: Env,
  email: string,
): Promise<void> {
  await run(env, 'DELETE FROM admin_sessions WHERE email = ?', email);
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd ohcs-website && npx vitest run tests/functions/_shared/admin-session.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/_shared/admin-session.ts ohcs-website/tests/functions/_shared/admin-session.test.ts
git commit -m "feat(admin-auth): admin session helpers — sliding 4h TTL, hard cap 7d"
```

---

### Task 4: Shared helper — admin magic-link email template

**Files:**
- Create: `ohcs-website/functions/_shared/admin-magic-link-email.ts`

- [ ] **Step 1: Implement directly (no test — pure data builder, exercised through endpoint tests)**

Create `ohcs-website/functions/_shared/admin-magic-link-email.ts`:

```typescript
// Distinct admin sign-in template — visually clear that this is for
// staff access to the admin portal, not the applicant flow.

export interface AdminMagicLinkEmailBody {
  subject: string;
  html: string;
  text: string;
}

export function adminMagicLinkEmail(
  resumeUrl: string,
  ttlMinutes: number = 15,
): AdminMagicLinkEmailBody {
  const subject = 'OHCS Admin Sign-In Link — action required';
  const html = `<!doctype html><html><body style="font-family: Arial, sans-serif; color: #1a1a1a; line-height: 1.5; max-width: 580px; margin: 0 auto; padding: 24px;">
<p style="font-size: 18px; font-weight: bold; color: #1B5E20;">OHCS Admin Sign-In</p>
<p>Click the link below to sign in to the OHCS Admin Portal. This link is valid for <strong>${ttlMinutes} minutes</strong> and can be used <strong>once</strong>.</p>
<p style="margin: 24px 0;"><a href="${resumeUrl}" style="background:#1B5E20;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Sign in to OHCS Admin</a></p>
<p style="font-size: 13px; color: #5C5549;">If you did not request this link, please ignore this email and notify the OHCS IT team. No further action is required — the link will expire automatically.</p>
<hr style="border: none; border-top: 1px solid #E5DDD0; margin: 24px 0;">
<p style="font-size: 12px; color: #5C5549;">Office of the Head of the Civil Service · Republic of Ghana</p>
</body></html>`;
  const text = `OHCS Admin Sign-In

Click the link below to sign in to the OHCS Admin Portal. Valid for ${ttlMinutes} minutes, single-use.

${resumeUrl}

If you did not request this link, please ignore this email and notify the OHCS IT team.

Office of the Head of the Civil Service · Republic of Ghana`;
  return { subject, html, text };
}
```

- [ ] **Step 2: Commit**

```bash
git add ohcs-website/functions/_shared/admin-magic-link-email.ts
git commit -m "feat(admin-auth): distinct admin sign-in email template"
```

---

### Task 5: POST /api/admin/auth/start — issue magic link

Mirrors the applicant `start.ts`: rate-limited, hashes the token, sends email. Returns 200 always to prevent email enumeration. Only sends if email exists in `admin_users` AND `is_active=1`.

**Files:**
- Create: `ohcs-website/functions/api/admin/auth/start.ts`
- Create: `ohcs-website/tests/functions/admin/auth/start.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/admin/auth/start.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from '../../../../functions/api/admin/auth/start';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

function startReq(body: unknown): Request {
  return new Request('https://x/api/admin/auth/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/auth/start', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('issues a hashed token and sends email when admin exists', async () => {
    const db = makeD1([
      {
        sql: 'SELECT email FROM admin_users WHERE email = ? AND is_active = 1',
        first: { email: 'admin@ohcs.gov.gh' },
      },
      {
        sql:
          'SELECT COUNT(*) AS n FROM admin_magic_tokens WHERE email = ? AND created_at > ?',
        first: { n: 0 },
      },
      {
        sql:
          'INSERT INTO admin_magic_tokens (token, email, created_at, expires_at, ip_address) VALUES (?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const res = await onRequestPost(ctx(startReq({ email: 'admin@ohcs.gov.gh' }), db));
    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('returns 200 (NOT 404) when email is not in allowlist (no enumeration leak)', async () => {
    const db = makeD1([
      {
        sql: 'SELECT email FROM admin_users WHERE email = ? AND is_active = 1',
      },
    ]);
    const res = await onRequestPost(ctx(startReq({ email: 'attacker@example.com' }), db));
    expect(res.status).toBe(200);
    // No email send attempted.
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limit exceeded (3 in 15 minutes)', async () => {
    const db = makeD1([
      {
        sql: 'SELECT email FROM admin_users WHERE email = ? AND is_active = 1',
        first: { email: 'admin@ohcs.gov.gh' },
      },
      {
        sql:
          'SELECT COUNT(*) AS n FROM admin_magic_tokens WHERE email = ? AND created_at > ?',
        first: { n: 3 },
      },
    ]);
    const res = await onRequestPost(ctx(startReq({ email: 'admin@ohcs.gov.gh' }), db));
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('returns 400 on invalid email', async () => {
    const res = await onRequestPost(ctx(startReq({ email: 'not-an-email' })));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/start.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/api/admin/auth/start.ts`:

```typescript
//
// SECURITY: see functions/_shared/admin-auth.ts header.
// Issues a magic-link admin sign-in. SHA-256 hashed tokens, 15-min TTL,
// per-email rate limit (3 in rolling 15 min). Returns 200 even when the
// email is not in the allowlist — prevents enumeration.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseBody } from '../../../_shared/validate';
import { first, run } from '../../../_shared/db';
import { sendEmail } from '../../../_shared/email';
import { hashToken } from '../../../_shared/hash-token';
import { adminMagicLinkEmail } from '../../../_shared/admin-magic-link-email';
import { z } from 'zod';

const TOKEN_TTL_MS = 15 * 60 * 1000;
const TOKEN_TTL_MIN = 15;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

const Body = z.object({
  email: z.string().email().toLowerCase(),
});

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;
  const { email } = parsed.value;
  const now = Date.now();

  // Always-200 envelope regardless of whether email is in allowlist.
  // Real existence is checked AFTER we decide whether to actually send.
  const admin = await first<{ email: string }>(
    env,
    'SELECT email FROM admin_users WHERE email = ? AND is_active = 1',
    email,
  );
  if (!admin) {
    return json({ data: { sent: true } });
  }

  // Rate limit (per email)
  const recent = await first<{ n: number }>(
    env,
    'SELECT COUNT(*) AS n FROM admin_magic_tokens WHERE email = ? AND created_at > ?',
    email,
    now - RATE_LIMIT_WINDOW_MS,
  );
  if (recent && recent.n >= RATE_LIMIT_MAX) {
    return json(
      { error: 'too many sign-in requests; please try again later' },
      { status: 429, headers: { 'retry-after': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) } },
    );
  }

  const token = generateToken();
  const tokenHash = await hashToken(token);
  const ipAddress = request.headers.get('cf-connecting-ip') ?? null;

  await run(
    env,
    'INSERT INTO admin_magic_tokens (token, email, created_at, expires_at, ip_address) VALUES (?, ?, ?, ?, ?)',
    tokenHash,
    email,
    now,
    now + TOKEN_TTL_MS,
    ipAddress,
  );

  const origin = new URL(request.url).origin;
  const resumeUrl = `${origin}/api/admin/auth/magic/${encodeURIComponent(token)}`;
  const body = adminMagicLinkEmail(resumeUrl, TOKEN_TTL_MIN);

  try {
    await sendEmail(env, { to: email, subject: body.subject, html: body.html, text: body.text });
  } catch (err) {
    console.error('admin magic link email failed', err);
    return json({ error: 'email send failed' }, { status: 502 });
  }

  return json({ data: { sent: true } });
};
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/start.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/api/admin/auth/start.ts ohcs-website/tests/functions/admin/auth/
git commit -m "feat(admin-auth): POST /api/admin/auth/start — magic-link issuance + rate limit"
```

---

### Task 6: GET /api/admin/auth/magic/[token] — consume magic link

**Files:**
- Create: `ohcs-website/functions/api/admin/auth/magic/[token].ts`
- Create: `ohcs-website/tests/functions/admin/auth/magic.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/admin/auth/magic.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/admin/auth/magic/[token]';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

function ctx(req: Request, token: string, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: { token }, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/auth/magic/[token]', () => {
  it('consumes valid token, creates session, sets cookie, redirects to /admin', async () => {
    const now = Date.now();
    const db = makeD1([
      {
        sql: 'SELECT * FROM admin_magic_tokens WHERE token = ?',
        first: {
          token: 'hash-of-real-token',
          email: 'admin@ohcs.gov.gh',
          created_at: now - 1000,
          expires_at: now + 60_000,
          used_at: null,
          ip_address: '1.2.3.4',
        },
      },
      {
        sql:
          'INSERT INTO admin_sessions (session_id, email, created_at, expires_at, last_used_at, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql: 'UPDATE admin_magic_tokens SET used_at = ? WHERE token = ?',
        run: {},
      },
      {
        sql: 'UPDATE admin_users SET last_login_at = ? WHERE email = ?',
        run: {},
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/auth/magic/raw-token'), 'raw-token', db),
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/admin');
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toMatch(/^admin_session=[^;]+;/);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
  });

  it('returns 404 when token unknown', async () => {
    const db = makeD1([
      { sql: 'SELECT * FROM admin_magic_tokens WHERE token = ?' },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/auth/magic/ghost'), 'ghost', db),
    );
    expect(res.status).toBe(404);
  });

  it('returns 410 when token expired', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM admin_magic_tokens WHERE token = ?',
        first: {
          token: 'h',
          email: 'admin@ohcs.gov.gh',
          created_at: 0,
          expires_at: 1,
          used_at: null,
          ip_address: null,
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/auth/magic/expired'), 'expired', db),
    );
    expect(res.status).toBe(410);
  });

  it('returns 410 when token already used', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM admin_magic_tokens WHERE token = ?',
        first: {
          token: 'h',
          email: 'admin@ohcs.gov.gh',
          created_at: 0,
          expires_at: Date.now() + 60_000,
          used_at: Date.now() - 1000,
          ip_address: null,
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/auth/magic/used'), 'used', db),
    );
    expect(res.status).toBe(410);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/magic.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/api/admin/auth/magic/[token].ts`:

```typescript
//
// Consumes an admin magic-link token. Hashes the inbound raw token,
// looks up by hash, marks used, creates an admin_sessions row, sets
// the cookie, redirects to /admin.

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { first, run } from '../../../../_shared/db';
import { hashToken } from '../../../../_shared/hash-token';
import { createAdminSession, ADMIN_SESSION_TTL_MS } from '../../../../_shared/admin-session';
import { buildSetAdminSessionCookie } from '../../../../_shared/admin-cookies';

interface TokenRow {
  token: string;
  email: string;
  created_at: number;
  expires_at: number;
  used_at: number | null;
  ip_address: string | null;
}

export const onRequestGet: PagesFunction<Env, 'token'> = async ({ request, env, params }) => {
  const tokenHash = await hashToken(params.token);
  const tokenRow = await first<TokenRow>(
    env,
    'SELECT * FROM admin_magic_tokens WHERE token = ?',
    tokenHash,
  );
  if (!tokenRow) return json({ error: 'token not found' }, { status: 404 });

  const now = Date.now();
  if (tokenRow.used_at) return json({ error: 'token already used' }, { status: 410 });
  if (tokenRow.expires_at <= now) return json({ error: 'token expired' }, { status: 410 });

  const ipAddress = request.headers.get('cf-connecting-ip') ?? null;
  const sessionId = await createAdminSession(env, {
    email: tokenRow.email,
    ipAddress,
  });

  await run(env, 'UPDATE admin_magic_tokens SET used_at = ? WHERE token = ?', now, tokenHash);
  await run(env, 'UPDATE admin_users SET last_login_at = ? WHERE email = ?', now, tokenRow.email);

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin',
      'Set-Cookie': buildSetAdminSessionCookie(sessionId, ADMIN_SESSION_TTL_MS / 1000),
    },
  });
};
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/magic.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/api/admin/auth/magic ohcs-website/tests/functions/admin/auth/magic.test.ts
git commit -m "feat(admin-auth): GET /api/admin/auth/magic/[token] — consume + cookie"
```

---

### Task 7: GET /api/admin/auth/me + POST /api/admin/auth/logout

**Files:**
- Create: `ohcs-website/functions/api/admin/auth/me.ts`
- Create: `ohcs-website/functions/api/admin/auth/logout.ts`
- Create: `ohcs-website/tests/functions/admin/auth/me.test.ts`
- Create: `ohcs-website/tests/functions/admin/auth/logout.test.ts`

- [ ] **Step 1: Write failing tests for /me**

Create `ohcs-website/tests/functions/admin/auth/me.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/admin/auth/me';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/auth/me', () => {
  it('returns 401 when no admin_session cookie', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/admin/auth/me')));
    expect(res.status).toBe(401);
  });

  it('returns the admin email + role when session is valid', async () => {
    const now = Date.now();
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
        first: {
          session_id: 'sess-abc',
          email: 'admin@ohcs.gov.gh',
          created_at: now - 1000,
          expires_at: now + 60_000,
          last_used_at: now - 500,
          role: 'super_admin',
        },
      },
      {
        sql:
          'UPDATE admin_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/admin/auth/me', {
      headers: { Cookie: 'admin_session=sess-abc' },
    });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { email: string; role: string } };
    expect(body.data.email).toBe('admin@ohcs.gov.gh');
    expect(body.data.role).toBe('super_admin');
  });
});
```

- [ ] **Step 2: Write failing tests for /logout**

Create `ohcs-website/tests/functions/admin/auth/logout.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { onRequestPost } from '../../../../functions/api/admin/auth/logout';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('POST /api/admin/auth/logout', () => {
  it('deletes the session row + clears cookie when authenticated', async () => {
    const db = makeD1([
      { sql: 'DELETE FROM admin_sessions WHERE session_id = ?', run: {} },
    ]);
    const req = new Request('https://x/api/admin/auth/logout', {
      method: 'POST',
      headers: { Cookie: 'admin_session=sess-abc' },
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toContain('admin_session=;');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('returns 200 even with no session cookie (idempotent)', async () => {
    const req = new Request('https://x/api/admin/auth/logout', { method: 'POST' });
    const res = await onRequestPost(ctx(req));
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/me.test.ts tests/functions/admin/auth/logout.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement /me**

Create `ohcs-website/functions/api/admin/auth/me.ts`:

```typescript
import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseAdminSessionId } from '../../../_shared/admin-cookies';
import { readAdminSession } from '../../../_shared/admin-session';

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const sessionId = parseAdminSessionId(request);
  if (!sessionId) return json({ error: 'unauthenticated' }, { status: 401 });

  const session = await readAdminSession(env, sessionId);
  if (!session) return json({ error: 'unauthenticated' }, { status: 401 });

  return json({ data: { email: session.email, role: session.role } });
};
```

- [ ] **Step 5: Implement /logout**

Create `ohcs-website/functions/api/admin/auth/logout.ts`:

```typescript
import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseAdminSessionId, buildClearAdminSessionCookie } from '../../../_shared/admin-cookies';
import { deleteAdminSession } from '../../../_shared/admin-session';

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const sessionId = parseAdminSessionId(request);
  if (sessionId) await deleteAdminSession(env, sessionId);

  return new Response(JSON.stringify({ data: { ok: true } }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'Set-Cookie': buildClearAdminSessionCookie(),
    },
  });
};
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/me.test.ts tests/functions/admin/auth/logout.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add ohcs-website/functions/api/admin/auth/me.ts ohcs-website/functions/api/admin/auth/logout.ts ohcs-website/tests/functions/admin/auth/me.test.ts ohcs-website/tests/functions/admin/auth/logout.test.ts
git commit -m "feat(admin-auth): /api/admin/auth/me + /logout — session info + revoke"
```

---

### Task 8: Rewrite `_shared/admin-auth.ts` — cookie-first, demo fallback

This is the keystone change. `requireAdmin()` becomes async and tries cookie session first, falls back to header-based context only when demo mode is on AND `APP_ENV !== 'production'`.

**Files:**
- Modify: `ohcs-website/functions/_shared/admin-auth.ts`
- Modify (small): existing admin endpoint files that call `requireAdmin()` — they all need `await` added

- [ ] **Step 1: Catalogue every caller** (research only)

Run: `cd ohcs-website && grep -rn "requireAdmin(" functions/api/admin --include="*.ts"`
Expected: ~16 hits across the admin endpoint tree. Note them — every one needs `await` added in step 4.

- [ ] **Step 2: Rewrite `_shared/admin-auth.ts`**

Replace `ohcs-website/functions/_shared/admin-auth.ts` with:

```typescript
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
```

- [ ] **Step 3: Update `mockEnv` so existing admin endpoint tests keep working**

The catch: existing tests rely on the pre-change synchronous header-based check. The new `requireAdmin` is async AND queries `site_config` for the demo toggle. We need the mock D1 to answer that query with `'true'` by default in tests, OR we set the toggle via a `site_config` mock in each test.

Cleanest: add a default script for the site_config lookup in `tests/functions/_helpers/d1-mock.ts` — but that breaks isolation. Instead, update each existing admin test to include the site_config script.

Modify `ohcs-website/tests/functions/_helpers/mock-env.ts` to expose a helper `mockEnvWithDemoMode(opts)` that wraps `makeD1` adding the site_config row. Then existing tests that call `mockEnv({db})` with their own `makeD1(...)` need to add the demo-mode script.

For minimum disruption, ADD the row to every existing admin test's `makeD1` setup. To find them:

Run: `cd ohcs-website && grep -l "X-Admin-User" tests/functions/admin --include="*.ts" -r`
Expected: 6 files (vetting, application-detail, applications-list, exercises, exercise-requirements, document-types, appeals-queue, document-url).

For each one, prepend this script to the `makeD1` array:

```typescript
{
  sql: 'SELECT value FROM site_config WHERE key = ?',
  first: { value: 'true' },
},
```

Concrete edit example for `tests/functions/admin/vetting.test.ts` (apply the same pattern to all 8):

```typescript
const db = makeD1([
  // NEW: enable demo mode in tests so existing header-based gate works
  { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } },
  // existing scripts follow ...
]);
```

- [ ] **Step 4: Add `await` to every `requireAdmin()` caller in admin endpoints**

For each file from Step 1, change:
```typescript
const auth = requireAdmin(request);
```
to:
```typescript
const auth = await requireAdmin(request, env);
```

The function is now async AND takes `env` as a second parameter. This is the only signature change.

Files to update (run grep again to confirm):
- `functions/api/admin/applications/[id].ts`
- `functions/api/admin/applications/index.ts`
- `functions/api/admin/applications/appeals.ts`
- `functions/api/admin/applications/[id]/claim.ts`
- `functions/api/admin/applications/[id]/release.ts`
- `functions/api/admin/applications/[id]/vetting.ts`
- `functions/api/admin/applications/[id]/appeals/resolve.ts`
- `functions/api/admin/applications/[id]/documents/[docTypeId]/url.ts`
- `functions/api/admin/dev/test-email.ts`
- `functions/api/admin/document-types/index.ts`
- `functions/api/admin/document-types/[id].ts`
- `functions/api/admin/exercises/index.ts`
- `functions/api/admin/exercises/[id].ts`
- `functions/api/admin/exercises/[id]/requirements.ts`
- `functions/api/admin/exercises/[id]/requirements/[doc_type_id].ts`

(Confirm exact list via grep — no manual list will stay accurate.)

- [ ] **Step 5: Run full test suite**

Run: `cd ohcs-website && npm test -- --run`
Expected: All 200+ tests passing (existing + 11 new from Tasks 2/3/5/6/7).

- [ ] **Step 6: Run typecheck + lint**

Run: `cd ohcs-website && npx tsc --noEmit && npm run lint`
Expected: 0 TS errors. Lint: 18 pre-existing warnings (unchanged).

- [ ] **Step 7: Commit**

```bash
git add ohcs-website/functions/_shared/admin-auth.ts ohcs-website/functions/api/admin ohcs-website/tests/functions/admin
git commit -m "feat(admin-auth): rewrite requireAdmin — cookie session first, demo fallback gated by toggle + APP_ENV"
```

---

### Task 9: GET + POST /api/admin/users — list + add admin (super_admin only)

**Files:**
- Create: `ohcs-website/functions/api/admin/users/index.ts`
- Create: `ohcs-website/tests/functions/admin/auth/users-list-create.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/admin/auth/users-list-create.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../../functions/api/admin/users/index';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

const SUPER = { 'X-Admin-User-Email': 's@ohcs.gov.gh', 'X-Admin-User-Role': 'super_admin' };
const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

const DEMO_ON = { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } };

describe('GET /api/admin/users', () => {
  it('lists admins for super_admin', async () => {
    const db = makeD1([
      DEMO_ON,
      {
        sql:
          'SELECT email, role, display_name, is_active, created_at, last_login_at FROM admin_users ORDER BY created_at ASC',
        all: {
          results: [
            {
              email: 's@ohcs.gov.gh',
              role: 'super_admin',
              display_name: 'Bootstrap',
              is_active: 1,
              created_at: 1,
              last_login_at: 2,
            },
          ],
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/users', { headers: SUPER }), db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { email: string }[] };
    expect(body.data).toHaveLength(1);
  });

  it('returns 403 for non-super_admin', async () => {
    const db = makeD1([DEMO_ON]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/users', { headers: VIEWER }), db),
    );
    expect(res.status).toBe(403);
  });
});

describe('POST /api/admin/users', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('creates a new admin and sends them a welcome magic link', async () => {
    const db = makeD1([
      DEMO_ON,
      {
        sql:
          'INSERT INTO admin_users (email, role, display_name, is_active, created_at, created_by, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'INSERT INTO admin_magic_tokens (token, email, created_at, expires_at, ip_address) VALUES (?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/users', {
          method: 'POST',
          headers: { ...SUPER, 'content-type': 'application/json' },
          body: JSON.stringify({
            email: 'new@ohcs.gov.gh',
            role: 'recruitment_admin',
            display_name: 'New Admin',
          }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(201);
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('rejects 400 when role is invalid', async () => {
    const db = makeD1([DEMO_ON]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/users', {
          method: 'POST',
          headers: { ...SUPER, 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'x@ohcs.gov.gh', role: 'god_mode' }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(400);
  });

  it('rejects 403 for non-super_admin', async () => {
    const db = makeD1([DEMO_ON]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/users', {
          method: 'POST',
          headers: { ...VIEWER, 'content-type': 'application/json' },
          body: JSON.stringify({ email: 'x@ohcs.gov.gh', role: 'viewer' }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/users-list-create.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/api/admin/users/index.ts`:

```typescript
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseBody } from '../../../_shared/validate';
import { all, run } from '../../../_shared/db';
import { requireAdmin } from '../../../_shared/admin-auth';
import { sendEmail } from '../../../_shared/email';
import { hashToken } from '../../../_shared/hash-token';
import { adminMagicLinkEmail } from '../../../_shared/admin-magic-link-email';
import { z } from 'zod';

const ROLES = ['super_admin', 'recruitment_admin', 'content_manager', 'viewer'] as const;

const Body = z.object({
  email: z.string().email().toLowerCase(),
  role: z.enum(ROLES),
  display_name: z.string().min(1).max(120).optional(),
});

const TOKEN_TTL_MS = 15 * 60 * 1000;
const TOKEN_TTL_MIN = 15;

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

interface AdminRow {
  email: string;
  role: string;
  display_name: string | null;
  is_active: number;
  created_at: number;
  last_login_at: number | null;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }

  const rows = await all<AdminRow>(
    env,
    'SELECT email, role, display_name, is_active, created_at, last_login_at FROM admin_users ORDER BY created_at ASC',
  );
  return json({ data: rows });
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;
  const now = Date.now();

  await run(
    env,
    'INSERT INTO admin_users (email, role, display_name, is_active, created_at, created_by, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)',
    v.email,
    v.role,
    v.display_name ?? null,
    now,
    auth.admin.email,
    now,
  );

  // Send a welcome magic link so they can log in immediately.
  const token = generateToken();
  const tokenHash = await hashToken(token);
  await run(
    env,
    'INSERT INTO admin_magic_tokens (token, email, created_at, expires_at, ip_address) VALUES (?, ?, ?, ?, ?)',
    tokenHash,
    v.email,
    now,
    now + TOKEN_TTL_MS,
    null,
  );

  const origin = new URL(request.url).origin;
  const resumeUrl = `${origin}/api/admin/auth/magic/${encodeURIComponent(token)}`;
  const body = adminMagicLinkEmail(resumeUrl, TOKEN_TTL_MIN);
  try {
    await sendEmail(env, { to: v.email, subject: body.subject, html: body.html, text: body.text });
  } catch (err) {
    console.error('admin welcome email failed', err);
  }

  return json({ data: { email: v.email, role: v.role } }, { status: 201 });
};
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/users-list-create.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/api/admin/users/index.ts ohcs-website/tests/functions/admin/auth/users-list-create.test.ts
git commit -m "feat(admin-auth): GET + POST /api/admin/users — list + create admin (super_admin only)"
```

---

### Task 10: PATCH + DELETE /api/admin/users/[email]

**Files:**
- Create: `ohcs-website/functions/api/admin/users/[email].ts`
- Create: `ohcs-website/tests/functions/admin/auth/users-update-delete.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/admin/auth/users-update-delete.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { onRequestPatch, onRequestDelete } from '../../../../functions/api/admin/users/[email]';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

const SUPER = { 'X-Admin-User-Email': 's@ohcs.gov.gh', 'X-Admin-User-Role': 'super_admin' };
const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };
const DEMO_ON = { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } };

function ctx(req: Request, email: string, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: { email }, waitUntil: () => {}, data: {} };
}

describe('PATCH /api/admin/users/[email]', () => {
  it('updates role', async () => {
    const db = makeD1([
      DEMO_ON,
      {
        sql:
          'UPDATE admin_users SET role = COALESCE(?, role), display_name = COALESCE(?, display_name), is_active = COALESCE(?, is_active), updated_at = ? WHERE email = ?',
        run: {},
      },
      // role change cascades to existing sessions
      { sql: 'DELETE FROM admin_sessions WHERE email = ?', run: {} },
    ]);
    const res = await onRequestPatch(
      ctx(
        new Request('https://x/api/admin/users/x@ohcs.gov.gh', {
          method: 'PATCH',
          headers: { ...SUPER, 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'recruitment_admin' }),
        }),
        'x@ohcs.gov.gh',
        db,
      ),
    );
    expect(res.status).toBe(200);
  });

  it('rejects 403 for non-super_admin', async () => {
    const db = makeD1([DEMO_ON]);
    const res = await onRequestPatch(
      ctx(
        new Request('https://x/api/admin/users/x@ohcs.gov.gh', {
          method: 'PATCH',
          headers: { ...VIEWER, 'content-type': 'application/json' },
          body: JSON.stringify({ role: 'super_admin' }),
        }),
        'x@ohcs.gov.gh',
        db,
      ),
    );
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/admin/users/[email]', () => {
  it('soft-deletes (is_active=0) and wipes sessions', async () => {
    const db = makeD1([
      DEMO_ON,
      {
        sql:
          'UPDATE admin_users SET is_active = 0, updated_at = ? WHERE email = ?',
        run: {},
      },
      { sql: 'DELETE FROM admin_sessions WHERE email = ?', run: {} },
    ]);
    const res = await onRequestDelete(
      ctx(
        new Request('https://x/api/admin/users/x@ohcs.gov.gh', {
          method: 'DELETE',
          headers: SUPER,
        }),
        'x@ohcs.gov.gh',
        db,
      ),
    );
    expect(res.status).toBe(200);
  });

  it('refuses to delete the caller themselves', async () => {
    const db = makeD1([DEMO_ON]);
    const res = await onRequestDelete(
      ctx(
        new Request('https://x/api/admin/users/s@ohcs.gov.gh', {
          method: 'DELETE',
          headers: SUPER,
        }),
        's@ohcs.gov.gh',
        db,
      ),
    );
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/users-update-delete.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/api/admin/users/[email].ts`:

```typescript
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseBody } from '../../../_shared/validate';
import { run } from '../../../_shared/db';
import { requireAdmin } from '../../../_shared/admin-auth';
import { z } from 'zod';

const ROLES = ['super_admin', 'recruitment_admin', 'content_manager', 'viewer'] as const;

const PatchBody = z.object({
  role: z.enum(ROLES).optional(),
  display_name: z.string().min(1).max(120).optional(),
  is_active: z.boolean().optional(),
});

export const onRequestPatch: PagesFunction<Env, 'email'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, PatchBody);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;
  const now = Date.now();

  await run(
    env,
    'UPDATE admin_users SET role = COALESCE(?, role), display_name = COALESCE(?, display_name), is_active = COALESCE(?, is_active), updated_at = ? WHERE email = ?',
    v.role ?? null,
    v.display_name ?? null,
    v.is_active === undefined ? null : v.is_active ? 1 : 0,
    now,
    params.email,
  );

  // Role change OR deactivation invalidates active sessions.
  if (v.role || v.is_active === false) {
    await run(env, 'DELETE FROM admin_sessions WHERE email = ?', params.email);
  }

  return json({ data: { email: params.email } });
};

export const onRequestDelete: PagesFunction<Env, 'email'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }
  if (params.email === auth.admin.email) {
    return json({ error: 'cannot deactivate yourself' }, { status: 409 });
  }

  const now = Date.now();
  await run(
    env,
    'UPDATE admin_users SET is_active = 0, updated_at = ? WHERE email = ?',
    now,
    params.email,
  );
  await run(env, 'DELETE FROM admin_sessions WHERE email = ?', params.email);

  return json({ data: { email: params.email, deactivated: true } });
};
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/users-update-delete.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/api/admin/users/[email].ts ohcs-website/tests/functions/admin/auth/users-update-delete.test.ts
git commit -m "feat(admin-auth): PATCH + DELETE /api/admin/users/[email] — update + soft-delete with session invalidation"
```

---

### Task 11: GET + PUT /api/admin/site-config

**Files:**
- Create: `ohcs-website/functions/api/admin/site-config/index.ts`
- Create: `ohcs-website/functions/api/admin/site-config/[key].ts`
- Create: `ohcs-website/tests/functions/admin/auth/site-config.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/admin/auth/site-config.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/admin/site-config/index';
import { onRequestPut } from '../../../../functions/api/admin/site-config/[key]';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1 } from '../../_helpers/d1-mock';

const SUPER = { 'X-Admin-User-Email': 's@ohcs.gov.gh', 'X-Admin-User-Role': 'super_admin' };
const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };
const DEMO_ON = { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } };

function ctx(req: Request, db?: D1Database, params: Record<string, string> = {}) {
  return { request: req, env: mockEnv({ db }), params, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/site-config', () => {
  it('returns all config rows for super_admin', async () => {
    const db = makeD1([
      DEMO_ON,
      {
        sql: 'SELECT key, value, updated_at, updated_by FROM site_config ORDER BY key ASC',
        all: {
          results: [
            { key: 'admin_demo_mode_enabled', value: 'true', updated_at: 1, updated_by: null },
          ],
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/site-config', { headers: SUPER }), db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { key: string; value: string }[] };
    expect(body.data[0]?.key).toBe('admin_demo_mode_enabled');
  });

  it('rejects 403 for non-super_admin', async () => {
    const db = makeD1([DEMO_ON]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/site-config', { headers: VIEWER }), db),
    );
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/admin/site-config/[key]', () => {
  it('updates an existing key for super_admin', async () => {
    const db = makeD1([
      DEMO_ON,
      {
        sql:
          'INSERT INTO site_config (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by',
        run: {},
      },
    ]);
    const res = await onRequestPut(
      ctx(
        new Request('https://x/api/admin/site-config/admin_demo_mode_enabled', {
          method: 'PUT',
          headers: { ...SUPER, 'content-type': 'application/json' },
          body: JSON.stringify({ value: 'false' }),
        }),
        db,
        { key: 'admin_demo_mode_enabled' },
      ),
    );
    expect(res.status).toBe(200);
  });

  it('rejects 400 when value is not a string', async () => {
    const db = makeD1([DEMO_ON]);
    const res = await onRequestPut(
      ctx(
        new Request('https://x/api/admin/site-config/x', {
          method: 'PUT',
          headers: { ...SUPER, 'content-type': 'application/json' },
          body: JSON.stringify({ value: 123 }),
        }),
        db,
        { key: 'x' },
      ),
    );
    expect(res.status).toBe(400);
  });

  it('rejects 403 for non-super_admin', async () => {
    const db = makeD1([DEMO_ON]);
    const res = await onRequestPut(
      ctx(
        new Request('https://x/api/admin/site-config/x', {
          method: 'PUT',
          headers: { ...VIEWER, 'content-type': 'application/json' },
          body: JSON.stringify({ value: 'y' }),
        }),
        db,
        { key: 'x' },
      ),
    );
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/site-config.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement GET endpoint**

Create `ohcs-website/functions/api/admin/site-config/index.ts`:

```typescript
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { all } from '../../../_shared/db';
import { requireAdmin } from '../../../_shared/admin-auth';

interface ConfigRow {
  key: string;
  value: string;
  updated_at: number;
  updated_by: string | null;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }

  const rows = await all<ConfigRow>(
    env,
    'SELECT key, value, updated_at, updated_by FROM site_config ORDER BY key ASC',
  );
  return json({ data: rows });
};
```

- [ ] **Step 4: Implement PUT endpoint**

Create `ohcs-website/functions/api/admin/site-config/[key].ts`:

```typescript
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseBody } from '../../../_shared/validate';
import { run } from '../../../_shared/db';
import { requireAdmin } from '../../../_shared/admin-auth';
import { z } from 'zod';

const Body = z.object({ value: z.string().min(1).max(2000) });

export const onRequestPut: PagesFunction<Env, 'key'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin') {
    return json({ error: 'super_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;

  const now = Date.now();
  await run(
    env,
    'INSERT INTO site_config (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by',
    params.key,
    parsed.value.value,
    now,
    auth.admin.email,
  );
  return json({ data: { key: params.key, value: parsed.value.value } });
};
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `cd ohcs-website && npx vitest run tests/functions/admin/auth/site-config.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add ohcs-website/functions/api/admin/site-config ohcs-website/tests/functions/admin/auth/site-config.test.ts
git commit -m "feat(admin-auth): GET + PUT /api/admin/site-config — toggle demo mode + other config"
```

---

### Task 12: Frontend — magic-link form component

**Files:**
- Create: `ohcs-website/src/components/admin/magic-link-form.tsx`

- [ ] **Step 1: Implement (no separate test — exercised through login page)**

Create `ohcs-website/src/components/admin/magic-link-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';

export function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many sign-in requests. Please wait 15 minutes and try again.');
        } else {
          setError('Could not send sign-in link. Please try again or contact IT.');
        }
        return;
      }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-lg font-bold text-primary-dark mb-2">Check your inbox</h3>
        <p className="text-sm text-text-muted">
          If <strong>{email}</strong> is registered as an OHCS admin, a sign-in link has been sent.
          The link expires in 15 minutes and can be used once.
        </p>
        <p className="text-xs text-text-muted mt-4">
          Didn&rsquo;t receive it? Check spam, or{' '}
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            className="underline font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label htmlFor="admin-email" className="block text-sm font-semibold text-primary-dark">
        OHCS admin email
      </label>
      <div className="relative">
        <Mail
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
          aria-hidden="true"
        />
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@ohcs.gov.gh"
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !email}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Mail className="h-4 w-4" aria-hidden="true" />
        )}
        {submitting ? 'Sending link…' : 'Send sign-in link'}
      </button>
      <p className="text-xs text-text-muted text-center">
        We&rsquo;ll email you a one-time link valid for 15 minutes. No password needed.
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add ohcs-website/src/components/admin/magic-link-form.tsx
git commit -m "feat(admin-auth): MagicLinkForm component — email input + sent-state confirmation"
```

---

### Task 13: Frontend — rewrite login page with tabs

**Files:**
- Modify: `ohcs-website/src/app/admin/login/page.tsx`

- [ ] **Step 1: Read existing login page to preserve any styling around the demo form**

Run: `cd ohcs-website && cat src/app/admin/login/page.tsx | head -80`

- [ ] **Step 2: Rewrite with tabs**

Replace `ohcs-website/src/app/admin/login/page.tsx` so it:

- Fetches `/api/admin/site-config` on mount
- If `admin_demo_mode_enabled === 'true'` → shows two tabs: **Magic Link** (default) + **Demo Login** (existing email+password form)
- Else → shows only `<MagicLinkForm />`

The demo login form's existing `adminLogin(email, password)` call from `src/lib/admin-auth.ts` stays unchanged — Task 17 will handle the lib's session bookkeeping.

Reference structure (the actual existing page may differ — preserve the page chrome, only change the form area):

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/lib/admin-auth';
import { MagicLinkForm } from '@/components/admin/magic-link-form';
import { cn } from '@/lib/utils';

type Tab = 'magic' | 'demo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [demoModeOn, setDemoModeOn] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('magic');

  // Demo form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((b: { data: { key: string; value: string }[] }) => {
        const row = b.data.find((c) => c.key === 'admin_demo_mode_enabled');
        setDemoModeOn(row?.value === 'true');
      })
      .catch(() => setDemoModeOn(false));
  }, []);

  async function onDemoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDemoSubmitting(true);
    setDemoError(null);
    try {
      await adminLogin(email, password);
      router.push('/admin');
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setDemoSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border-2 border-border/40 p-8">
        <h1 className="text-2xl font-bold text-primary-dark text-center mb-1">
          OHCS Admin Portal
        </h1>
        <p className="text-sm text-text-muted text-center mb-6">
          Office of the Head of the Civil Service
        </p>

        {demoModeOn === null && (
          <p className="text-sm text-text-muted text-center py-8">Loading…</p>
        )}

        {demoModeOn === false && <MagicLinkForm />}

        {demoModeOn === true && (
          <>
            <div className="flex border-b border-border/40 mb-6" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'magic'}
                onClick={() => setTab('magic')}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  tab === 'magic'
                    ? 'text-primary border-b-2 border-primary -mb-[2px]'
                    : 'text-text-muted hover:text-primary-dark',
                )}
              >
                Magic Link
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'demo'}
                onClick={() => setTab('demo')}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  tab === 'demo'
                    ? 'text-primary border-b-2 border-primary -mb-[2px]'
                    : 'text-text-muted hover:text-primary-dark',
                )}
              >
                Demo Login
              </button>
            </div>

            {tab === 'magic' && <MagicLinkForm />}

            {tab === 'demo' && (
              <form onSubmit={onDemoSubmit} className="space-y-4">
                <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                  Demo mode is currently enabled. Disable in Settings → Auth Mode before going live.
                </div>
                <div>
                  <label
                    htmlFor="demo-email"
                    className="block text-sm font-semibold text-primary-dark mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="demo-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="demo-password"
                    className="block text-sm font-semibold text-primary-dark mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="demo-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                  />
                </div>
                {demoError && <p className="text-sm text-red-700">{demoError}</p>}
                <button
                  type="submit"
                  disabled={demoSubmitting || !email || !password}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {demoSubmitting ? 'Signing in…' : 'Sign in (demo)'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Manual smoke test**

Run: `cd ohcs-website && npm run dev`

Visit `http://localhost:3000/admin/login`. Confirm:
- Loading state appears briefly
- Both tabs render with demo mode on (default)
- Switching tabs works
- Magic-link form sends a request to `/api/admin/auth/start` (network tab — won't actually deliver in dev unless Resend is configured locally, but the request should be made)
- Demo form still accepts `admin@ohcs.gov.gh` / `changeme123`

- [ ] **Step 4: Commit**

```bash
git add ohcs-website/src/app/admin/login/page.tsx
git commit -m "feat(admin-auth): login page tabs — magic-link default, demo-login when toggle on"
```

---

### Task 14: Frontend — Settings → Admin Users page

**Files:**
- Create: `ohcs-website/src/app/admin/settings/users/page.tsx`
- Create: `ohcs-website/src/components/admin/admin-users-table.tsx`

- [ ] **Step 1: Implement table component**

Create `ohcs-website/src/components/admin/admin-users-table.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Trash2, Mail, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES = ['super_admin', 'recruitment_admin', 'content_manager', 'viewer'] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super Admin',
  recruitment_admin: 'Recruitment Admin',
  content_manager: 'Content Manager',
  viewer: 'Viewer',
};

export interface AdminUserRow {
  email: string;
  role: Role;
  display_name: string | null;
  is_active: number;
  created_at: number;
  last_login_at: number | null;
}

export function AdminUsersTable({
  rows,
  onChange,
}: {
  rows: AdminUserRow[];
  onChange: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function changeRole(email: string, role: Role) {
    setBusy(email);
    try {
      await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      await onChange();
    } finally {
      setBusy(null);
    }
  }

  async function deactivate(email: string) {
    if (!confirm(`Deactivate ${email}? They will be signed out immediately.`)) return;
    setBusy(email);
    try {
      await fetch(`/api/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
      await onChange();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-border/40 overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold text-text-muted">Email</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Name</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Role</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Status</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Last sign-in</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.email} className="border-t border-border/40">
              <td className="px-4 py-3 font-mono text-xs">{r.email}</td>
              <td className="px-4 py-3">{r.display_name ?? '—'}</td>
              <td className="px-4 py-3">
                <select
                  value={r.role}
                  onChange={(e) => void changeRole(r.email, e.target.value as Role)}
                  disabled={busy === r.email || r.is_active === 0}
                  className="rounded border-2 border-border/60 px-2 py-1 text-sm bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABEL[role]}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold',
                    r.is_active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-600',
                  )}
                >
                  {r.is_active ? 'Active' : 'Deactivated'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-text-muted">
                {r.last_login_at ? new Date(r.last_login_at).toLocaleString() : 'Never'}
              </td>
              <td className="px-4 py-3 text-right">
                {r.is_active === 1 && (
                  <button
                    type="button"
                    onClick={() => void deactivate(r.email)}
                    disabled={busy === r.email}
                    aria-label={`Deactivate ${r.email}`}
                    className="text-red-700 hover:text-red-900 inline-flex items-center gap-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded p-1"
                  >
                    {busy === r.email ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                No admins yet. Click &ldquo;Add Admin&rdquo; above to add the first one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Implement page**

Create `ohcs-website/src/app/admin/settings/users/page.tsx`:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { AdminUsersTable, type AdminUserRow } from '@/components/admin/admin-users-table';

export default function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal state
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('recruitment_admin');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const body = (await res.json()) as { data: AdminUserRow[] };
      setRows(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          ...(name ? { display_name: name } : {}),
        }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error ?? `Failed (${res.status})`);
      }
      setOpen(false);
      setEmail('');
      setName('');
      setRole('recruitment_admin');
      await refresh();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Admin Users</h1>
          <p className="text-sm text-text-muted mt-1">
            Anyone in this list can sign in via magic link. Adding an admin sends them a welcome
            link immediately.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus className="h-4 w-4" /> Add Admin
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-800 mb-4">
          {error}{' '}
          <button onClick={() => void refresh()} className="underline font-semibold">
            Retry
          </button>
        </div>
      )}
      {!loading && !error && <AdminUsersTable rows={rows} onChange={refresh} />}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-primary-dark mb-4">Add Admin</h2>
            <form onSubmit={onAdd} className="space-y-4">
              <div>
                <label htmlFor="add-email" className="block text-sm font-semibold mb-1">
                  Email
                </label>
                <input
                  id="add-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>
              <div>
                <label htmlFor="add-role" className="block text-sm font-semibold mb-1">
                  Role
                </label>
                <select
                  id="add-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="recruitment_admin">Recruitment Admin</option>
                  <option value="content_manager">Content Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label htmlFor="add-name" className="block text-sm font-semibold mb-1">
                  Display name (optional)
                </label>
                <input
                  id="add-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>
              {addError && <p className="text-sm text-red-700">{addError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border-2 border-border/60 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !email}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:opacity-50"
                >
                  {submitting ? 'Adding…' : 'Add + send link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Manual smoke test**

Run: `cd ohcs-website && npm run dev`

Visit `http://localhost:3000/admin/settings/users/`. Confirm:
- Bootstrap admin row visible
- "Add Admin" modal opens, role dropdown shows 4 options, submitting POSTs to `/api/admin/users`
- Role dropdown on existing row PATCHes
- Deactivate button DELETEs (after confirm)

- [ ] **Step 4: Commit**

```bash
git add ohcs-website/src/components/admin/admin-users-table.tsx ohcs-website/src/app/admin/settings/users
git commit -m "feat(admin-auth): Settings → Admin Users page (super_admin allowlist management)"
```

---

### Task 15: Frontend — Settings → Auth Mode page

**Files:**
- Create: `ohcs-website/src/app/admin/settings/auth/page.tsx`

- [ ] **Step 1: Implement**

Create `ohcs-website/src/app/admin/settings/auth/page.tsx`:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function AuthModePage() {
  const [demoOn, setDemoOn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/site-config');
      if (!res.ok) throw new Error('Failed to load config');
      const body = (await res.json()) as { data: { key: string; value: string }[] };
      const row = body.data.find((c) => c.key === 'admin_demo_mode_enabled');
      setDemoOn(row?.value === 'true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle() {
    if (demoOn === null) return;
    const next = !demoOn;
    if (
      !next &&
      !confirm(
        'Disabling demo mode will sign out anyone using demo credentials and require all admins to use magic-link sign-in. Continue?',
      )
    ) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/site-config/admin_demo_mode_enabled', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value: next ? 'true' : 'false' }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      setDemoOn(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-primary-dark mb-1">Auth Mode</h1>
      <p className="text-sm text-text-muted mb-6">
        Controls whether the demo email+password login is accepted alongside magic-link sign-in.
      </p>

      {loading && (
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-800 mb-4">
          {error}
        </div>
      )}

      {!loading && demoOn !== null && (
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary-dark">Demo Mode</h2>
              <p className="text-sm text-text-muted mt-1">
                When ON, the four hardcoded demo accounts (
                <code className="text-xs">admin@ohcs.gov.gh</code> etc.) can sign in. When OFF,
                only emails in the Admin Users allowlist can sign in via magic link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void toggle()}
              disabled={saving}
              role="switch"
              aria-checked={demoOn}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                demoOn ? 'bg-primary' : 'bg-gray-300'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  demoOn ? 'translate-x-6' : 'translate-x-0.5'
                } translate-y-0.5`}
              />
            </button>
          </div>

          {demoOn && (
            <div className="mt-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Demo mode allows anyone with knowledge of the demo passwords to sign in. Disable
                before going live to citizens.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Manual smoke test**

Run: `cd ohcs-website && npm run dev`

Visit `http://localhost:3000/admin/settings/auth/`. Confirm:
- Toggle reflects current state
- Flipping fires PUT, persists, page reflects new state
- Confirm dialog appears when turning OFF

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/src/app/admin/settings/auth
git commit -m "feat(admin-auth): Settings → Auth Mode page (toggle demo mode)"
```

---

### Task 16: Frontend — wire `src/lib/admin-auth.ts` to /api/admin/auth/me

**Files:**
- Modify: `ohcs-website/src/lib/admin-auth.ts`

- [ ] **Step 1: Update getAdminUser to prefer cookie session, fall back to demo localStorage**

Replace the body of `getAdminUser()` in `ohcs-website/src/lib/admin-auth.ts` so it:

1. Calls `GET /api/admin/auth/me` first
2. If 200, returns that admin (this is a cookie-backed session — magic link path)
3. If 401, falls back to the existing localStorage demo path

Replace the existing function:

```typescript
export async function getAdminUser(): Promise<AdminUser | null> {
  // 1) Cookie-backed session (magic-link path)
  try {
    const res = await fetch('/api/admin/auth/me', { credentials: 'include' });
    if (res.ok) {
      const body = (await res.json()) as { data: { email: string; role: string } };
      return {
        id: `cookie-${body.data.email}`,
        email: body.data.email,
        name: body.data.email.split('@')[0],
        role: body.data.role as AdminUser['role'],
      };
    }
  } catch {
    // Fall through to demo path.
  }

  // 2) Demo fallback (localStorage)
  if (isDemoMode()) {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AdminUser;
    } catch {
      return null;
    }
  }

  return null;
}
```

Also update `adminLogout` to call the new endpoint:

```typescript
export async function adminLogout(): Promise<void> {
  audit('logout', 'session', '', '', 'Logged out');

  // 1) Magic-link session — POST to /logout endpoint, server clears cookie.
  try {
    await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // Best effort.
  }

  // 2) Demo fallback — clear localStorage.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
```

- [ ] **Step 2: Run any existing client tests**

Run: `cd ohcs-website && npm test -- --run`
Expected: 200+ tests pass.

- [ ] **Step 3: Manual smoke test**

Visit `/admin/login`, log in via demo creds (still works) — verify `/admin` loads correctly.
Then in DevTools Application tab, delete localStorage entries — visit `/admin` — should redirect to `/admin/login`.

- [ ] **Step 4: Commit**

```bash
git add ohcs-website/src/lib/admin-auth.ts
git commit -m "feat(admin-auth): client lib — prefer /api/admin/auth/me, fall back to demo localStorage"
```

---

### Task 17: Apply migration 0010 to remote D1

**Files:** None (operational task)

- [ ] **Step 1: Run remote migration**

Run: `cd ohcs-website && npm run migrate:remote`
Expected: `✅ Applied 1 migration(s).` (only 0010 — the previous 9 are already applied)

- [ ] **Step 2: Verify schema by listing tables**

Run: `cd ohcs-website && npx wrangler d1 execute ohcs-recruitment --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%admin%' OR name = 'site_config'"`
Expected output includes: `admin_users`, `admin_magic_tokens`, `admin_sessions`, `site_config`.

- [ ] **Step 3: Verify bootstrap row exists**

Run: `cd ohcs-website && npx wrangler d1 execute ohcs-recruitment --remote --command="SELECT email, role, is_active FROM admin_users"`
Expected: one row, `ohcsghana.main@gmail.com | super_admin | 1`.

- [ ] **Step 4: Verify demo mode is enabled by default**

Run: `cd ohcs-website && npx wrangler d1 execute ohcs-recruitment --remote --command="SELECT * FROM site_config"`
Expected: one row, `admin_demo_mode_enabled | true`.

---

### Task 18: Deploy + end-to-end smoke test

**Files:** None (operational task)

- [ ] **Step 1: Deploy**

Run: `cd ohcs-website && npm run pages:deploy`
Expected: `✨ Deployment complete!` URL printed.

- [ ] **Step 2: Health check**

Run: `curl -s https://ohcs.pages.dev/api/health | grep -o '"status":"ok"'`
Expected: `"status":"ok"`.

- [ ] **Step 3: Verify demo login still works**

Visit `https://ohcs.pages.dev/admin/login`. Both tabs visible. Log in via demo tab using `admin@ohcs.gov.gh` / `changeme123`. Should land on `/admin`.

- [ ] **Step 4: Verify magic-link path end-to-end**

Visit `https://ohcs.pages.dev/admin/login`. Enter `ohcsghana.main@gmail.com` in the Magic Link tab. Click "Send sign-in link". Confirm "Check your inbox" state appears. Check the inbox — open the magic link. Should land on `/admin` as super_admin.

- [ ] **Step 5: Verify Settings → Admin Users**

Visit `https://ohcs.pages.dev/admin/settings/users/`. Confirm one row (the bootstrap admin) is visible.

- [ ] **Step 6: Verify Settings → Auth Mode**

Visit `https://ohcs.pages.dev/admin/settings/auth/`. Confirm toggle shows ON. **Do NOT toggle off in production yet** — that's the cutover ceremony, deferred until ready.

- [ ] **Step 7: Verify enumeration protection**

Run:
```bash
curl -X POST https://ohcs.pages.dev/api/admin/auth/start \
  -H 'content-type: application/json' \
  -d '{"email":"attacker@example.com"}' -s | head
```
Expected: `{"data":{"sent":true}}` — same response shape as a real admin email (no leakage).

- [ ] **Step 8: Push to GitHub**

Run: `git push origin feat/admin-magic-link-auth` (and merge via PR or fast-forward to master per the project's branch convention).

- [ ] **Step 9: Update memory**

Append to `C:\Users\USER\.claude\projects\C--Users-USER-OneDrive---Smart-Workplace-Desktop-Projects-OHCS-Website-Redesign\memory\project_recruitment_progress.md` under the audit batch section: a one-line entry that admin magic-link auth shipped on 2026-04-24.

---

## Self-review checklist

Before declaring done, verify:

- [ ] **Spec coverage**: every numbered section in the spec has at least one task above (§5.1 schema → Task 1; §5.2 lifecycle → Tasks 3, 5, 6; §5.3 endpoints → Tasks 5–11; §5.4 requireAdmin rewrite → Task 8; §5.5 frontend → Tasks 12–16; §5.6 security → Tasks 5, 6, 8; §6 file layout → all tasks; §7 cutover plan → Task 18; §8 migration safety → Task 1 + 17; §9 tests → Tasks 2–11)
- [ ] **No placeholders**: every code block is complete (no `// TODO`, no `// implement here`)
- [ ] **Type consistency**: `requireAdmin(request, env)` signature is the same in Task 8 and the test files in Tasks 9–11; `AdminSessionRow.role` typed as `string` (not narrowed to a literal) in Task 3 and consumed in Task 8 — consistent
- [ ] **Bootstrap admin** is seeded in Task 1 migration (so the system is never lockable-out)
- [ ] **Demo coexistence** — Task 8 explicitly gates header path on (toggle ON) AND (APP_ENV !== 'production'); Task 16 keeps localStorage fallback for demo
- [ ] **Test count**: Task 2 (4) + Task 3 (7) + Task 5 (4) + Task 6 (4) + Task 7 (4) + Task 9 (5) + Task 10 (4) + Task 11 (5) = **37 new tests**, bringing total from 202 → 239

---

## Estimated effort

- Tasks 1–4: ~45 minutes (migration + 3 small helpers)
- Tasks 5–7: ~90 minutes (3 endpoints with TDD)
- Task 8: ~60 minutes (rewrite + cascade fix-ups + test reconciliation)
- Tasks 9–11: ~75 minutes (CRUD endpoints with TDD)
- Tasks 12–16: ~120 minutes (UI work, including manual smoke testing)
- Tasks 17–18: ~30 minutes (deploy + verify)

**Total: ~7 hours of focused work.**
