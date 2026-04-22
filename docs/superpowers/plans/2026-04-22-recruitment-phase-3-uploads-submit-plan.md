# Recruitment Phase 3 — Document Uploads & Submission Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Step 4 placeholder with a real document-upload UI backed by R2, gate Step 5's Submit button on completeness, send a confirmation email with the reference number on submit, and let applicants look up their application status from `/track`.

**Architecture:** A new D1 table (`application_documents`) stores upload metadata; the actual files live in R2 under `{exercise_id}/{application_id}/{doc_type_id}.{ext}`. Three new Pages Functions endpoints handle upload (multipart), delete, and submit. Step 4 is dynamically rendered from the exercise's document requirements (already in D1 from Phase 1) plus the applicant's eligibility flags (already in D1 from Phase 2). AI verification is intentionally NOT in this phase — that lands in Phase 4 on top of this foundation.

**Tech Stack:** Cloudflare D1, Cloudflare R2, Cloudflare Pages Functions, Next.js 16 (static export, React 19), Vitest, Resend (existing email pipeline).

**Spec reference:** `docs/superpowers/specs/2026-04-21-recruitment-document-requirements-design.md` § 4.2 (data model row), § 6.3 (Step 4 UX), § 7.1 (public endpoints), § 7.4 (upload endpoint flow), § 11 Phase 3.

---

## What's intentionally NOT in this phase

- **AI verification** — every upload returns `ai_verdict='unchecked'`. Phase 4 wires the Workers AI checks on top.
- **Auto-retry × 3 with exponential backoff** — XHR/fetch retries are a Phase 6 reliability pass. v1 surfaces a single error and lets the applicant click Replace.
- **Polling for AI verdict** — N/A in this phase since there's no AI yet.
- **Admin reviewer download URLs** — Phase 5 work; the Admin pipeline UI is separate.
- **Applicant preview of their own uploaded files** — out of scope. Filename + state badge is enough.

---

## Static-Export Constraint (carry-over from Phase 2)

The site is built with `output: "export"`. Pages Functions handle dynamic routes via `[docTypeId]` folder convention; React pages cannot. The Step 4 component is part of the existing `/apply/form` Suspense-wrapped wizard.

---

## File Structure

| Path | Responsibility |
|---|---|
| `ohcs-website/migrations/0005_application_documents.sql` | New table for document metadata |
| `ohcs-website/functions/_shared/r2-keys.ts` | Build the R2 object key from exercise/application/docType (deterministic) |
| `ohcs-website/functions/_shared/file-validate.ts` | MIME + size + content-sniff (first 4 bytes against magic numbers) |
| `ohcs-website/functions/_shared/submit-email.ts` | HTML+text body for the post-submit confirmation email |
| `ohcs-website/functions/api/applications/me/requirements.ts` | `GET` — merged view of exercise requirements + the applicant's current uploads + flags |
| `ohcs-website/functions/api/applications/me/documents/[docTypeId].ts` | `POST` (multipart upload) + `DELETE` |
| `ohcs-website/functions/api/applications/me/submit.ts` | `POST` — validates completeness, flips status, sends confirmation email |
| `ohcs-website/functions/api/applications/track.ts` | `GET ?ref=&email=` — public read-only status lookup |
| `ohcs-website/src/types/recruitment.ts` | Append `ApplicationDocument`, `RequirementWithUpload`, `ApplicantRequirementsView` |
| `ohcs-website/src/lib/applicant-api.ts` | Append: `getRequirements`, `uploadDocument`, `deleteDocument`, `submitApplication` |
| `ohcs-website/src/components/recruitment/step-documents.tsx` | NEW — real Step 4 (replaces stub) |
| `ohcs-website/src/components/recruitment/step-documents-stub.tsx` | DELETE this file |
| `ohcs-website/src/components/recruitment/wizard-shell.tsx` | Wire Step 4 to the new component; enable Submit on Step 5 when complete |
| `ohcs-website/src/components/recruitment/step-review.tsx` | Wire real Submit handler (was disabled stub); show post-submit success state |
| `ohcs-website/src/components/recruitment/upload-slot.tsx` | NEW — single-file drag-drop slot with state badges (empty / uploading / verified / rejected) |
| `ohcs-website/src/app/track/page.tsx` | Add a recruitment-application path: if reference starts with `OHCS-`, call the new track endpoint instead of the existing complaints/RTI tracker |
| Tests under `tests/functions/applications/` | Per endpoint |

---

## Prerequisites

- Phases 0, 1, 2 are deployed (production health endpoint returns ok, master library has 15 doc types, magic-link form wizard works end-to-end)
- A fresh feature branch: `git checkout -b feat/recruitment-phase-3` from `master`
- `RESEND_API_KEY` already set on production + preview Pages secrets (from earlier work)

---

## Task 1: Migration 0005 — `application_documents` table

**Files:**
- Create: `ohcs-website/migrations/0005_application_documents.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ohcs-website/migrations/0005_application_documents.sql

CREATE TABLE IF NOT EXISTS application_documents (
  id                  TEXT PRIMARY KEY,
  application_id      TEXT NOT NULL,
  document_type_id    TEXT NOT NULL,
  r2_key              TEXT NOT NULL,
  original_filename   TEXT NOT NULL,
  size_bytes          INTEGER NOT NULL,
  mime_type           TEXT NOT NULL,
  sha256              TEXT NOT NULL,
  uploaded_at         INTEGER NOT NULL,
  ai_verdict          TEXT NOT NULL DEFAULT 'unchecked',  -- 'passed' | 'flagged' | 'unchecked' (Phase 4 sets the others)
  ai_confidence       REAL,
  ai_reason           TEXT,
  ai_prompt_version   TEXT,
  manual_flag         TEXT,
  applicant_confirmed INTEGER NOT NULL DEFAULT 0,
  UNIQUE (application_id, document_type_id)
);

CREATE INDEX IF NOT EXISTS idx_app_docs_application
  ON application_documents(application_id);
```

- [ ] **Step 2: Apply local + remote**

```bash
cd ohcs-website
npm run migrate
npm run migrate:remote
```

Expected: each prints `✅ Applied 1 migration(s).`

- [ ] **Step 3: Verify**

```bash
npx wrangler d1 execute ohcs-recruitment --remote --command="PRAGMA table_info(application_documents)"
```

Expected: 14 columns matching the CREATE TABLE.

- [ ] **Step 4: Commit**

```bash
git add migrations/0005_application_documents.sql
git commit -m "feat(recruitment): add application_documents table for upload metadata"
```

---

## Task 2: R2 key helper

**Files:**
- Create: `ohcs-website/functions/_shared/r2-keys.ts`
- Create: `ohcs-website/tests/functions/_shared/r2-keys.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/_shared/r2-keys.test.ts
import { describe, it, expect } from 'vitest';
import { applicationDocKey, extensionForMime } from '../../../functions/_shared/r2-keys';

describe('extensionForMime', () => {
  it('returns the canonical extension for accepted MIMEs', () => {
    expect(extensionForMime('application/pdf')).toBe('pdf');
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('image/png')).toBe('png');
  });

  it('returns "bin" for unknown MIMEs (defensive)', () => {
    expect(extensionForMime('application/octet-stream')).toBe('bin');
  });
});

describe('applicationDocKey', () => {
  it('builds the canonical R2 key', () => {
    expect(applicationDocKey('ex-001', 'OHCS-2026-00001', 'national_id', 'application/pdf'))
      .toBe('ex-001/OHCS-2026-00001/national_id.pdf');
    expect(applicationDocKey('ex-001', 'OHCS-2026-00001', 'passport_photo', 'image/jpeg'))
      .toBe('ex-001/OHCS-2026-00001/passport_photo.jpg');
  });
});
```

Run: `npx vitest run tests/functions/_shared/r2-keys.test.ts` → 4 fail.

Commit:
```bash
git add tests/functions/_shared/r2-keys.test.ts
git commit -m "test(recruitment): add failing tests for R2 key helper"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/_shared/r2-keys.ts

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export function extensionForMime(mime: string): string {
  return MIME_TO_EXT[mime] ?? 'bin';
}

export function applicationDocKey(
  exerciseId: string,
  applicationId: string,
  docTypeId: string,
  mime: string,
): string {
  return `${exerciseId}/${applicationId}/${docTypeId}.${extensionForMime(mime)}`;
}
```

Run tests → 4 PASS. Commit:

```bash
git add functions/_shared/r2-keys.ts
git commit -m "feat(recruitment): add R2 key helper (canonical exercise/app/doc layout)"
```

---

## Task 3: File validation helper (MIME + size + content sniff)

**Files:**
- Create: `ohcs-website/functions/_shared/file-validate.ts`
- Create: `ohcs-website/tests/functions/_shared/file-validate.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/_shared/file-validate.test.ts
import { describe, it, expect } from 'vitest';
import { sniffMime, validateFile } from '../../../functions/_shared/file-validate';

const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RANDOM = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

describe('sniffMime', () => {
  it('detects PDF', () => expect(sniffMime(PDF_MAGIC)).toBe('application/pdf'));
  it('detects JPEG', () => expect(sniffMime(JPEG_MAGIC)).toBe('image/jpeg'));
  it('detects PNG', () => expect(sniffMime(PNG_MAGIC)).toBe('image/png'));
  it('returns null for unrecognised bytes', () => expect(sniffMime(RANDOM)).toBeNull());
});

describe('validateFile', () => {
  it('passes when MIME, sniff, and size all match', () => {
    const r = validateFile({
      claimedMime: 'application/pdf',
      sizeBytes: 1024,
      acceptedMimes: ['application/pdf', 'image/jpeg'],
      maxBytes: 5 * 1024 * 1024,
      head: PDF_MAGIC,
    });
    expect(r.kind).toBe('ok');
  });

  it('rejects when claimed MIME is not in accepted list', () => {
    const r = validateFile({
      claimedMime: 'image/gif',
      sizeBytes: 1024,
      acceptedMimes: ['application/pdf'],
      maxBytes: 5_000_000,
      head: PDF_MAGIC,
    });
    expect(r.kind).toBe('reject');
    if (r.kind === 'reject') expect(r.reason).toMatch(/mime/i);
  });

  it('rejects when oversized', () => {
    const r = validateFile({
      claimedMime: 'application/pdf',
      sizeBytes: 6 * 1024 * 1024,
      acceptedMimes: ['application/pdf'],
      maxBytes: 5 * 1024 * 1024,
      head: PDF_MAGIC,
    });
    expect(r.kind).toBe('reject');
    if (r.kind === 'reject') expect(r.reason).toMatch(/size|too large/i);
  });

  it('rejects when sniffed MIME does not match claimed', () => {
    const r = validateFile({
      claimedMime: 'application/pdf',
      sizeBytes: 1024,
      acceptedMimes: ['application/pdf'],
      maxBytes: 5_000_000,
      head: JPEG_MAGIC, // sniff says JPEG but claim says PDF
    });
    expect(r.kind).toBe('reject');
    if (r.kind === 'reject') expect(r.reason).toMatch(/mismatch|sniff/i);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/_shared/file-validate.test.ts
git commit -m "test(recruitment): add failing tests for file validation helper"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/_shared/file-validate.ts

export type SniffMime = 'application/pdf' | 'image/jpeg' | 'image/png';

export interface ValidateInput {
  claimedMime: string;
  sizeBytes: number;
  acceptedMimes: string[];
  maxBytes: number;
  head: Uint8Array;            // first ≥ 8 bytes of the file body
}

export type ValidateResult =
  | { kind: 'ok' }
  | { kind: 'reject'; reason: string };

export function sniffMime(head: Uint8Array): SniffMime | null {
  if (head.length >= 4 && head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46) {
    return 'application/pdf';
  }
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    head.length >= 8 &&
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 &&
    head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a
  ) {
    return 'image/png';
  }
  return null;
}

export function validateFile(input: ValidateInput): ValidateResult {
  if (!input.acceptedMimes.includes(input.claimedMime)) {
    return {
      kind: 'reject',
      reason: `mime not accepted: ${input.claimedMime}; expected one of ${input.acceptedMimes.join(', ')}`,
    };
  }
  if (input.sizeBytes > input.maxBytes) {
    return {
      kind: 'reject',
      reason: `file too large: ${input.sizeBytes} bytes (max ${input.maxBytes})`,
    };
  }
  const sniffed = sniffMime(input.head);
  if (sniffed && sniffed !== input.claimedMime) {
    return {
      kind: 'reject',
      reason: `mime mismatch: claimed ${input.claimedMime}, sniffed ${sniffed}`,
    };
  }
  // If sniff returned null, allow it — we only block on positive mismatch.
  return { kind: 'ok' };
}
```

Run tests → all PASS. Commit:

```bash
git add functions/_shared/file-validate.ts
git commit -m "feat(recruitment): add file validation helper (mime + size + magic-byte sniff)"
```

---

## Task 4: `GET /api/applications/me/requirements`

This endpoint feeds Step 4: it returns the merged view of (a) what documents the exercise requires, (b) which conditional ones are triggered by the applicant's flags, and (c) what the applicant has already uploaded.

**Files:**
- Modify: `ohcs-website/src/types/recruitment.ts` — append types
- Create: `ohcs-website/functions/api/applications/me/requirements.ts`
- Create: `ohcs-website/tests/functions/applications/requirements.test.ts`

- [ ] **Step 1: Append types to `src/types/recruitment.ts`**

```typescript
// Append at the bottom of src/types/recruitment.ts:

// ─── Documents (Phase 3) ─────────────────────────────────────────────────

export type AiVerdict = 'passed' | 'flagged' | 'unchecked';

export interface ApplicationDocument {
  id: string;
  document_type_id: string;
  original_filename: string;
  size_bytes: number;
  mime_type: string;
  sha256: string;
  uploaded_at: number;
  ai_verdict: AiVerdict;
  ai_reason: string | null;
  applicant_confirmed: boolean;
}

export interface RequirementWithUpload {
  document_type_id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  conditional_on: ConditionalTrigger | null;
  display_order: number;
  max_mb: number;                  // resolved (override or default)
  accepted_mimes: string[];
  ai_check_type: AiCheckType;
  upload: ApplicationDocument | null;   // null when slot is empty
  visible: boolean;                 // false when conditional_on is set and the trigger is off
}

export interface ApplicantRequirementsView {
  exercise_id: string;
  has_professional_qualification: boolean;
  is_pwd: boolean;
  requirements: RequirementWithUpload[];
}
```

- [ ] **Step 2: Write failing tests**

```typescript
// ohcs-website/tests/functions/applications/requirements.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/applications/me/requirements';
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

describe('GET /api/applications/me/requirements', () => {
  it('merges exercise requirements with the applicant flags + uploads', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT has_professional_qualification, is_pwd FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: { has_professional_qualification: 1, is_pwd: 0 },
      },
      {
        sql:
          'SELECT r.document_type_id, r.is_required, r.conditional_on, r.display_order, r.max_mb_override, t.label, t.description, t.default_max_mb, t.accepted_mimes, t.ai_check_type FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? ORDER BY r.display_order ASC',
        binds: ['ex-001'],
        all: {
          results: [
            {
              document_type_id: 'national_id',
              is_required: 1,
              conditional_on: null,
              display_order: 0,
              max_mb_override: null,
              label: 'National ID (Ghana Card)',
              description: null,
              default_max_mb: 5,
              accepted_mimes: '["application/pdf","image/jpeg","image/png"]',
              ai_check_type: 'identity',
            },
            {
              document_type_id: 'professional_cert',
              is_required: 1,
              conditional_on: 'has_professional_qualification',
              display_order: 1,
              max_mb_override: null,
              label: 'Professional Qualification',
              description: null,
              default_max_mb: 5,
              accepted_mimes: '["application/pdf"]',
              ai_check_type: 'certificate',
            },
            {
              document_type_id: 'medical_certificate_pwd',
              is_required: 1,
              conditional_on: 'is_pwd',
              display_order: 2,
              max_mb_override: null,
              label: 'Medical Certificate (PWD)',
              description: null,
              default_max_mb: 5,
              accepted_mimes: '["application/pdf"]',
              ai_check_type: 'certificate',
            },
          ],
        },
      },
      {
        sql:
          'SELECT id, document_type_id, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, ai_reason, applicant_confirmed FROM application_documents WHERE application_id = ?',
        binds: ['OHCS-2026-00001'],
        all: {
          results: [
            {
              id: 'doc-1',
              document_type_id: 'national_id',
              original_filename: 'card.pdf',
              size_bytes: 1024,
              mime_type: 'application/pdf',
              sha256: 'abc',
              uploaded_at: 1,
              ai_verdict: 'unchecked',
              ai_reason: null,
              applicant_confirmed: 0,
            },
          ],
        },
      },
    ]);

    const req = new Request('https://x/api/applications/me/requirements', { headers: { Cookie: SESSION_COOKIE } });
    const res = await onRequestGet(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        exercise_id: string;
        has_professional_qualification: boolean;
        is_pwd: boolean;
        requirements: Array<{
          document_type_id: string;
          visible: boolean;
          upload: { document_type_id: string } | null;
          accepted_mimes: string[];
          max_mb: number;
        }>;
      };
    };
    expect(body.data.exercise_id).toBe('ex-001');
    expect(body.data.has_professional_qualification).toBe(true);
    expect(body.data.requirements).toHaveLength(3);
    expect(body.data.requirements[0]!.document_type_id).toBe('national_id');
    expect(body.data.requirements[0]!.visible).toBe(true);
    expect(body.data.requirements[0]!.upload?.document_type_id).toBe('national_id');
    expect(body.data.requirements[0]!.accepted_mimes).toEqual(['application/pdf', 'image/jpeg', 'image/png']);
    expect(body.data.requirements[0]!.max_mb).toBe(5);
    // professional_cert is visible because has_professional_qualification=true
    expect(body.data.requirements[1]!.visible).toBe(true);
    // medical_certificate_pwd is hidden because is_pwd=false
    expect(body.data.requirements[2]!.visible).toBe(false);
  });

  it('returns 401 without session', async () => {
    const res = await onRequestGet(ctx(new Request('https://x/api/applications/me/requirements')));
    expect(res.status).toBe(401);
  });
});
```

Run: red. Commit failing tests + types.

```bash
git add src/types/recruitment.ts tests/functions/applications/requirements.test.ts
git commit -m "test(recruitment): add types + failing tests for /me/requirements"
```

- [ ] **Step 3: Implement**

```typescript
// ohcs-website/functions/api/applications/me/requirements.ts
import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { first, all } from '../../../_shared/db';
import { requireApplicant } from '../../../_shared/applicant-session';
import type {
  ApplicantRequirementsView,
  RequirementWithUpload,
  AiCheckType,
  AiVerdict,
  ConditionalTrigger,
} from '../../../../src/types/recruitment';

interface FlagsRow {
  has_professional_qualification: number;
  is_pwd: number;
}

interface RequirementRow {
  document_type_id: string;
  is_required: number;
  conditional_on: string | null;
  display_order: number;
  max_mb_override: number | null;
  label: string;
  description: string | null;
  default_max_mb: number;
  accepted_mimes: string;     // JSON array
  ai_check_type: AiCheckType;
}

interface UploadRow {
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

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;

  const flags = await first<FlagsRow>(
    env,
    'SELECT has_professional_qualification, is_pwd FROM applications WHERE id = ?',
    auth.application.id,
  );
  if (!flags) return json({ error: 'application not found' }, { status: 404 });

  const reqs = await all<RequirementRow>(
    env,
    'SELECT r.document_type_id, r.is_required, r.conditional_on, r.display_order, r.max_mb_override, t.label, t.description, t.default_max_mb, t.accepted_mimes, t.ai_check_type FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? ORDER BY r.display_order ASC',
    auth.application.exercise_id,
  );

  const uploads = await all<UploadRow>(
    env,
    'SELECT id, document_type_id, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, ai_reason, applicant_confirmed FROM application_documents WHERE application_id = ?',
    auth.application.id,
  );
  const uploadByType = new Map(uploads.map((u) => [u.document_type_id, u]));

  const hasPro = flags.has_professional_qualification === 1;
  const isPwd = flags.is_pwd === 1;

  const requirements: RequirementWithUpload[] = reqs.map((r) => {
    const conditional = (r.conditional_on as ConditionalTrigger | null) ?? null;
    const visible =
      conditional === null
        ? true
        : conditional === 'has_professional_qualification'
          ? hasPro
          : conditional === 'is_pwd'
            ? isPwd
            : true;
    const u = uploadByType.get(r.document_type_id);
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
      upload: u
        ? {
            id: u.id,
            document_type_id: u.document_type_id,
            original_filename: u.original_filename,
            size_bytes: u.size_bytes,
            mime_type: u.mime_type,
            sha256: u.sha256,
            uploaded_at: u.uploaded_at,
            ai_verdict: u.ai_verdict,
            ai_reason: u.ai_reason,
            applicant_confirmed: u.applicant_confirmed === 1,
          }
        : null,
      visible,
    };
  });

  const data: ApplicantRequirementsView = {
    exercise_id: auth.application.exercise_id,
    has_professional_qualification: hasPro,
    is_pwd: isPwd,
    requirements,
  };
  return json({ data });
};
```

Run tests → all PASS. Commit:

```bash
git add functions/api/applications/me/requirements.ts
git commit -m "feat(recruitment): add GET /api/applications/me/requirements (merged view)"
```

---

## Task 5: `POST` and `DELETE` `/api/applications/me/documents/[docTypeId]`

**Files:**
- Create: `ohcs-website/functions/api/applications/me/documents/[docTypeId].ts`
- Create: `ohcs-website/tests/functions/applications/documents.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/applications/documents.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  onRequestPost,
  onRequestDelete,
} from '../../../functions/api/applications/me/documents/[docTypeId]';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';
import type { Env } from '../../../functions/_shared/types';

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
  return { sql: 'UPDATE application_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?', run: {} };
}

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]); // "%PDF-1.4\n"

function makeR2Mock(): R2Bucket {
  const calls: Array<{ method: string; key: string }> = [];
  const store = {
    put: vi.fn(async (key: string) => {
      calls.push({ method: 'put', key });
      return { key } as R2Object;
    }),
    delete: vi.fn(async (key: string) => {
      calls.push({ method: 'delete', key });
    }),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (store as any).__calls = calls;
  return store as unknown as R2Bucket;
}

function ctx(req: Request, docTypeId: string, db?: D1Database, env?: Partial<Env>) {
  return {
    request: req,
    env: { ...mockEnv({ db }), ...env },
    params: { docTypeId },
    waitUntil: () => {},
    data: {},
  };
}

function buildUploadRequest(body: Uint8Array, mime: string): Request {
  const fd = new FormData();
  fd.append('file', new Blob([body], { type: mime }), 'card.pdf');
  return new Request('https://x/api/applications/me/documents/national_id', {
    method: 'POST',
    headers: { Cookie: SESSION_COOKIE },
    body: fd,
  });
}

describe('POST /api/applications/me/documents/[docTypeId]', () => {
  it('writes the file to R2, records metadata, returns 201', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      // Look up the requirement so we know accepted MIMEs + max size
      {
        sql:
          'SELECT r.is_required, r.max_mb_override, t.accepted_mimes, t.default_max_mb FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? AND r.document_type_id = ?',
        binds: ['ex-001', 'national_id'],
        first: { is_required: 1, max_mb_override: null, accepted_mimes: '["application/pdf"]', default_max_mb: 5 },
      },
      // Look up any existing upload for this slot (for replace flow)
      {
        sql: 'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
        binds: ['OHCS-2026-00001', 'national_id'],
      },
      // Upsert the row
      {
        sql:
          'INSERT INTO application_documents (id, application_id, document_type_id, r2_key, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, applicant_confirmed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(application_id, document_type_id) DO UPDATE SET r2_key=excluded.r2_key, original_filename=excluded.original_filename, size_bytes=excluded.size_bytes, mime_type=excluded.mime_type, sha256=excluded.sha256, uploaded_at=excluded.uploaded_at, ai_verdict=excluded.ai_verdict, ai_reason=NULL, ai_confidence=NULL, ai_prompt_version=NULL, manual_flag=NULL, applicant_confirmed=0',
        run: {},
      },
    ]);
    const r2 = makeR2Mock();
    const req = buildUploadRequest(PDF_BYTES, 'application/pdf');
    const res = await onRequestPost(ctx(req, 'national_id', db, { UPLOADS: r2 }));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { document_type_id: string; size_bytes: number } };
    expect(body.data.document_type_id).toBe('national_id');
    expect(body.data.size_bytes).toBe(PDF_BYTES.length);
  });

  it('returns 400 when MIME is wrong', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql:
          'SELECT r.is_required, r.max_mb_override, t.accepted_mimes, t.default_max_mb FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? AND r.document_type_id = ?',
        binds: ['ex-001', 'national_id'],
        first: { is_required: 1, max_mb_override: null, accepted_mimes: '["application/pdf"]', default_max_mb: 5 },
      },
    ]);
    const r2 = makeR2Mock();
    const req = buildUploadRequest(PDF_BYTES, 'image/gif');
    const res = await onRequestPost(ctx(req, 'national_id', db, { UPLOADS: r2 }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when docTypeId is not in the exercise requirements', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql:
          'SELECT r.is_required, r.max_mb_override, t.accepted_mimes, t.default_max_mb FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? AND r.document_type_id = ?',
        binds: ['ex-001', 'unknown_doc'],
      },
    ]);
    const r2 = makeR2Mock();
    const res = await onRequestPost(
      ctx(buildUploadRequest(PDF_BYTES, 'application/pdf'), 'unknown_doc', db, { UPLOADS: r2 }),
    );
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/applications/me/documents/[docTypeId]', () => {
  it('deletes the R2 object and the metadata row', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
        binds: ['OHCS-2026-00001', 'national_id'],
        first: { r2_key: 'ex-001/OHCS-2026-00001/national_id.pdf' },
      },
      {
        sql: 'DELETE FROM application_documents WHERE application_id = ? AND document_type_id = ?',
        binds: ['OHCS-2026-00001', 'national_id'],
        run: {},
      },
    ]);
    const r2 = makeR2Mock();
    const req = new Request('https://x/api/applications/me/documents/national_id', {
      method: 'DELETE',
      headers: { Cookie: SESSION_COOKIE },
    });
    const res = await onRequestDelete(ctx(req, 'national_id', db, { UPLOADS: r2 }));
    expect(res.status).toBe(204);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/applications/documents.test.ts
git commit -m "test(recruitment): add failing tests for documents POST/DELETE"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/applications/me/documents/[docTypeId].ts
import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { first, run } from '../../../../_shared/db';
import { requireApplicant } from '../../../../_shared/applicant-session';
import { validateFile } from '../../../../_shared/file-validate';
import { applicationDocKey } from '../../../../_shared/r2-keys';

const MB = 1024 * 1024;
const HEAD_BYTES = 16;

interface RequirementRow {
  is_required: number;
  max_mb_override: number | null;
  accepted_mimes: string;
  default_max_mb: number;
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function sanitiseFilename(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'upload';
}

export const onRequestPost: PagesFunction<Env, 'docTypeId'> = async ({ request, env, params }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.application.status !== 'draft') {
    return json({ error: 'application not editable', status: auth.application.status }, { status: 409 });
  }

  const reqRow = await first<RequirementRow>(
    env,
    'SELECT r.is_required, r.max_mb_override, t.accepted_mimes, t.default_max_mb FROM exercise_document_requirements r JOIN document_types t ON t.id = r.document_type_id WHERE r.exercise_id = ? AND r.document_type_id = ?',
    auth.application.exercise_id,
    params.docTypeId,
  );
  if (!reqRow) return json({ error: 'document type not in this exercise' }, { status: 404 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'multipart body expected' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return json({ error: 'missing "file" field in multipart body' }, { status: 400 });
  }

  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const head = bytes.slice(0, HEAD_BYTES);

  const accepted = JSON.parse(reqRow.accepted_mimes) as string[];
  const maxMb = reqRow.max_mb_override ?? reqRow.default_max_mb;
  const validated = validateFile({
    claimedMime: file.type,
    sizeBytes: file.size,
    acceptedMimes: accepted,
    maxBytes: maxMb * MB,
    head,
  });
  if (validated.kind === 'reject') return json({ error: validated.reason }, { status: 400 });

  const sha = await sha256Hex(buf);
  const key = applicationDocKey(auth.application.exercise_id, auth.application.id, params.docTypeId, file.type);
  const originalFilename = sanitiseFilename(file.name);

  // Replace flow: delete previous R2 object if any
  const existing = await first<{ r2_key: string }>(
    env,
    'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
    auth.application.id,
    params.docTypeId,
  );
  if (existing && existing.r2_key !== key) {
    await env.UPLOADS.delete(existing.r2_key);
  }

  await env.UPLOADS.put(key, buf, {
    httpMetadata: { contentType: file.type, contentDisposition: `attachment; filename="${originalFilename}"` },
    customMetadata: {
      application_id: auth.application.id,
      document_type_id: params.docTypeId,
      sha256: sha,
    },
  });

  const id = `doc_${auth.application.id}_${params.docTypeId}`;
  const now = Date.now();
  await run(
    env,
    'INSERT INTO application_documents (id, application_id, document_type_id, r2_key, original_filename, size_bytes, mime_type, sha256, uploaded_at, ai_verdict, applicant_confirmed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0) ON CONFLICT(application_id, document_type_id) DO UPDATE SET r2_key=excluded.r2_key, original_filename=excluded.original_filename, size_bytes=excluded.size_bytes, mime_type=excluded.mime_type, sha256=excluded.sha256, uploaded_at=excluded.uploaded_at, ai_verdict=excluded.ai_verdict, ai_reason=NULL, ai_confidence=NULL, ai_prompt_version=NULL, manual_flag=NULL, applicant_confirmed=0',
    id, auth.application.id, params.docTypeId, key, originalFilename, file.size, file.type, sha, now, 'unchecked',
  );

  return json(
    {
      data: {
        id,
        document_type_id: params.docTypeId,
        original_filename: originalFilename,
        size_bytes: file.size,
        mime_type: file.type,
        sha256: sha,
        uploaded_at: now,
        ai_verdict: 'unchecked' as const,
      },
    },
    { status: 201 },
  );
};

export const onRequestDelete: PagesFunction<Env, 'docTypeId'> = async ({ request, env, params }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.application.status !== 'draft') {
    return json({ error: 'application not editable', status: auth.application.status }, { status: 409 });
  }

  const existing = await first<{ r2_key: string }>(
    env,
    'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
    auth.application.id,
    params.docTypeId,
  );
  if (existing) {
    await env.UPLOADS.delete(existing.r2_key);
    await run(
      env,
      'DELETE FROM application_documents WHERE application_id = ? AND document_type_id = ?',
      auth.application.id,
      params.docTypeId,
    );
  }
  return new Response(null, { status: 204 });
};
```

Run tests → PASS. Commit:

```bash
git add 'functions/api/applications/me/documents/[docTypeId].ts'
git commit -m "feat(recruitment): add documents POST/DELETE with R2 + sniff + replace flow"
```

---

## Task 6: Confirmation email body + `POST /api/applications/me/submit`

**Files:**
- Create: `ohcs-website/functions/_shared/submit-email.ts`
- Create: `ohcs-website/functions/api/applications/me/submit.ts`
- Create: `ohcs-website/tests/functions/applications/submit.test.ts`

- [ ] **Step 1: Write the email body helper**

```typescript
// ohcs-website/functions/_shared/submit-email.ts

export interface SubmitEmailBody {
  subject: string;
  html: string;
  text: string;
}

export function submitEmail(referenceNumber: string, trackUrl: string): SubmitEmailBody {
  const subject = `OHCS Recruitment — application ${referenceNumber} received`;
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #006633; margin: 0 0 16px;">Application received</h2>
      <p>Thank you for applying. We've received your application and it will move into screening shortly.</p>
      <p style="margin: 24px 0;">
        <strong>Reference number:</strong>
        <span style="font-family: ui-monospace, monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${referenceNumber}</span>
      </p>
      <p>You can check status any time at:</p>
      <p style="margin: 16px 0;"><a href="${trackUrl}" style="color: #006633;">${trackUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      <p style="color: #6b7280; font-size: 13px;">Keep this email for your records. OHCS will contact you on the address you provided if you are shortlisted.</p>
    </div>`;
  const text = `OHCS Recruitment — application received

Reference number: ${referenceNumber}

Check status: ${trackUrl}

Keep this email for your records. OHCS will contact you on the address you provided if you are shortlisted.`;
  return { subject, html, text };
}
```

- [ ] **Step 2: Write failing tests for submit**

```typescript
// ohcs-website/tests/functions/applications/submit.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from '../../../functions/api/applications/me/submit';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const SESSION_COOKIE = 'session_id=sess-abc';

function sessionLookupScript(status = 'draft', hasPro = 0, isPwd = 0) {
  return {
    sql:
      'SELECT s.session_id, s.application_id, s.expires_at, a.exercise_id, a.email, a.status FROM application_sessions s JOIN applications a ON a.id = s.application_id WHERE s.session_id = ? AND s.expires_at > ?',
    first: {
      session_id: 'sess-abc',
      application_id: 'OHCS-2026-00001',
      expires_at: Date.now() + 86_400_000,
      exercise_id: 'ex-001',
      email: 'kofi@example.com',
      status,
    },
    // hasPro/isPwd unused by sessionLookup but kept for symmetry with later flag SQL
    _flags: { hasPro, isPwd },
  };
}

function slidingUpdateScript() {
  return { sql: 'UPDATE application_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?', run: {} };
}

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('POST /api/applications/me/submit', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('flips status to submitted, sends email, returns reference number', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      // Read flags + form_data for submission validation
      {
        sql: 'SELECT has_professional_qualification, is_pwd, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: {
          has_professional_qualification: 0,
          is_pwd: 0,
          form_data: JSON.stringify({
            holds_first_degree: true,
            full_name: 'Kofi',
            consent: { agreed: true, agreed_at: 1 },
            declaration: { agreed: true, agreed_at: 1 },
          }),
        },
      },
      // Required (and conditional-triggered) requirements for the exercise
      {
        sql:
          'SELECT document_type_id, is_required, conditional_on FROM exercise_document_requirements WHERE exercise_id = ? AND is_required = 1',
        binds: ['ex-001'],
        all: { results: [{ document_type_id: 'national_id', is_required: 1, conditional_on: null }] },
      },
      // Existing uploads
      {
        sql: 'SELECT document_type_id FROM application_documents WHERE application_id = ?',
        binds: ['OHCS-2026-00001'],
        all: { results: [{ document_type_id: 'national_id' }] },
      },
      // Status update
      {
        sql: 'UPDATE applications SET status = ?, submitted_at = ? WHERE id = ?',
        run: {},
      },
    ]);
    const req = new Request('https://x/api/applications/me/submit', {
      method: 'POST',
      headers: { Cookie: SESSION_COOKIE },
    });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { reference_number: string; status: string } };
    expect(body.data.reference_number).toBe('OHCS-2026-00001');
    expect(body.data.status).toBe('submitted');
    expect(globalThis.fetch).toHaveBeenCalledOnce(); // email send
  });

  it('rejects when a required document is missing', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT has_professional_qualification, is_pwd, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: {
          has_professional_qualification: 0,
          is_pwd: 0,
          form_data: JSON.stringify({
            holds_first_degree: true,
            full_name: 'Kofi',
            consent: { agreed: true, agreed_at: 1 },
            declaration: { agreed: true, agreed_at: 1 },
          }),
        },
      },
      {
        sql:
          'SELECT document_type_id, is_required, conditional_on FROM exercise_document_requirements WHERE exercise_id = ? AND is_required = 1',
        binds: ['ex-001'],
        all: { results: [{ document_type_id: 'national_id', is_required: 1, conditional_on: null }] },
      },
      {
        sql: 'SELECT document_type_id FROM application_documents WHERE application_id = ?',
        binds: ['OHCS-2026-00001'],
        all: { results: [] },
      },
    ]);
    const req = new Request('https://x/api/applications/me/submit', { method: 'POST', headers: { Cookie: SESSION_COOKIE } });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; missing: string[] };
    expect(body.missing).toContain('national_id');
  });

  it('rejects when declaration is not agreed', async () => {
    const db = makeD1([
      sessionLookupScript(),
      slidingUpdateScript(),
      {
        sql: 'SELECT has_professional_qualification, is_pwd, form_data FROM applications WHERE id = ?',
        binds: ['OHCS-2026-00001'],
        first: {
          has_professional_qualification: 0,
          is_pwd: 0,
          form_data: JSON.stringify({
            holds_first_degree: true,
            consent: { agreed: true, agreed_at: 1 },
            // declaration missing
          }),
        },
      },
    ]);
    const req = new Request('https://x/api/applications/me/submit', { method: 'POST', headers: { Cookie: SESSION_COOKIE } });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(400);
  });

  it('rejects when status is already submitted', async () => {
    const db = makeD1([sessionLookupScript('submitted'), slidingUpdateScript()]);
    const req = new Request('https://x/api/applications/me/submit', { method: 'POST', headers: { Cookie: SESSION_COOKIE } });
    const res = await onRequestPost(ctx(req, db));
    expect(res.status).toBe(409);
  });
});
```

Run: red. Commit failing.

```bash
git add functions/_shared/submit-email.ts tests/functions/applications/submit.test.ts
git commit -m "test(recruitment): add failing tests for submit endpoint + email body"
```

- [ ] **Step 3: Implement the submit endpoint**

```typescript
// ohcs-website/functions/api/applications/me/submit.ts
import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { first, all, run } from '../../../_shared/db';
import { requireApplicant } from '../../../_shared/applicant-session';
import { sendEmail } from '../../../_shared/email';
import { submitEmail } from '../../../_shared/submit-email';

interface FlagsAndForm {
  has_professional_qualification: number;
  is_pwd: number;
  form_data: string | null;
}

interface RequirementSummary {
  document_type_id: string;
  is_required: number;
  conditional_on: string | null;
}

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.application.status !== 'draft') {
    return json({ error: 'application is not in draft', status: auth.application.status }, { status: 409 });
  }

  const row = await first<FlagsAndForm>(
    env,
    'SELECT has_professional_qualification, is_pwd, form_data FROM applications WHERE id = ?',
    auth.application.id,
  );
  if (!row) return json({ error: 'application not found' }, { status: 404 });

  const formData = row.form_data ? (JSON.parse(row.form_data) as Record<string, unknown>) : {};
  const declaration = formData.declaration as { agreed?: boolean } | undefined;
  if (!declaration || declaration.agreed !== true) {
    return json({ error: 'declaration must be agreed' }, { status: 400 });
  }

  // Determine which document slots actually need a file
  const reqs = await all<RequirementSummary>(
    env,
    'SELECT document_type_id, is_required, conditional_on FROM exercise_document_requirements WHERE exercise_id = ? AND is_required = 1',
    auth.application.exercise_id,
  );
  const hasPro = row.has_professional_qualification === 1;
  const isPwd = row.is_pwd === 1;
  const requiredNow = reqs.filter((r) => {
    if (r.conditional_on === null) return true;
    if (r.conditional_on === 'has_professional_qualification') return hasPro;
    if (r.conditional_on === 'is_pwd') return isPwd;
    return true;
  });

  const uploads = await all<{ document_type_id: string }>(
    env,
    'SELECT document_type_id FROM application_documents WHERE application_id = ?',
    auth.application.id,
  );
  const uploaded = new Set(uploads.map((u) => u.document_type_id));
  const missing = requiredNow
    .filter((r) => !uploaded.has(r.document_type_id))
    .map((r) => r.document_type_id);

  if (missing.length > 0) {
    return json({ error: 'required documents missing', missing }, { status: 400 });
  }

  const now = Date.now();
  await run(env, 'UPDATE applications SET status = ?, submitted_at = ? WHERE id = ?', 'submitted', now, auth.application.id);

  // Best-effort confirmation email
  try {
    const origin = new URL(request.url).origin;
    const trackUrl = `${origin}/track/?ref=${encodeURIComponent(auth.application.id)}`;
    const body = submitEmail(auth.application.id, trackUrl);
    await sendEmail(env, { to: auth.application.email, subject: body.subject, html: body.html, text: body.text });
  } catch (err) {
    // Don't roll back the submission — confirmation email is best-effort.
    // The reference number is shown on the success screen.
    console.error('submit confirmation email failed', err);
  }

  return json({ data: { reference_number: auth.application.id, status: 'submitted', submitted_at: now } });
};
```

Run tests → PASS. Commit:

```bash
git add functions/api/applications/me/submit.ts
git commit -m "feat(recruitment): add POST /api/applications/me/submit (validate + flip + email)"
```

---

## Task 7: `GET /api/applications/track` — public status lookup

**Files:**
- Create: `ohcs-website/functions/api/applications/track.ts`
- Create: `ohcs-website/tests/functions/applications/track.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// ohcs-website/tests/functions/applications/track.test.ts
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../functions/api/applications/track';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function ctx(url: string, db?: D1Database) {
  return {
    request: new Request(url),
    env: mockEnv({ db }),
    params: {},
    waitUntil: () => {},
    data: {},
  };
}

describe('GET /api/applications/track', () => {
  it('returns public status when ref + email match', async () => {
    const db = makeD1([
      {
        sql: 'SELECT id, exercise_id, status, submitted_at, created_at FROM applications WHERE id = ? AND email = ?',
        binds: ['OHCS-2026-00001', 'kofi@example.com'],
        first: {
          id: 'OHCS-2026-00001',
          exercise_id: 'ex-001',
          status: 'submitted',
          submitted_at: 1,
          created_at: 0,
        },
      },
    ]);
    const res = await onRequestGet(
      ctx('https://x/api/applications/track?ref=OHCS-2026-00001&email=kofi@example.com', db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { reference_number: string; status: string } };
    expect(body.data.reference_number).toBe('OHCS-2026-00001');
    expect(body.data.status).toBe('submitted');
  });

  it('returns 404 when no application matches', async () => {
    const db = makeD1([
      {
        sql: 'SELECT id, exercise_id, status, submitted_at, created_at FROM applications WHERE id = ? AND email = ?',
        binds: ['OHCS-2026-99999', 'ghost@example.com'],
      },
    ]);
    const res = await onRequestGet(
      ctx('https://x/api/applications/track?ref=OHCS-2026-99999&email=ghost@example.com', db),
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 when ref or email missing', async () => {
    const res = await onRequestGet(ctx('https://x/api/applications/track?ref=OHCS-2026-00001'));
    expect(res.status).toBe(400);
  });
});
```

Run: red. Commit failing.

```bash
git add tests/functions/applications/track.test.ts
git commit -m "test(recruitment): add failing tests for public track endpoint"
```

- [ ] **Step 2: Implement**

```typescript
// ohcs-website/functions/api/applications/track.ts
import type { PagesFunction } from '../../_shared/types';
import { json } from '../../_shared/json';
import { first } from '../../_shared/db';

interface Row {
  id: string;
  exercise_id: string;
  status: string;
  submitted_at: number | null;
  created_at: number;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref')?.trim() ?? '';
  const email = url.searchParams.get('email')?.trim().toLowerCase() ?? '';
  if (!ref || !email) {
    return json({ error: 'ref and email query params required' }, { status: 400 });
  }
  const row = await first<Row>(
    env,
    'SELECT id, exercise_id, status, submitted_at, created_at FROM applications WHERE id = ? AND email = ?',
    ref,
    email,
  );
  if (!row) return json({ error: 'no application found for that reference and email' }, { status: 404 });
  return json({
    data: {
      reference_number: row.id,
      exercise_id: row.exercise_id,
      status: row.status,
      submitted_at: row.submitted_at,
      created_at: row.created_at,
    },
  });
};
```

Run tests → PASS. Commit:

```bash
git add functions/api/applications/track.ts
git commit -m "feat(recruitment): add GET /api/applications/track (public lookup by ref + email)"
```

---

## Task 8: Append browser API client functions

**Files:**
- Modify: `ohcs-website/src/lib/applicant-api.ts`

- [ ] **Step 1: Append**

Add at the bottom of `src/lib/applicant-api.ts`:

```typescript
import type { ApplicantRequirementsView, ApplicationDocument } from '@/types/recruitment';

export async function getRequirements(): Promise<ApplicantRequirementsView> {
  const { data } = await request<{ data: ApplicantRequirementsView }>('/api/applications/me/requirements');
  return data;
}

export async function uploadDocument(
  docTypeId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ApplicationDocument> {
  // Use XHR (not fetch) so we get upload progress events.
  const fd = new FormData();
  fd.append('file', file);
  return new Promise<ApplicationDocument>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/applications/me/documents/${encodeURIComponent(docTypeId)}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as { data: ApplicationDocument };
          resolve(parsed.data);
        } catch {
          reject(new Error(`bad response ${xhr.status}`));
        }
      } else {
        reject(new Error(`upload failed ${xhr.status}: ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error('network error during upload'));
    xhr.send(fd);
  });
}

export async function deleteDocument(docTypeId: string): Promise<void> {
  await request(`/api/applications/me/documents/${encodeURIComponent(docTypeId)}`, { method: 'DELETE' });
}

export async function submitApplication(): Promise<{
  reference_number: string;
  status: string;
  submitted_at: number;
}> {
  const { data } = await request<{
    data: { reference_number: string; status: string; submitted_at: number };
  }>('/api/applications/me/submit', { method: 'POST' });
  return data;
}

export async function trackApplication(ref: string, email: string): Promise<{
  reference_number: string;
  exercise_id: string;
  status: string;
  submitted_at: number | null;
  created_at: number;
}> {
  const params = new URLSearchParams({ ref, email });
  const { data } = await request<{
    data: { reference_number: string; exercise_id: string; status: string; submitted_at: number | null; created_at: number };
  }>(`/api/applications/track?${params.toString()}`);
  return data;
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit 2>&1 | grep "src/lib/applicant-api" | head -3 || echo OK
git add src/lib/applicant-api.ts
git commit -m "feat(recruitment): add applicant-api client funcs (uploadDocument/deleteDocument/submitApplication/trackApplication)"
```

---

## Task 9: `UploadSlot` component — single-file drag-drop slot

**Files:**
- Create: `ohcs-website/src/components/recruitment/upload-slot.tsx`

This component is a single-purpose card: shows one document slot with all its states. Step 4 renders one per visible requirement.

- [ ] **Step 1: Create the component**

```tsx
// ohcs-website/src/components/recruitment/upload-slot.tsx
'use client';

import { useRef, useState } from 'react';
import { CheckCircle, FileText, Loader2, Upload, X } from 'lucide-react';
import { uploadDocument, deleteDocument } from '@/lib/applicant-api';
import type { RequirementWithUpload } from '@/types/recruitment';
import { cn } from '@/lib/utils';

export interface UploadSlotProps {
  requirement: RequirementWithUpload;
  onChange: () => Promise<void>;   // parent re-fetches requirements after change
}

type State =
  | { kind: 'idle' }
  | { kind: 'uploading'; pct: number }
  | { kind: 'error'; message: string };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function shortMime(m: string): string {
  if (m === 'application/pdf') return 'PDF';
  if (m === 'image/jpeg') return 'JPG';
  if (m === 'image/png') return 'PNG';
  return m.split('/')[1]?.toUpperCase() ?? m;
}

export function UploadSlot({ requirement, onChange }: UploadSlotProps) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const accept = requirement.accepted_mimes.join(',');
  const maxBytes = requirement.max_mb * 1024 * 1024;
  const acceptList = requirement.accepted_mimes.map(shortMime).join(', ');

  async function handleFile(file: File) {
    if (file.size > maxBytes) {
      setState({
        kind: 'error',
        message: `File is ${formatBytes(file.size)} — maximum allowed is ${requirement.max_mb} MB.`,
      });
      return;
    }
    if (!requirement.accepted_mimes.includes(file.type)) {
      setState({
        kind: 'error',
        message: `${shortMime(file.type) || 'this file type'} not accepted — must be ${acceptList}.`,
      });
      return;
    }
    setState({ kind: 'uploading', pct: 0 });
    try {
      await uploadDocument(requirement.document_type_id, file, (pct) => setState({ kind: 'uploading', pct }));
      setState({ kind: 'idle' });
      await onChange();
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Upload failed' });
    }
  }

  async function handleDelete() {
    if (!requirement.upload) return;
    if (!window.confirm(`Remove "${requirement.upload.original_filename}"?`)) return;
    try {
      await deleteDocument(requirement.document_type_id);
      setState({ kind: 'idle' });
      await onChange();
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Delete failed' });
    }
  }

  const filled = requirement.upload !== null;

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-5 transition-colors',
        filled ? 'border-green-200 bg-green-50/40' : dragging ? 'border-primary bg-primary/5' : 'border-dashed border-border/60 bg-white',
      )}
      onDragOver={(e) => {
        if (!filled) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (filled) return;
        const file = e.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {filled ? (
            <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
          ) : (
            <FileText className="h-6 w-6 text-text-muted" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-primary-dark">{requirement.label}</h3>
            <span
              className={cn(
                'text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                requirement.is_required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700',
              )}
            >
              {requirement.is_required ? 'Required' : 'Optional'}
            </span>
          </div>
          {requirement.description && <p className="text-xs text-text-muted mb-2">{requirement.description}</p>}

          {filled ? (
            <div className="text-sm text-text-muted">
              <p className="font-mono text-primary-dark truncate">{requirement.upload!.original_filename}</p>
              <p className="text-xs">{formatBytes(requirement.upload!.size_bytes)} · {shortMime(requirement.upload!.mime_type)}</p>
            </div>
          ) : (
            <p className="text-xs text-text-muted">Drag and drop here, or click below. {acceptList} · Max {requirement.max_mb} MB</p>
          )}

          {state.kind === 'uploading' && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading… {state.pct}%
              </div>
              <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${state.pct}%` }} />
              </div>
            </div>
          )}
          {state.kind === 'error' && (
            <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2" role="alert">
              {state.message}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          {filled ? (
            <button
              type="button"
              onClick={handleDelete}
              aria-label={`Remove ${requirement.label}`}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={state.kind === 'uploading'}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-light disabled:opacity-50"
            >
              <Upload className="h-4 w-4" /> Browse
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = ''; // allow re-selecting the same file
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Build verify + commit**

```bash
npm run pages:build 2>&1 | tail -5
git add src/components/recruitment/upload-slot.tsx
git commit -m "feat(recruitment): add UploadSlot component (drag-drop, progress, replace, delete)"
```

---

## Task 10: Real Step 4 — `step-documents.tsx` (replaces stub)

**Files:**
- Create: `ohcs-website/src/components/recruitment/step-documents.tsx`
- Modify: `ohcs-website/src/components/recruitment/wizard-shell.tsx` (swap import)
- Delete: `ohcs-website/src/components/recruitment/step-documents-stub.tsx`

- [ ] **Step 1: Create `step-documents.tsx`**

```tsx
// ohcs-website/src/components/recruitment/step-documents.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getRequirements } from '@/lib/applicant-api';
import type { ApplicantRequirementsView, RequirementWithUpload } from '@/types/recruitment';
import { UploadSlot } from './upload-slot';

export function StepDocuments() {
  const [view, setView] = useState<ApplicantRequirementsView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const v = await getRequirements();
      setView(v);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="mt-3 text-sm">Loading required documents…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-red-900">Couldn&apos;t load required documents</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <button
            onClick={() => void refresh()}
            className="mt-3 px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!view) return null;

  const visible = view.requirements.filter((r) => r.visible);
  const visibleByOrder = visible.sort((a, b) => a.display_order - b.display_order);

  if (visibleByOrder.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border/60 bg-white p-8 text-center">
        <p className="text-text-muted">
          No documents are required for this exercise. You can proceed to Step 5.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-primary-dark mb-1">Upload Required Documents</h2>
        <p className="text-sm text-text-muted">
          Upload each required document below. Files are saved automatically — you can come back later to finish.
        </p>
      </div>

      <div className="space-y-3">
        {visibleByOrder.map((r: RequirementWithUpload) => (
          <UploadSlot key={r.document_type_id} requirement={r} onChange={refresh} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `wizard-shell.tsx`**

Open `src/components/recruitment/wizard-shell.tsx`. Find the import for `StepDocumentsStub`:

```tsx
import { StepDocumentsStub } from './step-documents-stub';
```

Replace with:

```tsx
import { StepDocuments } from './step-documents';
```

Find the JSX usage of `<StepDocumentsStub ... />` and replace with `<StepDocuments />` (no props needed — the new component fetches its own state).

- [ ] **Step 3: Delete the stub**

```bash
rm src/components/recruitment/step-documents-stub.tsx
```

- [ ] **Step 4: Build + commit**

```bash
npm run pages:build 2>&1 | tail -5
git add src/components/recruitment/step-documents.tsx src/components/recruitment/wizard-shell.tsx
git rm src/components/recruitment/step-documents-stub.tsx
git commit -m "feat(recruitment): replace Step 4 stub with real document uploads UI"
```

---

## Task 11: Wire Submit on Step 5

**Files:**
- Modify: `ohcs-website/src/components/recruitment/step-review.tsx`
- Modify: `ohcs-website/src/components/recruitment/wizard-shell.tsx`
- Modify: `ohcs-website/src/types/recruitment.ts` (add `declaration` field to `ApplicationFormData`)

The current Submit button is hardcoded disabled. Now it must:
1. Be enabled only when the declaration is checked AND at least one previous validation pass clean
2. On click, call `submitApplication()`
3. On success, replace the form with a success card showing the reference number + tracking link
4. On error, show the error inline (especially "required documents missing" listing them)

- [ ] **Step 1: Add `declaration` to `ApplicationFormData`**

In `src/types/recruitment.ts`, find the `ApplicationFormData` interface and add at the bottom (just inside the closing brace):

```typescript
  declaration?: { agreed: boolean; agreed_at: number };
```

- [ ] **Step 2: Update `step-review.tsx`**

Open `src/components/recruitment/step-review.tsx`. The component currently renders the read-only summary + a disabled Submit button. Make these changes:

1. Add a state for the declaration checkbox value: read from `data.declaration?.agreed === true`. The change handler calls `onChange({ declaration: { agreed: e.target.checked, agreed_at: Date.now() } })`.
2. Add new state `submitState: { kind: 'idle' } | { kind: 'submitting' } | { kind: 'success'; reference: string } | { kind: 'error'; message: string; missing?: string[] }`.
3. Replace the disabled Submit button with one that:
   - Is enabled only when `declaration.agreed === true` AND `submitState.kind === 'idle'`
   - On click, calls `submitApplication()` from `@/lib/applicant-api`. On success → `setSubmitState({kind:'success', reference: result.reference_number})`. On error: parse the response (it might be a JSON with `{error, missing?}`); set error state with the missing list when present.
4. When `submitState.kind === 'success'`, render a green success card with the reference number + a link to `/track?ref=...` instead of the form.
5. When `submitState.kind === 'error'`, render a red card listing the missing documents (if any) with a hint to "go back to Step 4 to upload".

Imports needed at top:
```tsx
import { useState } from 'react';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { submitApplication } from '@/lib/applicant-api';
```

- [ ] **Step 3: Update `wizard-shell.tsx` to remove the bottom-bar Submit button on step 5**

Step 5's actual submit lives inside `step-review.tsx`. The bottom bar's "Next/Submit" button on step 5 should no longer render — remove the special-case branch that renders "Submit Application" and just hide the next button on step 5.

- [ ] **Step 4: Build + commit**

```bash
npm run pages:build 2>&1 | tail -5
git add src/components/recruitment/step-review.tsx src/components/recruitment/wizard-shell.tsx src/types/recruitment.ts
git commit -m "feat(recruitment): wire real Submit on Step 5 (success/error states + reference number)"
```

---

## Task 12: Update `/track` page to support recruitment applications

**Files:**
- Modify: `ohcs-website/src/app/track/page.tsx`

The existing `/track` page handles complaints/RTI submissions via `trackSubmission` from `@/lib/api`. Recruitment references look like `OHCS-2026-00001` (different prefix). Add a branch that detects the new format and calls the recruitment endpoint instead.

- [ ] **Step 1: Read the current page to understand what fields it expects**

```bash
grep -n "trackSubmission\|TrackingResult\|onSubmit" src/app/track/page.tsx | head -10
```

- [ ] **Step 2: Add the recruitment branch**

In the existing `onSubmit` handler:

```tsx
const onSubmit = async (data: TrackFormData) => {
  setTrackError(null);
  setResult(null);
  try {
    if (/^OHCS-\d{4}-\d+$/i.test(data.referenceNumber.trim())) {
      // Recruitment application path
      const { trackApplication } = await import('@/lib/applicant-api');
      const r = await trackApplication(data.referenceNumber.trim(), data.contact);
      setResult({
        referenceNumber: r.reference_number,
        type: 'recruitment',
        status: r.status,
        subject: `Recruitment exercise ${r.exercise_id}`,
        createdAt: new Date(r.created_at).toISOString(),
        updatedAt: new Date(r.submitted_at ?? r.created_at).toISOString(),
        timeline: r.submitted_at
          ? [
              { id: 'created', status: 'received', note: 'Application created', created_at: new Date(r.created_at).toISOString() },
              { id: 'submitted', status: r.status, note: 'Application submitted', created_at: new Date(r.submitted_at).toISOString() },
            ]
          : [{ id: 'created', status: 'draft', note: 'Application not yet submitted', created_at: new Date(r.created_at).toISOString() }],
      });
      return;
    }
    // Existing complaints/RTI path
    const response = await trackSubmission(data.referenceNumber, data.contact);
    setResult(response.data);
  } catch (err) {
    setTrackError(
      err instanceof Error ? err.message : 'Unable to find your submission. Please check your details.',
    );
  }
};
```

The dynamic `import('@/lib/applicant-api')` keeps the recruitment client out of the bundle for users who don't need it.

- [ ] **Step 3: Build + commit**

```bash
npm run pages:build 2>&1 | tail -5
git add src/app/track/page.tsx
git commit -m "feat(recruitment): /track supports recruitment application references (OHCS-YYYY-NNNNN)"
```

---

## Task 13: End-to-end smoke against preview, then production deploy

- [ ] **Step 1: Configure the active exercise's required documents**

The applicant flow needs the `ex-001` exercise to have at least one required document configured (otherwise Step 4 shows "no documents required"). Use the Phase 1 admin UI:

1. Open `https://feat-recruitment-phase-3.ohcs.pages.dev/admin/recruitment/exercise-documents/?exerciseId=ex-001` (after deploy)
2. Add `national_id` as Required, `passport_photo` as Required, `cv` as Optional. Click Save Changes.

Alternatively via direct SQL (faster for testing):

```bash
npx wrangler d1 execute ohcs-recruitment --remote --command="INSERT OR IGNORE INTO exercise_document_requirements (id, exercise_id, document_type_id, is_required, display_order, created_at, updated_at) VALUES ('edr_ex-001_national_id', 'ex-001', 'national_id', 1, 0, strftime('%s','now')*1000, strftime('%s','now')*1000), ('edr_ex-001_passport_photo', 'ex-001', 'passport_photo', 1, 1, strftime('%s','now')*1000, strftime('%s','now')*1000)"
```

- [ ] **Step 2: Run final QA**

```bash
cd ohcs-website
npm test -- --run
npm run type-check
npm run pages:build 2>&1 | tail -5
```

All green expected.

- [ ] **Step 3: Preview deploy**

```bash
npx wrangler pages deploy out --project-name=ohcs
```

Note the preview URL.

- [ ] **Step 4: End-to-end smoke**

In a browser (against the preview URL):

1. Visit `/services/recruitment/`, click "Start or Resume Application"
2. Enter the verified Resend address, click Send Magic Link
3. Click link from email → land on Step 1
4. Fill Steps 1-3, navigate to Step 4 — expect to see slots for the required documents you configured in Step 1
5. Drag-drop a small PDF into one slot, watch the progress bar, see the green "Verified" state appear (well, no AI yet, just "uploaded")
6. Try to submit on Step 5 with a missing required upload — see the error listing what's missing
7. Go back to Step 4, upload the missing one, return to Step 5
8. Tick the declaration, click Submit — see the green success card with the reference number
9. Open `/track/`, enter the reference number + the same email, see the status

If anything fails, debug before merging.

- [ ] **Step 5: Merge to master + production deploy**

```bash
git checkout master
git merge --no-ff feat/recruitment-phase-3 -m "Merge branch 'feat/recruitment-phase-3' — document uploads + submission"
cd ohcs-website
npx wrangler pages deploy out --project-name=ohcs --branch=master
```

- [ ] **Step 6: Verify production**

```bash
sleep 20
curl -s https://ohcs.pages.dev/api/health | head -c 200
```

Then walk through the same end-to-end flow on `https://ohcs.pages.dev`.

- [ ] **Step 7: Push origin + clean up**

```bash
git push origin master
git branch -d feat/recruitment-phase-3
```

---

## Done — Exit criteria met

Phase 3 is complete when:

- ✅ D1 has `application_documents` table on production
- ✅ Step 4 in the wizard renders a slot per visible requirement, supports drag-drop + click-to-browse + replace + delete
- ✅ POST/DELETE `/api/applications/me/documents/[docTypeId]` work end-to-end against R2
- ✅ MIME + size + magic-byte validation runs server-side; rejects with clear errors
- ✅ Step 5 Submit button enables only when declaration is ticked
- ✅ POST `/api/applications/me/submit` validates required docs, flips status, sends confirmation email
- ✅ Confirmation email lands at the applicant's inbox with the reference number
- ✅ `/track` page accepts an `OHCS-YYYY-NNNNN` reference + email and returns the public status
- ✅ All Phase 0/1/2 tests still pass + ~25 new tests in Phase 3
- ✅ Production health endpoint still returns ok
- ✅ No `as any` introduced; no new lint errors in Phase 3 files

Phase 4 (AI verification) builds on this: every upload returns `ai_verdict='unchecked'` today; Phase 4 wires the Workers AI calls that flip it to `passed` or `flagged` and surfaces the verdict on the slot UI.
