# Recruitment Phase 0 — Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Cloudflare Pages Functions, D1, R2, Workers AI, and email infrastructure that the entire recruitment system will use, ending with a working `/api/health` endpoint that confirms every binding works in production.

**Architecture:** API endpoints are implemented as **Cloudflare Pages Functions** in a `functions/` directory at the project root (separate from Next.js routes — the site uses `output: "export"` so Next.js API routes are not viable). D1 stores all relational data, R2 stores uploaded files, Workers AI handles document verification, and MailChannels sends transactional email. A single `wrangler.toml` declares all bindings.

**Tech Stack:** Cloudflare Pages, Cloudflare Pages Functions, Cloudflare D1, Cloudflare R2, Cloudflare Workers AI, MailChannels (with Resend as fallback), Vitest, TypeScript strict, Node.js 20+, Wrangler CLI v3+.

**Spec reference:** `docs/superpowers/specs/2026-04-21-recruitment-document-requirements-design.md` § 11 Phase 0.

---

## File Structure

Files this plan creates or modifies (relative to repo root):

| Path | Responsibility |
|---|---|
| `ohcs-website/wrangler.toml` | Cloudflare bindings (D1, R2, AI), env vars, build config |
| `ohcs-website/functions/api/health.ts` | Pages Function: `GET /api/health` — runtime self-check |
| `ohcs-website/functions/_shared/types.ts` | Shared `Env` type with all binding declarations |
| `ohcs-website/functions/_shared/json.ts` | Helper for typed JSON responses |
| `ohcs-website/functions/_shared/email.ts` | MailChannels send helper (used in later phases too) |
| `ohcs-website/migrations/0001_initial_meta.sql` | First D1 migration: `_migrations` tracking table |
| `ohcs-website/scripts/migrate.ts` | Migration runner (executes SQL files in order) |
| `ohcs-website/tests/functions/health.test.ts` | Vitest unit test for the health endpoint |
| `ohcs-website/tests/functions/_helpers/mock-env.ts` | Test helper that constructs a mock `Env` |
| `ohcs-website/package.json` | Add scripts: `migrate`, `migrate:remote`, `pages:dev` |
| `ohcs-website/.dev.vars.example` | Template for local secrets (committed; real `.dev.vars` ignored) |
| `ohcs-website/.gitignore` | Ignore `.dev.vars` and `.wrangler/state/` |

---

## Prerequisites

The implementing engineer must have:

- Node.js 20+ and npm installed
- Cloudflare account with access to the `ohcs` Pages project (already deployed at `ohcs.pages.dev`)
- `wrangler` CLI authenticated: run `npx wrangler login` once and confirm with `npx wrangler whoami`
- Permission to create D1 databases and R2 buckets in the OHCS Cloudflare account
- DNS access for `ohcs.gov.gh` (only needed for the MailChannels DKIM/SPF step at the end — can be deferred if blocked)

---

## Task 1: Add Wrangler and Cloudflare types as dev dependencies

**Files:**
- Modify: `ohcs-website/package.json`

- [ ] **Step 1: Add the dependencies**

```bash
cd ohcs-website
npm install --save-dev wrangler@^3.85.0 @cloudflare/workers-types@^4.20251020.0
```

- [ ] **Step 2: Verify install**

Run: `npx wrangler --version`
Expected: prints something like `⛅️ wrangler 3.x.x`

Run: `npx tsc --noEmit`
Expected: no errors (the new types should not break existing build)

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/package.json ohcs-website/package-lock.json
git commit -m "chore(recruitment): add wrangler and workers-types"
```

---

## Task 2: Create wrangler.toml with placeholder bindings

We declare all the bindings the recruitment system will need. The actual D1 and R2 resources are created in later tasks; this file is updated with their real IDs as we go.

**Files:**
- Create: `ohcs-website/wrangler.toml`

- [ ] **Step 1: Create the file**

```toml
# Cloudflare Pages project configuration
name = "ohcs"
pages_build_output_dir = ".vercel/output/static"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

# ──────────────────────────────────────────────────────────────────────
# Production (default) environment
# ──────────────────────────────────────────────────────────────────────

# D1 database (relational data)
[[d1_databases]]
binding = "DB"
database_name = "ohcs-recruitment"
database_id = "REPLACE_WITH_REAL_ID_IN_TASK_3"

# R2 bucket (uploaded files)
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "ohcs-recruitment-uploads"

# Workers AI binding (document sanity checks)
[ai]
binding = "AI"

# Non-secret env vars
[vars]
APP_NAME = "OHCS Recruitment"
APP_ENV = "production"
EMAIL_FROM = "noreply@ohcs.gov.gh"
EMAIL_FROM_NAME = "OHCS Recruitment"

# ──────────────────────────────────────────────────────────────────────
# Preview environment (Cloudflare Pages preview deployments)
# ──────────────────────────────────────────────────────────────────────
[env.preview]

[env.preview.vars]
APP_NAME = "OHCS Recruitment (Preview)"
APP_ENV = "preview"
EMAIL_FROM = "noreply@ohcs.gov.gh"
EMAIL_FROM_NAME = "OHCS Recruitment (Preview)"
```

- [ ] **Step 2: Verify wrangler can parse it**

Run: `npx wrangler pages deployment list --project-name=ohcs 2>&1 | head -3`
Expected: either lists deployments OR prints an auth error (auth error is OK; what matters is wrangler.toml itself parses without complaint)

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/wrangler.toml
git commit -m "feat(recruitment): add wrangler.toml with D1/R2/AI bindings"
```

---

## Task 3: Create the D1 database and capture its ID

This step requires running a wrangler command that creates a real D1 database in the Cloudflare account. The output includes a `database_id` UUID that must be pasted into `wrangler.toml`.

**Files:**
- Modify: `ohcs-website/wrangler.toml`

- [ ] **Step 1: Create the database**

Run from `ohcs-website/`:

```bash
npx wrangler d1 create ohcs-recruitment
```

Expected output (real UUID will differ):

```
✅ Successfully created DB 'ohcs-recruitment'

[[d1_databases]]
binding = "DB"
database_name = "ohcs-recruitment"
database_id = "abc12345-6789-abcd-ef01-234567890abc"
```

Copy the `database_id` value.

- [ ] **Step 2: Paste the real ID into wrangler.toml**

Open `ohcs-website/wrangler.toml` and replace `REPLACE_WITH_REAL_ID_IN_TASK_3` with the real UUID from Step 1.

- [ ] **Step 3: Verify the database is reachable**

```bash
npx wrangler d1 execute ohcs-recruitment --command="SELECT 1 as ok"
```

Expected output ends with: `┌────┐ │ ok │ ├────┤ │ 1  │ └────┘`

- [ ] **Step 4: Commit**

```bash
git add ohcs-website/wrangler.toml
git commit -m "feat(recruitment): wire D1 database id into wrangler config"
```

---

## Task 4: Create the R2 bucket and verify it

**Files:** none (R2 buckets are created via CLI; the binding in `wrangler.toml` from Task 2 already references the bucket name).

- [ ] **Step 1: Create the bucket**

Run from `ohcs-website/`:

```bash
npx wrangler r2 bucket create ohcs-recruitment-uploads
```

Expected: `✅ Created bucket 'ohcs-recruitment-uploads'`

- [ ] **Step 2: Verify the bucket exists**

```bash
npx wrangler r2 bucket list
```

Expected: the output includes a line containing `ohcs-recruitment-uploads`.

- [ ] **Step 3: Add lifecycle rule (auto-delete files older than 7 years)**

Create a temporary file `lifecycle.json` in `ohcs-website/` with this exact content:

```json
{
  "rules": [
    {
      "id": "auto-delete-after-7-years",
      "enabled": true,
      "conditions": {
        "prefix": ""
      },
      "deleteObjectsTransition": {
        "condition": {
          "type": "Age",
          "maxAge": 220752000
        }
      }
    }
  ]
}
```

(220752000 seconds = 7 × 365.25 × 24 × 3600, rounded.)

Apply it:

```bash
npx wrangler r2 bucket lifecycle put ohcs-recruitment-uploads --file=lifecycle.json
```

Expected: `✅ Updated lifecycle rules for 'ohcs-recruitment-uploads'`

Then delete the temporary file:

```bash
rm lifecycle.json
```

- [ ] **Step 4: Verify the lifecycle rule is set**

```bash
npx wrangler r2 bucket lifecycle list ohcs-recruitment-uploads
```

Expected: output includes `auto-delete-after-7-years` and `Age 220752000`.

No commit needed for this task — bucket and lifecycle are remote state, not in the repo.

---

## Task 5: Add `.gitignore` and `.dev.vars.example`

Local development uses `.dev.vars` for secrets (e.g. eventually for Resend API key). It must never be committed.

**Files:**
- Create: `ohcs-website/.dev.vars.example`
- Modify: `ohcs-website/.gitignore`

- [ ] **Step 1: Create `.dev.vars.example`**

```
# Copy this file to `.dev.vars` and fill in real values for local dev.
# `.dev.vars` is gitignored.

# Optional: only needed if MailChannels DKIM is not yet provisioned and
# we fall back to Resend. Get key from: https://resend.com/api-keys
RESEND_API_KEY=
```

- [ ] **Step 2: Append to `.gitignore`**

Read `ohcs-website/.gitignore` first to confirm current content; then add these lines at the bottom (only if not already present):

```
# Cloudflare local dev secrets and state
.dev.vars
.wrangler/state/
```

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/.dev.vars.example ohcs-website/.gitignore
git commit -m "chore(recruitment): gitignore .dev.vars and wrangler state"
```

---

## Task 6: Create the `_shared` types and JSON helper

Pages Functions use a typed `Env` interface to access bindings. We define it once and reuse it across every function.

**Files:**
- Create: `ohcs-website/functions/_shared/types.ts`
- Create: `ohcs-website/functions/_shared/json.ts`

- [ ] **Step 1: Create `types.ts`**

```typescript
/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  AI: Ai;
  APP_NAME: string;
  APP_ENV: 'production' | 'preview' | 'development';
  EMAIL_FROM: string;
  EMAIL_FROM_NAME: string;
  RESEND_API_KEY?: string;
}

export type PagesFunction<E = Env, P extends string = string> = (context: {
  request: Request;
  env: E;
  params: Record<P, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  data: Record<string, unknown>;
}) => Response | Promise<Response>;
```

- [ ] **Step 2: Create `json.ts`**

```typescript
export function json<T>(data: T, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers ?? {}),
    },
  });
}
```

- [ ] **Step 3: Verify types compile**

Run from `ohcs-website/`: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add ohcs-website/functions/_shared/types.ts ohcs-website/functions/_shared/json.ts
git commit -m "feat(recruitment): add shared Env type and json helper"
```

---

## Task 7: Write a failing test for the health endpoint

Following TDD: test first, fail, then implement.

**Files:**
- Create: `ohcs-website/tests/functions/_helpers/mock-env.ts`
- Create: `ohcs-website/tests/functions/health.test.ts`

- [ ] **Step 1: Create the mock env helper**

```typescript
// ohcs-website/tests/functions/_helpers/mock-env.ts
import { vi } from 'vitest';
import type { Env } from '../../../functions/_shared/types';

export interface MockEnvOverrides {
  d1Healthy?: boolean;
  r2Healthy?: boolean;
  aiHealthy?: boolean;
}

export function mockEnv(o: MockEnvOverrides = {}): Env {
  const { d1Healthy = true, r2Healthy = true, aiHealthy = true } = o;

  const db = {
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
    DB: db,
    UPLOADS: uploads,
    AI: ai,
    APP_NAME: 'OHCS Recruitment (Test)',
    APP_ENV: 'development',
    EMAIL_FROM: 'noreply@example.com',
    EMAIL_FROM_NAME: 'Test',
  };
}
```

- [ ] **Step 2: Create the failing test**

```typescript
// ohcs-website/tests/functions/health.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../functions/api/health';
import { mockEnv } from './_helpers/mock-env';

function makeContext(env = mockEnv()) {
  return {
    request: new Request('https://example.com/api/health'),
    env,
    params: {},
    waitUntil: () => {},
    data: {},
  };
}

describe('GET /api/health', () => {
  it('returns 200 with status:ok when all bindings are healthy', async () => {
    const res = await onRequestGet(makeContext());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.checks).toEqual({
      d1: 'ok',
      r2: 'ok',
      workers_ai: 'ok',
    });
    expect(body.app).toBe('OHCS Recruitment (Test)');
    expect(body.env).toBe('development');
  });

  it('returns 503 with status:degraded when D1 is unhealthy', async () => {
    const env = mockEnv({ d1Healthy: false });
    const res = await onRequestGet(makeContext(env));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe('degraded');
    expect(body.checks.d1).toBe('error');
    expect(body.checks.r2).toBe('ok');
    expect(body.checks.workers_ai).toBe('ok');
  });

  it('returns 503 when R2 is unhealthy', async () => {
    const env = mockEnv({ r2Healthy: false });
    const res = await onRequestGet(makeContext(env));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.checks.r2).toBe('error');
  });

  it('returns 503 when AI is unhealthy', async () => {
    const env = mockEnv({ aiHealthy: false });
    const res = await onRequestGet(makeContext(env));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.checks.workers_ai).toBe('error');
  });

  it('sets cache-control: no-store', async () => {
    const res = await onRequestGet(makeContext());
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
```

- [ ] **Step 3: Run the test and verify it fails**

```bash
cd ohcs-website
npx vitest run tests/functions/health.test.ts
```

Expected: all 5 tests FAIL with an error like `Cannot find module '../../functions/api/health'` (because we haven't written the handler yet).

- [ ] **Step 4: Commit the failing tests**

```bash
git add ohcs-website/tests/functions/
git commit -m "test(recruitment): add failing tests for /api/health"
```

---

## Task 8: Implement `/api/health` to make the tests pass

Each binding gets a tiny "is this alive" probe:
- **D1**: `SELECT 1 as ok`
- **R2**: `head()` for a sentinel key (returns `null` if not found, which is fine — we just want the call to not throw)
- **AI**: a 1-token llama call (cheapest possible)

**Files:**
- Create: `ohcs-website/functions/api/health.ts`

- [ ] **Step 1: Write the implementation**

```typescript
import type { PagesFunction, Env } from '../_shared/types';
import { json } from '../_shared/json';

type CheckStatus = 'ok' | 'error';

async function checkD1(env: Env): Promise<CheckStatus> {
  try {
    await env.DB.prepare('SELECT 1 as ok').first();
    return 'ok';
  } catch {
    return 'error';
  }
}

async function checkR2(env: Env): Promise<CheckStatus> {
  try {
    await env.UPLOADS.head('__healthcheck__');
    return 'ok';
  } catch {
    return 'error';
  }
}

async function checkAI(env: Env): Promise<CheckStatus> {
  try {
    await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: 'ok',
      max_tokens: 1,
    });
    return 'ok';
  } catch {
    return 'error';
  }
}

export const onRequestGet: PagesFunction = async ({ env }) => {
  const [d1, r2, workers_ai] = await Promise.all([
    checkD1(env),
    checkR2(env),
    checkAI(env),
  ]);

  const allOk = d1 === 'ok' && r2 === 'ok' && workers_ai === 'ok';

  return json(
    {
      status: allOk ? 'ok' : 'degraded',
      checks: { d1, r2, workers_ai },
      app: env.APP_NAME,
      env: env.APP_ENV,
      version: '1.0.0',
      ts: Date.now(),
    },
    { status: allOk ? 200 : 503 },
  );
};
```

- [ ] **Step 2: Run the tests and verify they pass**

```bash
cd ohcs-website
npx vitest run tests/functions/health.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add ohcs-website/functions/api/health.ts
git commit -m "feat(recruitment): implement /api/health endpoint"
```

---

## Task 9: Add the migration runner

Migrations are SQL files in `migrations/` named `NNNN_<slug>.sql` (zero-padded). The runner tracks applied migrations in a `_migrations` table and applies any new ones in order. Works against both local D1 (via wrangler) and remote.

**Files:**
- Create: `ohcs-website/migrations/0001_initial_meta.sql`
- Create: `ohcs-website/scripts/migrate.ts`
- Modify: `ohcs-website/package.json`

- [ ] **Step 1: Create the first migration**

```sql
-- ohcs-website/migrations/0001_initial_meta.sql
CREATE TABLE IF NOT EXISTS _migrations (
  id           TEXT PRIMARY KEY,
  applied_at   INTEGER NOT NULL
);
```

- [ ] **Step 2: Create the runner**

```typescript
// ohcs-website/scripts/migrate.ts
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const MIGRATIONS_DIR = join(REPO_ROOT, 'migrations');
const DB_NAME = 'ohcs-recruitment';

const remote = process.argv.includes('--remote');
const flag = remote ? '--remote' : '--local';

function listMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function applied(): Set<string> {
  try {
    const out = execSync(
      `npx wrangler d1 execute ${DB_NAME} ${flag} --json --command="SELECT id FROM _migrations"`,
      { encoding: 'utf8', cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const parsed = JSON.parse(out);
    const rows: Array<{ id: string }> = parsed[0]?.results ?? [];
    return new Set(rows.map((r) => r.id));
  } catch {
    // Table doesn't exist yet — first run
    return new Set();
  }
}

function apply(file: string): void {
  const path = join(MIGRATIONS_DIR, file);
  const sql = readFileSync(path, 'utf8');
  console.log(`→ applying ${file}`);
  execSync(
    `npx wrangler d1 execute ${DB_NAME} ${flag} --file="${path}"`,
    { cwd: REPO_ROOT, stdio: 'inherit' },
  );
  // Record it
  execSync(
    `npx wrangler d1 execute ${DB_NAME} ${flag} --command="INSERT INTO _migrations (id, applied_at) VALUES ('${file}', ${Date.now()})"`,
    { cwd: REPO_ROOT, stdio: 'inherit' },
  );
  // Suppress unused warning
  void sql;
}

function main(): void {
  console.log(`Migrating ${DB_NAME} (${remote ? 'REMOTE' : 'LOCAL'})`);
  const all = listMigrations();
  if (all.length === 0) {
    console.log('No migration files found.');
    return;
  }
  const done = applied();
  const pending = all.filter((f) => !done.has(f));
  if (pending.length === 0) {
    console.log('All migrations already applied.');
    return;
  }
  for (const file of pending) {
    apply(file);
  }
  console.log(`✅ Applied ${pending.length} migration(s).`);
}

main();
```

- [ ] **Step 3: Add scripts to `package.json`**

Open `ohcs-website/package.json` and add these three lines to the `"scripts"` block (preserve existing scripts):

```json
"migrate": "tsx scripts/migrate.ts",
"migrate:remote": "tsx scripts/migrate.ts --remote",
"pages:dev": "npx wrangler pages dev .vercel/output/static --d1=DB --r2=UPLOADS --ai=AI"
```

- [ ] **Step 4: Install `tsx` for running TypeScript scripts**

```bash
cd ohcs-website
npm install --save-dev tsx@^4.19.0
```

- [ ] **Step 5: Run the migration locally**

```bash
npm run migrate
```

Expected output ends with `✅ Applied 1 migration(s).` (and no errors).

- [ ] **Step 6: Verify the table exists**

```bash
npx wrangler d1 execute ohcs-recruitment --local --command="SELECT id FROM _migrations"
```

Expected: a table showing one row with `id = 0001_initial_meta.sql`.

- [ ] **Step 7: Re-run migrate to verify idempotency**

```bash
npm run migrate
```

Expected: prints `All migrations already applied.` and exits 0.

- [ ] **Step 8: Commit**

```bash
git add ohcs-website/migrations/ ohcs-website/scripts/ ohcs-website/package.json ohcs-website/package-lock.json
git commit -m "feat(recruitment): add D1 migration runner and initial _migrations table"
```

---

## Task 10: Apply the initial migration to the remote D1

The local migration only touches the local SQLite file in `.wrangler/state/`. Remote D1 is the production database — apply the same migration there.

- [ ] **Step 1: Run remote migration**

```bash
cd ohcs-website
npm run migrate:remote
```

Expected output ends with `✅ Applied 1 migration(s).` (and no errors).

- [ ] **Step 2: Verify on remote**

```bash
npx wrangler d1 execute ohcs-recruitment --remote --command="SELECT id FROM _migrations"
```

Expected: one row with `id = 0001_initial_meta.sql`.

No commit needed — remote DB state is not in the repo.

---

## Task 11: Create the email helper (MailChannels with Resend fallback)

We add this in Phase 0 because the auth phase will need it immediately. It is a thin wrapper around `fetch` — no third-party SDK needed for either provider.

**Files:**
- Create: `ohcs-website/functions/_shared/email.ts`
- Create: `ohcs-website/tests/functions/_shared/email.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// ohcs-website/tests/functions/_shared/email.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendEmail } from '../../../functions/_shared/email';
import { mockEnv } from '../_helpers/mock-env';

describe('sendEmail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to MailChannels with the expected payload', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(null, { status: 202 }),
    );

    await sendEmail(mockEnv(), {
      to: 'kofi@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.mailchannels.net/tx/v1/send');
    const body = JSON.parse(init.body);
    expect(body.personalizations[0].to[0].email).toBe('kofi@example.com');
    expect(body.from.email).toBe('noreply@example.com');
    expect(body.subject).toBe('Hello');
    expect(body.content[0].type).toBe('text/html');
    expect(body.content[0].value).toBe('<p>Hi</p>');
  });

  it('falls back to Resend on MailChannels 4xx if RESEND_API_KEY is set', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(new Response('rejected', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'r1' }), { status: 200 }));

    const env = { ...mockEnv(), RESEND_API_KEY: 'test-key' };
    await sendEmail(env, {
      to: 'kofi@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.resend.com/emails');
    const resendInit = fetchMock.mock.calls[1][1];
    expect(resendInit.headers.Authorization).toBe('Bearer test-key');
  });

  it('throws when both providers fail', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(new Response('mailchannels failed', { status: 500 }))
      .mockResolvedValueOnce(new Response('resend failed', { status: 500 }));

    const env = { ...mockEnv(), RESEND_API_KEY: 'test-key' };
    await expect(
      sendEmail(env, { to: 'kofi@example.com', subject: 'X', html: '<p>X</p>' }),
    ).rejects.toThrow(/email send failed/i);
  });

  it('throws when MailChannels fails and Resend is not configured', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response('failed', { status: 500 }));

    await expect(
      sendEmail(mockEnv(), { to: 'kofi@example.com', subject: 'X', html: '<p>X</p>' }),
    ).rejects.toThrow(/mailchannels failed/i);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

```bash
cd ohcs-website
npx vitest run tests/functions/_shared/email.test.ts
```

Expected: tests FAIL with `Cannot find module '../../../functions/_shared/email'`.

- [ ] **Step 3: Implement the helper**

```typescript
// ohcs-website/functions/_shared/email.ts
import type { Env } from './types';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const MAILCHANNELS_URL = 'https://api.mailchannels.net/tx/v1/send';
const RESEND_URL = 'https://api.resend.com/emails';

async function sendViaMailChannels(env: Env, input: SendEmailInput): Promise<Response> {
  const body = {
    personalizations: [{ to: [{ email: input.to }] }],
    from: { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
    subject: input.subject,
    content: [
      { type: 'text/html', value: input.html },
      ...(input.text ? [{ type: 'text/plain', value: input.text }] : []),
    ],
  };

  return fetch(MAILCHANNELS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function sendViaResend(env: Env, input: SendEmailInput): Promise<Response> {
  return fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
    }),
  });
}

export async function sendEmail(env: Env, input: SendEmailInput): Promise<void> {
  const mc = await sendViaMailChannels(env, input);
  if (mc.ok) return;

  const mcText = await mc.text();
  if (!env.RESEND_API_KEY) {
    throw new Error(`mailchannels failed (${mc.status}): ${mcText}`);
  }

  const rs = await sendViaResend(env, input);
  if (rs.ok) return;

  const rsText = await rs.text();
  throw new Error(
    `email send failed: mailchannels=${mc.status} ${mcText} | resend=${rs.status} ${rsText}`,
  );
}
```

- [ ] **Step 4: Run the tests, verify they pass**

```bash
cd ohcs-website
npx vitest run tests/functions/_shared/email.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/_shared/email.ts ohcs-website/tests/functions/_shared/
git commit -m "feat(recruitment): add MailChannels email helper with Resend fallback"
```

---

## Task 12: Smoke-test `/api/health` against local pages dev

This task verifies the wiring end-to-end on the developer's machine before deploying. It's a manual smoke test — no automated assertion — because the goal is to confirm the bindings actually plumb through wrangler's local emulation.

- [ ] **Step 1: Build the site and start pages dev**

In one terminal, from `ohcs-website/`:

```bash
npm run pages:build
```

Expected: completes without errors and writes `.vercel/output/static`.

Then in the same terminal:

```bash
npm run pages:dev
```

Expected: pages dev starts and prints something like `[wrangler:info] Ready on http://localhost:8788`.

- [ ] **Step 2: Curl the health endpoint**

In a second terminal:

```bash
curl -s http://localhost:8788/api/health | jq
```

Expected JSON output:

```json
{
  "status": "ok",
  "checks": { "d1": "ok", "r2": "ok", "workers_ai": "ok" },
  "app": "OHCS Recruitment",
  "env": "production",
  "version": "1.0.0",
  "ts": 1745262134567
}
```

If `workers_ai` is `error` locally, that is normal — Workers AI is not always emulated locally. We will re-verify against production in Task 13.

If `d1` or `r2` is `error`, stop and debug (the bindings are misconfigured in `wrangler.toml`).

- [ ] **Step 3: Stop pages dev**

In the first terminal: press `Ctrl+C`.

No commit needed — this is a verification step.

---

## Task 13: Deploy and verify against production

The live deployment URL is `https://ohcs.pages.dev`. After this task ships, that URL will serve `/api/health`.

- [ ] **Step 1: Build for production**

```bash
cd ohcs-website
npm run pages:build
```

Expected: completes without errors.

- [ ] **Step 2: Deploy to Cloudflare Pages**

```bash
npm run pages:deploy
```

Expected: completes and prints a deployment URL like `https://abc1234.ohcs.pages.dev` (preview) and confirms attachment to the `ohcs` project. The production alias `ohcs.pages.dev` updates within ~30 seconds.

- [ ] **Step 3: Curl production health**

Wait ~30 seconds for the deployment to propagate, then:

```bash
curl -s https://ohcs.pages.dev/api/health | jq
```

Expected: same shape as Task 12 Step 2, but with `"env": "production"` and all three `checks` reporting `"ok"` (Workers AI works in production).

If any check is `error`, do NOT proceed. Investigate by:
- Checking the deployment logs: `npx wrangler pages deployment tail --project-name=ohcs`
- Confirming bindings in the Cloudflare dashboard (Pages → ohcs → Settings → Functions)

- [ ] **Step 4: Confirm response status code**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://ohcs.pages.dev/api/health
```

Expected: `200`.

No commit needed — this is verification only.

---

## Task 14: Document MailChannels DKIM/SPF setup

MailChannels requires the sending domain to publish DKIM and SPF records before transactional email actually delivers. This task is documentation only — the actual DNS change is performed by whoever has access to the `ohcs.gov.gh` zone (likely an OHCS infra contact, not the implementing engineer).

**Files:**
- Create: `ohcs-website/docs/email-setup.md`

- [ ] **Step 1: Write the document**

```markdown
# Email Setup (MailChannels) for OHCS Recruitment

The recruitment system sends transactional email (magic links, status
notifications) via Cloudflare's free MailChannels integration. For the
sender domain `ohcs.gov.gh` to be accepted by MailChannels and not
rejected as spam by recipients, the following DNS records must exist
on the `ohcs.gov.gh` zone.

## 1. SPF record

Add or update the TXT record at the apex `ohcs.gov.gh`:

    v=spf1 a mx include:relay.mailchannels.net ~all

If an SPF record already exists, append `include:relay.mailchannels.net`
into the existing record — do NOT publish two SPF records (RFC 7208
forbids it).

## 2. Domain Lockdown (MailChannels-specific)

To prevent other Cloudflare accounts from sending mail as
`@ohcs.gov.gh`, add this TXT record at `_mailchannels.ohcs.gov.gh`:

    v=mc1 cfid=ohcs.pages.dev

Replace `ohcs.pages.dev` with the actual production hostname if it
ever differs. This is REQUIRED — MailChannels began enforcing it
in 2024.

## 3. DKIM (recommended, not strictly required)

Generate a 2048-bit DKIM keypair (any tool — e.g. `opendkim-genkey`).
Publish the public key as TXT at `mailchannels._domainkey.ohcs.gov.gh`,
and store the private key as a Cloudflare Pages secret named
`DKIM_PRIVATE_KEY` (we will wire this into the email helper in a
future patch).

## Verification

After the DNS records propagate (5–60 minutes), confirm with:

    dig +short TXT ohcs.gov.gh                          # should include relay.mailchannels.net
    dig +short TXT _mailchannels.ohcs.gov.gh            # should include cfid=ohcs.pages.dev

A round-trip test will live at `/admin/recruitment/health` once Phase 6
ships. Until then, MailChannels delivery can be confirmed manually by
sending a test message via the helper (see `functions/_shared/email.ts`).

## Fallback: Resend

If MailChannels rejects the domain (e.g. shared-IP reputation issues),
sign up for Resend (https://resend.com), get an API key, and set it in
Cloudflare Pages env vars as `RESEND_API_KEY`. The email helper
auto-falls back when this var is set and MailChannels returns 4xx/5xx.
```

- [ ] **Step 2: Commit**

```bash
git add ohcs-website/docs/email-setup.md
git commit -m "docs(recruitment): document MailChannels DKIM/SPF setup steps"
```

---

## Task 15: Final pass — full test suite + lint + type-check

Run the entire quality gate before marking Phase 0 complete.

- [ ] **Step 1: Run all tests**

```bash
cd ohcs-website
npm test -- --run
```

Expected: all tests pass (existing ones + new health + email tests).

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no errors. (If lint complains about the new `functions/` directory, add it to the ESLint config in a small follow-up commit; do NOT silence rules.)

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Final verification of production health**

```bash
curl -s https://ohcs.pages.dev/api/health | jq '.status, .checks'
```

Expected output:

```
"ok"
{
  "d1": "ok",
  "r2": "ok",
  "workers_ai": "ok"
}
```

- [ ] **Step 5: Commit any remaining lint/type fixes (if any)**

If Step 2 or 3 surfaced fixes:

```bash
git add -p     # stage only the relevant fixes
git commit -m "chore(recruitment): lint/type-check fixes for Phase 0"
```

If nothing needs fixing, skip this step.

---

## Done — Exit criteria met

Phase 0 is complete when:

- ✅ `wrangler.toml` declares D1 (`DB`), R2 (`UPLOADS`), and AI (`AI`) bindings
- ✅ D1 database `ohcs-recruitment` exists in production with the `_migrations` table
- ✅ R2 bucket `ohcs-recruitment-uploads` exists with a 7-year lifecycle rule
- ✅ `functions/api/health.ts` is deployed and `https://ohcs.pages.dev/api/health` returns `200 {status: "ok", checks: {d1: "ok", r2: "ok", workers_ai: "ok"}}`
- ✅ Migration runner works locally and remotely (`npm run migrate` and `npm run migrate:remote`)
- ✅ Email helper (MailChannels + Resend fallback) is implemented and unit-tested
- ✅ MailChannels DNS setup documented in `docs/email-setup.md` (handed to OHCS infra)
- ✅ `npm test`, `npm run lint`, `npm run type-check` all pass

The next plan (Phase 1) builds the admin master-library and per-exercise document-requirements UI on top of this foundation.
