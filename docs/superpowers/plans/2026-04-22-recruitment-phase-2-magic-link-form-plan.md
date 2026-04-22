# Recruitment Phase 2 — Magic Link & Application Form Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an applicant request a magic link, click through email, fill personal/eligibility/education form steps, save progress automatically, log out and resume from any device — Step 4 (document uploads) stays a placeholder until Phase 3.

**Architecture:** Three new D1 tables (`applications`, `magic_link_tokens`, `application_sessions`). Eight new Pages Functions endpoints under `/api/applications/*` for the public side. Five-step wizard React UI gated by an httpOnly session cookie, with a typed browser client that auto-saves form fields on blur and step change. Magic-link emails delivered via Resend (already wired in via `feat/email-resend-sandbox`). Reference numbers generated as `OHCS-{year}-{seq:05d}` per exercise.

**Tech Stack:** Cloudflare D1, Cloudflare Pages Functions, Cloudflare R2 (not used in this phase), Next.js 16 (static export, React 19), Vitest, Zod for validation, Resend for transactional email, the existing `audit-logger` client helper.

**Spec reference:** `docs/superpowers/specs/2026-04-21-recruitment-document-requirements-design.md` § 4 (data model), § 6 (applicant UX), § 7.1 (public endpoints), § 11 Phase 2.

---

## Interim Security Posture (still in effect)

The applicant-side endpoints in this phase use real session-based auth — no header-trust shortcut. The applicant receives a magic-link token by email, the GET `/api/applications/magic/[token]` endpoint exchanges the token for a session cookie (httpOnly, Secure, SameSite=Lax, 7-day sliding expiry), and every subsequent `/api/applications/me*` call is authorised by reading that cookie and looking up the session.

Admin endpoints from Phase 1 remain on the interim header-based gate. They are not touched in this phase.

---

## Resend Sandbox Constraint (developer note)

Phase 1 wired the email helper to send via Resend's sandbox sender (`onboarding@resend.dev`). **Resend will only deliver mail from that sender to email addresses verified on the OHCS Resend account** (https://resend.com/emails). For Phase 2 testing, the only addresses that will receive magic links are the ones added there. Phase 2 ships and works for any verified address; broader testing waits until DNS for `ohcs.gov.gh` is in place per `docs/email-setup.md`.

---

## Static-Export Constraint (developer note)

The site is built with `output: "export"` (pure static HTML). Two consequences for this phase:

1. **No dynamic Next.js routes** — the magic-link landing page uses `/apply/resume?token=...` (query param) instead of `/apply/resume/[token]`. Same for the form: `/apply/form?step=1` rather than `/apply/form/[step]`.
2. **`useSearchParams()` requires a `<Suspense>` boundary** in Next 16 static builds, otherwise the production build fails. Every page that reads search params must be wrapped — there is a working example in `src/app/admin/recruitment/exercise-documents/page.tsx`.

Pages Functions (the API endpoints) are independent of the Next.js build pipeline — they DO support dynamic routes via the `[token]` folder convention.

---

## File Structure

| Path | Responsibility |
|---|---|
| `ohcs-website/migrations/0004_applications_and_sessions.sql` | All three new tables + indexes |
| `ohcs-website/functions/_shared/cookies.ts` | Helpers: read `session_id` from `Cookie` header, build `Set-Cookie` header for setting / clearing the session |
| `ohcs-website/functions/_shared/applicant-session.ts` | `requireApplicant(request, env)` — looks up session by cookie, returns `{kind:'ok', application}` or `{kind:'reject', response}` |
| `ohcs-website/functions/_shared/reference-number.ts` | `generateReference(env, exerciseId, year)` — atomic per-exercise sequence and OHCS-YYYY-NNNNN formatter |
| `ohcs-website/functions/_shared/magic-link-email.ts` | HTML + plain-text body for the magic-link email, parameterised by URL |
| `ohcs-website/functions/api/applications/start.ts` | `POST` — issue magic link, send email |
| `ohcs-website/functions/api/applications/magic/[token].ts` | `GET` — consume token, set cookie, redirect to form |
| `ohcs-website/functions/api/applications/me.ts` | `GET` returns draft state, `PATCH` upserts form fields, `POST` (under `/me/logout`) clears session |
| `ohcs-website/functions/api/applications/me/logout.ts` | `POST` — clears session cookie + deletes session row |
| `ohcs-website/src/types/recruitment.ts` | Append `Application`, `ApplicationRow`, `ApplicationStatus`, `FormData` interfaces |
| `ohcs-website/src/lib/applicant-api.ts` | Browser client: `startApplication`, `getDraft`, `saveDraft`, `logout` |
| `ohcs-website/src/components/recruitment/start-application-modal.tsx` | Email-entry modal with "Get Magic Link" button |
| `ohcs-website/src/app/services/recruitment/page.tsx:210-216` | Replace placeholder with the `Apply Now` button that opens the modal |
| `ohcs-website/src/app/apply/resume/page.tsx` | Magic-link landing — calls magic endpoint then redirects to `/apply/form?step=1` |
| `ohcs-website/src/app/apply/form/page.tsx` | 5-step wizard scaffolding, Suspense-wrapped, step from `?step=` query param |
| `ohcs-website/src/components/recruitment/wizard-shell.tsx` | Layout: progress bar, step header, prev/next buttons, log-out button, "Saved Xs ago" indicator |
| `ohcs-website/src/components/recruitment/step-personal.tsx` | Step 1 form fields + consent |
| `ohcs-website/src/components/recruitment/step-eligibility.tsx` | Step 2 toggles |
| `ohcs-website/src/components/recruitment/step-education.tsx` | Step 3 fields |
| `ohcs-website/src/components/recruitment/step-documents-stub.tsx` | Step 4 placeholder ("Document uploads coming soon — Phase 3") |
| `ohcs-website/src/components/recruitment/step-review.tsx` | Step 5 read-only summary + declaration + Submit (Submit is disabled in Phase 2 because Step 4 is incomplete; tooltip explains) |
| `ohcs-website/src/lib/use-auto-save.ts` | Hook: debounce (1.5s) + save on blur + save on step change |
| `ohcs-website/tests/functions/applications/start.test.ts` | Tests for the start endpoint |
| `ohcs-website/tests/functions/applications/magic.test.ts` | Tests for magic consume |
| `ohcs-website/tests/functions/applications/me.test.ts` | Tests for me GET/PATCH |
| `ohcs-website/tests/functions/applications/logout.test.ts` | Tests for logout |
| `ohcs-website/tests/functions/_shared/applicant-session.test.ts` | Tests for the session helper |
| `ohcs-website/tests/functions/_shared/reference-number.test.ts` | Tests for sequence + format |
| `ohcs-website/tests/functions/_shared/cookies.test.ts` | Tests for cookie helpers |

---

## Prerequisites

- Phases 0 and 1 are deployed (`https://ohcs.pages.dev/api/health` returns ok, master library has 15 rows)
- Email pipeline verified — test send via `POST /api/admin/dev/test-email` returns `{sent: true}` (already done in `feat/email-resend-sandbox`)
- A fresh feature branch: `git checkout -b feat/recruitment-phase-2` from `master`
- Wrangler authenticated against the OHCS Cloudflare account
- An email address verified on the OHCS Resend account that the developer can monitor

---

## Task 1: Migration 0004 — `applications`, `magic_link_tokens`, `application_sessions`, `sequences`

**Files:**
- Create: `ohcs-website/migrations/0004_applications_and_sessions.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ohcs-website/migrations/0004_applications_and_sessions.sql

CREATE TABLE IF NOT EXISTS applications (
  id                              TEXT PRIMARY KEY,            -- 'OHCS-2026-00372'
  exercise_id                     TEXT NOT NULL,
  email                           TEXT NOT NULL,
  status                          TEXT NOT NULL DEFAULT 'draft',
  has_professional_qualification  INTEGER NOT NULL DEFAULT 0,
  is_pwd                          INTEGER NOT NULL DEFAULT 0,
  form_data                       TEXT,                        -- JSON blob
  created_at                      INTEGER NOT NULL,
  submitted_at                    INTEGER,
  last_saved_at                   INTEGER NOT NULL,
  UNIQUE (exercise_id, email)
);

CREATE INDEX IF NOT EXISTS idx_applications_email_exercise
  ON applications(email, exercise_id);

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  token          TEXT PRIMARY KEY,
  email          TEXT NOT NULL,
  exercise_id    TEXT NOT NULL,
  application_id TEXT,                -- bound on first consume
  created_at     INTEGER NOT NULL,
  expires_at     INTEGER NOT NULL,    -- created_at + 30 minutes
  used_at        INTEGER
);

CREATE INDEX IF NOT EXISTS idx_magic_tokens_email_exercise
  ON magic_link_tokens(email, exercise_id);

CREATE TABLE IF NOT EXISTS application_sessions (
  session_id     TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  expires_at     INTEGER NOT NULL,    -- 7 days, sliding
  last_used_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_application
  ON application_sessions(application_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires
  ON application_sessions(expires_at);

-- Atomic per-exercise sequence counter for reference numbers.
-- Used by reference-number.ts.
CREATE TABLE IF NOT EXISTS sequences (
  key   TEXT PRIMARY KEY,            -- e.g. 'app_ex-001_2026'
  last  INTEGER NOT NULL DEFAULT 0
);
```

- [ ] **Step 2: Apply local + remote**

```bash
cd ohcs-website
npm run migrate
npm run migrate:remote
```

Expected: each prints `✅ Applied 1 migration(s).`

- [ ] **Step 3: Verify table shape**

```bash
npx wrangler d1 execute ohcs-recruitment --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Expected output includes `applications`, `application_sessions`, `magic_link_tokens`, `sequences` (alongside the Phase 0/1 tables).

- [ ] **Step 4: Commit**

```bash
git add migrations/0004_applications_and_sessions.sql
git commit -m "feat(recruitment): add applications, magic_link_tokens, application_sessions, sequences tables"
```

---

## Task 2: Cookie helpers

**Files:**
- Create: `ohcs-website/functions/_shared/cookies.ts`
- Create: `ohcs-website/tests/functions/_shared/cookies.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/_shared/cookies.test.ts
import { describe, it, expect } from 'vitest';
import {
  readSessionCookie,
  buildSetSessionCookie,
  buildClearSessionCookie,
} from '../../../functions/_shared/cookies';

describe('readSessionCookie', () => {
  it('returns the session_id value when present', () => {
    const req = new Request('https://x', { headers: { Cookie: 'session_id=abc123; theme=dark' } });
    expect(readSessionCookie(req)).toBe('abc123');
  });

  it('returns null when no Cookie header', () => {
    expect(readSessionCookie(new Request('https://x'))).toBeNull();
  });

  it('returns null when session_id is missing', () => {
    const req = new Request('https://x', { headers: { Cookie: 'theme=dark' } });
    expect(readSessionCookie(req)).toBeNull();
  });

  it('handles whitespace and multiple cookies', () => {
    const req = new Request('https://x', { headers: { Cookie: ' theme=dark ; session_id=xyz789 ; locale=en' } });
    expect(readSessionCookie(req)).toBe('xyz789');
  });
});

describe('buildSetSessionCookie', () => {
  it('includes Secure, HttpOnly, SameSite=Lax, Path=/, Max-Age', () => {
    const cookie = buildSetSessionCookie('abc123', 7 * 24 * 60 * 60);
    expect(cookie).toMatch(/^session_id=abc123;/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=604800');
  });
});

describe('buildClearSessionCookie', () => {
  it('returns a cookie that expires the session immediately', () => {
    const cookie = buildClearSessionCookie();
    expect(cookie).toMatch(/^session_id=;/);
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/');
  });
});
```

Run: `npx vitest run tests/functions/_shared/cookies.test.ts` → 7 fail with module-not-found.

Commit:
```bash
git add tests/functions/_shared/cookies.test.ts
git commit -m "test(recruitment): add failing tests for cookie helpers"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/_shared/cookies.ts

const SESSION_COOKIE = 'session_id';

export function readSessionCookie(request: Request): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=');
  }
  return null;
}

export function buildSetSessionCookie(sessionId: string, maxAgeSeconds: number): string {
  return [
    `${SESSION_COOKIE}=${sessionId}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

export function buildClearSessionCookie(): string {
  return [
    `${SESSION_COOKIE}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
  ].join('; ');
}
```

Run: `npx vitest run tests/functions/_shared/cookies.test.ts` → 7 PASS.

Commit:
```bash
git add functions/_shared/cookies.ts
git commit -m "feat(recruitment): add session cookie read/set/clear helpers"
```

---

## Task 3: Reference-number generator

**Files:**
- Create: `ohcs-website/functions/_shared/reference-number.ts`
- Create: `ohcs-website/tests/functions/_shared/reference-number.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/_shared/reference-number.test.ts
import { describe, it, expect } from 'vitest';
import { generateReference, formatReference } from '../../../functions/_shared/reference-number';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

describe('formatReference', () => {
  it('zero-pads to 5 digits', () => {
    expect(formatReference(2026, 1)).toBe('OHCS-2026-00001');
    expect(formatReference(2026, 372)).toBe('OHCS-2026-00372');
    expect(formatReference(2027, 100000)).toBe('OHCS-2027-100000');
  });
});

describe('generateReference', () => {
  it('seeds a new sequence row and returns OHCS-YEAR-00001 on first call', async () => {
    const db = makeD1([
      {
        sql: 'INSERT OR IGNORE INTO sequences (key, last) VALUES (?, 0)',
        binds: ['app_ex-001_2026'],
        run: {},
      },
      {
        sql: 'UPDATE sequences SET last = last + 1 WHERE key = ? RETURNING last',
        binds: ['app_ex-001_2026'],
        first: { last: 1 },
      },
    ]);
    const ref = await generateReference(mockEnv({ db }), 'ex-001', 2026);
    expect(ref).toBe('OHCS-2026-00001');
  });

  it('returns the next number when the sequence already exists', async () => {
    const db = makeD1([
      {
        sql: 'INSERT OR IGNORE INTO sequences (key, last) VALUES (?, 0)',
        binds: ['app_ex-001_2026'],
        run: {},
      },
      {
        sql: 'UPDATE sequences SET last = last + 1 WHERE key = ? RETURNING last',
        binds: ['app_ex-001_2026'],
        first: { last: 372 },
      },
    ]);
    const ref = await generateReference(mockEnv({ db }), 'ex-001', 2026);
    expect(ref).toBe('OHCS-2026-00372');
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/_shared/reference-number.test.ts
git commit -m "test(recruitment): add failing tests for reference number generator"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/_shared/reference-number.ts
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
  if (!row) throw new Error(`reference-number: sequence row for ${key} disappeared after INSERT OR IGNORE`);
  return formatReference(year, row.last);
}
```

Run: green. Commit.

```bash
git add functions/_shared/reference-number.ts
git commit -m "feat(recruitment): add atomic per-exercise reference number generator"
```

---

## Task 4: Applicant session helper

**Files:**
- Create: `ohcs-website/functions/_shared/applicant-session.ts`
- Create: `ohcs-website/tests/functions/_shared/applicant-session.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/_shared/applicant-session.test.ts
import { describe, it, expect } from 'vitest';
import { requireApplicant } from '../../../functions/_shared/applicant-session';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function reqWith(cookie?: string): Request {
  return new Request('https://x/api/applications/me', {
    headers: cookie ? { Cookie: cookie } : {},
  });
}

describe('requireApplicant', () => {
  it('returns ok with application context when session valid', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
        first: {
          session_id: 'sess-abc',
          application_id: 'OHCS-2026-00001',
          expires_at: Date.now() + 86_400_000,
          exercise_id: 'ex-001',
          email: 'kofi@example.com',
          status: 'draft',
        },
      },
      {
        sql: 'UPDATE application_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
        run: {},
      },
    ]);
    const result = await requireApplicant(reqWith('session_id=sess-abc'), mockEnv({ db }));
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.application.id).toBe('OHCS-2026-00001');
      expect(result.application.email).toBe('kofi@example.com');
      expect(result.session.session_id).toBe('sess-abc');
    }
  });

  it('returns 401 when no cookie', async () => {
    const result = await requireApplicant(reqWith(), mockEnv());
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') expect(result.response.status).toBe(401);
  });

  it('returns 401 when session not found', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
        first: undefined,
      },
    ]);
    const result = await requireApplicant(reqWith('session_id=ghost'), mockEnv({ db }));
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') expect(result.response.status).toBe(401);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/_shared/applicant-session.test.ts
git commit -m "test(recruitment): add failing tests for applicant session helper"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/_shared/applicant-session.ts
import type { Env } from './types';
import { json } from './json';
import { first, run } from './db';
import { readSessionCookie } from './cookies';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface ApplicantContext {
  id: string;
  exercise_id: string;
  email: string;
  status: string;
}

export interface SessionContext {
  session_id: string;
  expires_at: number;
}

export type ApplicantAuthResult =
  | { kind: 'ok'; application: ApplicantContext; session: SessionContext }
  | { kind: 'reject'; response: Response };

interface JoinedRow {
  session_id: string;
  application_id: string;
  expires_at: number;
  exercise_id: string;
  email: string;
  status: string;
}

export async function requireApplicant(request: Request, env: Env): Promise<ApplicantAuthResult> {
  const sessionId = readSessionCookie(request);
  if (!sessionId) {
    return {
      kind: 'reject',
      response: json({ error: 'authentication required', code: 'AUTH_MISSING' }, { status: 401 }),
    };
  }

  const now = Date.now();
  const row = await first<JoinedRow>(
    env,
    'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
    sessionId,
    now,
  );

  if (!row) {
    return {
      kind: 'reject',
      response: json({ error: 'session expired or invalid', code: 'AUTH_SESSION_INVALID' }, { status: 401 }),
    };
  }

  // Sliding session: bump last_used_at + push expires_at forward.
  const newExpires = now + SESSION_TTL_SECONDS * 1000;
  await run(env, 'UPDATE application_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?', now, newExpires, sessionId);

  return {
    kind: 'ok',
    application: { id: row.application_id, exercise_id: row.exercise_id, email: row.email, status: row.status },
    session: { session_id: row.session_id, expires_at: newExpires },
  };
}
```

Run: green. Commit.

```bash
git add functions/_shared/applicant-session.ts
git commit -m "feat(recruitment): add cookie-based applicant session helper with sliding expiry"
```

---

## Task 5: Magic-link email body helper

**Files:**
- Create: `ohcs-website/functions/_shared/magic-link-email.ts`

This file is small and deterministic — no TDD needed beyond the build check. The body is parameterised by the resume URL.

- [ ] **Step 1: Write the helper**

```typescript
// ohcs-website/functions/_shared/magic-link-email.ts

export interface MagicLinkEmailBody {
  subject: string;
  html: string;
  text: string;
}

export function magicLinkEmail(resumeUrl: string): MagicLinkEmailBody {
  const subject = 'Continue your OHCS Recruitment application';
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #006633; margin: 0 0 16px;">OHCS Recruitment</h2>
      <p>Click the button below to continue or resume your application. The link expires in 30 minutes.</p>
      <p style="margin: 32px 0;">
        <a href="${resumeUrl}" style="display: inline-block; padding: 12px 24px; background: #006633; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Continue Application
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 13px;">${resumeUrl}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      <p style="color: #6b7280; font-size: 13px;">If you didn't request this email, you can safely ignore it. OHCS will never ask for your password or payment.</p>
    </div>
  `;
  const text = `OHCS Recruitment

Click the link below to continue or resume your application. The link expires in 30 minutes.

${resumeUrl}

If you didn't request this email, you can safely ignore it. OHCS will never ask for your password or payment.`;
  return { subject, html, text };
}
```

- [ ] **Step 2: Type-check**

```bash
cd ohcs-website
npx tsc --noEmit 2>&1 | grep -E "magic-link-email" | head -3 || echo OK
```

Expected: prints `OK`.

- [ ] **Step 3: Commit**

```bash
git add functions/_shared/magic-link-email.ts
git commit -m "feat(recruitment): add magic-link email body helper"
```

---

## Task 6: `POST /api/applications/start` — issue magic link

**Files:**
- Create: `ohcs-website/functions/api/applications/start.ts`
- Create: `ohcs-website/tests/functions/applications/start.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/applications/start.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from '../../../functions/api/applications/start';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function ctx(req: Request, db?: D1Database) {
  return {
    request: req,
    env: mockEnv({ db }),
    params: {},
    waitUntil: () => {},
    data: {},
  };
}

function startReq(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://x/api/applications/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/applications/start', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('issues a magic-link token and sends email when input is valid', async () => {
    const db = makeD1([
      {
        sql: 'INSERT INTO magic_link_tokens (token, email, exercise_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const res = await onRequestPost(
      ctx(startReq({ email: 'kofi@example.com', exercise_id: 'ex-001' }), db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { sent: true } };
    expect(body.data.sent).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('returns 400 on invalid email', async () => {
    const res = await onRequestPost(ctx(startReq({ email: 'not-an-email', exercise_id: 'ex-001' })));
    expect(res.status).toBe(400);
  });

  it('returns 400 on missing exercise_id', async () => {
    const res = await onRequestPost(ctx(startReq({ email: 'kofi@example.com' })));
    expect(res.status).toBe(400);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/applications/start.test.ts
git commit -m "test(recruitment): add failing tests for /api/applications/start"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/applications/start.ts
import type { PagesFunction } from '../../_shared/types';
import { json } from '../../_shared/json';
import { parseBody } from '../../_shared/validate';
import { run } from '../../_shared/db';
import { sendEmail } from '../../_shared/email';
import { magicLinkEmail } from '../../_shared/magic-link-email';
import { z } from 'zod';

const TOKEN_TTL_MS = 30 * 60 * 1000;

const Body = z.object({
  email: z.string().email().toLowerCase(),
  exercise_id: z.string().min(1),
});

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;
  const { email, exercise_id } = parsed.value;

  const token = generateToken();
  const now = Date.now();
  const expires = now + TOKEN_TTL_MS;

  await run(
    env,
    'INSERT INTO magic_link_tokens (token, email, exercise_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    token, email, exercise_id, now, expires,
  );

  const origin = new URL(request.url).origin;
  const resumeUrl = `${origin}/apply/resume/?token=${encodeURIComponent(token)}`;
  const body = magicLinkEmail(resumeUrl);

  try {
    await sendEmail(env, { to: email, subject: body.subject, html: body.html, text: body.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: 'email send failed', detail: message }, { status: 502 });
  }

  return json({ data: { sent: true, exercise_id } });
};
```

Run: green. Commit.

```bash
git add functions/api/applications/start.ts
git commit -m "feat(recruitment): add POST /api/applications/start (issue magic link)"
```

---

## Task 7: `GET /api/applications/magic/[token]` — consume token, set cookie, redirect

**Files:**
- Create: `ohcs-website/functions/api/applications/magic/[token].ts`
- Create: `ohcs-website/tests/functions/applications/magic.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/applications/magic.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/applications/magic/[token]';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function ctx(req: Request, token: string, db?: D1Database) {
  return {
    request: req,
    env: mockEnv({ db }),
    params: { token },
    waitUntil: () => {},
    data: {},
  };
}

describe('GET /api/applications/magic/[token]', () => {
  it('consumes a valid token, creates an application + session, sets cookie, redirects', async () => {
    const now = Date.now();
    const db = makeD1([
      {
        sql: 'SELECT * FROM magic_link_tokens WHERE token = ?',
        binds: ['valid-token'],
        first: {
          token: 'valid-token',
          email: 'kofi@example.com',
          exercise_id: 'ex-001',
          application_id: null,
          created_at: now - 1000,
          expires_at: now + 60_000,
          used_at: null,
        },
      },
      // Reference number generation
      { sql: 'INSERT OR IGNORE INTO sequences (key, last) VALUES (?, 0)', run: {} },
      {
        sql: 'UPDATE sequences SET last = last + 1 WHERE key = ? RETURNING last',
        first: { last: 1 },
      },
      // Application upsert (create-or-get for this email+exercise)
      { sql: 'SELECT id FROM applications WHERE exercise_id = ? AND email = ?', first: undefined },
      {
        sql:
          'INSERT INTO applications (id, exercise_id, email, status, form_data, created_at, last_saved_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      // Session create
      {
        sql:
          'INSERT INTO application_sessions (session_id, application_id, created_at, expires_at, last_used_at) VALUES (?, ?, ?, ?, ?)',
        run: {},
      },
      // Mark token used + bind application_id
      {
        sql: 'UPDATE magic_link_tokens SET used_at = ?, application_id = ? WHERE token = ?',
        run: {},
      },
    ]);

    const res = await onRequestGet(ctx(new Request('https://ohcs.pages.dev/api/applications/magic/valid-token'), 'valid-token', db));
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/apply/form/?step=1');
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toMatch(/^session_id=[^;]+;/);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
  });

  it('reuses an existing application for the same email + exercise', async () => {
    const now = Date.now();
    const db = makeD1([
      {
        sql: 'SELECT * FROM magic_link_tokens WHERE token = ?',
        binds: ['valid-token-2'],
        first: { token: 'valid-token-2', email: 'kofi@example.com', exercise_id: 'ex-001', application_id: null, created_at: now - 1000, expires_at: now + 60_000, used_at: null },
      },
      // Existing application found — no new ref number, no INSERT
      { sql: 'SELECT id FROM applications WHERE exercise_id = ? AND email = ?', first: { id: 'OHCS-2026-00001' } },
      // Session create
      {
        sql: 'INSERT INTO application_sessions (session_id, application_id, created_at, expires_at, last_used_at) VALUES (?, ?, ?, ?, ?)',
        run: {},
      },
      // Mark token used
      { sql: 'UPDATE magic_link_tokens SET used_at = ?, application_id = ? WHERE token = ?', run: {} },
    ]);

    const res = await onRequestGet(ctx(new Request('https://x/api/applications/magic/valid-token-2'), 'valid-token-2', db));
    expect(res.status).toBe(302);
  });

  it('returns 410 when token is expired', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM magic_link_tokens WHERE token = ?',
        binds: ['expired'],
        first: { token: 'expired', email: 'kofi@example.com', exercise_id: 'ex-001', application_id: null, created_at: 0, expires_at: 1, used_at: null },
      },
    ]);
    const res = await onRequestGet(ctx(new Request('https://x/api/applications/magic/expired'), 'expired', db));
    expect(res.status).toBe(410);
  });

  it('returns 410 when token already used', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM magic_link_tokens WHERE token = ?',
        binds: ['used'],
        first: { token: 'used', email: 'k@x', exercise_id: 'ex-001', application_id: 'OHCS-2026-00001', created_at: 0, expires_at: Date.now() + 60_000, used_at: 1 },
      },
    ]);
    const res = await onRequestGet(ctx(new Request('https://x/api/applications/magic/used'), 'used', db));
    expect(res.status).toBe(410);
  });

  it('returns 404 when token does not exist', async () => {
    const db = makeD1([
      { sql: 'SELECT * FROM magic_link_tokens WHERE token = ?', binds: ['ghost'], first: undefined },
    ]);
    const res = await onRequestGet(ctx(new Request('https://x/api/applications/magic/ghost'), 'ghost', db));
    expect(res.status).toBe(404);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/applications/magic.test.ts
git commit -m "test(recruitment): add failing tests for magic-link consume endpoint"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/applications/magic/[token].ts
import type { PagesFunction, Env } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { first, run } from '../../../_shared/db';
import { buildSetSessionCookie } from '../../../_shared/cookies';
import { generateReference } from '../../../_shared/reference-number';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

interface TokenRow {
  token: string;
  email: string;
  exercise_id: string;
  application_id: string | null;
  created_at: number;
  expires_at: number;
  used_at: number | null;
}

function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const onRequestGet: PagesFunction<Env, 'token'> = async ({ env, params }) => {
  const token = params.token;
  const tokenRow = await first<TokenRow>(env, 'SELECT * FROM magic_link_tokens WHERE token = ?', token);

  if (!tokenRow) return json({ error: 'token not found' }, { status: 404 });

  const now = Date.now();
  if (tokenRow.used_at) return json({ error: 'token already used' }, { status: 410 });
  if (tokenRow.expires_at <= now) return json({ error: 'token expired' }, { status: 410 });

  // Find existing application or create one
  let applicationId: string;
  const existing = await first<{ id: string }>(
    env,
    'SELECT id FROM applications WHERE exercise_id = ? AND email = ?',
    tokenRow.exercise_id,
    tokenRow.email,
  );

  if (existing) {
    applicationId = existing.id;
  } else {
    const year = new Date(now).getFullYear();
    applicationId = await generateReference(env, tokenRow.exercise_id, year);
    await run(
      env,
      'INSERT INTO applications (id, exercise_id, email, status, form_data, created_at, last_saved_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      applicationId, tokenRow.exercise_id, tokenRow.email, 'draft', '{}', now, now,
    );
  }

  // Create session
  const sessionId = generateSessionId();
  const sessionExpires = now + SESSION_TTL_SECONDS * 1000;
  await run(
    env,
    'INSERT INTO application_sessions (session_id, application_id, created_at, expires_at, last_used_at) VALUES (?, ?, ?, ?, ?)',
    sessionId, applicationId, now, sessionExpires, now,
  );

  // Mark token used + bind application_id
  await run(env, 'UPDATE magic_link_tokens SET used_at = ?, application_id = ? WHERE token = ?', now, applicationId, token);

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/apply/form/?step=1',
      'Set-Cookie': buildSetSessionCookie(sessionId, SESSION_TTL_SECONDS),
    },
  });
};
```

Run: green. Commit.

```bash
git add 'functions/api/applications/magic/[token].ts'
git commit -m "feat(recruitment): add GET /api/applications/magic/[token] (consume + redirect)"
```

---

## Task 8: `GET` and `PATCH` `/api/applications/me`

**Files:**
- Create: `ohcs-website/functions/api/applications/me.ts`
- Create: `ohcs-website/tests/functions/applications/me.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/applications/me.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestPatch } from '../../../functions/api/applications/me';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const SESSION_COOKIE = 'session_id=sess-abc';

function sessionLookupScript() {
  return {
    sql:
      'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
    first: {
      session_id: 'sess-abc',
      application_id: 'OHCS-2026-00001',
      expires_at: Date.now() + 86_400_000,
      exercise_id: 'ex-001',
      email: 'kofi@example.com',
      status: 'draft',
    },
  };
}

function slidingUpdateScript() {
  return {
    sql: 'UPDATE application_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
    run: {},
  };
}

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/applications/me', () => {
  it('returns the draft application for the current session', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT id, exercise_id, email, status, has_professional_qualification, is_pwd, form_data, created_at, submitted_at, last_saved_at FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: {
          id: 'OHCS-2026-00001',
          exercise_id: 'ex-001',
          email: 'kofi@example.com',
          status: 'draft',
          has_professional_qualification: 0,
          is_pwd: 0,
          form_data: '{"step":1}',
          created_at: 1,
          submitted_at: null,
          last_saved_at: 1,
        },
      },
    ]);
    const req = new Request('https://x/api/applications/me', { headers: { Cookie: SESSION_COOKIE } });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string; form_data: { step: number } } };
    expect(body.data.id).toBe('OHCS-2026-00001');
    expect(body.data.form_data).toEqual({ step: 1 });
  });

  it('returns 401 when no cookie', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/applications/me')));
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/applications/me', () => {
  it('merges patch into form_data and bumps last_saved_at', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { form_data: '{"step":1,"name":"Kofi"}' },
      },
      {
        // Dynamic SQL — both form_patch AND has_professional_qualification provided
        sql: 'UPDATE applications SET form_data = ?, has_professional_qualification = ?, last_saved_at = ? WHERE id = ?',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/applications/me', {
      method: 'PATCH',
      headers: { Cookie: SESSION_COOKIE, 'content-type': 'application/json' },
      body: JSON.stringify({ form_patch: { dob: '1990-01-15' }, has_professional_qualification: true }),
    });
    const res = await onRequestPatch(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { last_saved_at: number } };
    expect(typeof body.data.last_saved_at).toBe('number');
  });

  it('rejects when status is not draft', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
        first: {
          session_id: 'sess-abc',
          application_id: 'OHCS-2026-00001',
          expires_at: Date.now() + 86_400_000,
          exercise_id: 'ex-001',
          email: 'kofi@example.com',
          status: 'submitted',
        },
      },
      slidingUpdateScript(),
    ]);
    const req = new Request('https://x/api/applications/me', {
      method: 'PATCH',
      headers: { Cookie: SESSION_COOKIE, 'content-type': 'application/json' },
      body: JSON.stringify({ form_patch: { dob: '1990-01-15' } }),
    });
    const res = await onRequestPatch(ctx(req, db));
    expect(res.status).toBe(409);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/applications/me.test.ts
git commit -m "test(recruitment): add failing tests for /api/applications/me"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/applications/me.ts
import type { PagesFunction } from '../../_shared/types';
import { json } from '../../_shared/json';
import { parseBody } from '../../_shared/validate';
import { first, run } from '../../_shared/db';
import { requireApplicant } from '../../_shared/applicant-session';
import { z } from 'zod';

interface ApplicationRow {
  id: string;
  exercise_id: string;
  email: string;
  status: string;
  has_professional_qualification: number;
  is_pwd: number;
  form_data: string | null;
  created_at: number;
  submitted_at: number | null;
  last_saved_at: number;
}

const PatchSchema = z.object({
  form_patch: z.record(z.string(), z.unknown()).optional(),
  has_professional_qualification: z.boolean().optional(),
  is_pwd: z.boolean().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'at least one field required' });

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;

  const row = await first<ApplicationRow>(
    env,
    'SELECT id, exercise_id, email, status, has_professional_qualification, is_pwd, form_data, created_at, submitted_at, last_saved_at FROM applications WHERE id = ?',
    auth.application.id,
  );
  if (!row) return json({ error: 'application not found' }, { status: 404 });

  return json({
    data: {
      id: row.id,
      exercise_id: row.exercise_id,
      email: row.email,
      status: row.status,
      has_professional_qualification: row.has_professional_qualification === 1,
      is_pwd: row.is_pwd === 1,
      form_data: row.form_data ? (JSON.parse(row.form_data) as Record<string, unknown>) : {},
      created_at: row.created_at,
      submitted_at: row.submitted_at,
      last_saved_at: row.last_saved_at,
    },
  });
};

export const onRequestPatch: PagesFunction = async ({ request, env }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.application.status !== 'draft') {
    return json({ error: 'application is not editable', code: 'NOT_DRAFT', status: auth.application.status }, { status: 409 });
  }

  const parsed = await parseBody(request, PatchSchema);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;

  // Build dynamic UPDATE — only set columns the patch actually touches.
  const sets: string[] = [];
  const binds: unknown[] = [];

  if (v.form_patch) {
    const cur = await first<{ form_data: string | null }>(env, 'SELECT form_data FROM applications WHERE id = ?', auth.application.id);
    const curObj = cur?.form_data ? (JSON.parse(cur.form_data) as Record<string, unknown>) : {};
    const merged = { ...curObj, ...v.form_patch };
    sets.push('form_data = ?');
    binds.push(JSON.stringify(merged));
  }

  if (v.has_professional_qualification !== undefined) {
    sets.push('has_professional_qualification = ?');
    binds.push(v.has_professional_qualification ? 1 : 0);
  }

  if (v.is_pwd !== undefined) {
    sets.push('is_pwd = ?');
    binds.push(v.is_pwd ? 1 : 0);
  }

  const now = Date.now();
  sets.push('last_saved_at = ?');
  binds.push(now);
  binds.push(auth.application.id);

  await run(env, `UPDATE applications SET ${sets.join(', ')} WHERE id = ?`, ...binds);

  return json({ data: { last_saved_at: now } });
};
```

Run: green. Commit.

```bash
git add functions/api/applications/me.ts
git commit -m "feat(recruitment): add GET/PATCH /api/applications/me"
```

---

## Task 9: `POST /api/applications/me/logout`

**Files:**
- Create: `ohcs-website/functions/api/applications/me/logout.ts`
- Create: `ohcs-website/tests/functions/applications/logout.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/applications/logout.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestPost } from '../../../functions/api/applications/me/logout';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('POST /api/applications/me/logout', () => {
  it('deletes the session row and returns a clear-cookie header', async () => {
    const db = makeD1([
      { sql: 'DELETE FROM application_sessions WHERE session_id = ?', binds: ['sess-abc'], run: {} },
    ]);
    const req = new Request('https://x/api/applications/me/logout', {
      method: 'POST',
      headers: { Cookie: 'session_id=sess-abc' },
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toMatch(/^session_id=;/);
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });

  it('still returns 200 even when no cookie is present (idempotent)', async () => {
    const res = await onRequestPost(ctx(new Request('https://x/api/applications/me/logout', { method: 'POST' })));
    expect(res.status).toBe(200);
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });
});
```

Run: red. Commit failing.

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/applications/me/logout.ts
import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { run } from '../../../_shared/db';
import { readSessionCookie, buildClearSessionCookie } from '../../../_shared/cookies';

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const sid = readSessionCookie(request);
  if (sid) {
    await run(env, 'DELETE FROM application_sessions WHERE session_id = ?', sid);
  }
  const res = json({ data: { logged_out: true } });
  res.headers.set('Set-Cookie', buildClearSessionCookie());
  return res;
};
```

Run: green. Commit (both files).

```bash
git add functions/api/applications/me/logout.ts tests/functions/applications/logout.test.ts
git commit -m "feat(recruitment): add POST /api/applications/me/logout"
```

---

## Task 10: Append applicant types to `src/types/recruitment.ts`

**Files:**
- Modify: `ohcs-website/src/types/recruitment.ts` (append at end)

- [ ] **Step 1: Append**

```typescript
// ─── Applicant ───────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'requires_action'
  | 'shortlisted'
  | 'rejected';

export interface ApplicationFormData {
  // Step 1
  full_name?: string;
  date_of_birth?: string;          // 'YYYY-MM-DD'
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  nia_number?: string;             // Ghana Card 'GHA-XXXXXXXXX-X'
  phone?: string;
  postal_address?: string;
  region?: string;
  consent?: { agreed: boolean; agreed_at: number; ip?: string };

  // Step 3
  highest_qualification?: 'first_degree' | 'pg_diploma' | 'masters' | 'phd';
  field_of_study?: string;
  institution?: string;
  graduation_year?: number;
  class_of_degree?: 'first' | 'second_upper' | 'second_lower' | 'third' | 'pass';
  years_experience?: number;
  current_employment?: string;
  work_history?: string;
}

export interface Application {
  id: string;
  exercise_id: string;
  email: string;
  status: ApplicationStatus;
  has_professional_qualification: boolean;
  is_pwd: boolean;
  form_data: ApplicationFormData;
  created_at: number;
  submitted_at: number | null;
  last_saved_at: number;
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit 2>&1 | grep "src/types/recruitment" | head -3 || echo OK
git add src/types/recruitment.ts
git commit -m "feat(recruitment): add Application + ApplicationFormData types"
```

---

## Task 11: Browser API client (`src/lib/applicant-api.ts`)

**Files:**
- Create: `ohcs-website/src/lib/applicant-api.ts`

- [ ] **Step 1: Write the client**

```typescript
// ohcs-website/src/lib/applicant-api.ts
import type { Application, ApplicationFormData } from '@/types/recruitment';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    const err = new Error(`API ${res.status}: ${txt}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function startApplication(input: { email: string; exercise_id: string }): Promise<{ sent: true; exercise_id: string }> {
  const { data } = await request<{ data: { sent: true; exercise_id: string } }>('/api/applications/start', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data;
}

export async function getDraft(): Promise<Application> {
  const { data } = await request<{ data: Application }>('/api/applications/me');
  return data;
}

export interface SaveDraftInput {
  form_patch?: Partial<ApplicationFormData>;
  has_professional_qualification?: boolean;
  is_pwd?: boolean;
}

export async function saveDraft(patch: SaveDraftInput): Promise<{ last_saved_at: number }> {
  const { data } = await request<{ data: { last_saved_at: number } }>('/api/applications/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return data;
}

export async function logout(): Promise<void> {
  await request('/api/applications/me/logout', { method: 'POST' });
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit 2>&1 | grep "src/lib/applicant-api" | head -3 || echo OK
git add src/lib/applicant-api.ts
git commit -m "feat(recruitment): add browser applicant-api client"
```

---

## Task 12: "Start Application" modal + replace placeholder on recruitment page

**Files:**
- Create: `ohcs-website/src/components/recruitment/start-application-modal.tsx`
- Modify: `ohcs-website/src/app/services/recruitment/page.tsx:210-216`

- [ ] **Step 1: Create the modal**

```tsx
// ohcs-website/src/components/recruitment/start-application-modal.tsx
'use client';

import { useEffect, useState } from 'react';
import { X, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { startApplication } from '@/lib/applicant-api';

export interface StartApplicationModalProps {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
}

export function StartApplicationModal({ open, onClose, exerciseId }: StartApplicationModalProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await startApplication({ email, exercise_id: exerciseId });
      setSent(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send link');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Start application"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-primary-dark">Start or Resume Application</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100 text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-semibold text-primary-dark mb-2">Check your email</h4>
            <p className="text-sm text-text-muted">
              We&apos;ve sent a magic link to <span className="font-semibold text-primary-dark">{sent}</span>.
              The link expires in 30 minutes.
            </p>
            <p className="text-xs text-text-muted mt-4">Didn&apos;t arrive? Check your spam folder, or close this and try again.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-text-muted">
              Enter your email address. We&apos;ll send you a secure link to start a new application or resume one in progress.
            </p>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/40" aria-hidden="true" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
            )}
            <button
              type="submit"
              disabled={submitting || !email}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : 'Send Magic Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace placeholder on the recruitment page**

Open `src/app/services/recruitment/page.tsx`. Find the existing placeholder block (around line 210-216):

```tsx
              <div className="bg-white rounded-2xl border-2 border-border/40 p-8 shadow-sm">
                <p className="text-center text-text-muted py-8">
                  Application form will load here when connected to the backend.
                  <br />
                  <span className="text-sm text-text-muted/50 mt-2 block">Deadline: {deadline}</span>
                </p>
              </div>
```

Replace it with:

```tsx
              <div className="bg-white rounded-2xl border-2 border-border/40 p-8 shadow-sm text-center">
                <p className="text-base text-text-muted mb-6">
                  Click below to start a new application or resume one in progress.
                  We&apos;ll email you a secure link — no password required.
                </p>
                <button
                  onClick={() => setStartModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary-light transition-colors"
                >
                  Start or Resume Application
                </button>
                <p className="text-xs text-text-muted/60 mt-4">Deadline: {deadline}</p>
              </div>
              <StartApplicationModal
                open={startModalOpen}
                onClose={() => setStartModalOpen(false)}
                exerciseId="ex-001"
              />
```

Add `const [startModalOpen, setStartModalOpen] = useState(false);` near the other useState calls in this file. Add `import { StartApplicationModal } from '@/components/recruitment/start-application-modal';` at the top.

> **Note:** `exerciseId="ex-001"` is hardcoded. Ideally we'd read which exercise is currently active from D1 — but that table doesn't exist yet (exercises still live in localStorage). Leave the TODO and revisit when exercises move to D1.

- [ ] **Step 3: Build + commit**

```bash
npm run pages:build 2>&1 | tail -5
git add src/components/recruitment/start-application-modal.tsx src/app/services/recruitment/page.tsx
git commit -m "feat(recruitment): replace recruitment placeholder with Start Application modal"
```

---

## Task 13: Point magic-link email directly at the API endpoint (no intermediate React page)

The Pages Function `/api/applications/magic/[token]` already 302s to `/apply/form/?step=1` and sets the `Set-Cookie` header. Browsers send cookies on the redirected request, so an intermediate `/apply/resume` React page is unnecessary — the API URL itself can be the link target.

**Files:**
- Modify: `ohcs-website/functions/api/applications/start.ts` (one-line change to the `resumeUrl`)

- [ ] **Step 1: Update the email helper to use the API URL directly**

Edit `functions/_shared/magic-link-email.ts` — replace the `resumeUrl` paragraph wording is fine, but make sure the URL passed is the API endpoint, not an `/apply/resume` page.

Actually the email body already takes `resumeUrl` as a parameter. The caller (`functions/api/applications/start.ts`) passes:

```typescript
const resumeUrl = `${origin}/apply/resume/?token=${encodeURIComponent(token)}`;
```

Change this line in `start.ts` to:

```typescript
const resumeUrl = `${origin}/api/applications/magic/${encodeURIComponent(token)}`;
```

The user clicks the link, hits the API endpoint directly, the API sets the session cookie and 302s to `/apply/form/?step=1`. No intermediate React page needed.

- [ ] **Step 2: Update the start endpoint test if needed**

The existing test in Task 6 just asserts `body.data.sent === true` and that fetch was called. It doesn't assert the URL inside the email body. No test change needed.

- [ ] **Step 3: Commit**

```bash
git add functions/api/applications/start.ts
git commit -m "fix(recruitment): point magic link email directly at API endpoint (no intermediate page)"
```

---

## Task 14: Auto-save hook

**Files:**
- Create: `ohcs-website/src/lib/use-auto-save.ts`

- [ ] **Step 1: Write the hook**

```typescript
// ohcs-website/src/lib/use-auto-save.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { saveDraft, type SaveDraftInput } from '@/lib/applicant-api';

const DEBOUNCE_MS = 1500;

export interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: number | null;
  error: string | null;
}

export function useAutoSave(): {
  state: AutoSaveState;
  schedule: (patch: SaveDraftInput) => void;
  flush: () => Promise<void>;
} {
  const [state, setState] = useState<AutoSaveState>({ status: 'idle', lastSavedAt: null, error: null });
  const pending = useRef<SaveDraftInput | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!pending.current) return;
    const patch = pending.current;
    pending.current = null;
    setState((s) => ({ ...s, status: 'saving', error: null }));
    try {
      const r = await saveDraft(patch);
      setState({ status: 'saved', lastSavedAt: r.last_saved_at, error: null });
    } catch (err) {
      setState({ status: 'error', lastSavedAt: null, error: err instanceof Error ? err.message : 'save failed' });
    }
  }, []);

  const schedule = useCallback((patch: SaveDraftInput) => {
    pending.current = pending.current
      ? { ...pending.current, ...patch, form_patch: { ...pending.current.form_patch, ...patch.form_patch } }
      : patch;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(send, DEBOUNCE_MS);
  }, [send]);

  const flush = useCallback(async () => {
    await send();
  }, [send]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { state, schedule, flush };
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit 2>&1 | grep "use-auto-save" | head -3 || echo OK
git add src/lib/use-auto-save.ts
git commit -m "feat(recruitment): add useAutoSave hook with 1.5s debounce + flush"
```

---

## Task 15: Wizard shell + form pages (substantial UI)

This task is dispatched to a subagent because of its size (~600 lines across 6 files). The plan describes the contracts; the implementer follows them and references the existing admin pages for style.

**Files:**
- Create: `ohcs-website/src/app/apply/form/page.tsx`
- Create: `ohcs-website/src/components/recruitment/wizard-shell.tsx`
- Create: `ohcs-website/src/components/recruitment/step-personal.tsx`
- Create: `ohcs-website/src/components/recruitment/step-eligibility.tsx`
- Create: `ohcs-website/src/components/recruitment/step-education.tsx`
- Create: `ohcs-website/src/components/recruitment/step-documents-stub.tsx`
- Create: `ohcs-website/src/components/recruitment/step-review.tsx`

### Subagent prompt outline

The subagent must implement all 7 files. Behavioural contracts:

**`src/app/apply/form/page.tsx`** — Suspense-wrapped (same pattern as `src/app/admin/recruitment/exercise-documents/page.tsx`). Reads `?step=` from `useSearchParams()` (1–5). On mount, calls `getDraft()`. If 401, redirects to `/services/recruitment/`. Otherwise, renders `<WizardShell>` with the appropriate step component inside.

**`src/components/recruitment/wizard-shell.tsx`** — Layout: top progress bar (`w-{step*20}%`), step counter ("Step N of 5: <title>"), in-content children area, bottom bar with "Previous" / "Next" buttons (Previous goes to step-1, Next flushes auto-save then goes to step+1; both update the URL via `router.push`). A "Saved Xs ago" indicator using the auto-save state (with a `Loader2` spin during 'saving' and a red "Save failed — retry" button on 'error'). A "Log out" link in the top-right that calls `logout()` then redirects to `/services/recruitment/`. Step 1 has no Previous button; Step 5's Next becomes "Submit Application" (disabled with tooltip "Document uploads coming in Phase 3").

**`src/components/recruitment/step-personal.tsx`** — Form fields per `ApplicationFormData` Step 1 keys, plus consent checkbox. Calls `schedule({ form_patch: { full_name: e.target.value }, ... })` from `useAutoSave()` on every change. Email field shows `application.email` read-only.

**`src/components/recruitment/step-eligibility.tsx`** — Three checkboxes:
1. "I hold at least a first degree" (REQUIRED, blocks proceeding if unchecked)
2. "I hold a professional qualification" → `schedule({ has_professional_qualification: bool })`
3. "I am a Person with Disability (PWD)" → `schedule({ is_pwd: bool })`

**`src/components/recruitment/step-education.tsx`** — Form fields per `ApplicationFormData` Step 3 keys.

**`src/components/recruitment/step-documents-stub.tsx`** — Yellow info card: "Document uploads will be available when Phase 3 ships. For now, you can navigate to Step 5 to review what you've entered. Submission is disabled until upload support is added."

**`src/components/recruitment/step-review.tsx`** — Read-only render of all entered data, declaration checkbox, disabled Submit button with tooltip "Document uploads coming in Phase 3 — submission unlocks then".

**Constraints:**
- TypeScript strict, no `any`.
- Match the existing Tailwind patterns (`rounded-2xl`, `border-2 border-border/40`, `bg-primary text-white`, etc.) — see `src/app/admin/recruitment/exercise-documents/page.tsx`.
- React 19 / Next 16. Suspense boundary required for `useSearchParams`.
- All form state lives in the Wizard parent (passed down as props + onChange callbacks), so navigation between steps preserves it without re-fetching.
- Use `next/navigation`'s `useRouter`/`useSearchParams`.
- Don't add new dependencies.

After the subagent reports DONE:

- [ ] **Step 1: Build verification**

```bash
cd ohcs-website
npm run pages:build 2>&1 | tail -5
```

- [ ] **Step 2: Visual sanity-check is part of Task 16**

---

## Task 16: End-to-end smoke test against preview

This task verifies the full magic-link → form-fill → resume flow against a real Cloudflare preview deployment.

- [ ] **Step 1: Deploy preview**

```bash
npx wrangler pages deploy out --project-name=ohcs 2>&1 | tail -5
```

Note the preview URL (e.g. `https://feat-recruitment-phase-2.ohcs.pages.dev`).

- [ ] **Step 2: Trigger magic link**

```bash
curl -s -X POST -H "content-type: application/json" \
  -d '{"email":"<your-resend-verified-email>","exercise_id":"ex-001"}' \
  https://feat-recruitment-phase-2.ohcs.pages.dev/api/applications/start
```

Expected: `{"data":{"sent":true,"exercise_id":"ex-001"}}`. Check the inbox — magic link arrives within 30 seconds.

- [ ] **Step 3: Click the link**

In a browser, click the link from the email. Expected sequence:
1. Browser hits `/api/applications/magic/<token>`
2. API responds with 302 to `/apply/form/?step=1` and a `Set-Cookie` header
3. Browser lands on `/apply/form/?step=1` with the form rendered

- [ ] **Step 4: Fill Step 1 fields**

Type a name, DOB, etc. Pause for 2 seconds — the "Saved" indicator should flip to "Saved 2s ago".

- [ ] **Step 5: Verify resume**

Close the browser tab. Reopen the magic-link request flow with the SAME email. Click the new magic link. Expected: lands on Step 1 with the previous data pre-filled (because the application is reused).

- [ ] **Step 6: Verify Steps 2, 3, 5 navigate**

Click Next through Step 2 (eligibility), Step 3 (education), Step 4 (placeholder card), Step 5 (review). Confirm the entered data appears on the review screen. Confirm Submit button is disabled with the "Phase 3" tooltip.

- [ ] **Step 7: Verify log out**

Click "Log out" — should redirect back to `/services/recruitment/` and the session cookie should be cleared (verify in browser DevTools → Application → Cookies).

If any step fails, debug before proceeding to production.

---

## Task 17: Final QA + production deploy

- [ ] **Step 1: Full test suite**

```bash
cd ohcs-website
npm test -- --run
```

Expected: all tests pass (Phase 0+1+2 combined ~110+ tests).

- [ ] **Step 2: Type-check + lint + build**

```bash
npm run type-check
npm run lint 2>&1 | tail -3
npm run pages:build 2>&1 | tail -5
```

Lint may show pre-existing errors — that's fine. Verify no NEW errors in your changed files.

- [ ] **Step 3: Merge to master**

```bash
git checkout master
git merge --no-ff feat/recruitment-phase-2 -m "Merge branch 'feat/recruitment-phase-2' — magic link auth + applicant form wizard"
```

- [ ] **Step 4: Production deploy**

```bash
cd ohcs-website
npx wrangler pages deploy out --project-name=ohcs --branch=master 2>&1 | tail -5
```

- [ ] **Step 5: Production smoke test**

Repeat Task 16 steps against `https://ohcs.pages.dev` instead of the preview URL.

- [ ] **Step 6: Push origin + clean up**

```bash
git push origin master
git branch -d feat/recruitment-phase-2
```

---

## Done — Exit criteria met

Phase 2 is complete when:

- ✅ D1 has `applications`, `magic_link_tokens`, `application_sessions`, `sequences` tables on production
- ✅ POST `/api/applications/start` issues a magic link, email lands in the inbox
- ✅ Clicking the magic link sets a session cookie and lands on `/apply/form/?step=1`
- ✅ Form Steps 1, 2, 3, 5 render and accept input; Step 4 shows the placeholder
- ✅ Auto-save fires within 2 seconds of typing; "Saved Xs ago" indicator updates
- ✅ Closing the browser and re-requesting a magic link with the same email reuses the existing application (data preserved)
- ✅ "Log out" clears the session cookie and redirects to `/services/recruitment/`
- ✅ Submit button on Step 5 is disabled with a tooltip explaining Phase 3 ships first
- ✅ Production health endpoint still returns ok across D1, R2, Workers AI
- ✅ Full test suite green; type-check clean

Phase 3 (document uploads) builds Step 4 on this foundation.
