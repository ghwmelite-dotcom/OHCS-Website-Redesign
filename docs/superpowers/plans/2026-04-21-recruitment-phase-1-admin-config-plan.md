# Recruitment Phase 1 — Admin Document Configuration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin-facing UI and API that lets OHCS configure which documents each recruitment exercise requires applicants to upload. Ends with a working `/admin/recruitment/document-types` master library page, a working per-exercise config page, and a "Preview as Applicant" modal — all backed by D1 via Cloudflare Pages Functions.

**Architecture:** Two new D1 tables (`document_types` master library, `exercise_document_requirements` per-exercise selections). Three groups of Pages Functions endpoints under `/api/admin/...`. React admin pages call these endpoints via a typed client (`src/lib/recruitment-api.ts`). The existing exercises management page (still localStorage-backed) gets a new "Configure Documents" link. Static-export constraint means the per-exercise config page uses `?exerciseId=` query params instead of dynamic route segments.

**Tech Stack:** Cloudflare D1, Cloudflare Pages Functions (TypeScript), Next.js 16 (static export, React 19), Vitest, Zod for input validation, the existing admin React patterns (lucide icons, Tailwind, the shared `audit()` client logger).

**Spec reference:** `docs/superpowers/specs/2026-04-21-recruitment-document-requirements-design.md` § 4 (data model), § 5 (admin UI), § 7.2 (admin endpoints), § 11 Phase 1.

---

## Interim Security Posture

Real backend admin auth is not in scope until a later phase. Today the admin section is gated by client-side demo passwords (`src/lib/admin-auth.ts`). For Phase 1, the new Pages Functions follow this same model:

- The React admin client sends two headers on every admin API call: `X-Admin-User-Email` and `X-Admin-User-Role` (read from the existing `localStorage` user blob).
- The Pages Function reads the headers via a shared helper (`functions/_shared/admin-auth.ts`) and rejects requests where the role is not in `ADMIN_ROLES` (`super_admin`, `recruitment_admin`).
- This is **not** real authentication. It blocks accidental misuse but a determined caller can spoof headers. A future phase replaces this with a real session-token check before production launch. Every admin Pages Function file MUST contain the comment block defined in Task 4 to make this reality visible to anyone reading the code.

This matches the security level of every other admin feature already shipped on `ohcs.pages.dev`.

---

## File Structure

| Path | Responsibility |
|---|---|
| `ohcs-website/migrations/0002_document_types.sql` | Master library table + 15-row seed |
| `ohcs-website/migrations/0003_exercise_document_requirements.sql` | Per-exercise selections table |
| `ohcs-website/functions/_shared/db.ts` | Typed D1 query helpers (`first`, `all`, `run`) |
| `ohcs-website/functions/_shared/admin-auth.ts` | Header-based admin role gate (interim) |
| `ohcs-website/functions/_shared/validate.ts` | Tiny Zod-schema → 400 helper |
| `ohcs-website/functions/api/admin/document-types/index.ts` | `GET` list, `POST` create |
| `ohcs-website/functions/api/admin/document-types/[id].ts` | `GET` one, `PATCH`, `DELETE` (soft) |
| `ohcs-website/functions/api/admin/exercises/[id]/requirements.ts` | `GET` requirements, `PUT` replace full set |
| `ohcs-website/tests/functions/admin/document-types.test.ts` | All `document-types` endpoints |
| `ohcs-website/tests/functions/admin/exercise-requirements.test.ts` | Requirements endpoints |
| `ohcs-website/tests/functions/_helpers/d1-mock.ts` | In-memory D1 stand-in (typed) for endpoint tests |
| `ohcs-website/src/types/recruitment.ts` | Shared types (DocumentType, ExerciseRequirement, etc.) |
| `ohcs-website/src/lib/recruitment-api.ts` | Browser-side typed client for the new endpoints |
| `ohcs-website/src/app/admin/recruitment/document-types/page.tsx` | Master library CRUD page |
| `ohcs-website/src/app/admin/recruitment/exercise-documents/page.tsx` | Per-exercise config page (reads `?exerciseId=`) |
| `ohcs-website/src/components/admin/preview-applicant-modal.tsx` | "Preview as Applicant" modal |
| `ohcs-website/src/app/admin/recruitment/exercises/page.tsx` | Add "Configure Documents" link to each row |

---

## Prerequisites

- Phase 0 is shipped (D1 + R2 + AI bindings live, `/api/health` returns `ok` on `ohcs.pages.dev`)
- Engineer is on a fresh feature branch: `git checkout -b feat/recruitment-phase-1` from `master`
- `npm install` is current (`@testing-library/dom`, `wrangler`, `tsx`, `@cloudflare/workers-types` all present from Phase 0)
- Wrangler authenticated against the OHCS Cloudflare account

---

## Task 1: Create migration 0002 — `document_types` table + seed

**Files:**
- Create: `ohcs-website/migrations/0002_document_types.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- ohcs-website/migrations/0002_document_types.sql

CREATE TABLE IF NOT EXISTS document_types (
  id              TEXT PRIMARY KEY,
  label           TEXT NOT NULL,
  description     TEXT,
  default_max_mb  INTEGER NOT NULL,
  accepted_mimes  TEXT NOT NULL,           -- JSON array string
  ai_check_type   TEXT,                    -- 'certificate' | 'photo' | 'identity' | NULL
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- Seed the 15-document master library agreed in the spec
INSERT INTO document_types (id, label, description, default_max_mb, accepted_mimes, ai_check_type, is_active, created_at, updated_at) VALUES
  ('national_id',           'National ID (Ghana Card)',                                          NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'identity',    1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('birth_certificate',     'Birth Certificate',                                                 NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('passport_photo',        'Passport-sized Photograph',                                         NULL, 2, '["image/jpeg","image/png"]',                    'photo',       1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ssce_wassce',           'SSSCE / WASSCE Certificate',                                        NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('first_degree',          'First Degree Certificate',                                          NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('degree_transcript',     'Degree Transcript',                                                 NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('nss_certificate',       'National Service Certificate (NSS)',                                NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('postgraduate_cert',     'Postgraduate Certificate (Masters / PhD)',                          NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('professional_cert',     'Professional Qualification (ICAG / GhIE / BAR / GMA)',              NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('cv',                    'Curriculum Vitae',                                                  NULL, 5, '["application/pdf"]',                           NULL,          1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('cover_letter',          'Cover Letter / Statement of Purpose',                               NULL, 5, '["application/pdf"]',                           NULL,          1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('reference_letter_1',    'Reference Letter 1',                                                NULL, 5, '["application/pdf"]',                           NULL,          1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('reference_letter_2',    'Reference Letter 2',                                                NULL, 5, '["application/pdf"]',                           NULL,          1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('work_experience_proof', 'Proof of Work Experience',                                          NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('medical_certificate_pwd','Medical Certificate (PWD)',                                        NULL, 5, '["application/pdf"]',                           'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000);
```

- [ ] **Step 2: Apply locally**

```bash
cd ohcs-website
npm run migrate
```

Expected: `→ applying 0002_document_types.sql` then `✅ Applied 1 migration(s).`

- [ ] **Step 3: Verify the seed**

```bash
npx wrangler d1 execute ohcs-recruitment --local --command="SELECT id, label, ai_check_type FROM document_types ORDER BY id"
```

Expected: 15 rows printed including `national_id`, `passport_photo`, `cv`, `medical_certificate_pwd`, etc.

- [ ] **Step 4: Apply to production D1**

```bash
npm run migrate:remote
```

Expected: `→ applying 0002_document_types.sql` then `✅ Applied 1 migration(s).`

- [ ] **Step 5: Verify on remote**

```bash
npx wrangler d1 execute ohcs-recruitment --remote --command="SELECT COUNT(*) as n FROM document_types"
```

Expected: `n = 15`.

- [ ] **Step 6: Commit**

```bash
git add migrations/0002_document_types.sql
git commit -m "feat(recruitment): add document_types table with 15-row master library seed"
```

---

## Task 2: Create migration 0003 — `exercise_document_requirements` table

**Files:**
- Create: `ohcs-website/migrations/0003_exercise_document_requirements.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- ohcs-website/migrations/0003_exercise_document_requirements.sql

CREATE TABLE IF NOT EXISTS exercise_document_requirements (
  id                  TEXT PRIMARY KEY,
  exercise_id         TEXT NOT NULL,
  document_type_id    TEXT NOT NULL,
  is_required         INTEGER NOT NULL DEFAULT 1,
  conditional_on      TEXT,                  -- 'has_professional_qualification' | 'is_pwd' | NULL
  display_order       INTEGER NOT NULL,
  max_mb_override     INTEGER,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL,
  UNIQUE (exercise_id, document_type_id)
);

CREATE INDEX IF NOT EXISTS idx_edr_exercise
  ON exercise_document_requirements(exercise_id, display_order);
```

- [ ] **Step 2: Apply locally and remotely**

```bash
cd ohcs-website
npm run migrate
npm run migrate:remote
```

Expected: each prints `✅ Applied 1 migration(s).`

- [ ] **Step 3: Verify table shape**

```bash
npx wrangler d1 execute ohcs-recruitment --remote --command="PRAGMA table_info(exercise_document_requirements)"
```

Expected: 9 columns matching the CREATE TABLE above.

- [ ] **Step 4: Commit**

```bash
git add migrations/0003_exercise_document_requirements.sql
git commit -m "feat(recruitment): add exercise_document_requirements table"
```

---

## Task 3: Add D1 helper module

This wraps the raw D1 API in tiny typed helpers so endpoint code is shorter and less error-prone.

**Files:**
- Create: `ohcs-website/functions/_shared/db.ts`

- [ ] **Step 1: Write the helper**

```typescript
// ohcs-website/functions/_shared/db.ts
import type { Env } from './types';

export interface RowOf<T> {
  results: T[];
  meta?: Record<string, unknown>;
}

export async function first<T>(
  env: Env,
  sql: string,
  ...binds: unknown[]
): Promise<T | null> {
  return (await env.DB.prepare(sql).bind(...binds).first<T>()) ?? null;
}

export async function all<T>(
  env: Env,
  sql: string,
  ...binds: unknown[]
): Promise<T[]> {
  const result = await env.DB.prepare(sql).bind(...binds).all<T>();
  return result.results ?? [];
}

export async function run(
  env: Env,
  sql: string,
  ...binds: unknown[]
): Promise<void> {
  await env.DB.prepare(sql).bind(...binds).run();
}

export async function batch(env: Env, statements: D1PreparedStatement[]): Promise<void> {
  await env.DB.batch(statements);
}
```

- [ ] **Step 2: Type-check**

```bash
cd ohcs-website
npx tsc --noEmit 2>&1 | grep "functions/_shared/db" || echo "OK"
```

Expected: prints `OK` (no errors in the new file).

- [ ] **Step 3: Commit**

```bash
git add functions/_shared/db.ts
git commit -m "feat(recruitment): add D1 query helpers (first/all/run/batch)"
```

---

## Task 4: Add interim admin auth helper

Header-based role gate. Includes the security-disclosure comment that every admin endpoint must reference.

**Files:**
- Create: `ohcs-website/functions/_shared/admin-auth.ts`
- Create: `ohcs-website/tests/functions/_shared/admin-auth.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/_shared/admin-auth.test.ts
import { describe, it, expect } from 'vitest';
import { requireAdmin } from '../../../functions/_shared/admin-auth';

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/admin/test', { headers });
}

describe('requireAdmin', () => {
  it('returns admin context when role is super_admin', () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'admin@ohcs.gov.gh',
      'X-Admin-User-Role': 'super_admin',
    });
    const result = requireAdmin(req);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.admin.email).toBe('admin@ohcs.gov.gh');
      expect(result.admin.role).toBe('super_admin');
    }
  });

  it('returns admin context when role is recruitment_admin', () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'recruitment@ohcs.gov.gh',
      'X-Admin-User-Role': 'recruitment_admin',
    });
    const result = requireAdmin(req);
    expect(result.kind).toBe('ok');
  });

  it('returns 403 response when role is viewer', () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'viewer@ohcs.gov.gh',
      'X-Admin-User-Role': 'viewer',
    });
    const result = requireAdmin(req);
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') {
      expect(result.response.status).toBe(403);
    }
  });

  it('returns 401 response when headers are missing', () => {
    const req = makeRequest({});
    const result = requireAdmin(req);
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') {
      expect(result.response.status).toBe(401);
    }
  });

  it('returns 401 response when role header is empty', () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'admin@ohcs.gov.gh',
      'X-Admin-User-Role': '',
    });
    const result = requireAdmin(req);
    expect(result.kind).toBe('reject');
  });
});
```

Run: `npx vitest run tests/functions/_shared/admin-auth.test.ts`
Expected: all 5 tests FAIL with "Cannot find module".

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/_shared/admin-auth.ts
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
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run tests/functions/_shared/admin-auth.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add functions/_shared/admin-auth.ts tests/functions/_shared/admin-auth.test.ts
git commit -m "feat(recruitment): add interim header-based admin role gate"
```

---

## Task 5: Add Zod-validation helper

Returns a 400 on invalid input, otherwise returns the parsed value. Saves boilerplate in every endpoint.

**Files:**
- Create: `ohcs-website/functions/_shared/validate.ts`
- Create: `ohcs-website/tests/functions/_shared/validate.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/_shared/validate.test.ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseBody } from '../../../functions/_shared/validate';

function jsonRequest(body: unknown): Request {
  return new Request('https://example.com/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const schema = z.object({ name: z.string().min(1), count: z.number().int().nonnegative() });

describe('parseBody', () => {
  it('returns parsed value on valid input', async () => {
    const result = await parseBody(jsonRequest({ name: 'kofi', count: 3 }), schema);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value).toEqual({ name: 'kofi', count: 3 });
    }
  });

  it('returns 400 on schema violation', async () => {
    const result = await parseBody(jsonRequest({ name: '', count: -1 }), schema);
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') {
      expect(result.response.status).toBe(400);
      const body = (await result.response.json()) as { error: string; issues: unknown[] };
      expect(body.error).toBe('invalid request body');
      expect(Array.isArray(body.issues)).toBe(true);
    }
  });

  it('returns 400 on malformed JSON', async () => {
    const req = new Request('https://example.com/x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    const result = await parseBody(req, schema);
    expect(result.kind).toBe('reject');
  });
});
```

Run: `npx vitest run tests/functions/_shared/validate.test.ts`
Expected: all 3 tests FAIL with "Cannot find module".

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/_shared/validate.ts
import type { ZodTypeAny, infer as ZodInfer, ZodIssue } from 'zod';
import { json } from './json';

export type ValidateResult<T> =
  | { kind: 'ok'; value: T }
  | { kind: 'reject'; response: Response };

export async function parseBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<ValidateResult<ZodInfer<S>>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      kind: 'reject',
      response: json({ error: 'invalid request body', issues: [{ message: 'malformed JSON' }] satisfies Pick<ZodIssue, 'message'>[] }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      kind: 'reject',
      response: json({ error: 'invalid request body', issues: parsed.error.issues }, { status: 400 }),
    };
  }

  return { kind: 'ok', value: parsed.data };
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run tests/functions/_shared/validate.test.ts
```

Expected: all 3 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add functions/_shared/validate.ts tests/functions/_shared/validate.test.ts
git commit -m "feat(recruitment): add Zod body-parsing helper"
```

---

## Task 6: Add D1 mock helper for endpoint tests

Endpoint tests need a way to construct a fake `Env` whose D1 binding actually executes SQL deterministically without hitting Cloudflare. We use a tiny in-memory map keyed by SQL+binds — sufficient for the assertions our endpoints make.

**Files:**
- Modify: `ohcs-website/tests/functions/_helpers/mock-env.ts`
- Create: `ohcs-website/tests/functions/_helpers/d1-mock.ts`

- [ ] **Step 1: Write `d1-mock.ts`**

```typescript
// ohcs-website/tests/functions/_helpers/d1-mock.ts
//
// Tiny scriptable D1 stand-in. Tests register expected (sql, binds) → result
// triples; the mock returns the matched result when the endpoint calls
// .prepare(sql).bind(...binds).first()/all()/run().
//
// Match is exact-string on `sql` and JSON-equal on `binds`. If no match, the
// mock throws — surfacing test setup gaps rather than silently returning null.

export interface D1Script {
  sql: string;
  binds?: unknown[];
  first?: unknown;
  all?: { results: unknown[]; meta?: Record<string, unknown> };
  run?: { meta?: Record<string, unknown> };
}

export function makeD1(scripts: D1Script[]): D1Database {
  function find(sql: string, binds: unknown[]): D1Script {
    const match = scripts.find((s) => {
      if (s.sql !== sql) return false;
      if (s.binds === undefined) return true; // wildcard: match any binds
      return JSON.stringify(s.binds) === JSON.stringify(binds);
    });
    if (!match) {
      throw new Error(
        `d1-mock: no script registered for sql=${JSON.stringify(sql)} binds=${JSON.stringify(binds)}`,
      );
    }
    return match;
  }

  return {
    prepare(sql: string) {
      let bound: unknown[] = [];
      const stmt = {
        bind(...args: unknown[]) {
          bound = args;
          return stmt;
        },
        async first<T = unknown>(): Promise<T | null> {
          const s = find(sql, bound);
          return (s.first as T) ?? null;
        },
        async all<T = unknown>(): Promise<{ results: T[]; meta?: Record<string, unknown> }> {
          const s = find(sql, bound);
          return s.all ? { results: s.all.results as T[], meta: s.all.meta } : { results: [] };
        },
        async run(): Promise<{ meta?: Record<string, unknown> }> {
          const s = find(sql, bound);
          return s.run ?? {};
        },
      };
      return stmt;
    },
    async batch(_statements: unknown[]): Promise<unknown[]> {
      // Tests that exercise batch register a single script per call site.
      return [];
    },
  } as unknown as D1Database;
}
```

- [ ] **Step 2: Extend `mock-env.ts` with a `withD1` override**

Replace the contents of `tests/functions/_helpers/mock-env.ts` with:

```typescript
import { vi } from 'vitest';
import type { Env } from '../../../functions/_shared/types';

export interface MockEnvOverrides {
  d1Healthy?: boolean;
  r2Healthy?: boolean;
  aiHealthy?: boolean;
  db?: D1Database;
}

export function mockEnv(o: MockEnvOverrides = {}): Env {
  const { d1Healthy = true, r2Healthy = true, aiHealthy = true, db } = o;

  const defaultDb = {
    prepare: vi.fn(() => ({
      first: vi.fn(async () => {
        if (!d1Healthy) throw new Error('D1 unavailable');
        return { ok: 1 };
      }),
    })),
  } as unknown as D1Database;

  const uploads = {
    head: vi.fn(async () => {
      if (!r2Healthy) throw new Error('R2 unavailable');
      return null;
    }),
  } as unknown as R2Bucket;

  const ai = {
    run: vi.fn(async () => {
      if (!aiHealthy) throw new Error('AI unavailable');
      return { response: 'ok' };
    }),
  } as unknown as Ai;

  return {
    DB: db ?? defaultDb,
    UPLOADS: uploads,
    AI: ai,
    APP_NAME: 'OHCS Recruitment (Test)',
    APP_ENV: 'development',
    EMAIL_FROM: 'noreply@example.com',
    EMAIL_FROM_NAME: 'Test',
  };
}
```

- [ ] **Step 3: Re-run the existing tests to make sure nothing broke**

```bash
cd ohcs-website
npx vitest run tests/functions
```

Expected: all 9 existing tests still PASS (5 health + 4 email).

- [ ] **Step 4: Commit**

```bash
git add tests/functions/_helpers/
git commit -m "test(recruitment): add scriptable D1 mock for endpoint tests"
```

---

## Task 7: Implement `GET` and `POST` `/api/admin/document-types`

**Files:**
- Create: `ohcs-website/functions/api/admin/document-types/index.ts`
- Create: `ohcs-website/tests/functions/admin/document-types.test.ts`
- Create: `ohcs-website/src/types/recruitment.ts`

- [ ] **Step 1: Define shared types**

```typescript
// ohcs-website/src/types/recruitment.ts

export type AiCheckType = 'certificate' | 'photo' | 'identity' | null;

export interface DocumentType {
  id: string;
  label: string;
  description: string | null;
  default_max_mb: number;
  accepted_mimes: string[];           // parsed JSON array
  ai_check_type: AiCheckType;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface DocumentTypeRow {
  id: string;
  label: string;
  description: string | null;
  default_max_mb: number;
  accepted_mimes: string;             // raw JSON string from D1
  ai_check_type: AiCheckType;
  is_active: number;                  // 0 / 1 from D1
  created_at: number;
  updated_at: number;
}

export type ConditionalTrigger = 'has_professional_qualification' | 'is_pwd';

export interface ExerciseRequirement {
  id: string;
  exercise_id: string;
  document_type_id: string;
  is_required: boolean;
  conditional_on: ConditionalTrigger | null;
  display_order: number;
  max_mb_override: number | null;
}

export interface ExerciseRequirementRow {
  id: string;
  exercise_id: string;
  document_type_id: string;
  is_required: number;
  conditional_on: string | null;
  display_order: number;
  max_mb_override: number | null;
  created_at: number;
  updated_at: number;
}

export function rowToDocumentType(row: DocumentTypeRow): DocumentType {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    default_max_mb: row.default_max_mb,
    accepted_mimes: JSON.parse(row.accepted_mimes) as string[],
    ai_check_type: row.ai_check_type,
    is_active: row.is_active === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function rowToRequirement(row: ExerciseRequirementRow): ExerciseRequirement {
  return {
    id: row.id,
    exercise_id: row.exercise_id,
    document_type_id: row.document_type_id,
    is_required: row.is_required === 1,
    conditional_on: (row.conditional_on as ConditionalTrigger | null) ?? null,
    display_order: row.display_order,
    max_mb_override: row.max_mb_override,
  };
}
```

- [ ] **Step 2: Write failing tests**

```typescript
// ohcs-website/tests/functions/admin/document-types.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../functions/api/admin/document-types/index';
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

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'admin@ohcs.gov.gh',
  'X-Admin-User-Role': 'super_admin',
};

describe('GET /api/admin/document-types', () => {
  it('returns the active master library', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM document_types ORDER BY label',
        all: {
          results: [
            {
              id: 'national_id',
              label: 'National ID (Ghana Card)',
              description: null,
              default_max_mb: 5,
              accepted_mimes: '["application/pdf","image/jpeg","image/png"]',
              ai_check_type: 'identity',
              is_active: 1,
              created_at: 1,
              updated_at: 1,
            },
          ],
        },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/document-types', { headers: ADMIN_HEADERS }), db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; accepted_mimes: string[]; is_active: boolean }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.id).toBe('national_id');
    expect(body.data[0]!.accepted_mimes).toEqual(['application/pdf', 'image/jpeg', 'image/png']);
    expect(body.data[0]!.is_active).toBe(true);
  });

  it('rejects without admin headers', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/admin/document-types')));
    expect(res.status).toBe(401);
  });

  it('rejects with viewer role', async () => {
    const headers = { 'X-Admin-User-Email': 'v@x.gh', 'X-Admin-User-Role': 'viewer' };
    const res = await onRequestGet(ctx(new Request('https://x/api/admin/document-types', { headers })));
    expect(res.status).toBe(403);
  });
});

describe('POST /api/admin/document-types', () => {
  it('creates a new document type', async () => {
    const db = makeD1([
      {
        // `binds` omitted → the d1-mock treats this as a wildcard match, which is
        // what we want because the implementation passes Date.now() values that
        // we can't predict. The assertion is "insert SQL was called, response
        // shape is right."
        sql:
          'INSERT INTO document_types (id, label, description, default_max_mb, accepted_mimes, ai_check_type, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
        run: { meta: { changes: 1 } },
      },
    ]);

    const req = new Request('https://x/api/admin/document-types', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'custom_letter',
        label: 'Endorsement Letter',
        description: 'Required for senior roles only',
        default_max_mb: 3,
        accepted_mimes: ['application/pdf'],
        ai_check_type: null,
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { id: string } };
    expect(body.data.id).toBe('custom_letter');
  });

  it('rejects invalid payload', async () => {
    const req = new Request('https://x/api/admin/document-types', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({ label: '', default_max_mb: -1 }),
    });
    const res = await onRequestPost(ctx(req));
    expect(res.status).toBe(400);
  });
});
```

> **Note on the POST test:** the d1-mock matches binds exactly, but `created_at`/`updated_at` use `Date.now()` so we can't predict them. To keep this Step compact and the test deterministic, we relax the d1-mock's first POST script to match ANY binds for that exact SQL, which the mock supports if `binds` is omitted. The implementation in Step 3 below uses one INSERT per call, so this is unambiguous.

Run: `npx vitest run tests/functions/admin/document-types.test.ts`
Expected: all 5 tests FAIL with "Cannot find module".

- [ ] **Step 3: Implement the endpoint**

```typescript
// ohcs-website/functions/api/admin/document-types/index.ts
//
// SECURITY: see functions/_shared/admin-auth.ts header. This endpoint
// trusts X-Admin-User-Role headers — replace before production launch.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { parseBody } from '../../../_shared/validate';
import { all, run } from '../../../_shared/db';
import { z } from 'zod';
import {
  rowToDocumentType,
  type DocumentTypeRow,
} from '../../../../src/types/recruitment';

const CreateSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/, 'lowercase letters, numbers, underscores only'),
  label: z.string().min(1).max(200),
  description: z.string().max(500).nullable().optional(),
  default_max_mb: z.number().int().min(1).max(50),
  accepted_mimes: z.array(z.string().min(1)).min(1),
  ai_check_type: z.enum(['certificate', 'photo', 'identity']).nullable().optional(),
});

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const rows = await all<DocumentTypeRow>(env, 'SELECT * FROM document_types ORDER BY label');
  return json({ data: rows.map(rowToDocumentType) });
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const body = await parseBody(request, CreateSchema);
  if (body.kind === 'reject') return body.response;
  const v = body.value;

  const now = Date.now();
  await run(
    env,
    'INSERT INTO document_types (id, label, description, default_max_mb, accepted_mimes, ai_check_type, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
    v.id,
    v.label,
    v.description ?? null,
    v.default_max_mb,
    JSON.stringify(v.accepted_mimes),
    v.ai_check_type ?? null,
    now,
    now,
  );

  return json(
    {
      data: {
        id: v.id,
        label: v.label,
        description: v.description ?? null,
        default_max_mb: v.default_max_mb,
        accepted_mimes: v.accepted_mimes,
        ai_check_type: v.ai_check_type ?? null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    },
    { status: 201 },
  );
};
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/functions/admin/document-types.test.ts
```

Expected: all 5 tests PASS. If the POST test fails because the `binds` array doesn't match (since `Date.now()` produces different values), make the d1-mock script omit `binds` so any binds match — the test only cares about the SQL and the response shape.

- [ ] **Step 5: Commit**

```bash
git add functions/api/admin/document-types/index.ts tests/functions/admin/ src/types/recruitment.ts
git commit -m "feat(recruitment): add GET/POST /api/admin/document-types"
```

---

## Task 8: Implement `GET`, `PATCH`, `DELETE` `/api/admin/document-types/[id]`

**Files:**
- Create: `ohcs-website/functions/api/admin/document-types/[id].ts`
- Modify: `ohcs-website/tests/functions/admin/document-types.test.ts` (add 6 tests)

- [ ] **Step 1: Append failing tests**

Add this `describe` block to the bottom of the existing test file:

```typescript
import {
  onRequestGet as onRequestGetOne,
  onRequestPatch,
  onRequestDelete,
} from '../../../functions/api/admin/document-types/[id]';

describe('GET /api/admin/document-types/[id]', () => {
  it('returns one row', async () => {
    const db = makeD1([
      {
        sql: 'SELECT * FROM document_types WHERE id = ?',
        binds: ['national_id'],
        first: {
          id: 'national_id',
          label: 'National ID (Ghana Card)',
          description: null,
          default_max_mb: 5,
          accepted_mimes: '["application/pdf"]',
          ai_check_type: 'identity',
          is_active: 1,
          created_at: 1,
          updated_at: 1,
        },
      },
    ]);
    const req = new Request('https://x/api/admin/document-types/national_id', { headers: ADMIN_HEADERS });
    const res = await onRequestGetOne({ ...ctx(req, db), params: { id: 'national_id' } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string } };
    expect(body.data.id).toBe('national_id');
  });

  it('404 when not found', async () => {
    const db = makeD1([
      { sql: 'SELECT * FROM document_types WHERE id = ?', binds: ['missing'], first: undefined },
    ]);
    const req = new Request('https://x/api/admin/document-types/missing', { headers: ADMIN_HEADERS });
    const res = await onRequestGetOne({ ...ctx(req, db), params: { id: 'missing' } });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/admin/document-types/[id]', () => {
  it('updates label and bumps updated_at', async () => {
    const db = makeD1([
      {
        sql: 'UPDATE document_types SET label = ?, updated_at = ? WHERE id = ?',
        run: { meta: { changes: 1 } },
      },
    ]);
    const req = new Request('https://x/api/admin/document-types/national_id', {
      method: 'PATCH',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({ label: 'National ID (Ghana Card) — Updated' }),
    });
    const res = await onRequestPatch({ ...ctx(req, db), params: { id: 'national_id' } });
    expect(res.status).toBe(200);
  });

  it('400 on empty body', async () => {
    const req = new Request('https://x/api/admin/document-types/national_id', {
      method: 'PATCH',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await onRequestPatch({ ...ctx(req), params: { id: 'national_id' } });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/admin/document-types/[id]', () => {
  it('soft-deletes by setting is_active = 0', async () => {
    const db = makeD1([
      {
        sql: 'UPDATE document_types SET is_active = 0, updated_at = ? WHERE id = ?',
        run: { meta: { changes: 1 } },
      },
    ]);
    const req = new Request('https://x/api/admin/document-types/national_id', {
      method: 'DELETE',
      headers: ADMIN_HEADERS,
    });
    const res = await onRequestDelete({ ...ctx(req, db), params: { id: 'national_id' } });
    expect(res.status).toBe(204);
  });
});
```

Run tests — expect 4 new failures (module-not-found).

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/admin/document-types/[id].ts
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { parseBody } from '../../../_shared/validate';
import { first, run } from '../../../_shared/db';
import { z } from 'zod';
import { rowToDocumentType, type DocumentTypeRow } from '../../../../src/types/recruitment';

const PatchSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  description: z.string().max(500).nullable().optional(),
  default_max_mb: z.number().int().min(1).max(50).optional(),
  accepted_mimes: z.array(z.string().min(1)).min(1).optional(),
  ai_check_type: z.enum(['certificate', 'photo', 'identity']).nullable().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'at least one field is required' });

export const onRequestGet: PagesFunction<unknown, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const row = await first<DocumentTypeRow>(env, 'SELECT * FROM document_types WHERE id = ?', params.id);
  if (!row) return json({ error: 'not found' }, { status: 404 });
  return json({ data: rowToDocumentType(row) });
};

export const onRequestPatch: PagesFunction<unknown, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const body = await parseBody(request, PatchSchema);
  if (body.kind === 'reject') return body.response;
  const v = body.value;

  const now = Date.now();
  // Build SQL dynamically — exactly one column per provided field, then updated_at.
  const sets: string[] = [];
  const binds: unknown[] = [];
  if (v.label !== undefined) { sets.push('label = ?'); binds.push(v.label); }
  if (v.description !== undefined) { sets.push('description = ?'); binds.push(v.description); }
  if (v.default_max_mb !== undefined) { sets.push('default_max_mb = ?'); binds.push(v.default_max_mb); }
  if (v.accepted_mimes !== undefined) { sets.push('accepted_mimes = ?'); binds.push(JSON.stringify(v.accepted_mimes)); }
  if (v.ai_check_type !== undefined) { sets.push('ai_check_type = ?'); binds.push(v.ai_check_type); }
  sets.push('updated_at = ?'); binds.push(now);
  binds.push(params.id);

  await run(env, `UPDATE document_types SET ${sets.join(', ')} WHERE id = ?`, ...binds);
  return json({ data: { id: params.id, updated_at: now } });
};

export const onRequestDelete: PagesFunction<unknown, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  await run(env, 'UPDATE document_types SET is_active = 0, updated_at = ? WHERE id = ?', Date.now(), params.id);
  return new Response(null, { status: 204 });
};
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run tests/functions/admin/document-types.test.ts
```

Expected: all 9 tests PASS. If the PATCH test fails because the dynamic SQL string differs from what the d1-mock expects, register the `UPDATE document_types SET label = ?, updated_at = ? WHERE id = ?` SQL exactly (matching the order: provided fields, then updated_at).

- [ ] **Step 4: Commit**

```bash
git add functions/api/admin/document-types/\[id\].ts tests/functions/admin/document-types.test.ts
git commit -m "feat(recruitment): add GET/PATCH/DELETE /api/admin/document-types/[id]"
```

---

## Task 9: Implement `GET` and `PUT` `/api/admin/exercises/[id]/requirements`

PUT is a full replace: client sends the complete ordered list, server deletes old rows and inserts the new ones in a single batch.

**Files:**
- Create: `ohcs-website/functions/api/admin/exercises/[id]/requirements.ts`
- Create: `ohcs-website/tests/functions/admin/exercise-requirements.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/admin/exercise-requirements.test.ts
import { describe, it, expect } from 'vitest';
import {
  onRequestGet,
  onRequestPut,
} from '../../../functions/api/admin/exercises/[id]/requirements';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'admin@ohcs.gov.gh',
  'X-Admin-User-Role': 'super_admin',
};

function ctx(req: Request, db?: D1Database) {
  return {
    request: req,
    env: mockEnv({ db }),
    params: { id: 'ex-001' },
    waitUntil: () => {},
    data: {},
  };
}

describe('GET /api/admin/exercises/[id]/requirements', () => {
  it('returns the ordered requirements list for an exercise', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT * FROM exercise_document_requirements WHERE exercise_id = ? ORDER BY display_order ASC',
        binds: ['ex-001'],
        all: {
          results: [
            {
              id: 'r1',
              exercise_id: 'ex-001',
              document_type_id: 'national_id',
              is_required: 1,
              conditional_on: null,
              display_order: 0,
              max_mb_override: null,
              created_at: 1,
              updated_at: 1,
            },
          ],
        },
      },
    ]);
    const req = new Request('https://x/api/admin/exercises/ex-001/requirements', { headers: ADMIN_HEADERS });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ document_type_id: string; is_required: boolean }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.document_type_id).toBe('national_id');
    expect(body.data[0]!.is_required).toBe(true);
  });

  it('rejects non-admin', async () => {
    const req = new Request('https://x/api/admin/exercises/ex-001/requirements');
    const res = await onRequestGet(ctx(req));
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/exercises/[id]/requirements', () => {
  it('replaces the full list (validates input shape)', async () => {
    // We don't deeply assert the batch SQL — we assert the endpoint returns 200
    // when input is valid and our mock's run() succeeds.
    const db = makeD1([
      {
        sql: 'DELETE FROM exercise_document_requirements WHERE exercise_id = ?',
        binds: ['ex-001'],
        run: {},
      },
      {
        // The implementation INSERTs row-by-row inside a single batch. We register
        // the same SQL once; d1-mock's batch() returns []. The endpoint test asserts
        // status only.
        sql:
          'INSERT INTO exercise_document_requirements (id, exercise_id, document_type_id, is_required, conditional_on, display_order, max_mb_override, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
    ]);

    const req = new Request('https://x/api/admin/exercises/ex-001/requirements', {
      method: 'PUT',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        requirements: [
          {
            document_type_id: 'national_id',
            is_required: true,
            conditional_on: null,
            display_order: 0,
            max_mb_override: null,
          },
          {
            document_type_id: 'professional_cert',
            is_required: true,
            conditional_on: 'has_professional_qualification',
            display_order: 1,
            max_mb_override: null,
          },
        ],
      }),
    });
    const res = await onRequestPut(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { count: number } };
    expect(body.data.count).toBe(2);
  });

  it('400 on invalid conditional_on value', async () => {
    const req = new Request('https://x/api/admin/exercises/ex-001/requirements', {
      method: 'PUT',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        requirements: [
          {
            document_type_id: 'national_id',
            is_required: true,
            conditional_on: 'something_invalid',
            display_order: 0,
            max_mb_override: null,
          },
        ],
      }),
    });
    const res = await onRequestPut(ctx(req));
    expect(res.status).toBe(400);
  });

  it('400 on duplicate document_type_id within the request', async () => {
    const req = new Request('https://x/api/admin/exercises/ex-001/requirements', {
      method: 'PUT',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        requirements: [
          { document_type_id: 'national_id', is_required: true, conditional_on: null, display_order: 0, max_mb_override: null },
          { document_type_id: 'national_id', is_required: false, conditional_on: null, display_order: 1, max_mb_override: null },
        ],
      }),
    });
    const res = await onRequestPut(ctx(req));
    expect(res.status).toBe(400);
  });
});
```

Run: `npx vitest run tests/functions/admin/exercise-requirements.test.ts`
Expected: all 5 tests FAIL with "Cannot find module".

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/admin/exercises/[id]/requirements.ts
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { parseBody } from '../../../../_shared/validate';
import { all, run } from '../../../../_shared/db';
import { z } from 'zod';
import {
  rowToRequirement,
  type ExerciseRequirementRow,
} from '../../../../../src/types/recruitment';

const RequirementInput = z.object({
  document_type_id: z.string().min(1),
  is_required: z.boolean(),
  conditional_on: z.enum(['has_professional_qualification', 'is_pwd']).nullable(),
  display_order: z.number().int().nonnegative(),
  max_mb_override: z.number().int().min(1).max(50).nullable(),
});

const PutSchema = z.object({
  requirements: z
    .array(RequirementInput)
    .max(50)
    .refine(
      (rs) => new Set(rs.map((r) => r.document_type_id)).size === rs.length,
      { message: 'duplicate document_type_id in requirements list' },
    ),
});

export const onRequestGet: PagesFunction<unknown, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const rows = await all<ExerciseRequirementRow>(
    env,
    'SELECT * FROM exercise_document_requirements WHERE exercise_id = ? ORDER BY display_order ASC',
    params.id,
  );
  return json({ data: rows.map(rowToRequirement) });
};

export const onRequestPut: PagesFunction<unknown, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const body = await parseBody(request, PutSchema);
  if (body.kind === 'reject') return body.response;
  const v = body.value;

  const now = Date.now();
  await run(env, 'DELETE FROM exercise_document_requirements WHERE exercise_id = ?', params.id);

  for (const r of v.requirements) {
    const id = `edr_${params.id}_${r.document_type_id}`;
    await run(
      env,
      'INSERT INTO exercise_document_requirements (id, exercise_id, document_type_id, is_required, conditional_on, display_order, max_mb_override, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      params.id,
      r.document_type_id,
      r.is_required ? 1 : 0,
      r.conditional_on,
      r.display_order,
      r.max_mb_override,
      now,
      now,
    );
  }

  return json({ data: { count: v.requirements.length, exercise_id: params.id } });
};
```

> **Note:** PUT performs N+1 D1 calls instead of `env.DB.batch()` to keep the d1-mock simple. For ≤50 rows this is fine; revisit with batch if a real exercise needs more.

- [ ] **Step 3: Run tests**

```bash
npx vitest run tests/functions/admin/exercise-requirements.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add functions/api/admin/exercises tests/functions/admin/exercise-requirements.test.ts
git commit -m "feat(recruitment): add GET/PUT /api/admin/exercises/[id]/requirements"
```

---

## Task 10: Add the typed browser-side API client

The React admin pages call this client; this client calls the Pages Functions.

**Files:**
- Create: `ohcs-website/src/lib/recruitment-api.ts`

- [ ] **Step 1: Write the client**

```typescript
// ohcs-website/src/lib/recruitment-api.ts
import type {
  DocumentType,
  ExerciseRequirement,
  ConditionalTrigger,
  AiCheckType,
} from '@/types/recruitment';

const USER_KEY = 'ohcs_admin_user';

interface StoredUser { email?: string; role?: string }

function adminHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return {};
    const u = JSON.parse(raw) as StoredUser;
    return {
      'X-Admin-User-Email': u.email ?? '',
      'X-Admin-User-Role': u.role ?? '',
    };
  } catch {
    return {};
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...adminHeaders(),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ─── Document Types ──────────────────────────────────────────────────────

export async function listDocumentTypes(): Promise<DocumentType[]> {
  const { data } = await request<{ data: DocumentType[] }>('/api/admin/document-types');
  return data;
}

export interface CreateDocumentTypeInput {
  id: string;
  label: string;
  description?: string | null;
  default_max_mb: number;
  accepted_mimes: string[];
  ai_check_type?: AiCheckType;
}

export async function createDocumentType(input: CreateDocumentTypeInput): Promise<DocumentType> {
  const { data } = await request<{ data: DocumentType }>('/api/admin/document-types', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data;
}

export async function patchDocumentType(
  id: string,
  patch: Partial<CreateDocumentTypeInput>,
): Promise<void> {
  await request(`/api/admin/document-types/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deactivateDocumentType(id: string): Promise<void> {
  await request(`/api/admin/document-types/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─── Exercise Requirements ───────────────────────────────────────────────

export async function getExerciseRequirements(
  exerciseId: string,
): Promise<ExerciseRequirement[]> {
  const { data } = await request<{ data: ExerciseRequirement[] }>(
    `/api/admin/exercises/${encodeURIComponent(exerciseId)}/requirements`,
  );
  return data;
}

export interface RequirementInput {
  document_type_id: string;
  is_required: boolean;
  conditional_on: ConditionalTrigger | null;
  display_order: number;
  max_mb_override: number | null;
}

export async function putExerciseRequirements(
  exerciseId: string,
  requirements: RequirementInput[],
): Promise<{ count: number }> {
  const { data } = await request<{ data: { count: number } }>(
    `/api/admin/exercises/${encodeURIComponent(exerciseId)}/requirements`,
    { method: 'PUT', body: JSON.stringify({ requirements }) },
  );
  return data;
}
```

- [ ] **Step 2: Type-check**

```bash
cd ohcs-website
npx tsc --noEmit 2>&1 | grep "src/lib/recruitment-api" || echo "OK"
```

Expected: prints `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/recruitment-api.ts
git commit -m "feat(recruitment): add browser API client for document-config endpoints"
```

---

## Task 11: Build the master library admin page

Implements `/admin/recruitment/document-types` — list, create, edit, soft-delete the master library. Follows the existing admin pattern (lucide icons, Tailwind, `audit()` for client log).

**Files:**
- Create: `ohcs-website/src/app/admin/recruitment/document-types/page.tsx`

This task involves a substantial UI file. Rather than inline it in the plan (it would be 250+ lines), the implementer follows these constraints:

- [ ] **Step 1: Read existing exercises page for style reference**

```bash
cat ohcs-website/src/app/admin/recruitment/exercises/page.tsx | head -120
```

Note the `RecruitmentTabs` pattern (locally redeclared per page), the toast pattern, the card layout, and how `audit()` is called.

- [ ] **Step 2: Create the page**

The page must:
1. Render the `RecruitmentTabs` (copy the array verbatim; the existing pages each have their own copy).
2. On mount, call `listDocumentTypes()` from `@/lib/recruitment-api` and render the rows in a card list ordered by `label`.
3. Show: label, id (small mono font), `default_max_mb`, accepted MIMEs (chip badges), `ai_check_type` (chip), `is_active` (toggle reflecting current state).
4. "New Document Type" button opens a modal with fields matching the `CreateDocumentTypeInput` interface. On submit, call `createDocumentType()`, then refresh the list.
5. Each row has an "Edit" button that opens the same modal pre-filled; submit calls `patchDocumentType()`.
6. Each row has a "Deactivate" button (only shown for active rows) that calls `deactivateDocumentType()` after a `window.confirm()`.
7. Every successful mutation calls `audit('create' | 'update' | 'delete', 'admin_user', id, label, details)` — yes use `'admin_user'` as the AuditResource enum value (the existing logger doesn't have a dedicated `'document_type'` resource; do NOT extend the enum here, save that for a later cleanup pass).
8. Errors from `request()` show a red toast for 4 seconds.
9. Loading state shows a `Loader2` spinner from lucide.

Implementation must:
- Use `'use client'` at the top
- Use `useState`, `useEffect`, `useMemo`
- NOT use any `any` casts — type everything from the imported types
- Use the same Tailwind classes as the existing exercises page (`rounded-2xl`, `border-2 border-border/40`, `bg-primary text-white`, etc.)

- [ ] **Step 3: Build and verify the page renders without errors**

```bash
npm run pages:build 2>&1 | tail -10
```

Expected: build succeeds. If TypeScript or React issues appear, fix them — DO NOT use `any`.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/recruitment/document-types/page.tsx
git commit -m "feat(recruitment): add admin master library page"
```

---

## Task 12: Build the per-exercise requirements admin page

Implements `/admin/recruitment/exercise-documents?exerciseId=ex-001`. This is the heart of the spec § 5.2 UI: the ordered list with required/optional/conditional toggles, drag-reorder, "Add from Master Library" picker, and "Preview as Applicant" button.

**Files:**
- Create: `ohcs-website/src/app/admin/recruitment/exercise-documents/page.tsx`

- [ ] **Step 1: Create the page**

The page must:
1. Read `?exerciseId=` from `useSearchParams()` (a `'use client'` page using `next/navigation`). If missing, render a friendly "Pick an exercise" empty state with a link back to `/admin/recruitment/exercises`.
2. On mount: call `listDocumentTypes()` AND `getExerciseRequirements(exerciseId)` in parallel (Promise.all).
3. Render the ordered selected requirements list. Each row shows: label, id (small), required/optional/conditional radio group, conditional dropdown (only when "Conditional" is selected; options: `has_professional_qualification`, `is_pwd`), max_mb override numeric input, drag handle (⋮⋮ icon from lucide), and a remove (✕) button.
4. Reordering uses HTML5 drag-and-drop (no extra library). On drop, recompute `display_order` 0…N and update local state.
5. "Add from Master Library" is a dropdown button. Clicking opens a popover listing every active document type that is NOT already in the requirements list. Clicking one appends a new requirement with default `is_required = true`, `conditional_on = null`, `display_order = currentLength`, `max_mb_override = null`.
6. "Save Changes" button calls `putExerciseRequirements(exerciseId, currentList)`. Disable while pending. Show a toast on success/failure. After success, log `audit('update', 'recruitment_exercise', exerciseId, exerciseId, 'Updated document requirements')`.
7. "Preview as Applicant" button opens the modal from Task 13 (passing the current in-memory requirement list and document type metadata).
8. If `exerciseId` doesn't appear in localStorage's exercises (read the same `ohcs_recruitment_exercises` key the existing page uses; if that key doesn't exist yet, just show the exerciseId as the title), show a small warning "Exercise not found in local store — saving requirements is allowed but the applicant view may not match what they actually see."

- [ ] **Step 2: Build and verify**

```bash
npm run pages:build 2>&1 | tail -10
```

Expected: build succeeds without errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/recruitment/exercise-documents/page.tsx
git commit -m "feat(recruitment): add per-exercise document requirements config page"
```

---

## Task 13: Build the Preview-as-Applicant modal component

**Files:**
- Create: `ohcs-website/src/components/admin/preview-applicant-modal.tsx`

- [ ] **Step 1: Create the component**

The component must:
1. Accept props: `open: boolean`, `onClose: () => void`, `documentTypes: DocumentType[]`, `requirements: RequirementInput[]`.
2. Render an applicant-style "Step 4: Documents" preview matching spec § 6.3 visually (one card per required slot, "Drag and drop, or Browse Files" placeholder, file size + accepted types listed).
3. At the top of the modal include two simulation toggles:
   - "Simulate: I hold a professional qualification"
   - "Simulate: I am a Person with Disability"
4. When a toggle is on, conditional requirements where `conditional_on` matches become visible; when off, they are hidden. (Mirrors the runtime behavior the applicant will see.)
5. The modal closes on overlay click, ESC, or the X button. Use existing modal pattern from `src/app/admin/recruitment/exercises/page.tsx` (the create-exercise modal).
6. It is preview only — no upload affordance is wired to anything; clicking "Browse Files" is a no-op (or shows a small grey "preview only" tooltip).
7. Pure presentational — no API calls, no state outside the two toggles and the close handler.

- [ ] **Step 2: Verify the page compiles when imported**

The component is imported by Task 12's page. Re-run the build:

```bash
npm run pages:build 2>&1 | tail -10
```

Expected: still compiles.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/preview-applicant-modal.tsx
git commit -m "feat(recruitment): add Preview-as-Applicant modal component"
```

---

## Task 14: Add "Configure Documents" link to the Exercises list page

The existing exercises management page lists exercises in cards. Add a link on each card to the new `exercise-documents` page.

**Files:**
- Modify: `ohcs-website/src/app/admin/recruitment/exercises/page.tsx`

- [ ] **Step 1: Find the exercise card action area**

```bash
grep -n "toggleStatus\|Activate\|Close\|Complete" ohcs-website/src/app/admin/recruitment/exercises/page.tsx | head -10
```

- [ ] **Step 2: Add a "Configure Documents" `Link` next to the status button**

Before the existing `<button onClick={() => toggleStatus(ex.id)}>` block, add:

```tsx
<Link
  href={`/admin/recruitment/exercise-documents?exerciseId=${ex.id}`}
  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-border/60 text-text-muted hover:border-primary hover:text-primary transition-colors"
>
  <FileText className="h-4 w-4" aria-hidden="true" />
  Configure Documents
</Link>
```

`Link` and `FileText` are already imported in this file.

- [ ] **Step 3: Verify build**

```bash
npm run pages:build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/recruitment/exercises/page.tsx
git commit -m "feat(recruitment): add Configure Documents link on exercise cards"
```

---

## Task 15: End-to-end smoke test against local pages dev

**Files:** none.

- [ ] **Step 1: Start pages dev**

```bash
cd ohcs-website
npm run pages:dev
```

- [ ] **Step 2: In a second terminal, hit the API directly**

```bash
curl -s -H "X-Admin-User-Email: admin@ohcs.gov.gh" -H "X-Admin-User-Role: super_admin" http://localhost:8788/api/admin/document-types | jq '.data | length'
```

Expected: `15`.

- [ ] **Step 3: Open the admin pages in a browser**

Visit `http://localhost:8788/admin/login/`, log in as `admin@ohcs.gov.gh / changeme123`, then visit `http://localhost:8788/admin/recruitment/document-types/`. Confirm 15 document types render.

Then visit `http://localhost:8788/admin/recruitment/exercise-documents/?exerciseId=ex-001`. Confirm the page loads, you can add a requirement, save it, and the toast appears.

Then visit `http://localhost:8788/admin/recruitment/exercises/`. Confirm the "Configure Documents" link is present and goes to the right URL.

- [ ] **Step 4: Stop pages dev**

`Ctrl+C` in the first terminal.

No commit — verification step.

---

## Task 16: Final QA — full test suite + lint + type-check

- [ ] **Step 1: Run all tests**

```bash
cd ohcs-website
npm test -- --run
```

Expected: all tests pass (Phase 0's 64 + new Phase 1 tests = ~85+).

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors. (If new errors surfaced anywhere outside the new files, investigate — they may be a regression you introduced.)

- [ ] **Step 3: Lint**

```bash
npm run lint 2>&1 | tail -20
```

Expected: no NEW errors in your changed files. (Pre-existing React-hooks errors from Phase 0 are still tolerated until they're cleaned up separately.)

If the lint output shows new errors for files YOU touched, fix them before merging. Don't fix unrelated pre-existing warnings.

- [ ] **Step 4: Build for deploy**

```bash
npm run pages:build 2>&1 | tail -10
```

Expected: build succeeds.

---

## Task 17: Deploy preview, verify, merge to master, deploy production

- [ ] **Step 1: Deploy preview**

```bash
npx wrangler pages deploy out --project-name=ohcs
```

Expected: prints `Deployment alias URL: https://feat-recruitment-phase-1.ohcs.pages.dev`.

- [ ] **Step 2: Verify preview**

```bash
sleep 20 && curl -s -H "X-Admin-User-Email: admin@ohcs.gov.gh" -H "X-Admin-User-Role: super_admin" https://feat-recruitment-phase-1.ohcs.pages.dev/api/admin/document-types | jq '.data | length'
```

Expected: `15`.

- [ ] **Step 3: Merge to master**

```bash
git checkout master
git merge --no-ff feat/recruitment-phase-1 -m "Merge branch 'feat/recruitment-phase-1' — admin document configuration"
```

- [ ] **Step 4: Deploy to production**

```bash
cd ohcs-website
npx wrangler pages deploy out --project-name=ohcs --branch=master
```

Expected: deploy completes; `https://ohcs.pages.dev` updated.

- [ ] **Step 5: Verify production**

```bash
sleep 20 && curl -s -H "X-Admin-User-Email: admin@ohcs.gov.gh" -H "X-Admin-User-Role: super_admin" https://ohcs.pages.dev/api/admin/document-types | jq '.data | length'
```

Expected: `15`.

- [ ] **Step 6: Push and clean up**

```bash
git push origin master
git branch -d feat/recruitment-phase-1
```

---

## Done — Exit criteria met

Phase 1 is complete when:

- ✅ D1 has `document_types` (15 seeded rows) and `exercise_document_requirements` tables on production
- ✅ `GET /api/admin/document-types` returns the master library (with admin headers)
- ✅ `POST/PATCH/DELETE` endpoints work for the master library
- ✅ `GET/PUT /api/admin/exercises/[id]/requirements` works for any exercise id
- ✅ `/admin/recruitment/document-types/` page renders the library and supports CRUD
- ✅ `/admin/recruitment/exercise-documents/?exerciseId=ex-001` page works and saves requirements
- ✅ "Preview as Applicant" modal renders the dynamic Step 4 view with conditional-trigger toggles
- ✅ "Configure Documents" link appears on each exercise card
- ✅ Production health (`https://ohcs.pages.dev/api/health`) still returns `200 ok`
- ✅ Full test suite passes; type-check clean; build succeeds
- ✅ Every admin endpoint file contains the SECURITY disclosure comment

The next plan (Phase 2) builds magic-link auth and the applicant form skeleton on this foundation.
