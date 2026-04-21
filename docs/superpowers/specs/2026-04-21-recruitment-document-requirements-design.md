# Recruitment Application: Document Requirements & Upload System

**Status**: Approved design, ready for implementation planning
**Date**: 2026-04-21
**Owner**: OHCS Website Redesign team
**Replaces**: Placeholder application form at `services/recruitment/page.tsx:210-216`

---

## 1. Purpose

Build a production-grade recruitment application system for the Office of the Head of Civil Service (OHCS) that:

1. Lets admins configure required documents per recruitment exercise from a master library.
2. Lets applicants (degree holders + professional-qualification holders) submit applications through a multi-step, resumable form.
3. Validates uploaded documents at multiple layers — frontend, backend, and AI sanity check (Lexi via Workers AI).
4. Stores files securely in Cloudflare R2 with metadata in D1.
5. Surfaces AI flags and audit trails to admin reviewers.

The first exercise this serves is the **2026 Graduate Entrance Examination** (already in admin as `ex-001`).

---

## 2. Decisions summary

| Topic | Decision |
|---|---|
| Document config scope | Per-exercise (admin picks from master library) |
| Master library | 15 standard documents (see §4.1; reference letters are two separate slots) |
| Validation depth | Frontend + backend + AI sanity check (Workers AI) |
| AI threshold | 0.75 confidence; below = flagged (soft warning, applicant can override) |
| AI branding | Invisible to applicants ("automatic check"), visible to admins |
| Storage backend | Cloudflare D1 (metadata) + R2 (files); Pages Functions for API |
| Auth model | Magic-link (passwordless), email-based, draft resumable |
| Reference number | Friendly format `OHCS-2026-00372` (sortable, human-shareable) |
| Session length | 7 days, sliding |
| Conditional documents | Two predefined triggers: `has_professional_qualification`, `is_pwd` |
| Email transport | MailChannels (free, native Cloudflare); Resend as fallback |
| AI verdict propagation | Polling every 3s while any doc has `ai_verdict = 'unchecked'` |
| Retry on upload failure | Auto-retry × 3 with exponential backoff |
| Retention | 7 years (R2 lifecycle rule); applications + audit logs same |
| Privacy consent | Explicit checkbox on Step 1 of form (Ghana Data Protection Act 2012, Act 843) |
| SMS notifications | Not in v1 |
| Disposable email block | Not in v1 |
| Multi-language | English only in v1 |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (applicant)               Browser (admin)               │
│  ┌──────────────────┐              ┌──────────────────────┐      │
│  │ 5-step wizard    │              │ Exercises → Required │      │
│  │ Step 4: Uploads  │              │ Documents tab        │      │
│  │ Polling for AI   │              │ Pipeline / review    │      │
│  └────────┬─────────┘              └──────────┬───────────┘      │
└───────────┼──────────────────────────────────┼──────────────────┘
            │                                  │
            ▼                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│  Cloudflare Pages Functions (existing deployment)                │
│  /api/applications/*    /api/admin/*    /api/health              │
└──────┬─────────────────┬──────────────────┬─────────────────────┘
       │                 │                  │
       ▼                 ▼                  ▼
   ┌────────┐      ┌─────────┐      ┌──────────────┐
   │   D1   │      │   R2    │      │ Workers AI   │
   │ tables │      │  files  │      │ llava-1.5-7b │
   └────────┘      └─────────┘      │ llama-3.1-8b │
                                    └──────────────┘
                       │
                       ▼
                ┌──────────────┐
                │ MailChannels │
                │ (magic links │
                │  + status)   │
                └──────────────┘
```

- **Pages Functions** — same Cloudflare Pages deployment that serves `ohcs.pages.dev`. No separate Workers project.
- **D1** — `ohcs-recruitment` database; bindings in `wrangler.toml`.
- **R2** — `ohcs-recruitment-uploads` bucket, private, 7-year lifecycle rule.
- **Workers AI** — llava for vision (photo/cert/identity), llama for PDF text classification.
- **MailChannels** — transactional email; Resend as fallback if MailChannels rejects (Cloudflare requires DKIM/SPF setup).

---

## 4. Data model

### 4.1 Master document library (seed)

| ID | Label | Default size | Accepted MIMEs | AI check type |
|---|---|---|---|---|
| `national_id` | National ID (Ghana Card) | 5 MB | PDF, JPG, PNG | identity |
| `birth_certificate` | Birth Certificate | 5 MB | PDF, JPG, PNG | certificate |
| `passport_photo` | Passport-sized Photograph | 2 MB | JPG, PNG | photo |
| `ssce_wassce` | SSSCE / WASSCE Certificate | 5 MB | PDF, JPG, PNG | certificate |
| `first_degree` | First Degree Certificate | 5 MB | PDF, JPG, PNG | certificate |
| `degree_transcript` | Degree Transcript | 5 MB | PDF, JPG, PNG | certificate |
| `nss_certificate` | National Service Certificate (NSS) | 5 MB | PDF, JPG, PNG | certificate |
| `postgraduate_cert` | Postgraduate Certificate (Masters / PhD) | 5 MB | PDF, JPG, PNG | certificate |
| `professional_cert` | Professional Qualification (ICAG / GhIE / BAR / GMA) | 5 MB | PDF, JPG, PNG | certificate |
| `cv` | Curriculum Vitae | 5 MB | PDF | (none) |
| `cover_letter` | Cover Letter / Statement of Purpose | 5 MB | PDF | (none) |
| `reference_letter_1` | Reference Letter 1 | 5 MB | PDF | (none) |
| `reference_letter_2` | Reference Letter 2 | 5 MB | PDF | (none) |
| `work_experience_proof` | Proof of Work Experience | 5 MB | PDF, JPG, PNG | certificate |
| `medical_certificate_pwd` | Medical Certificate (PWD) | 5 MB | PDF | certificate |

### 4.2 D1 schema

```sql
CREATE TABLE document_types (
  id              TEXT PRIMARY KEY,
  label           TEXT NOT NULL,
  description     TEXT,
  default_max_mb  INTEGER NOT NULL,
  accepted_mimes  TEXT NOT NULL,           -- JSON array
  ai_check_type   TEXT,                    -- 'certificate' | 'photo' | 'identity' | NULL
  is_active       INTEGER DEFAULT 1
);

CREATE TABLE exercise_document_requirements (
  id                  TEXT PRIMARY KEY,
  exercise_id         TEXT NOT NULL,
  document_type_id    TEXT NOT NULL,
  is_required         INTEGER NOT NULL,
  conditional_on      TEXT,                -- 'has_professional_qualification' | 'is_pwd' | NULL
  display_order       INTEGER NOT NULL,
  max_mb_override     INTEGER,
  UNIQUE (exercise_id, document_type_id)
);

CREATE TABLE applications (
  id                              TEXT PRIMARY KEY,   -- 'OHCS-2026-00372'
  exercise_id                     TEXT NOT NULL,
  email                           TEXT NOT NULL,
  status                          TEXT NOT NULL,      -- 'draft'|'submitted'|'under_review'|'requires_action'|'shortlisted'|'rejected'
  has_professional_qualification  INTEGER DEFAULT 0,
  is_pwd                          INTEGER DEFAULT 0,
  form_data                       TEXT,               -- JSON
  created_at                      INTEGER NOT NULL,
  submitted_at                    INTEGER,
  last_saved_at                   INTEGER NOT NULL,
  UNIQUE (exercise_id, email)                          -- one application per email per exercise
);

CREATE TABLE application_documents (
  id                  TEXT PRIMARY KEY,
  application_id      TEXT NOT NULL,
  document_type_id    TEXT NOT NULL,
  r2_key              TEXT NOT NULL,
  original_filename   TEXT NOT NULL,
  size_bytes          INTEGER NOT NULL,
  mime_type           TEXT NOT NULL,
  sha256              TEXT NOT NULL,
  uploaded_at         INTEGER NOT NULL,
  ai_verdict          TEXT,                -- 'passed'|'flagged'|'unchecked'
  ai_confidence       REAL,
  ai_reason           TEXT,
  ai_prompt_version   TEXT,
  manual_flag         TEXT,                -- admin-set flag reason
  applicant_confirmed INTEGER DEFAULT 0,
  UNIQUE (application_id, document_type_id)
);

CREATE TABLE magic_link_tokens (
  token          TEXT PRIMARY KEY,
  email          TEXT NOT NULL,
  exercise_id    TEXT NOT NULL,
  application_id TEXT,
  created_at     INTEGER NOT NULL,
  expires_at     INTEGER NOT NULL,         -- created_at + 30 min
  used_at        INTEGER
);

CREATE TABLE application_sessions (
  session_id     TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  expires_at     INTEGER NOT NULL,         -- created_at + 7 days, sliding
  last_used_at   INTEGER NOT NULL
);

CREATE INDEX idx_applications_exercise_status ON applications(exercise_id, status);
CREATE INDEX idx_app_docs_application ON application_documents(application_id);
CREATE INDEX idx_magic_tokens_email ON magic_link_tokens(email, exercise_id);
CREATE INDEX idx_sessions_expires ON application_sessions(expires_at);
```

### 4.3 R2 layout

```
ohcs-recruitment-uploads/
  {exercise_id}/
    {application_id}/
      national_id.pdf
      first_degree.pdf
      passport_photo.jpg
      ...
```

One file per `(application_id, document_type_id)` slot. Re-uploading deletes the prior R2 object and writes the new one. Bucket is private; admin downloads via 60-second signed URLs.

### 4.4 Reference number generation

Format: `OHCS-{exercise_year}-{sequence_5_digit_zero_padded}`. Example: `OHCS-2026-00372`. Sequence is per-exercise, monotonically incrementing on application creation. Uniqueness enforced at the DB layer.

---

## 5. Admin: Document Requirements Configuration

### 5.1 Routes

- `/admin/recruitment/document-types` — master library CRUD (settings-style page, infrequent use)
- `/admin/recruitment/exercises/[id]/documents` — per-exercise requirements UI

### 5.2 Per-exercise requirements UI

Layout: ordered list of selected documents with drag-to-reorder, plus an "Add from Master Library" dropdown. Each row shows:

- Document label
- Required / Optional / Conditional radio
- Conditional trigger dropdown (only when "Conditional" is selected): `has_professional_qualification` | `is_pwd`
- Size override field (default = `document_types.default_max_mb`)
- Remove button

Header actions:
- **Save Changes** — writes `exercise_document_requirements` rows
- **Preview as Applicant** — modal renders Step 4 exactly as a candidate sees it, with toggles to simulate Step 2 conditions

### 5.3 Editing rules

- Exercises in `draft` status: fully editable
- Exercises in `active` status with applications already started: editable but warned ("Changing requirements will affect in-progress applications")
- Exercises in `closed` or `completed`: read-only

### 5.4 Master library CRUD

Add / edit / soft-delete (`is_active = 0`) documents in the master library. Soft delete preserves historical exercise integrity. Hard delete only allowed for items never referenced by any exercise.

---

## 6. Applicant: Multi-Step Form & Upload UX

### 6.1 Form structure (5 steps)

| Step | Content |
|---|---|
| 1. Personal Details | Name, DOB, gender, contact, address, NIA number, **consent checkbox** |
| 2. Eligibility | "I hold a 1st degree" (required), "I hold a professional qualification" (toggle), "I am a PWD" (toggle) |
| 3. Education & Experience | Degree info, transcript GPA, work history |
| 4. Documents | Dynamic upload slots based on exercise requirements + Step 2 toggles |
| 5. Review & Submit | Read-only preview, declaration checkbox, submit |

Auto-save fires on field blur, on step change, and every 30s while typing. Stores into `applications.form_data` (JSON).

### 6.2 Magic-link entry flow

1. Applicant clicks **Apply Now** on `/services/recruitment` (replacing the current placeholder).
2. Modal: "Enter your email to start or resume your application."
3. POST `/api/applications/start` → token written to `magic_link_tokens`, email sent via MailChannels.
4. Applicant clicks link in email → GET `/api/applications/magic/[token]` → consumes token, creates session row + cookie, 302 redirects to form.
5. If applicant requests a second magic link with the same email + exercise, the existing draft is reused — no duplicates.

### 6.3 Step 4 upload UX

For each required (and triggered-conditional) document slot:

| State | Visual | Behaviour |
|---|---|---|
| Empty | grey ○ | Drag-drop zone + Browse button |
| Uploading | spinner | Progress bar 0–100%, navigation blocked |
| AI checking | amber 🔍 | "Verifying document…" |
| Verified (AI passed) | green ✓ | Filename, size, "Verified" badge, [Replace] |
| AI flagged | amber ⚠ | Reason shown, applicant must tick confirmation to continue |
| Hard rejected | red ✕ | Wrong type / oversized / corrupt — must replace |

Conditional slots appear/disappear based on Step 2 toggles in real time.

### 6.4 Submission gating (Step 5)

Submit button disabled until:
- All required (and triggered-conditional) document slots have a file
- Every AI-flagged doc is either replaced or has applicant-confirmation tick
- All other steps' validations pass
- Declaration checkbox ticked: *"I declare that all information and documents provided are true and accurate. I understand that providing false information may result in disqualification or prosecution under the Civil Service Act."*

### 6.5 Post-submit

- `applications.status` → `submitted`, `submitted_at` set
- Confirmation email sent with reference number
- Reference number shown on screen (canonical; not dependent on email delivery)
- Existing `/track` page extended to look up by `email + reference number`

---

## 7. API endpoints (Pages Functions)

### 7.1 Public / applicant

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/applications/start` | `{email, exercise_id}` → issue magic link |
| GET | `/api/applications/magic/[token]` | Consume magic link → set session → 302 |
| GET | `/api/applications/me` | Returns current draft (form_data + docs metadata) |
| PATCH | `/api/applications/me` | Auto-save form fields |
| POST | `/api/applications/me/documents/[docTypeId]` | Multipart upload |
| DELETE | `/api/applications/me/documents/[docTypeId]` | Remove file |
| POST | `/api/applications/me/documents/[docTypeId]/confirm` | Override AI flag |
| POST | `/api/applications/me/submit` | Validate + flip status to submitted + send email |
| POST | `/api/applications/me/logout` | Clear session |
| GET | `/api/exercises/[id]/requirements` | Public: requirement list for Step 4 rendering |

### 7.2 Admin

| Method | Path | Purpose |
|---|---|---|
| GET, POST, PATCH, DELETE | `/api/admin/document-types[/id]` | Master library CRUD |
| GET, PUT | `/api/admin/exercises/[id]/requirements` | Per-exercise config |
| GET | `/api/admin/applications?exercise_id=&status=&ai_flag=` | Pipeline list |
| GET | `/api/admin/applications/[id]` | Detail + document metadata |
| GET | `/api/admin/applications/[id]/documents/[docTypeId]/url` | 60s signed R2 URL |
| PATCH | `/api/admin/applications/[id]/status` | Status transition + audit |
| POST | `/api/admin/applications/[id]/request-action` | Set `manual_flag`, email applicant |

### 7.3 Health

`GET /api/health` returns `{status, checks: {d1, r2, workers_ai, email}, version, uptime_seconds}`. No auth.

### 7.4 Upload endpoint flow

```
1.  Auth: read session_id cookie → load application from D1 (401 if missing)
2.  Guard: application.status === 'draft' (no uploads after submit)
3.  Guard: docTypeId exists in exercise's requirements
4.  Parse multipart body → single file
5.  Validate MIME against document_types.accepted_mimes
6.  Validate size against (max_mb_override || default_max_mb)
7.  Content sniff: first 512 bytes against magic numbers (anti-spoof)
8.  Sanitize filename, compute sha256
9.  If existing record for this slot: delete old R2 object
10. r2_key = `${exercise_id}/${application_id}/${doc_type_id}.${ext}`
11. Write to R2 with content-type + original filename metadata
12. Upsert application_documents row (ai_verdict='unchecked')
13. ctx.waitUntil(verifyWithAI(...))
14. Return 200 { status:'uploaded', ai:'checking' }
```

### 7.5 Constraints

- Max body size: 10 MB
- Rate limit: 20 uploads/min/session, 5 magic-link requests/hour/email
- Content sniffing required (anti-MIME-spoof)

---

## 8. AI Verification (Lexi sanity check)

### 8.1 Models

| Check type | Model | Notes |
|---|---|---|
| `photo` | `@cf/llava-hf/llava-1.5-7b-hf` | "Is this a passport-style photograph?" |
| `certificate` (image) | `@cf/llava-hf/llava-1.5-7b-hf` | "Does this look like an official certificate?" |
| `certificate` (text PDF) | `@cf/meta/llama-3.1-8b-instruct` | Text classification on extracted PDF text |
| `identity` | `@cf/llava-hf/llava-1.5-7b-hf` | "Does this look like a Ghana National ID card?" |

PDFs preprocessed: try `pdf-parse` for native text-PDFs first; fall back to rendering page 1 to PNG for vision check.

### 8.2 Prompt enforcement

Prompts demand JSON response: `{"is_<thing>": boolean, "confidence": 0.0-1.0, "reason": "<sentence>"}`. Parse failure triggers single retry with stricter "ONLY JSON" instruction. Second failure → `ai_verdict = 'unchecked'`.

### 8.3 Verdict thresholds

```
confidence ≥ 0.75 AND positive boolean  → 'passed'
confidence < 0.75 OR negative boolean   → 'flagged'
parse failure / model error             → 'unchecked'
```

### 8.4 Cost

~$0.001–$0.003 per inference. ~10,000 inferences per exercise = $10–$30. Negligible.

### 8.5 Fallback

AI failures never block uploads. `ai_verdict = 'unchecked'` is treated as "uploaded but not auto-verified" — admins see a badge and review manually.

### 8.6 Versioning

Every verdict stores `ai_prompt_version` so we can audit historical decisions and re-run flagged docs against newer prompts if needed.

### 8.7 Branding

AI is **invisible to applicants** — UI says "automatic check" or shows a plain warning ("This image doesn't appear to be a passport-style photo"). Lexi branding only in admin views.

---

## 9. Security, Privacy & Compliance

### 9.1 Authentication

- Magic-link tokens: 32-byte URL-safe random, single-use, 30-min expiry
- Session cookies: `Secure`, `HttpOnly`, `SameSite=Lax`, 7-day sliding
- CSRF: `X-Requested-With: XMLHttpRequest` header on state-changing endpoints (same-origin SPA)
- Admin auth: existing `admin/login` flow, role-checked for recruitment endpoints

### 9.2 File security

- R2 bucket private; admin downloads via 60s signed URLs
- Applicants cannot retrieve their own files (re-upload to change)
- Lifecycle rule: auto-delete files > 7 years old
- EXIF stripped from photos before R2 storage
- PDFs rejected if they contain embedded JS / files / external refs

### 9.3 Input validation

Three layers: client → server MIME → server content-sniff (first 512 bytes vs magic numbers). Filename sanitised to `[a-zA-Z0-9._-]`, max 100 chars. SVG rejected (XSS vector).

### 9.4 Privacy

- Ghana Data Protection Act 2012 (Act 843) compliant
- Explicit consent on Step 1, logged with timestamp + IP in `form_data.consent`
- Data minimisation: no SSN-equivalent, no banking, no biometrics beyond photo
- No PII in logs (application_id only)
- Right to access + delete: dedicated endpoint; submitted applications cannot be self-deleted

### 9.5 Audit logging

All consequential actions (create, upload, replace, override, submit, admin view, admin download, status change) logged via existing `audit-logger`. Append-only, 7-year retention.

### 9.6 Anti-fraud

- Email uniqueness per exercise (DB constraint)
- IP velocity check: > 10 starts/hour from same IP triggers CAPTCHA on next attempt
- SHA-256 dedup detection across applications in same exercise → flagged in existing Anti-Fraud admin tab
- Disposable email block: not in v1

### 9.7 Headers

```
Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; ...
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 9.8 Compliance docs

To produce alongside the build:
- **Privacy Notice** (public, `/privacy/recruitment`)
- **Data Processing Record** (internal, Act 843 requirement)
- **Security incident response plan** (internal runbook)

---

## 10. Error handling, edge cases & observability

### 10.1 Error UX

| Failure | Applicant sees | System does |
|---|---|---|
| Network drop mid-upload | "Upload interrupted. Retrying…" | Auto-retry × 3 with exponential backoff |
| File too large | Inline message before upload | No server call |
| Wrong file type | Inline message before upload | No server call |
| AI down | "Uploaded ✓" (no warning) | `ai_verdict = 'unchecked'`, admin badge |
| R2 write fails | "Upload failed — please retry" | Logged, single auto-retry after 2s |
| D1 unavailable | Maintenance page; saved progress intact | 503 returned, CDN serves cached |
| Magic link expired | "Link expired — request a fresh one" | Friendly CTA |
| Session expired | Auto-redirect to magic-link request | Cookie cleared, draft preserved |
| Two browsers editing draft | Last-write-wins on form_data; uploads atomic | "Saved 12s ago" indicator |
| Window closes mid-form | At submit only: "Window closed; draft preserved" | Admin can manually allow late submission |

### 10.2 Edge cases

1. Replace flow: old R2 object deleted before new one written; SHA-256 dedup not affected.
2. Cleared cookies: applicant requests fresh magic link with same email; draft loads exactly as left.
3. Shared laptop: explicit logout button + 7-day session expiry.
4. Step 2 toggle change after upload: conditional slot disappears in UI; file kept in R2; not validated on submit if no longer required.
5. Master library soft-delete: existing exercises continue using the type; removed from "Add" dropdown.
6. AI flag arrives during Step 5: Submit disabled, flagged doc highlighted, applicant must resolve.
7. Admin manual flag after submit: `manual_flag` set, applicant emailed, status → `requires_action`, applicant can replace, status → `submitted` again.
8. Email never delivered: reference number on screen + `/track` lookup by `email + ref` works.
9. Duplicate application for same email + exercise: second magic-link reuses existing draft.

### 10.3 Observability

- **Structured logs** (Cloudflare Logpush → R2): JSON with `application_id`, no PII
- **Metrics dashboard** (`/admin/recruitment/health`): active applications, upload success rate, AI verdict breakdown, upload latency P50/P95/P99, magic-link funnel, 5xx rate
- **Alerts**: upload error > 5% over 15 min, AI queue depth > 100, D1 write failures, submission spike > 50 in 5 min
- **Sentry** (browser SDK, applicant flow only)
- **Health endpoint**: `/api/health`, public, monitored by Cloudflare uptime checks

---

## 11. Build phases

| Phase | Duration | Description |
|---|---|---|
| 0. Infrastructure | 1 d | D1, R2, AI binding, MailChannels, migrations runner, `/api/health` |
| 1. Admin: master lib + per-exercise config | 2 d | `document_types`, `exercise_document_requirements`, both admin pages, "Preview as Applicant" |
| 2. Magic link + form skeleton | 2 d | `applications`, `magic_link_tokens`, `application_sessions`, Steps 1, 2, 3, 5 (no uploads yet) |
| 3. Document uploads (no AI) | 2 d | `application_documents`, upload/delete endpoints, Step 4 UI, retries, submission gating, confirmation email |
| 4. AI verification | 1.5 d | Workers AI integration, three prompt templates, polling, override flow, admin badges |
| 5. Admin pipeline + reviewer tools | 1.5 d | List + detail views, signed-URL document viewer, status transitions, "request action" flow |
| 6. Hardening + observability | 1 d | Rate limits, IP velocity, SHA dedup, EXIF strip, PDF safety, Sentry, dashboard, Privacy Notice, load test |

**Total: ~10 working days.** Phases ordered so each delivers shippable value: Phase 1 unblocks admin config in parallel; Phase 3 yields a working recruitment system even if Phase 4 (AI) slips.

### Out of scope for v1 (deferred)

- OCR + applicant-name matching against certificates
- Bulk operations (export, batch shortlist)
- In-app messaging beyond status emails
- Self-withdraw flow (admin handles via status change)
- Multi-language (Twi, Ga, Ewe, Hausa)
- SMS notifications

---

## 12. Open questions for implementation

These are intentionally left for the implementation plan / first dev day to resolve, not the design phase:

1. **MailChannels DKIM setup** — needs DNS access; OHCS infra team must provision. Block on this before Phase 0 ships.
2. **Sequence number generation under concurrency** — D1 doesn't have native sequences. Likely use a `sequences` table with `UPDATE ... RETURNING` pattern, or compute as `(SELECT COUNT(*) + 1 ...)` inside a transaction. Decide in Phase 2.
3. **Polling vs SSE for AI verdict** — start with polling (simpler); revisit if it shows up as a load issue.
4. **PDF rendering library for AI fallback** — `pdfjs-dist` works in Workers but is heavy. Alternative: skip vision fallback and treat unrenderable PDFs as `'unchecked'`. Decide in Phase 4.

---

## 13. Success criteria

The system is considered launch-ready when:

1. OHCS admin can configure required documents for the 2026 Graduate Entrance Examination through the admin UI without developer help.
2. An applicant can complete the full flow on a Ghana mobile network: request magic link → fill 5 steps → upload 8+ documents → submit → receive reference number → track status.
3. AI sanity check correctly flags an obvious non-passport image as a passport photo, and correctly passes a real passport photo, in 95%+ of test cases.
4. 500 concurrent applicants can submit without P95 upload latency exceeding 5 seconds.
5. All audit log entries are written; no PII appears in logs.
6. Privacy Notice is published and linked from every form step.
7. End-to-end smoke test passes for: happy path, AI flag override, replace upload, late session expiry, submission after window closes.
