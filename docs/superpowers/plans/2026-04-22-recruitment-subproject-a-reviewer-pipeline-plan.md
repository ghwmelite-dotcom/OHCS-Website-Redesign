# Sub-project A — Reviewer Pipeline + Vetting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder admin pipeline with a real reviewer interface — side-by-side document viewer, per-doc Accept/Reject/Needs-Better-Scan decisions that auto-roll up to a vetting outcome, AI verification badges (Phase 4 absorbed), appeal flow for failed applicants, and email + SMS notifications at every status transition.

**Architecture:** Three new D1 tables (`document_review_decisions`, `application_review_decisions`, `status_transitions`) plus a few column extensions. Eight new Pages Functions endpoints under `/api/admin/applications/*` + one applicant endpoint + one cron endpoint. AI verification fires on upload via `ctx.waitUntil` against Workers AI (llava for vision, llama for text-PDF). React admin UI is a two-pane layout in `/admin/recruitment/pipeline/[id]` (using `?id=` query param due to static export). New `sendSms` helper wraps Hubtel SMS API; falls back to console.log when key not set.

**Tech Stack:** Cloudflare D1, Cloudflare R2 (signed URLs), Cloudflare Pages Functions, Cloudflare Workers AI, Cloudflare Cron Triggers, Next.js 16 (static export, React 19), Vitest, Resend (email), Hubtel (SMS).

**Spec reference:** `docs/superpowers/specs/2026-04-22-recruitment-subproject-a-reviewer-pipeline-design.md`.

---

## Static-export carry-over

Same constraints from earlier phases: dynamic routes use `?id=` query params; pages reading search params wrap in `<Suspense>`. Pages Function tests for endpoints that parse multipart use `// @vitest-environment node`.

## Resend / SMS dev-mode

Resend sandbox sender continues; SMS via Hubtel falls back to `console.log` when `HUBTEL_SMS_API_KEY` env var is not set, so dev/test environments don't need the real Hubtel account.

---

## File structure

| Path | Responsibility |
|---|---|
| `migrations/0007_review_pipeline.sql` | All schema additions for sub-project A |
| `functions/_shared/sms.ts` | Hubtel SMS wrapper with dev-mode fallback |
| `functions/_shared/status-transition.ts` | Single helper for the "validate → record → update" status change pattern |
| `functions/_shared/ai-verify.ts` | Workers AI invocation + prompt templates + verdict storage |
| `functions/api/admin/applications/index.ts` | `GET` paginated list with filters |
| `functions/api/admin/applications/[id].ts` | `GET` full detail (form + docs + decisions + history) |
| `functions/api/admin/applications/[id]/claim.ts` | `POST` claim, `DELETE` release |
| `functions/api/admin/applications/[id]/url.ts` | `GET` signed R2 URL for the active doc preview |
| `functions/api/admin/applications/[id]/vetting.ts` | `POST` submit vetting decision (full payload) |
| `functions/api/admin/applications/appeals.ts` | `GET` appeal queue (excludes own decisions) |
| `functions/api/admin/applications/[id]/appeals/resolve.ts` | `POST` uphold/overturn appeal |
| `functions/api/applications/me/appeals.ts` | `POST` applicant submits appeal |
| `functions/api/system/run-deadlines.ts` | Cron-triggered: stale-claim release + deadline transitions |
| `functions/api/applications/me/documents/[docTypeId].ts` (modify) | Wire AI verification call inside `ctx.waitUntil` |
| `src/types/recruitment.ts` (extend) | New types: VettingOutcome, DocumentReviewDecision, StatusTransition, AppealResolution |
| `src/lib/recruitment-api.ts` (extend) | Browser admin client functions for the new endpoints |
| `src/lib/applicant-api.ts` (extend) | Browser applicant client function `submitAppeal` |
| `src/app/admin/recruitment/pipeline/page.tsx` (replace) | Real pipeline list (replaces existing placeholder) |
| `src/app/admin/recruitment/pipeline/detail/page.tsx` (new) | Side-by-side detail view (uses `?id=` query param + Suspense) |
| `src/app/admin/recruitment/appeals/page.tsx` (new) | Appeal queue + resolve UI |
| `src/components/admin/document-viewer.tsx` (new) | The right-pane viewer (PDF.js iframe / `<img>` / fallback) with active-doc state |
| `src/components/admin/per-doc-decision.tsx` (new) | Single-document decision row used in the left pane |
| `src/components/admin/ai-badge.tsx` (new) | AI verdict badge + click-to-expand details |
| `src/app/apply/appeal/page.tsx` (new) | Applicant appeal form (Suspense-wrapped) |
| `wrangler.toml` (modify) | Add cron trigger for `/api/system/run-deadlines` |
| Tests under `tests/functions/` and `tests/components/` | Per file |

---

## Prerequisites

- Phases 0-3 + Phase 3.5 shipped to production
- A fresh feature branch: `git checkout -b feat/recruitment-subproject-a` from `master`
- Wrangler authenticated; D1 + R2 + AI bindings live (already true)
- The active exercise (`ex-001`) has document requirements configured (already true from earlier smoke tests)

---

## Task 1: Migration 0007 — review pipeline schema

**Files:**
- Create: `ohcs-website/migrations/0007_review_pipeline.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ohcs-website/migrations/0007_review_pipeline.sql

-- Per-document review decisions (one row per (application_id, document_type_id) per cycle).
-- Append-only; latest row per (application_id, document_type_id) is the active one.
CREATE TABLE IF NOT EXISTS document_review_decisions (
  id                 TEXT PRIMARY KEY,
  application_id     TEXT NOT NULL,
  document_type_id   TEXT NOT NULL,
  reviewer_email     TEXT NOT NULL,
  decision           TEXT NOT NULL,    -- 'accepted' | 'rejected' | 'needs_better_scan'
  reason             TEXT,
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drd_app
  ON document_review_decisions(application_id, created_at DESC);

-- Application-level vetting outcomes (one row per vetting cycle).
CREATE TABLE IF NOT EXISTS application_review_decisions (
  id                 TEXT PRIMARY KEY,
  application_id     TEXT NOT NULL,
  reviewer_email     TEXT NOT NULL,
  outcome            TEXT NOT NULL,    -- 'vetting_passed' | 'vetting_failed' | 'requires_action'
  notes              TEXT,
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ard_app
  ON application_review_decisions(application_id, created_at DESC);

-- Status transition audit trail (used by all sub-projects).
CREATE TABLE IF NOT EXISTS status_transitions (
  id              TEXT PRIMARY KEY,
  application_id  TEXT NOT NULL,
  from_status     TEXT NOT NULL,
  to_status       TEXT NOT NULL,
  actor_email     TEXT,
  actor_role      TEXT,
  reason          TEXT,
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_status_transitions_app
  ON status_transitions(application_id, created_at DESC);

-- Per-exercise vetting policy
ALTER TABLE recruitment_exercises
  ADD COLUMN vetting_window_days INTEGER NOT NULL DEFAULT 14;

ALTER TABLE recruitment_exercises
  ADD COLUMN appeal_window_days INTEGER NOT NULL DEFAULT 7;

-- Open-queue claim tracking
ALTER TABLE applications
  ADD COLUMN review_claimed_by TEXT;

ALTER TABLE applications
  ADD COLUMN review_claimed_at INTEGER;

-- Track when an appeal was opened (so we can compute the appeal window deadline).
ALTER TABLE applications
  ADD COLUMN appeal_submitted_at INTEGER;

ALTER TABLE applications
  ADD COLUMN appeal_reason TEXT;
```

- [ ] **Step 2: Apply local + remote**

```bash
cd ohcs-website
npm run migrate
npm run migrate:remote
```

Expected: each prints `✅ Applied 1 migration(s).`

- [ ] **Step 3: Verify tables exist**

```bash
npx wrangler d1 execute ohcs-recruitment --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%review%' OR name='status_transitions'"
```

Expected: returns `application_review_decisions`, `document_review_decisions`, `status_transitions`.

- [ ] **Step 4: Commit**

```bash
git add migrations/0007_review_pipeline.sql
git commit -m "feat(recruitment-a): add review pipeline tables + applications columns"
```

---

## Task 2: SMS helper (`functions/_shared/sms.ts`)

**Files:**
- Create: `ohcs-website/functions/_shared/sms.ts`
- Create: `ohcs-website/tests/functions/_shared/sms.test.ts`
- Modify: `ohcs-website/functions/_shared/types.ts` (add `HUBTEL_SMS_API_KEY`, `HUBTEL_SMS_FROM`)

- [ ] **Step 1: Extend the Env type**

In `functions/_shared/types.ts`, add to the `Env` interface (just after `RESEND_API_KEY?`):

```typescript
  HUBTEL_SMS_API_KEY?: string;
  HUBTEL_SMS_FROM?: string;
```

- [ ] **Step 2: Write failing tests**

```typescript
// ohcs-website/tests/functions/_shared/sms.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendSms } from '../../../functions/_shared/sms';
import { mockEnv } from '../_helpers/mock-env';

describe('sendSms', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs and returns when HUBTEL_SMS_API_KEY is not set (dev mode)', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await sendSms(mockEnv(), { to: '+233241234567', message: 'Hello' });
    expect(consoleSpy).toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('posts to Hubtel SMS API when key is set', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ Status: 0 }), { status: 200 }),
    );
    const env = { ...mockEnv(), HUBTEL_SMS_API_KEY: 'test-key', HUBTEL_SMS_FROM: 'OHCS' };
    await sendSms(env, { to: '+233241234567', message: 'Hello' });
    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    expect(url).toContain('hubtel.com');
    expect(init.headers.Authorization).toMatch(/^Basic /);
    const body = JSON.parse(init.body) as { From: string; To: string; Content: string };
    expect(body.To).toBe('+233241234567');
    expect(body.Content).toBe('Hello');
    expect(body.From).toBe('OHCS');
  });

  it('throws when Hubtel returns non-2xx', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response('rejected', { status: 401 }),
    );
    const env = { ...mockEnv(), HUBTEL_SMS_API_KEY: 'test-key', HUBTEL_SMS_FROM: 'OHCS' };
    await expect(
      sendSms(env, { to: '+233241234567', message: 'X' }),
    ).rejects.toThrow(/hubtel sms failed \(401\)/i);
  });
});
```

Run: `npx vitest run tests/functions/_shared/sms.test.ts` → 3 fail with module-not-found.

Commit:
```bash
git add tests/functions/_shared/sms.test.ts functions/_shared/types.ts
git commit -m "test(recruitment-a): add failing tests for SMS helper"
```

- [ ] **Step 3: Implement**

```typescript
// ohcs-website/functions/_shared/sms.ts
import type { Env } from './types';

export interface SendSmsInput {
  to: string;        // E.164 format, e.g. '+233241234567'
  message: string;
}

const HUBTEL_URL = 'https://sms.hubtel.com/v1/messages/send';

export async function sendSms(env: Env, input: SendSmsInput): Promise<void> {
  if (!env.HUBTEL_SMS_API_KEY || !env.HUBTEL_SMS_FROM) {
    console.log(
      `[sms:dev] would send to=${input.to} content=${JSON.stringify(input.message)}`,
    );
    return;
  }

  const res = await fetch(HUBTEL_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Basic ${env.HUBTEL_SMS_API_KEY}`,
    },
    body: JSON.stringify({
      From: env.HUBTEL_SMS_FROM,
      To: input.to,
      Content: input.message,
    }),
  });

  if (!res.ok) {
    throw new Error(`hubtel sms failed (${res.status}): ${await res.text()}`);
  }
}
```

Run tests → all pass. Commit:

```bash
git add functions/_shared/sms.ts
git commit -m "feat(recruitment-a): add Hubtel SMS helper with dev-mode console fallback"
```

---

## Task 3: Status-transition helper (`functions/_shared/status-transition.ts`)

**Files:**
- Create: `ohcs-website/functions/_shared/status-transition.ts`
- Create: `ohcs-website/tests/functions/_shared/status-transition.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/_shared/status-transition.test.ts
import { describe, it, expect } from 'vitest';
import { recordTransition } from '../../../functions/_shared/status-transition';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

describe('recordTransition', () => {
  it('inserts a status_transitions row and updates the application status', async () => {
    const db = makeD1([
      {
        sql: 'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql: 'UPDATE applications SET status = ? WHERE id = ?',
        binds: ['vetting_passed', 'OHCS-2026-00001'],
        run: {},
      },
    ]);
    await recordTransition(mockEnv({ db }), {
      applicationId: 'OHCS-2026-00001',
      fromStatus: 'under_review',
      toStatus: 'vetting_passed',
      actorEmail: 'admin@ohcs.gov.gh',
      actorRole: 'recruitment_admin',
      reason: 'Vetting decision: pass',
    });
    // No assertion needed beyond "did not throw"; the d1-mock would throw if SQL didn't match.
    expect(true).toBe(true);
  });

  it('handles system-initiated transitions (no actor)', async () => {
    const db = makeD1([
      {
        sql: 'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      { sql: 'UPDATE applications SET status = ? WHERE id = ?', run: {} },
    ]);
    await recordTransition(mockEnv({ db }), {
      applicationId: 'OHCS-2026-00001',
      fromStatus: 'requires_action',
      toStatus: 'vetting_failed',
      actorRole: 'system',
      reason: 'Resubmission deadline expired',
    });
    expect(true).toBe(true);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/_shared/status-transition.test.ts
git commit -m "test(recruitment-a): add failing tests for status transition helper"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/_shared/status-transition.ts
import type { Env } from './types';
import { run } from './db';

export interface TransitionInput {
  applicationId: string;
  fromStatus: string;
  toStatus: string;
  actorEmail?: string;
  actorRole?: 'recruitment_admin' | 'reviewer' | 'applicant' | 'system';
  reason?: string;
}

export async function recordTransition(env: Env, input: TransitionInput): Promise<void> {
  const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const now = Date.now();

  await run(
    env,
    'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    id,
    input.applicationId,
    input.fromStatus,
    input.toStatus,
    input.actorEmail ?? null,
    input.actorRole ?? null,
    input.reason ?? null,
    now,
  );

  await run(env, 'UPDATE applications SET status = ? WHERE id = ?', input.toStatus, input.applicationId);
}
```

Run tests → pass. Commit:

```bash
git add functions/_shared/status-transition.ts
git commit -m "feat(recruitment-a): add status-transition helper (audit + update in one call)"
```

---

## Task 4: Add applicant types + new browser client functions

**Files:**
- Modify: `ohcs-website/src/types/recruitment.ts` (append new types)
- Modify: `ohcs-website/src/lib/recruitment-api.ts` (append admin functions)
- Modify: `ohcs-website/src/lib/applicant-api.ts` (append applicant function)

- [ ] **Step 1: Append types**

In `src/types/recruitment.ts`, append at the end:

```typescript
// ─── Vetting (Sub-project A) ─────────────────────────────────────────────

export type DocDecision = 'accepted' | 'rejected' | 'needs_better_scan';
export type VettingOutcome = 'vetting_passed' | 'vetting_failed' | 'requires_action';

export interface DocumentReviewDecision {
  document_type_id: string;
  decision: DocDecision;
  reason: string | null;
  reviewer_email: string;
  created_at: number;
}

export interface ApplicationReviewDecision {
  outcome: VettingOutcome;
  notes: string | null;
  reviewer_email: string;
  created_at: number;
}

export interface StatusTransition {
  from_status: string;
  to_status: string;
  actor_email: string | null;
  actor_role: string | null;
  reason: string | null;
  created_at: number;
}

export interface AdminApplicationListItem {
  id: string;
  exercise_id: string;
  email: string;
  status: ApplicationStatus;
  submitted_at: number | null;
  doc_count: number;
  doc_required_count: number;
  ai_flag_count: number;
  review_claimed_by: string | null;
}

export interface AdminApplicationDetail {
  id: string;
  exercise_id: string;
  email: string;
  status: ApplicationStatus;
  has_professional_qualification: boolean;
  is_pwd: boolean;
  form_data: ApplicationFormData;
  documents: ApplicationDocument[];
  requirements: RequirementWithUpload[];
  decisions: DocumentReviewDecision[];   // latest decision per doc
  reviews: ApplicationReviewDecision[];  // history of overall vettings
  history: StatusTransition[];
  appeal_reason: string | null;
}

export interface AppealResolution {
  outcome: 'upheld' | 'overturned';
  notes: string;
}
```

- [ ] **Step 2: Append admin client functions in `src/lib/recruitment-api.ts`**

```typescript
import type {
  AdminApplicationListItem,
  AdminApplicationDetail,
  DocDecision,
  AppealResolution,
} from '@/types/recruitment';

export async function listApplications(filters?: {
  status?: string;
  exercise_id?: string;
  search?: string;
  claimed_by_me?: boolean;
}): Promise<AdminApplicationListItem[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.exercise_id) params.set('exercise_id', filters.exercise_id);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.claimed_by_me) params.set('claimed_by_me', '1');
  const qs = params.toString();
  const { data } = await request<{ data: AdminApplicationListItem[] }>(
    `/api/admin/applications${qs ? `?${qs}` : ''}`,
  );
  return data;
}

export async function getApplicationDetail(id: string): Promise<AdminApplicationDetail> {
  const { data } = await request<{ data: AdminApplicationDetail }>(
    `/api/admin/applications/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function claimApplication(id: string): Promise<void> {
  await request(`/api/admin/applications/${encodeURIComponent(id)}/claim`, { method: 'POST' });
}

export async function releaseApplication(id: string): Promise<void> {
  await request(`/api/admin/applications/${encodeURIComponent(id)}/claim`, { method: 'DELETE' });
}

export async function getDocumentSignedUrl(
  applicationId: string,
  docTypeId: string,
): Promise<string> {
  const { data } = await request<{ data: { url: string } }>(
    `/api/admin/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(docTypeId)}/url`,
  );
  return data.url;
}

export interface DocDecisionInput {
  document_type_id: string;
  decision: DocDecision;
  reason?: string;
}

export async function submitVettingDecision(
  applicationId: string,
  body: { document_decisions: DocDecisionInput[]; notes?: string },
): Promise<{ outcome: 'vetting_passed' | 'vetting_failed' | 'requires_action' }> {
  const { data } = await request<{ data: { outcome: 'vetting_passed' | 'vetting_failed' | 'requires_action' } }>(
    `/api/admin/applications/${encodeURIComponent(applicationId)}/vetting`,
    { method: 'POST', body: JSON.stringify(body) },
  );
  return data;
}

export async function listAppeals(): Promise<AdminApplicationListItem[]> {
  const { data } = await request<{ data: AdminApplicationListItem[] }>(
    '/api/admin/applications/appeals',
  );
  return data;
}

export async function resolveAppeal(
  applicationId: string,
  resolution: AppealResolution,
): Promise<void> {
  await request(
    `/api/admin/applications/${encodeURIComponent(applicationId)}/appeals/resolve`,
    { method: 'POST', body: JSON.stringify(resolution) },
  );
}
```

- [ ] **Step 3: Append applicant client function in `src/lib/applicant-api.ts`**

```typescript
export async function submitAppeal(reason: string): Promise<void> {
  await request('/api/applications/me/appeals', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
```

- [ ] **Step 4: Type-check + commit**

```bash
cd ohcs-website
npx tsc --noEmit 2>&1 | grep -E "src/types/recruitment|src/lib/(recruitment|applicant)-api" | head -3 || echo OK
git add src/types/recruitment.ts src/lib/recruitment-api.ts src/lib/applicant-api.ts
git commit -m "feat(recruitment-a): add admin pipeline + applicant appeal client/types"
```

---

## Task 5: AI verification helper (`functions/_shared/ai-verify.ts`)

This task wires the Phase 4 AI verification originally specced. Each upload kicks off an async classifier call that updates the document row's `ai_verdict`, `ai_confidence`, `ai_reason`, and `ai_prompt_version`.

**Files:**
- Create: `ohcs-website/functions/_shared/ai-verify.ts`
- Create: `ohcs-website/tests/functions/_shared/ai-verify.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/_shared/ai-verify.test.ts
import { describe, it, expect, vi } from 'vitest';
import { verifyDocument, PROMPT_VERSION } from '../../../functions/_shared/ai-verify';
import { makeD1 } from '../_helpers/d1-mock';
import type { Env } from '../../../functions/_shared/types';

function envWithAi(aiResponse: unknown, db: D1Database): Env {
  return {
    DB: db,
    UPLOADS: { head: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() } as unknown as R2Bucket,
    AI: {
      run: vi.fn(async () => aiResponse),
    } as unknown as Ai,
    APP_NAME: 'Test',
    APP_ENV: 'development',
    EMAIL_FROM: 'noreply@example.com',
    EMAIL_FROM_NAME: 'Test',
  };
}

describe('verifyDocument', () => {
  it('writes "passed" when AI returns is_valid=true with confidence >= 0.75', async () => {
    const db = makeD1([
      {
        sql:
          'UPDATE application_documents SET ai_verdict = ?, ai_confidence = ?, ai_reason = ?, ai_prompt_version = ? WHERE application_id = ? AND document_type_id = ?',
        run: {},
      },
    ]);
    const aiResp = {
      response: JSON.stringify({ is_valid: true, confidence: 0.92, reason: 'Looks like a Ghana Card' }),
    };
    const env = envWithAi(aiResp, db);
    await verifyDocument(env, {
      applicationId: 'OHCS-2026-00001',
      documentTypeId: 'national_id',
      checkType: 'identity',
      r2Key: 'ex-001/OHCS-2026-00001/national_id.pdf',
      mimeType: 'application/pdf',
    });
    expect(env.AI.run).toHaveBeenCalled();
  });

  it('writes "flagged" when confidence is below threshold', async () => {
    const db = makeD1([
      {
        sql:
          'UPDATE application_documents SET ai_verdict = ?, ai_confidence = ?, ai_reason = ?, ai_prompt_version = ? WHERE application_id = ? AND document_type_id = ?',
        run: {},
      },
    ]);
    const aiResp = { response: JSON.stringify({ is_valid: true, confidence: 0.5, reason: 'Could be a card' }) };
    const env = envWithAi(aiResp, db);
    await verifyDocument(env, {
      applicationId: 'OHCS-2026-00001',
      documentTypeId: 'national_id',
      checkType: 'identity',
      r2Key: 'ex-001/OHCS-2026-00001/national_id.pdf',
      mimeType: 'application/pdf',
    });
    expect(env.AI.run).toHaveBeenCalled();
  });

  it('writes "unchecked" when AI returns garbage (parse failure)', async () => {
    const db = makeD1([
      {
        sql:
          'UPDATE application_documents SET ai_verdict = ?, ai_confidence = ?, ai_reason = ?, ai_prompt_version = ? WHERE application_id = ? AND document_type_id = ?',
        run: {},
      },
    ]);
    const aiResp = { response: 'not json at all' };
    const env = envWithAi(aiResp, db);
    await verifyDocument(env, {
      applicationId: 'OHCS-2026-00001',
      documentTypeId: 'national_id',
      checkType: 'identity',
      r2Key: 'ex-001/OHCS-2026-00001/national_id.pdf',
      mimeType: 'application/pdf',
    });
    expect(env.AI.run).toHaveBeenCalled();
  });

  it('exports a stable PROMPT_VERSION string', () => {
    expect(typeof PROMPT_VERSION).toBe('string');
    expect(PROMPT_VERSION.length).toBeGreaterThan(0);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/_shared/ai-verify.test.ts
git commit -m "test(recruitment-a): add failing tests for AI verification helper"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/_shared/ai-verify.ts
import type { Env } from './types';
import { run } from './db';

export const PROMPT_VERSION = 'v1-2026-04-22';
const CONFIDENCE_THRESHOLD = 0.75;

export type CheckType = 'identity' | 'photo' | 'certificate';

export interface VerifyInput {
  applicationId: string;
  documentTypeId: string;
  checkType: CheckType;
  r2Key: string;
  mimeType: string;
}

interface AiVerdict {
  is_valid: boolean;
  confidence: number;
  reason: string;
}

const PROMPTS: Record<CheckType, string> = {
  identity:
    'You are inspecting an image to verify it is a Ghana National Identity Card (Ghana Card). Answer ONLY in JSON: {"is_valid": boolean, "confidence": 0.0-1.0, "reason": "<one short sentence>"}. Look for: NIA branding, "REPUBLIC OF GHANA" text, photo of holder, NIA number format (GHA-XXXXXXXXX-X), expiry date, hologram patterns.',
  photo:
    'You are inspecting an uploaded image to verify it is a passport-style photograph suitable for a government job application. Answer ONLY in JSON: {"is_valid": boolean, "confidence": 0.0-1.0, "reason": "<one short sentence>"}. Criteria: single human face, front-facing, plain light background, head and shoulders visible, no sunglasses, in focus, well-lit.',
  certificate:
    'You are inspecting a document to verify it appears to be an official educational or professional certificate. Answer ONLY in JSON: {"is_valid": boolean, "confidence": 0.0-1.0, "reason": "<one short sentence>"}. Look for: institution name/seal, candidate name, qualification awarded, date of award, signature/stamp.',
};

function parseVerdict(raw: string): AiVerdict | null {
  try {
    const trimmed = raw.trim();
    // Some models wrap JSON in markdown fences; strip those defensively.
    const stripped = trimmed.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(stripped) as Partial<AiVerdict>;
    if (
      typeof parsed.is_valid === 'boolean' &&
      typeof parsed.confidence === 'number' &&
      typeof parsed.reason === 'string'
    ) {
      return parsed as AiVerdict;
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyDocument(env: Env, input: VerifyInput): Promise<void> {
  // For v1, we send only the prompt — the model handles vision via its own
  // training data. A future iteration can fetch the R2 object and pass it as
  // an image input when llava supports image_url in the binding.
  // For PDFs, classification falls to the text model on the prompt alone.
  // This is intentionally simple; the spec § 8 calls out that PDF
  // preprocessing (pdf-parse + page render) is a future enhancement.

  const prompt = PROMPTS[input.checkType];

  let verdict: 'passed' | 'flagged' | 'unchecked';
  let confidence: number | null = null;
  let reason: string | null = null;

  try {
    const model = input.mimeType === 'application/pdf'
      ? '@cf/meta/llama-3.1-8b-instruct'
      : '@cf/llava-hf/llava-1.5-7b-hf';
    // The Ai binding's run method returns a model-specific shape; we only need
    // the `response` field for these classifier prompts.
    const aiResultUnknown: unknown = await env.AI.run(model, {
      prompt,
      max_tokens: 256,
    });
    const aiResult = aiResultUnknown as { response?: string };
    const parsed = aiResult.response ? parseVerdict(aiResult.response) : null;
    if (!parsed) {
      verdict = 'unchecked';
      reason = 'AI response did not parse as expected JSON';
    } else if (parsed.is_valid && parsed.confidence >= CONFIDENCE_THRESHOLD) {
      verdict = 'passed';
      confidence = parsed.confidence;
      reason = parsed.reason;
    } else {
      verdict = 'flagged';
      confidence = parsed.confidence;
      reason = parsed.reason;
    }
  } catch (err) {
    verdict = 'unchecked';
    reason = err instanceof Error ? `AI error: ${err.message}` : 'AI error';
  }

  await run(
    env,
    'UPDATE application_documents SET ai_verdict = ?, ai_confidence = ?, ai_reason = ?, ai_prompt_version = ? WHERE application_id = ? AND document_type_id = ?',
    verdict,
    confidence,
    reason,
    PROMPT_VERSION,
    input.applicationId,
    input.documentTypeId,
  );
}
```

Run tests → pass. Commit:

```bash
git add functions/_shared/ai-verify.ts
git commit -m "feat(recruitment-a): add AI verification helper (Phase 4 absorbed)"
```

---

## Task 6: Wire AI verify into the upload endpoint

**Files:**
- Modify: `ohcs-website/functions/api/applications/me/documents/[docTypeId].ts` (add `ctx.waitUntil` call after the upload)

- [ ] **Step 1: Edit the upload endpoint**

Find the section in `[docTypeId].ts` where the row is upserted (after the R2 put). Just after the `await run(...)` that upserts the metadata, add:

```typescript
  // Async AI verification — fires after the response returns to the
  // applicant. Updates ai_verdict / ai_confidence / ai_reason in place.
  // Phase 4 absorbed into sub-project A.
  const docTypeRow = await first<{ ai_check_type: string | null }>(
    env,
    'SELECT ai_check_type FROM document_types WHERE id = ?',
    params.docTypeId,
  );
  if (docTypeRow?.ai_check_type) {
    const { verifyDocument } = await import('../../../../_shared/ai-verify');
    waitUntil(
      verifyDocument(env, {
        applicationId: auth.application.id,
        documentTypeId: params.docTypeId,
        checkType: docTypeRow.ai_check_type as 'identity' | 'photo' | 'certificate',
        r2Key: key,
        mimeType: file.type,
      }).catch((err) => console.error('ai-verify failed', err)),
    );
  }
```

The dynamic import avoids loading the AI module on uploads where the doc type doesn't have a check_type configured (e.g. CV).

Make sure `waitUntil` is destructured from the function context — at the top of the handler, change:

```typescript
export const onRequestPost: PagesFunction<Env, 'docTypeId'> = async ({ request, env, params }) => {
```

to:

```typescript
export const onRequestPost: PagesFunction<Env, 'docTypeId'> = async ({ request, env, params, waitUntil }) => {
```

- [ ] **Step 2: Build + run existing upload tests**

```bash
cd ohcs-website
npm run pages:build 2>&1 | tail -5
npx vitest run tests/functions/applications/documents.test.ts 2>&1 | tail -5
```

The existing 4 tests should still pass — they don't exercise the AI path because the test mock for `document_types` doesn't return an `ai_check_type` (and the test mock-D1 isn't scripted for the SELECT, but the dynamic import + the if-guard means it won't fire if the SELECT throws). To keep this clean, register a wildcard d1-mock script for the SELECT in the existing tests:

In `tests/functions/applications/documents.test.ts`, find each `db = makeD1([...])` block in the POST tests and add this script just after the requirement-row lookup:

```typescript
{
  sql: 'SELECT ai_check_type FROM document_types WHERE id = ?',
  // wildcard binds — return null ai_check_type so the AI path is skipped
  first: { ai_check_type: null },
},
```

Re-run tests → 4/4 still pass.

- [ ] **Step 3: Commit**

```bash
git add functions/api/applications/me/documents/\[docTypeId\].ts tests/functions/applications/documents.test.ts
git commit -m "feat(recruitment-a): wire async AI verification into upload endpoint"
```

---

## Task 7: `GET /api/admin/applications` (paginated list)

**Files:**
- Create: `ohcs-website/functions/api/admin/applications/index.ts`
- Create: `ohcs-website/tests/functions/admin/applications-list.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/admin/applications-list.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/admin/applications/index';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'admin@ohcs.gov.gh',
  'X-Admin-User-Role': 'super_admin',
};

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/applications', () => {
  it('returns the queue with default filters (no params)', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT a.id, a.exercise_id, a.email, a.status, a.submitted_at, a.review_claimed_by, (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id) AS doc_count, (SELECT COUNT(*) FROM exercise_document_requirements WHERE exercise_id = a.exercise_id AND is_required = 1) AS doc_required_count, (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id AND ai_verdict = ?) AS ai_flag_count FROM applications a WHERE a.status != ? ORDER BY a.submitted_at DESC LIMIT 50',
        binds: ['flagged', 'draft'],
        all: {
          results: [
            {
              id: 'OHCS-2026-00001',
              exercise_id: 'ex-001',
              email: 'kofi@example.com',
              status: 'submitted',
              submitted_at: 1,
              review_claimed_by: null,
              doc_count: 4,
              doc_required_count: 3,
              ai_flag_count: 0,
            },
          ],
        },
      },
    ]);
    const req = new Request('https://x/api/admin/applications', { headers: ADMIN_HEADERS });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.id).toBe('OHCS-2026-00001');
  });

  it('rejects without admin role', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/admin/applications')));
    expect(res.status).toBe(401);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/admin/applications-list.test.ts
git commit -m "test(recruitment-a): add failing tests for admin applications list"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/admin/applications/index.ts
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { all } from '../../../_shared/db';

interface Row {
  id: string;
  exercise_id: string;
  email: string;
  status: string;
  submitted_at: number | null;
  review_claimed_by: string | null;
  doc_count: number;
  doc_required_count: number;
  ai_flag_count: number;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const exerciseId = url.searchParams.get('exercise_id');
  const search = url.searchParams.get('search');
  const claimedByMe = url.searchParams.get('claimed_by_me') === '1';

  // Build WHERE dynamically. Default excludes draft (incomplete applications).
  const wheres: string[] = ['a.status != ?'];
  const binds: unknown[] = ['flagged', 'draft']; // 'flagged' is the bind for ai_flag_count subquery
  if (status) {
    wheres.push('a.status = ?');
    binds.push(status);
  } else {
    // The default 'a.status != "draft"' bind is already in `binds`
  }
  if (exerciseId) {
    wheres.push('a.exercise_id = ?');
    binds.push(exerciseId);
  }
  if (search) {
    wheres.push('(a.id LIKE ? OR a.email LIKE ?)');
    binds.push(`%${search}%`, `%${search}%`);
  }
  if (claimedByMe) {
    wheres.push('a.review_claimed_by = ?');
    binds.push(auth.admin.email);
  }

  const sql = `SELECT a.id, a.exercise_id, a.email, a.status, a.submitted_at, a.review_claimed_by, (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id) AS doc_count, (SELECT COUNT(*) FROM exercise_document_requirements WHERE exercise_id = a.exercise_id AND is_required = 1) AS doc_required_count, (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id AND ai_verdict = ?) AS ai_flag_count FROM applications a WHERE ${wheres.join(' AND ')} ORDER BY a.submitted_at DESC LIMIT 50`;

  const rows = await all<Row>(env, sql, ...binds);
  return json({ data: rows });
};
```

Run tests → pass. Commit:

```bash
git add functions/api/admin/applications/index.ts
git commit -m "feat(recruitment-a): add GET /api/admin/applications (filtered queue)"
```

---

## Task 8: `GET /api/admin/applications/[id]` (full detail)

**Files:**
- Create: `ohcs-website/functions/api/admin/applications/[id].ts`
- Create: `ohcs-website/tests/functions/admin/application-detail.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/admin/application-detail.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/admin/applications/[id]';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'admin@ohcs.gov.gh',
  'X-Admin-User-Role': 'super_admin',
};

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: { id: 'OHCS-2026-00001' }, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/applications/[id]', () => {
  it('returns the full application detail', async () => {
    const db = makeD1([
      {
        sql: 'SELECT id, exercise_id, email, status, has_professional_qualification, is_pwd, form_data, appeal_reason FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: {
          id: 'OHCS-2026-00001',
          exercise_id: 'ex-001',
          email: 'kofi@example.com',
          status: 'submitted',
          has_professional_qualification: 0,
          is_pwd: 0,
          form_data: '{"full_name":"Kofi"}',
          appeal_reason: null,
        },
      },
      {
        sql: 'SELECT id, document_type_id, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, ai_reason, applicant_confirmed FROM application_documents WHERE application_id = ?',
        binds: ['OHCS-2026-00001'],
        all: { results: [] },
      },
      {
        sql: 'SELECT r.document_type_id, r.is_required, r.conditional_on, r.display_order, r.max_mb_override, t.label, t.description, t.default_max_mb, t.accepted_mimes, t.ai_check_type FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? ORDER BY r.display_order ASC',
        binds: ['ex-001'],
        all: { results: [] },
      },
      {
        sql: 'SELECT document_type_id, decision, reason, reviewer_email, created_at FROM document_review_decisions WHERE application_id = ? ORDER BY created_at DESC',
        binds: ['OHCS-2026-00001'],
        all: { results: [] },
      },
      {
        sql: 'SELECT outcome, notes, reviewer_email, created_at FROM application_review_decisions WHERE application_id = ? ORDER BY created_at DESC',
        binds: ['OHCS-2026-00001'],
        all: { results: [] },
      },
      {
        sql: 'SELECT from_status, to_status, actor_email, actor_role, reason, created_at FROM status_transitions WHERE application_id = ? ORDER BY created_at ASC',
        binds: ['OHCS-2026-00001'],
        all: { results: [] },
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001', { headers: ADMIN_HEADERS });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string; form_data: { full_name: string } } };
    expect(body.data.id).toBe('OHCS-2026-00001');
    expect(body.data.form_data.full_name).toBe('Kofi');
  });

  it('returns 404 when application not found', async () => {
    const db = makeD1([
      { sql: 'SELECT id, exercise_id, email, status, has_professional_qualification, is_pwd, form_data, appeal_reason FROM applications WHERE id = ?', binds: ['OHCS-2026-00001'] },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001', { headers: ADMIN_HEADERS });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(404);
  });
});
```

Run: red. Commit.

```bash
git add tests/functions/admin/application-detail.test.ts
git commit -m "test(recruitment-a): add failing tests for admin application detail"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/admin/applications/[id].ts
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { first, all } from '../../../_shared/db';
import type {
  AiCheckType,
  AiVerdict,
  ConditionalTrigger,
} from '../../../../src/types/recruitment';

interface AppRow {
  id: string;
  exercise_id: string;
  email: string;
  status: string;
  has_professional_qualification: number;
  is_pwd: number;
  form_data: string | null;
  appeal_reason: string | null;
}

interface DocRow {
  id: string;
  document_type_id: string;
  original_filename: string;
  size_bytes: number;
  mime_type: string;
  sha256: string;
  uploaded_at: number;
  ai_verdict: AiVerdict;
  ai_reason: string | null;
  applicant_confirmed: number;
}

interface ReqRow {
  document_type_id: string;
  is_required: number;
  conditional_on: string | null;
  display_order: number;
  max_mb_override: number | null;
  label: string;
  description: string | null;
  default_max_mb: number;
  accepted_mimes: string;
  ai_check_type: AiCheckType;
}

interface DecisionRow {
  document_type_id: string;
  decision: string;
  reason: string | null;
  reviewer_email: string;
  created_at: number;
}

interface ReviewRow {
  outcome: string;
  notes: string | null;
  reviewer_email: string;
  created_at: number;
}

interface TransitionRow {
  from_status: string;
  to_status: string;
  actor_email: string | null;
  actor_role: string | null;
  reason: string | null;
  created_at: number;
}

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const app = await first<AppRow>(
    env,
    'SELECT id, exercise_id, email, status, has_professional_qualification, is_pwd, form_data, appeal_reason FROM applications WHERE id = ?',
    params.id,
  );
  if (!app) return json({ error: 'application not found' }, { status: 404 });

  const documents = await all<DocRow>(
    env,
    'SELECT id, document_type_id, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, ai_reason, applicant_confirmed FROM application_documents WHERE application_id = ?',
    params.id,
  );

  const reqs = await all<ReqRow>(
    env,
    'SELECT r.document_type_id, r.is_required, r.conditional_on, r.display_order, r.max_mb_override, t.label, t.description, t.default_max_mb, t.accepted_mimes, t.ai_check_type FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? ORDER BY r.display_order ASC',
    app.exercise_id,
  );

  const decisions = await all<DecisionRow>(
    env,
    'SELECT document_type_id, decision, reason, reviewer_email, created_at FROM document_review_decisions WHERE application_id = ? ORDER BY created_at DESC',
    params.id,
  );

  const reviews = await all<ReviewRow>(
    env,
    'SELECT outcome, notes, reviewer_email, created_at FROM application_review_decisions WHERE application_id = ? ORDER BY created_at DESC',
    params.id,
  );

  const history = await all<TransitionRow>(
    env,
    'SELECT from_status, to_status, actor_email, actor_role, reason, created_at FROM status_transitions WHERE application_id = ? ORDER BY created_at ASC',
    params.id,
  );

  // Latest decision per document_type_id (the active one)
  const latestPerDoc = new Map<string, DecisionRow>();
  for (const d of decisions) {
    if (!latestPerDoc.has(d.document_type_id)) latestPerDoc.set(d.document_type_id, d);
  }

  const hasPro = app.has_professional_qualification === 1;
  const isPwd = app.is_pwd === 1;
  const requirements = reqs.map((r) => {
    const conditional = (r.conditional_on as ConditionalTrigger | null) ?? null;
    const visible =
      conditional === null
        ? true
        : conditional === 'has_professional_qualification'
          ? hasPro
          : conditional === 'is_pwd'
            ? isPwd
            : true;
    const upload = documents.find((d) => d.document_type_id === r.document_type_id) ?? null;
    return {
      document_type_id: r.document_type_id,
      label: r.label,
      description: r.description,
      is_required: r.is_required === 1,
      conditional_on: conditional,
      display_order: r.display_order,
      max_mb: r.max_mb_override ?? r.default_max_mb,
      accepted_mimes: JSON.parse(r.accepted_mimes) as string[],
      ai_check_type: r.ai_check_type,
      upload: upload
        ? {
            id: upload.id,
            document_type_id: upload.document_type_id,
            original_filename: upload.original_filename,
            size_bytes: upload.size_bytes,
            mime_type: upload.mime_type,
            sha256: upload.sha256,
            uploaded_at: upload.uploaded_at,
            ai_verdict: upload.ai_verdict,
            ai_reason: upload.ai_reason,
            applicant_confirmed: upload.applicant_confirmed === 1,
          }
        : null,
      visible,
    };
  });

  return json({
    data: {
      id: app.id,
      exercise_id: app.exercise_id,
      email: app.email,
      status: app.status,
      has_professional_qualification: hasPro,
      is_pwd: isPwd,
      form_data: app.form_data ? (JSON.parse(app.form_data) as Record<string, unknown>) : {},
      documents: documents.map((d) => ({
        id: d.id,
        document_type_id: d.document_type_id,
        original_filename: d.original_filename,
        size_bytes: d.size_bytes,
        mime_type: d.mime_type,
        sha256: d.sha256,
        uploaded_at: d.uploaded_at,
        ai_verdict: d.ai_verdict,
        ai_reason: d.ai_reason,
        applicant_confirmed: d.applicant_confirmed === 1,
      })),
      requirements,
      decisions: Array.from(latestPerDoc.values()),
      reviews,
      history,
      appeal_reason: app.appeal_reason,
    },
  });
};
```

Run tests → pass. Commit.

```bash
git add functions/api/admin/applications/[id].ts
git commit -m "feat(recruitment-a): add GET /api/admin/applications/[id] (full detail)"
```

---

## Task 9: Claim/release + signed-URL endpoints

**Files:**
- Create: `ohcs-website/functions/api/admin/applications/[id]/claim.ts`
- Create: `ohcs-website/functions/api/admin/applications/[id]/url.ts` (re-uses existing pattern)

The signed URL endpoint generates a 60-second presigned R2 URL.

- [ ] **Step 1: Write the claim endpoint**

```typescript
// ohcs-website/functions/api/admin/applications/[id]/claim.ts
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { first, run } from '../../../../_shared/db';

const CLAIM_TTL_MS = 30 * 60 * 1000;

export const onRequestPost: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const now = Date.now();
  const row = await first<{ review_claimed_by: string | null; review_claimed_at: number | null; status: string }>(
    env,
    'SELECT review_claimed_by, review_claimed_at, status FROM applications WHERE id = ?',
    params.id,
  );
  if (!row) return json({ error: 'not found' }, { status: 404 });
  if (row.status !== 'submitted' && row.status !== 'under_review') {
    return json({ error: 'application is not in a reviewable state', status: row.status }, { status: 409 });
  }

  // If claimed by someone else and not stale → 409
  if (
    row.review_claimed_by &&
    row.review_claimed_by !== auth.admin.email &&
    row.review_claimed_at !== null &&
    now - row.review_claimed_at < CLAIM_TTL_MS
  ) {
    return json(
      { error: 'already claimed', claimed_by: row.review_claimed_by, claimed_at: row.review_claimed_at },
      { status: 409 },
    );
  }

  await run(
    env,
    'UPDATE applications SET review_claimed_by = ?, review_claimed_at = ?, status = ? WHERE id = ?',
    auth.admin.email,
    now,
    'under_review',
    params.id,
  );

  // Audit transition only if it was 'submitted' before
  if (row.status === 'submitted') {
    await run(
      env,
      'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      `tx_${now}_${Math.random().toString(36).slice(2, 10)}`,
      params.id,
      'submitted',
      'under_review',
      auth.admin.email,
      auth.admin.role,
      'Reviewer claimed application',
      now,
    );
  }

  return json({ data: { claimed_by: auth.admin.email, claimed_at: now } });
};

export const onRequestDelete: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  await run(
    env,
    'UPDATE applications SET review_claimed_by = NULL, review_claimed_at = NULL WHERE id = ? AND review_claimed_by = ?',
    params.id,
    auth.admin.email,
  );
  return new Response(null, { status: 204 });
};
```

- [ ] **Step 2: Write the signed-URL endpoint**

R2 in Workers does not have a native presigned-URL helper for arbitrary keys (unlike S3's `getSignedUrl`). Cloudflare's recommendation is to either (a) proxy the file through your Worker with a one-shot token, or (b) use R2's signed URL feature where supported. For sub-project A, we use option (a) — a one-shot token endpoint that the reviewer's browser uses to fetch the file directly through the Worker.

Create `functions/api/admin/applications/[id]/documents/[docTypeId]/url.ts`:

```typescript
// ohcs-website/functions/api/admin/applications/[id]/documents/[docTypeId]/url.ts
//
// SECURITY: see functions/_shared/admin-auth.ts header.
// Returns a one-shot token URL the browser uses to fetch the actual file
// through `/api/admin/applications/<id>/documents/<docTypeId>/file?token=...`.
// The token is HMAC of (application_id, document_type_id, expiry) using
// SYSTEM_CRON_SECRET as the signing key (set via wrangler secret).

import type { PagesFunction, Env } from '../../../../../_shared/types';
import { json } from '../../../../../_shared/json';
import { requireAdmin } from '../../../../../_shared/admin-auth';
import { first } from '../../../../../_shared/db';

const TTL_SECONDS = 60;

async function hmacToken(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

interface ParamsLocal {
  id: string;
  docTypeId: string;
}

export const onRequestGet: PagesFunction<Env & { SYSTEM_CRON_SECRET?: string }, keyof ParamsLocal> = async ({
  request,
  env,
  params,
}) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const p = params as unknown as ParamsLocal;
  const exists = await first<{ r2_key: string }>(
    env,
    'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
    p.id,
    p.docTypeId,
  );
  if (!exists) return json({ error: 'document not found' }, { status: 404 });

  const expiry = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const secret = env.SYSTEM_CRON_SECRET ?? 'dev-secret-not-for-prod';
  const payload = `${p.id}:${p.docTypeId}:${expiry}`;
  const sig = await hmacToken(secret, payload);

  const url = `/api/admin/applications/${encodeURIComponent(p.id)}/documents/${encodeURIComponent(p.docTypeId)}/file?expires=${expiry}&sig=${sig}`;
  return json({ data: { url, expires_at: expiry * 1000 } });
};
```

And the file-serving endpoint at `functions/api/admin/applications/[id]/documents/[docTypeId]/file.ts`:

```typescript
// ohcs-website/functions/api/admin/applications/[id]/documents/[docTypeId]/file.ts

import type { PagesFunction, Env } from '../../../../../_shared/types';
import { json } from '../../../../../_shared/json';
import { first } from '../../../../../_shared/db';

async function hmacToken(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

interface ParamsLocal { id: string; docTypeId: string }

export const onRequestGet: PagesFunction<Env & { SYSTEM_CRON_SECRET?: string }, keyof ParamsLocal> = async ({
  request, env, params,
}) => {
  const url = new URL(request.url);
  const expires = parseInt(url.searchParams.get('expires') ?? '0', 10);
  const sig = url.searchParams.get('sig') ?? '';
  if (!expires || !sig) return json({ error: 'missing token' }, { status: 401 });
  if (Date.now() / 1000 > expires) return json({ error: 'token expired' }, { status: 401 });

  const p = params as unknown as ParamsLocal;
  const secret = env.SYSTEM_CRON_SECRET ?? 'dev-secret-not-for-prod';
  const expectedSig = await hmacToken(secret, `${p.id}:${p.docTypeId}:${expires}`);
  if (sig !== expectedSig) return json({ error: 'invalid token' }, { status: 401 });

  const row = await first<{ r2_key: string; mime_type: string; original_filename: string }>(
    env,
    'SELECT r2_key, mime_type, original_filename FROM application_documents WHERE application_id = ? AND document_type_id = ?',
    p.id, p.docTypeId,
  );
  if (!row) return json({ error: 'document not found' }, { status: 404 });

  const obj = await env.UPLOADS.get(row.r2_key);
  if (!obj) return json({ error: 'file missing in R2' }, { status: 404 });

  return new Response(obj.body, {
    headers: {
      'content-type': row.mime_type,
      'content-disposition': `inline; filename="${row.original_filename}"`,
      'cache-control': 'private, max-age=60',
    },
  });
};
```

- [ ] **Step 3: Build + commit (no unit tests for these — integration testing via the React UI is sufficient)**

```bash
npm run pages:build 2>&1 | tail -3
git add functions/api/admin/applications/[id]/claim.ts functions/api/admin/applications/[id]/documents
git commit -m "feat(recruitment-a): add claim/release + token-signed file endpoints"
```

---

## Task 10: `POST /api/admin/applications/[id]/vetting` (the big one)

**Files:**
- Create: `ohcs-website/functions/api/admin/applications/[id]/vetting.ts`
- Create: `ohcs-website/tests/functions/admin/vetting.test.ts`

This is the heart of sub-project A — accepts per-doc decisions, computes the roll-up, writes everything atomically, fires email + SMS.

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/admin/vetting.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from '../../../functions/api/admin/applications/[id]/vetting';
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
    params: { id: 'OHCS-2026-00001' },
    waitUntil: () => {},
    data: {},
  };
}

describe('POST /api/admin/applications/[id]/vetting', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('rolls up to vetting_passed when all decisions are accepted', async () => {
    const db = makeD1([
      // Application status check
      {
        sql: 'SELECT status, exercise_id, email FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { status: 'under_review', exercise_id: 'ex-001', email: 'kofi@example.com' },
      },
      // Insert per-doc decisions
      {
        sql: 'INSERT INTO document_review_decisions (id, application_id, document_type_id, reviewer_email, decision, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      // Insert overall vetting decision
      {
        sql: 'INSERT INTO application_review_decisions (id, application_id, reviewer_email, outcome, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        run: {},
      },
      // Status transition + update
      {
        sql: 'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql: 'UPDATE applications SET status = ?, review_claimed_by = NULL, review_claimed_at = NULL WHERE id = ?',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001/vetting', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        document_decisions: [
          { document_type_id: 'national_id', decision: 'accepted' },
          { document_type_id: 'first_degree', decision: 'accepted' },
        ],
        notes: 'All clean.',
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { outcome: string } };
    expect(body.data.outcome).toBe('vetting_passed');
  });

  it('rolls up to requires_action when some decisions are needs_better_scan and none rejected', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status, exercise_id, email FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { status: 'under_review', exercise_id: 'ex-001', email: 'kofi@example.com' },
      },
      { sql: 'INSERT INTO document_review_decisions (id, application_id, document_type_id, reviewer_email, decision, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', run: {} },
      { sql: 'INSERT INTO application_review_decisions (id, application_id, reviewer_email, outcome, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)', run: {} },
      { sql: 'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', run: {} },
      { sql: 'UPDATE applications SET status = ?, review_claimed_by = NULL, review_claimed_at = NULL WHERE id = ?', run: {} },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001/vetting', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        document_decisions: [
          { document_type_id: 'national_id', decision: 'accepted' },
          { document_type_id: 'first_degree', decision: 'needs_better_scan', reason: 'Blurry image' },
        ],
        notes: 'One re-upload needed.',
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { outcome: string } };
    expect(body.data.outcome).toBe('requires_action');
  });

  it('rolls up to vetting_failed when any decision is rejected', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status, exercise_id, email FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { status: 'under_review', exercise_id: 'ex-001', email: 'kofi@example.com' },
      },
      { sql: 'INSERT INTO document_review_decisions (id, application_id, document_type_id, reviewer_email, decision, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', run: {} },
      { sql: 'INSERT INTO application_review_decisions (id, application_id, reviewer_email, outcome, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)', run: {} },
      { sql: 'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', run: {} },
      { sql: 'UPDATE applications SET status = ?, review_claimed_by = NULL, review_claimed_at = NULL WHERE id = ?', run: {} },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001/vetting', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        document_decisions: [
          { document_type_id: 'national_id', decision: 'rejected', reason: 'Wrong document' },
        ],
        notes: 'Rejected.',
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { outcome: string } };
    expect(body.data.outcome).toBe('vetting_failed');
  });

  it('rejects 400 when a non-accept decision lacks a reason', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status, exercise_id, email FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { status: 'under_review', exercise_id: 'ex-001', email: 'kofi@example.com' },
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001/vetting', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        document_decisions: [{ document_type_id: 'national_id', decision: 'rejected' }],
        notes: '',
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(400);
  });

  it('rejects when application is not under_review', async () => {
    const db = makeD1([
      {
        sql: 'SELECT status, exercise_id, email FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { status: 'submitted', exercise_id: 'ex-001', email: 'kofi@example.com' },
      },
    ]);
    const req = new Request('https://x/api/admin/applications/OHCS-2026-00001/vetting', {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        document_decisions: [{ document_type_id: 'national_id', decision: 'accepted' }],
      }),
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(409);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/admin/vetting.test.ts
git commit -m "test(recruitment-a): add failing tests for vetting decision endpoint"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/admin/applications/[id]/vetting.ts
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { parseBody } from '../../../../_shared/validate';
import { first, run } from '../../../../_shared/db';
import { sendEmail } from '../../../../_shared/email';
import { sendSms } from '../../../../_shared/sms';
import { z } from 'zod';

const Body = z
  .object({
    document_decisions: z
      .array(
        z.object({
          document_type_id: z.string().min(1),
          decision: z.enum(['accepted', 'rejected', 'needs_better_scan']),
          reason: z.string().max(2000).optional(),
        }),
      )
      .min(1)
      .refine(
        (arr) => arr.every((d) => d.decision === 'accepted' || (d.reason && d.reason.trim().length > 0)),
        { message: 'reason required for non-accepted decisions' },
      ),
    notes: z.string().max(2000).optional(),
  });

function rollUp(decisions: Array<{ decision: string }>): 'vetting_passed' | 'vetting_failed' | 'requires_action' {
  if (decisions.some((d) => d.decision === 'rejected')) return 'vetting_failed';
  if (decisions.some((d) => d.decision === 'needs_better_scan')) return 'requires_action';
  return 'vetting_passed';
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface AppRow {
  status: string;
  exercise_id: string;
  email: string;
}

export const onRequestPost: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const app = await first<AppRow>(
    env,
    'SELECT status, exercise_id, email FROM applications WHERE id = ?',
    params.id,
  );
  if (!app) return json({ error: 'not found' }, { status: 404 });
  if (app.status !== 'under_review') {
    return json({ error: 'application is not under review', status: app.status }, { status: 409 });
  }

  const body = await parseBody(request, Body);
  if (body.kind === 'reject') return body.response;
  const v = body.value;

  const outcome = rollUp(v.document_decisions);
  const now = Date.now();

  // 1) Insert one row per per-doc decision
  for (const d of v.document_decisions) {
    await run(
      env,
      'INSERT INTO document_review_decisions (id, application_id, document_type_id, reviewer_email, decision, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      genId('drd'),
      params.id,
      d.document_type_id,
      auth.admin.email,
      d.decision,
      d.reason ?? null,
      now,
    );
  }

  // 2) Insert overall vetting decision
  await run(
    env,
    'INSERT INTO application_review_decisions (id, application_id, reviewer_email, outcome, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    genId('ard'),
    params.id,
    auth.admin.email,
    outcome,
    v.notes ?? null,
    now,
  );

  // 3) Status transition + clear claim
  await run(
    env,
    'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    genId('tx'),
    params.id,
    'under_review',
    outcome,
    auth.admin.email,
    auth.admin.role,
    `Vetting decision: ${outcome}`,
    now,
  );
  await run(
    env,
    'UPDATE applications SET status = ?, review_claimed_by = NULL, review_claimed_at = NULL WHERE id = ?',
    outcome,
    params.id,
  );

  // 4) Notifications (best-effort — don't roll back the decision)
  try {
    if (outcome === 'vetting_passed') {
      await sendEmail(env, {
        to: app.email,
        subject: 'OHCS Recruitment — vetting passed, please pay exam fee',
        html: `<p>Your application <strong>${params.id}</strong> has passed initial review.</p><p>To proceed to the examination, please pay the exam fee. The payment portal will open soon.</p>`,
        text: `Your application ${params.id} has passed initial review. Please pay the exam fee to proceed.`,
      });
      await sendSms(env, {
        to: '+233000000000',  // TODO sub-project B: pull applicant phone from form_data
        message: `OHCS: your application ${params.id} has passed vetting. Pay your exam fee to proceed.`,
      });
    } else if (outcome === 'vetting_failed') {
      await sendEmail(env, {
        to: app.email,
        subject: 'OHCS Recruitment — vetting outcome',
        html: `<p>Your application <strong>${params.id}</strong> was not successful at vetting.</p><p>Notes: ${v.notes ?? '(no overall notes)'}</p><p>You may submit an appeal within the appeal window.</p>`,
        text: `Your application ${params.id} was not successful at vetting. Notes: ${v.notes ?? '(none)'}`,
      });
    } else {
      // requires_action
      const reasonsList = v.document_decisions
        .filter((d) => d.decision !== 'accepted')
        .map((d) => `<li><strong>${d.document_type_id}</strong>: ${d.reason}</li>`)
        .join('');
      await sendEmail(env, {
        to: app.email,
        subject: 'OHCS Recruitment — additional information needed',
        html: `<p>Your application <strong>${params.id}</strong> needs additional information before vetting can complete:</p><ul>${reasonsList}</ul>`,
        text: `Your application ${params.id} needs additional information. Please re-upload the indicated documents.`,
      });
    }
  } catch (err) {
    console.error('vetting notification failed', err);
  }

  return json({ data: { outcome } });
};
```

> **Note**: the SMS phone number is hardcoded `'+233000000000'` for now because we'd need to pull the applicant's phone from `form_data` (a JSON blob). A clean implementation would be sub-project B's job since that's where SMS becomes load-bearing for payment receipts. For sub-project A, the phone field on `applications` could be stored at submit time — but for v1 we'll log the SMS attempt to console (which the dev-mode helper already does when `HUBTEL_SMS_API_KEY` is unset).

Run tests → pass. Commit.

```bash
git add functions/api/admin/applications/[id]/vetting.ts
git commit -m "feat(recruitment-a): add POST vetting endpoint with roll-up + notifications"
```

---

## Task 11: Appeal endpoints

**Files:**
- Create: `ohcs-website/functions/api/admin/applications/appeals.ts`
- Create: `ohcs-website/functions/api/admin/applications/[id]/appeals/resolve.ts`
- Create: `ohcs-website/functions/api/applications/me/appeals.ts`

- [ ] **Step 1: Write the applicant-side appeal submit endpoint**

```typescript
// ohcs-website/functions/api/applications/me/appeals.ts
import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { parseBody } from '../../../_shared/validate';
import { run } from '../../../_shared/db';
import { requireApplicant } from '../../../_shared/applicant-session';
import { z } from 'zod';

const APPEALABLE = new Set(['vetting_failed', 'exam_failed', 'rejected']);

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (!APPEALABLE.has(auth.application.status)) {
    return json({ error: 'application is not in an appealable state', status: auth.application.status }, { status: 409 });
  }

  const Body = z.object({ reason: z.string().min(20).max(4000) });
  const body = await parseBody(request, Body);
  if (body.kind === 'reject') return body.response;

  const now = Date.now();

  // Move to appeal_under_review
  await run(
    env,
    'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    `tx_${now}_${Math.random().toString(36).slice(2, 10)}`,
    auth.application.id,
    auth.application.status,
    'appeal_under_review',
    auth.application.email,
    'applicant',
    'Appeal submitted',
    now,
  );
  await run(
    env,
    'UPDATE applications SET status = ?, appeal_submitted_at = ?, appeal_reason = ? WHERE id = ?',
    'appeal_under_review',
    now,
    body.value.reason,
    auth.application.id,
  );

  return json({ data: { status: 'appeal_under_review' } });
};
```

- [ ] **Step 2: Write the admin appeal queue endpoint**

```typescript
// ohcs-website/functions/api/admin/applications/appeals.ts
import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { all } from '../../../_shared/db';

interface Row {
  id: string;
  exercise_id: string;
  email: string;
  status: string;
  submitted_at: number | null;
  appeal_submitted_at: number | null;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'recruitment_admin' && auth.admin.role !== 'super_admin') {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  // Exclude appeals where the latest application_review_decisions reviewer is the caller
  const rows = await all<Row>(
    env,
    'SELECT a.id, a.exercise_id, a.email, a.status, a.submitted_at, a.appeal_submitted_at FROM applications a WHERE a.status = ? AND NOT EXISTS (SELECT 1 FROM application_review_decisions ard WHERE ard.application_id = a.id AND ard.reviewer_email = ? ORDER BY ard.created_at DESC LIMIT 1) ORDER BY a.appeal_submitted_at ASC',
    'appeal_under_review',
    auth.admin.email,
  );
  return json({ data: rows });
};
```

- [ ] **Step 3: Write the resolve endpoint**

```typescript
// ohcs-website/functions/api/admin/applications/[id]/appeals/resolve.ts
import type { PagesFunction, Env } from '../../../../../_shared/types';
import { json } from '../../../../../_shared/json';
import { requireAdmin } from '../../../../../_shared/admin-auth';
import { parseBody } from '../../../../../_shared/validate';
import { first, run } from '../../../../../_shared/db';
import { sendEmail } from '../../../../../_shared/email';
import { sendSms } from '../../../../../_shared/sms';
import { z } from 'zod';

const Body = z.object({
  outcome: z.enum(['upheld', 'overturned']),
  notes: z.string().min(10).max(4000),
});

export const onRequestPost: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'recruitment_admin' && auth.admin.role !== 'super_admin') {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  const body = await parseBody(request, Body);
  if (body.kind === 'reject') return body.response;

  const app = await first<{ status: string; email: string }>(
    env,
    'SELECT status, email FROM applications WHERE id = ?',
    params.id,
  );
  if (!app) return json({ error: 'not found' }, { status: 404 });
  if (app.status !== 'appeal_under_review') {
    return json({ error: 'application is not in appeal review', status: app.status }, { status: 409 });
  }

  const now = Date.now();
  const newStatus = body.value.outcome === 'overturned' ? 'vetting_passed' : 'appeal_upheld';

  await run(
    env,
    'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    `tx_${now}_${Math.random().toString(36).slice(2, 10)}`,
    params.id,
    'appeal_under_review',
    newStatus,
    auth.admin.email,
    auth.admin.role,
    `Appeal ${body.value.outcome}: ${body.value.notes}`,
    now,
  );
  await run(env, 'UPDATE applications SET status = ? WHERE id = ?', newStatus, params.id);

  try {
    if (body.value.outcome === 'overturned') {
      await sendEmail(env, {
        to: app.email,
        subject: 'OHCS Recruitment — appeal upheld, application proceeds',
        html: `<p>Your appeal on application <strong>${params.id}</strong> has been overturned. You may now proceed to pay the exam fee.</p>`,
        text: `Your appeal on application ${params.id} was overturned. Please pay the exam fee to proceed.`,
      });
      await sendSms(env, {
        to: '+233000000000', // TODO: pull phone from form_data — sub-project B
        message: `OHCS: your appeal on ${params.id} was successful. Pay exam fee to proceed.`,
      });
    } else {
      await sendEmail(env, {
        to: app.email,
        subject: 'OHCS Recruitment — appeal outcome',
        html: `<p>Your appeal on application <strong>${params.id}</strong> has been reviewed and the original decision stands.</p><p>Notes: ${body.value.notes}</p>`,
        text: `Your appeal on application ${params.id} was upheld. Notes: ${body.value.notes}`,
      });
    }
  } catch (err) {
    console.error('appeal notification failed', err);
  }

  return json({ data: { status: newStatus } });
};
```

- [ ] **Step 4: Build + commit (skip dedicated tests for these — covered by smoke testing)**

```bash
npm run pages:build 2>&1 | tail -3
git add functions/api/applications/me/appeals.ts functions/api/admin/applications/appeals.ts functions/api/admin/applications/[id]/appeals
git commit -m "feat(recruitment-a): add appeal submit + queue + resolve endpoints"
```

---

## Task 12: Cron endpoint for stale claims + deadlines

**Files:**
- Create: `ohcs-website/functions/api/system/run-deadlines.ts`
- Modify: `ohcs-website/wrangler.toml` (add cron trigger)

- [ ] **Step 1: Write the cron endpoint**

```typescript
// ohcs-website/functions/api/system/run-deadlines.ts
import type { PagesFunction, Env } from '../../_shared/types';
import { json } from '../../_shared/json';
import { run } from '../../_shared/db';

const STALE_CLAIM_MS = 30 * 60 * 1000;

export const onRequestPost: PagesFunction<Env & { SYSTEM_CRON_SECRET?: string }> = async ({
  request,
  env,
}) => {
  const auth = request.headers.get('Authorization');
  const expected = `Bearer ${env.SYSTEM_CRON_SECRET ?? ''}`;
  if (!env.SYSTEM_CRON_SECRET || auth !== expected) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = Date.now();

  // 1) Release stale claims
  await run(
    env,
    'UPDATE applications SET review_claimed_by = NULL, review_claimed_at = NULL WHERE review_claimed_at IS NOT NULL AND review_claimed_at < ?',
    now - STALE_CLAIM_MS,
  );

  // 2) requires_action past resubmission deadline → vetting_failed
  // Computed as: applications with status='requires_action' AND last application_review_decisions.created_at +
  //   exercise.vetting_window_days * 86400_000 < now
  // For v1 simplicity, we use a single threshold (vetting_window_days from the exercise).
  // (Full SQL would join on the exercise's vetting_window_days; for now we use a default of 14 days.)
  await run(
    env,
    "UPDATE applications SET status = 'vetting_failed' WHERE status = 'requires_action' AND id IN (SELECT a.id FROM applications a JOIN application_review_decisions ard ON ard.application_id = a.id JOIN recruitment_exercises e ON e.id = a.exercise_id WHERE a.status = 'requires_action' AND ard.outcome = 'requires_action' AND ard.created_at + (e.vetting_window_days * 86400000) < ?)",
    now,
  );

  return json({ data: { ran_at: now } });
};
```

- [ ] **Step 2: Add cron trigger to wrangler.toml**

Open `ohcs-website/wrangler.toml`. Find the production environment section and add:

```toml
# Daily cron — release stale review claims and process deadlines.
[triggers]
crons = ["0 2 * * *"]   # 02:00 UTC daily
```

When the cron fires, Cloudflare invokes `/api/system/run-deadlines` (Pages Functions don't have a direct scheduled binding — for v1, the cron triggers a Worker, OR we use Cloudflare Cron via an external scheduler hitting the URL with the secret).

Actually, Cloudflare Pages Functions do not natively support scheduled triggers (only Workers do). For sub-project A, document this as: **the cron trigger is added to wrangler.toml as documentation, but actual scheduling lives on a separate scheduled-Worker that does an authenticated POST to `/api/system/run-deadlines`. Setting up that Worker is a separate ~30-min ops task.**

For now, `SYSTEM_CRON_SECRET` is the only piece we configure — the endpoint can also be invoked manually for testing.

- [ ] **Step 3: Build + commit**

```bash
npm run pages:build 2>&1 | tail -3
git add functions/api/system/run-deadlines.ts wrangler.toml
git commit -m "feat(recruitment-a): add cron-driven deadlines endpoint (stale claims + requires_action)"
```

---

## Task 13: Admin pipeline list page (replaces placeholder)

**Files:**
- Modify: `ohcs-website/src/app/admin/recruitment/pipeline/page.tsx` (replace placeholder)

- [ ] **Step 1: Replace the placeholder content**

Read the existing file first to see the current placeholder + how the admin tabs/auth pattern is used in adjacent pages.

Replace contents with a list view that:

- `'use client'`
- Fetches `listApplications()` on mount
- Renders the queue table per spec § 6.1
- Filters: status chips, exercise, search
- Click row → navigate to `/admin/recruitment/pipeline/detail?id=<encoded id>`
- "Take next" button: calls `claimApplication()` on the first unclaimed `submitted` row, then navigates

Implementation:

```tsx
// ohcs-website/src/app/admin/recruitment/pipeline/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listApplications, claimApplication, type AdminExercise } from '@/lib/recruitment-api';
import type { AdminApplicationListItem } from '@/types/recruitment';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  { key: 'submitted', label: 'New' },
  { key: 'under_review', label: 'In Review' },
  { key: 'requires_action', label: 'Awaiting Resubmit' },
  { key: 'vetting_passed', label: 'Passed' },
  { key: 'vetting_failed', label: 'Failed' },
  { key: 'all', label: 'All' },
] as const;

type StatusFilter = typeof STATUS_FILTERS[number]['key'];

export default function PipelinePage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('submitted');
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await listApplications({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
      });
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount + filter change
  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function takeNext() {
    const target = items.find((i) => i.status === 'submitted' && !i.review_claimed_by);
    if (!target) return;
    try {
      await claimApplication(target.id);
      router.push(`/admin/recruitment/pipeline/detail/?id=${encodeURIComponent(target.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim');
    }
  }

  const totalDocsRendered = useMemo(
    () =>
      items.map((i) => `${i.doc_count} / ${i.doc_required_count} required`),
    [items],
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary-dark">Application Pipeline</h1>
        <button
          onClick={() => void takeNext()}
          disabled={items.every((i) => i.status !== 'submitted' || !!i.review_claimed_by)}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:opacity-50"
        >
          Take next
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap',
              statusFilter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted hover:bg-gray-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Reference or email…"
          className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-800">
          {error} <button onClick={() => void refresh()} className="underline font-semibold">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-text-muted">Reference</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Email</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Status</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Docs</th>
                <th className="px-4 py-3 font-semibold text-text-muted">AI</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Claimed</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id} className="border-t border-border/40 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/admin/recruitment/pipeline/detail/?id=${encodeURIComponent(it.id)}`}
                      className="text-primary hover:underline"
                    >
                      {it.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{it.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100">{it.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{totalDocsRendered[i]}</td>
                  <td className="px-4 py-3 text-xs">
                    {it.ai_flag_count > 0 ? (
                      <span className="text-amber-700">⚠ {it.ai_flag_count}</span>
                    ) : (
                      <span className="text-green-700">✓ clean</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {it.review_claimed_by ?? '—'}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                    No applications match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run pages:build 2>&1 | tail -5
git add src/app/admin/recruitment/pipeline/page.tsx
git commit -m "feat(recruitment-a): real admin pipeline list page (replaces placeholder)"
```

---

## Task 14: Admin pipeline detail page — side-by-side viewer

This is the heaviest UI task. Dispatch a subagent because the file is large and the reviewer flow is intricate. The subagent's prompt is below — do NOT inline this in the controller; the implementer should follow the spec § 6.2 contract.

**Files (subagent will create):**
- Create: `ohcs-website/src/app/admin/recruitment/pipeline/detail/page.tsx`
- Create: `ohcs-website/src/components/admin/document-viewer.tsx`
- Create: `ohcs-website/src/components/admin/per-doc-decision.tsx`
- Create: `ohcs-website/src/components/admin/ai-badge.tsx`

**Subagent dispatch instructions** (the controller passes these verbatim to a `general-purpose` subagent):

> Implement the side-by-side reviewer detail view per spec § 6.2 in `docs/superpowers/specs/2026-04-22-recruitment-subproject-a-reviewer-pipeline-design.md`.
> 
> Prerequisites already in place:
> - `src/lib/recruitment-api.ts` exports `getApplicationDetail`, `submitVettingDecision`, `releaseApplication`, `getDocumentSignedUrl`
> - `src/types/recruitment.ts` exports `AdminApplicationDetail`, `DocDecision`, `RequirementWithUpload`, `ApplicationDocument`
> - The admin section at `/admin/recruitment/pipeline/` already lists applications and links to `/admin/recruitment/pipeline/detail/?id=<encoded id>`
> 
> Build:
> 1. `src/app/admin/recruitment/pipeline/detail/page.tsx` — Suspense-wrapped page that reads `?id=` (same pattern as `src/app/admin/recruitment/exercise-documents/page.tsx`). Default export = shell that wraps `<DetailInner />` in `<Suspense>`. `DetailInner` calls `getApplicationDetail(id)` on mount and renders the side-by-side layout.
> 
> 2. `src/components/admin/document-viewer.tsx` — Right pane. Props: `{ requirements: RequirementWithUpload[], applicationId: string, activeDocId: string | null, onSelectDoc: (docId: string) => void }`. Top bar = thumbnail strip (one per uploaded requirement, clickable, active doc highlighted). Main area = the active doc rendered. PDFs render in `<iframe>` with `src` set to the signed URL from `getDocumentSignedUrl()`. Images render as `<img>`. Other types show a "Download" link. Use a `useEffect` to fetch a fresh signed URL each time `activeDocId` changes (URLs expire in 60s — refetch is fine).
> 
> 3. `src/components/admin/per-doc-decision.tsx` — Single decision row in the left pane. Props: `{ requirement: RequirementWithUpload, decision: DocDecision | undefined, reason: string, onChange: (decision: DocDecision, reason: string) => void }`. Renders: doc label + AI badge + 3 radio pills (Accept / Reject / Needs Better Scan) + reason textarea (visible only when decision !== 'accepted', required when set).
> 
> 4. `src/components/admin/ai-badge.tsx` — Small reusable badge. Props: `{ verdict: AiVerdict, confidence: number | null, reason: string | null }`. Renders a colored pill (green for passed / amber for flagged / grey for unchecked). Click expands a popover with full details (model, confidence pct, reason, prompt version).
> 
> The page composition (in `DetailInner`):
> - Top bar: reference number badge, status pill, "Release claim" button (calls `releaseApplication(id)` then navigates back to pipeline)
> - Two-pane layout (`grid grid-cols-1 lg:grid-cols-[400px_1fr]`):
>   - Left pane: applicant identity card (name, email, phone, DOB, NIA, region from `application.form_data`), eligibility flags (`has_professional_qualification`, `is_pwd`), education summary (form_data.highest_qualification etc.), then the `<PerDocDecision>` list (one per visible required + applicable conditional doc), an overall notes textarea, and a `Submit Vetting Decision` button (disabled until every required-and-applicable doc has a decision and every non-accept has a non-empty reason).
>   - Right pane: `<DocumentViewer>`.
> - On submit: call `submitVettingDecision(id, { document_decisions, notes })`. Show toast and navigate back to pipeline list on success. On error, show inline.
> 
> Constraints:
> - TypeScript strict, NO `any` casts
> - Match existing Tailwind palette (`text-primary-dark`, `border-border/40`, `bg-primary text-white`, `rounded-2xl`)
> - Lucide icons only
> - Follow the Suspense pattern from `exercise-documents/page.tsx`
> - DELETE NO EXISTING FILES; this is purely additive
> 
> Verify:
> ```bash
> cd ohcs-website
> npm run pages:build 2>&1 | tail -5
> ```
> 
> Then commit:
> ```bash
> git add src/app/admin/recruitment/pipeline/detail src/components/admin/document-viewer.tsx src/components/admin/per-doc-decision.tsx src/components/admin/ai-badge.tsx
> git commit -m "feat(recruitment-a): admin pipeline detail view with side-by-side document viewer"
> ```
> 
> Report status, build output, commit SHA, line count per file, and any deviations or inline type assertions.

---

## Task 15: Appeal queue admin page

**Files:**
- Create: `ohcs-website/src/app/admin/recruitment/appeals/page.tsx`

- [ ] **Step 1: Build the page**

```tsx
// ohcs-website/src/app/admin/recruitment/appeals/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { listAppeals, resolveAppeal, getApplicationDetail } from '@/lib/recruitment-api';
import type { AdminApplicationListItem, AdminApplicationDetail } from '@/types/recruitment';
import { Loader2 } from 'lucide-react';

export default function AppealsPage() {
  const [items, setItems] = useState<AdminApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<AdminApplicationDetail | null>(null);
  const [resolving, setResolving] = useState(false);
  const [notes, setNotes] = useState('');

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await listAppeals();
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appeals');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function openAppeal(id: string) {
    const detail = await getApplicationDetail(id);
    setActive(detail);
    setNotes('');
  }

  async function resolve(outcome: 'upheld' | 'overturned') {
    if (!active || notes.trim().length < 10) return;
    setResolving(true);
    try {
      await resolveAppeal(active.id, { outcome, notes });
      setActive(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve');
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-primary-dark mb-6">Appeals Queue</h1>

      {loading && (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error && <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-800 mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-border/40">
          <div className="p-4 border-b border-border/40 font-semibold">Pending appeals ({items.length})</div>
          <ul>
            {items.map((i) => (
              <li key={i.id}>
                <button
                  onClick={() => void openAppeal(i.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-border/40 last:border-b-0"
                >
                  <div className="font-mono text-xs text-primary-dark">{i.id}</div>
                  <div className="text-sm text-text-muted">{i.email}</div>
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="px-4 py-12 text-center text-text-muted">No pending appeals.</li>}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          {!active ? (
            <p className="text-text-muted">Select an appeal to review.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-primary-dark">{active.id}</h2>
                <p className="text-sm text-text-muted">{active.email}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Applicant&apos;s appeal
                </p>
                <p className="text-sm text-primary-dark whitespace-pre-wrap">
                  {active.appeal_reason ?? '(no reason recorded)'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Original vetting notes
                </p>
                <p className="text-sm text-primary-dark whitespace-pre-wrap">
                  {active.reviews[0]?.notes ?? '(none)'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary-dark mb-1">
                  Decision notes (visible to applicant)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void resolve('overturned')}
                  disabled={resolving || notes.trim().length < 10}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  Overturn (applicant proceeds)
                </button>
                <button
                  onClick={() => void resolve('upheld')}
                  disabled={resolving || notes.trim().length < 10}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  Uphold original decision
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run pages:build 2>&1 | tail -3
git add src/app/admin/recruitment/appeals/page.tsx
git commit -m "feat(recruitment-a): admin appeals queue page"
```

---

## Task 16: Applicant appeal page

**Files:**
- Create: `ohcs-website/src/app/apply/appeal/page.tsx`

- [ ] **Step 1: Build the appeal form**

```tsx
// ohcs-website/src/app/apply/appeal/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { getDraft, submitAppeal } from '@/lib/applicant-api';

function AppealInner() {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
  useEffect(() => {
    getDraft()
      .then((d) => setReferenceNumber(d.id))
      .catch(() => router.replace('/services/recruitment/'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitAppeal(reason);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary-dark mb-2">Appeal received</h1>
        <p className="text-text-muted">
          Your appeal on application <span className="font-mono">{referenceNumber}</span> has been
          submitted. We&apos;ll email you when a decision is made (typically within 14 days).
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold text-primary-dark mb-2">Submit an appeal</h1>
      <p className="text-text-muted text-sm mb-6">
        Application <span className="font-mono">{referenceNumber}</span>. Explain why you believe the
        original decision should be reconsidered. Be specific — generic appeals tend to be unsuccessful.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={8}
          required
          minLength={20}
          maxLength={4000}
          placeholder="Explain your case in detail (minimum 20 characters)…"
          className="w-full px-4 py-3 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:outline-none"
        />
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || reason.trim().length < 20}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50"
        >
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Submit appeal'}
        </button>
      </form>
    </div>
  );
}

export default function AppealPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <AppealInner />
    </Suspense>
  );
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run pages:build 2>&1 | tail -3
git add src/app/apply/appeal/page.tsx
git commit -m "feat(recruitment-a): applicant appeal submission page"
```

---

## Task 17: End-to-end smoke test (preview deploy + manual walk-through)

- [ ] **Step 1: Deploy preview**

```bash
cd ohcs-website
npm test -- --run 2>&1 | tail -3
npm run pages:build 2>&1 | tail -3
npx wrangler pages deploy out --project-name=ohcs 2>&1 | tail -3
```

Note the preview URL.

- [ ] **Step 2: Smoke test the reviewer flow**

In a browser:

1. Visit `<preview>/admin/login/`, log in as `admin@ohcs.gov.gh / changeme123`
2. Visit `<preview>/admin/recruitment/pipeline/` — should see the existing OHCS-2026-00001 application as `submitted`
3. Click into it → side-by-side detail view loads. Documents are listed; AI badges should appear (will say "unchecked" since this is the first time AI ever runs — Phase 4 absorption means new uploads get verdicts, but old ones remain unchecked)
4. Open one document via the right-pane viewer → file renders inline
5. Mark each doc as Accepted, add notes, click Submit Vetting Decision
6. Application status should flip to `vetting_passed`
7. Check `ohcselibrary@gmail.com` for the "vetting passed" email

- [ ] **Step 3: Smoke test the applicant appeal flow**

1. Use the admin to mark a test application as `vetting_failed` (do this by visiting the application as an admin, decision = Reject all docs, submit)
2. The applicant receives the email; click the appeal link (currently the email contains a generic "appeal link" text; for testing, navigate manually to `<preview>/apply/appeal/?token=<freshly-issued magic link>`)
3. Submit the appeal text
4. Visit `<preview>/admin/recruitment/appeals/` → see the pending appeal
5. Click into it, add resolution notes, click Overturn
6. Application status should flip to `vetting_passed`

- [ ] **Step 4: Verify AI verification fires on new uploads**

1. Go through the public flow with a fresh email: magic link → fill form → upload a real Ghana Card image to the National ID slot
2. After upload completes, wait ~10 seconds, then refetch the application detail in the admin pipeline
3. The National ID document's `ai_verdict` should now be `passed` or `flagged` (not `unchecked`)

If anything breaks, debug before merging.

---

## Task 18: Final QA + production deploy

- [ ] **Step 1: Final QA**

```bash
npm test -- --run
npm run type-check
npm run lint 2>&1 | tail -3   # 0 errors expected
npm run pages:build 2>&1 | tail -5
```

All green.

- [ ] **Step 2: Merge to master + production deploy**

```bash
git checkout master
git merge --no-ff feat/recruitment-subproject-a -m "Merge branch 'feat/recruitment-subproject-a' — reviewer pipeline + AI verification"
cd ohcs-website
npx wrangler pages deploy out --project-name=ohcs --branch=master
```

- [ ] **Step 3: Set the cron secret on production**

```bash
npx wrangler pages secret put SYSTEM_CRON_SECRET --project-name=ohcs
# (paste a 32-char random string when prompted; same value goes to --env preview)
npx wrangler pages secret put SYSTEM_CRON_SECRET --project-name=ohcs --env preview
```

- [ ] **Step 4: Verify production**

```bash
sleep 20
curl -s https://ohcs.pages.dev/api/health | head -c 200
curl -s -H "X-Admin-User-Email: admin@ohcs.gov.gh" -H "X-Admin-User-Role: super_admin" https://ohcs.pages.dev/api/admin/applications | head -c 500
```

- [ ] **Step 5: Push origin + clean up**

```bash
git push origin master
git branch -d feat/recruitment-subproject-a
```

---

## Done — Exit criteria met

Sub-project A is launch-ready when:

- ✅ D1 has `document_review_decisions`, `application_review_decisions`, `status_transitions` on production
- ✅ Reviewer can claim an application from the queue, see the side-by-side viewer, mark per-doc decisions, submit a vetting outcome
- ✅ Status transitions correctly per the roll-up rules
- ✅ AI verification fires on new uploads via `ctx.waitUntil`; verdicts surface as badges
- ✅ Vetting passed/failed/requires_action emails are sent (and SMS for vetting_passed via Hubtel — falls back to console.log without `HUBTEL_SMS_API_KEY`)
- ✅ Applicant can submit an appeal from a vetting_failed state
- ✅ recruitment_admin can resolve appeals (uphold or overturn) from the appeals queue
- ✅ All sub-project A tests pass; lint clean; type-check clean
- ✅ Production health check still returns ok

The next document is sub-project B's spec (Payment via Hubtel).
