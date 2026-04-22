# Sub-project A — Reviewer Pipeline + Document Vetting

**Status**: Approved design, ready for implementation planning
**Date**: 2026-04-22
**Owner**: OHCS Website Redesign team
**Position in roadmap**: First sub-project after Phase 3; absorbs the originally-planned Phase 4 (AI verification) since both surface in the same reviewer UI
**Prerequisites**: Phases 0-3 + Phase 3.5 (active-exercise → D1) all shipped to `ohcs.pages.dev`
**References**:
- `docs/superpowers/specs/2026-04-22-recruitment-lifecycle-master-roadmap.md` (cross-cutting design)
- `docs/superpowers/specs/2026-04-21-recruitment-document-requirements-design.md` § 8 (AI verification details — model choices, prompts, thresholds)

---

## 1. Purpose

Build the reviewer side of recruitment: an admin-facing pipeline where staff with the `recruitment_admin` role open submitted applications, view each uploaded document side-by-side with the application metadata, mark each document as Accepted / Rejected / Needs Better Scan, and let the system roll up to an overall vetting outcome (`vetting_passed`, `vetting_failed`, or `requires_action`). Status transitions trigger applicant emails (and SMS for time-critical ones). AI sanity-check verdicts on uploaded documents are surfaced as badges in the gallery to help reviewers prioritise their attention. Failed-vetting decisions are appealable; appeals are reviewed by `recruitment_admin` only (not the original reviewer).

This is the first sub-project of the full lifecycle build because nothing else can happen until applications are vetted: payment requires `vetting_passed`, exam requires `paid`, interview requires `exam_passed`.

---

## 2. Decisions summary

| Topic | Decision |
|---|---|
| Vetting outcomes | 3-way: Pass / Fail / Request Resubmission |
| Reviewer UI layout | Side-by-side: app metadata + decision controls (left), document gallery + active preview (right) |
| Reviewer assignment | Open queue — anyone with the role picks; first-click claims |
| Per-document granularity | Per-document decision (Accept / Reject / Needs Better Scan) → application outcome rolls up automatically |
| Appeal reviewer | `recruitment_admin` only (not the original reviewer) |
| AI verification | Per the original spec § 8: 3 check types (photo / certificate / identity), llava-1.5-7b vision + llama-3.1-8b text, 0.75 confidence threshold, async via `ctx.waitUntil`, soft-warning UX |
| Reasons visibility | Per-doc reasons are ALWAYS applicant-facing (so they know what to fix on resubmission); no internal-only notes in v1 |
| Vetting deadline | Per-exercise admin config (default: vetting must complete within 14 days of submission, applicant-relative) |
| Re-vetting after appeal | Different reviewer required where possible (UI hides own decisions from the appeal queue; not bulletproof — relies on role separation) |
| Bulk actions | Not in v1 — one application at a time |

---

## 3. Status state machine additions

The master roadmap defines the full lifecycle. This sub-project introduces and exercises these states + transitions:

```
submitted
  │ (any reviewer clicks "Take" or opens it from the queue)
  ▼
under_review
  │ (reviewer marks per-doc decisions and clicks Submit)
  │
  │  All accepted → ────────→ vetting_passed
  │
  │  Any rejected → ────────→ vetting_failed (T*)
  │                              │ (applicant appeals within window)
  │                              ▼
  │                            appeal_under_review
  │                              │ (recruitment_admin reviews)
  │                              ├─→ appeal_overturned → vetting_passed
  │                              └─→ appeal_upheld (T)
  │
  │  Any "needs better scan" → requires_action
  │     │ (applicant resubmits affected docs)
  │     │
  │     ├─→ submitted        (back to queue)
  │     ├─→ withdrawn (T)    (applicant gives up)
  │     └─→ vetting_failed   (deadline passed without resubmission, auto)

(T*) — appealable terminal
```

**Important: `requires_action` was missing from the master roadmap's enum.** This spec adds it; the master will be updated to include it in the next revision.

---

## 4. Data model

### 4.1 New D1 tables

Two new tables, plus extensions to existing ones:

```sql
-- Per-document review decisions (one row per (application_id, document_type_id))
-- A new row is INSERTed each time a reviewer makes a fresh decision; the
-- LATEST row per (application_id, document_type_id) is the active one.
-- Older rows are the audit trail.
CREATE TABLE IF NOT EXISTS document_review_decisions (
  id                 TEXT PRIMARY KEY,
  application_id     TEXT NOT NULL,
  document_type_id   TEXT NOT NULL,
  reviewer_email     TEXT NOT NULL,
  decision           TEXT NOT NULL,    -- 'accepted' | 'rejected' | 'needs_better_scan'
  reason             TEXT,             -- required when decision != 'accepted'
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drd_application
  ON document_review_decisions(application_id, created_at DESC);

-- Application-level vetting outcomes (one row per vetting cycle).
-- A re-vetting after appeal_overturned creates a new row.
CREATE TABLE IF NOT EXISTS application_review_decisions (
  id                 TEXT PRIMARY KEY,
  application_id     TEXT NOT NULL,
  reviewer_email     TEXT NOT NULL,
  outcome            TEXT NOT NULL,    -- 'vetting_passed' | 'vetting_failed' | 'requires_action'
  notes              TEXT,             -- reviewer's overall summary, ALWAYS applicant-facing
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ard_application
  ON application_review_decisions(application_id, created_at DESC);

-- Status transition audit trail (used by THIS sub-project and all future ones).
-- One row per status change. Captures who, what, when, why.
CREATE TABLE IF NOT EXISTS status_transitions (
  id              TEXT PRIMARY KEY,
  application_id  TEXT NOT NULL,
  from_status     TEXT NOT NULL,
  to_status       TEXT NOT NULL,
  actor_email     TEXT,             -- NULL for system-initiated transitions (e.g. deadline-driven)
  actor_role      TEXT,             -- 'recruitment_admin' | 'reviewer' | 'applicant' | 'system'
  reason          TEXT,             -- short human-readable description
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_status_transitions_app
  ON status_transitions(application_id, created_at DESC);
```

### 4.2 Schema additions to existing tables

```sql
-- recruitment_exercises: add per-exercise vetting policy
ALTER TABLE recruitment_exercises
  ADD COLUMN vetting_window_days INTEGER NOT NULL DEFAULT 14;
ALTER TABLE recruitment_exercises
  ADD COLUMN appeal_window_days INTEGER NOT NULL DEFAULT 7;

-- applications: lock-claim for the open-queue model. NULL = unclaimed.
-- Set when a reviewer opens an app from the queue; cleared if they release it
-- or after a 30-min idle timeout.
ALTER TABLE applications
  ADD COLUMN review_claimed_by TEXT;
ALTER TABLE applications
  ADD COLUMN review_claimed_at INTEGER;
```

### 4.3 ApplicationStatus enum (full list, including this sub-project's additions)

```typescript
type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'requires_action'              // NEW in this sub-project
  | 'vetting_passed'
  | 'vetting_failed'
  | 'appeal_under_review'
  | 'appeal_upheld'
  | 'payment_pending'
  | 'paid'
  | 'payment_lapsed'
  | 'refund_pending'
  | 'refunded'
  | 'exam_taken'
  | 'exam_passed'
  | 'exam_failed'
  | 'interview_scheduled'
  | 'interviewed'
  | 'shortlisted'
  | 'waitlisted'
  | 'rejected'
  | 'withdrawn';
```

Sub-projects B, C, D will exercise the rest of these states.

---

## 5. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ Browser (admin reviewer)               Browser (recruitment_admin) │
│ ┌──────────────────────┐              ┌──────────────────────┐   │
│ │ /admin/recruitment/  │              │ Same UI + appeal     │   │
│ │   pipeline           │              │ queue + override      │   │
│ │ Side-by-side viewer  │              │ capability            │   │
│ │ Per-doc decisions    │              │                       │   │
│ │ AI badges            │              │                       │   │
│ └──────────┬───────────┘              └───────────┬──────────┘   │
└────────────┼──────────────────────────────────────┼──────────────┘
             │                                      │
             ▼                                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  Cloudflare Pages Functions                                      │
│  /api/admin/applications/* (queue, claim, decide, appeal)        │
│  /api/admin/applications/[id]/documents/[docTypeId]/url          │
│    (60s signed R2 URL for the side-by-side preview pane)         │
│  /api/applications/me/appeals  (applicant-facing appeal submit)  │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
                ┌────────────┐    ┌────────┐    ┌──────────────┐
                │     D1     │    │   R2   │    │ Workers AI   │
                │ + new tabs │    │ signed │    │ (verdict     │
                │  drd, ard, │    │  URLs  │    │  writer)     │
                │  status_   │    │        │    │              │
                │  trans.    │    │        │    │              │
                └────────────┘    └────────┘    └──────────────┘
                                                      │
                                                      ▼
                                                ┌──────────┐
                                                │ Resend   │ ← outcome emails
                                                │ + Hubtel │ ← outcome SMS
                                                │   SMS    │   (time-critical only)
                                                └──────────┘
```

---

## 6. Reviewer UI specification

### 6.1 Pipeline page at `/admin/recruitment/pipeline`

Already exists as a placeholder — replace with the real implementation.

**Top bar**:
- Status filter chips (`Submitted`, `Under Review`, `Requires Action`, `Vetting Passed`, `Vetting Failed`, plus `All`)
- Exercise filter (defaults to active exercise)
- Search by reference number / email
- Right side: **Take next** button (claims the next unclaimed `submitted` or `requires_action` application and routes the reviewer into the detail view)

**Table**:
- Reference number (mono badge)
- Submitted-at (relative: "3h ago")
- Applicant email (truncated)
- Doc count (e.g. "8/8" or "7/8 — missing PWD cert")
- AI summary (e.g. "✓ all clean" or "⚠ 2 flags")
- Status badge
- Currently-claimed-by indicator if present
- Click row → opens detail view (claims if currently `submitted` and unclaimed; otherwise just opens read-only or under_review depending on existing claim)

### 6.2 Application detail view at `/admin/recruitment/pipeline/[id]`

Two-pane layout (desktop-first; collapses to single column on mobile).

**Left pane (decision controls)**:
- Application reference + status pill at top
- Applicant identity card (name, email, phone, DOB, NIA, region) — read-only
- Eligibility flags (holds first degree, professional qual, PWD)
- Education & experience summary (Step 3 data)
- Per-document decision list:
  - Each row: doc label + AI verdict badge + 3 radio buttons (Accept / Reject / Needs Better Scan) + reason field (shown when not Accept)
  - All required + applicable conditional docs listed; missing docs show as "NOT UPLOADED" with no decision controls
- Overall notes textarea (applicant-facing)
- "Submit Vetting Decision" button (disabled until every required doc has a decision AND every non-accept decision has a reason)

**Right pane (document viewer)**:
- Document gallery thumbnails along the top
- Active document rendered in main area:
  - PDFs: PDF.js iframe
  - Images: native `<img>` with zoom controls
  - Unrenderable types: download button
- AI verdict box overlay (top-right corner of preview): green check / amber warning / grey question, click for detail (model, confidence, reason, prompt version)
- Reviewer can click "Override AI" inside the AI box (sets a flag the audit log captures)

### 6.3 Submission flow

When the reviewer clicks **Submit Vetting Decision**:

1. Server validates: every required-and-applicable doc has a decision; every non-accept decision has a non-empty reason.
2. INSERT one `document_review_decisions` row per per-doc decision.
3. Compute roll-up:
   - All accepted → `vetting_passed`
   - Any rejected → `vetting_failed` (rejected reasons are terminal — applicant must appeal)
   - Otherwise (some `needs_better_scan`, no rejected) → `requires_action`
4. INSERT one `application_review_decisions` row with the rolled-up outcome.
5. INSERT one `status_transitions` row.
6. UPDATE applications: set new status, clear `review_claimed_by`/`review_claimed_at`.
7. If `requires_action`: also UPDATE the affected `application_documents` rows to clear them (set `applicant_confirmed = 0` so they need to re-upload).
8. Send applicant email (always) + SMS (only for `vetting_passed` since payment is now time-critical).
9. Return success → reviewer routed back to the queue.

### 6.4 Appeal queue at `/admin/recruitment/appeals`

Visible only to `recruitment_admin`. Same table style as the main pipeline but filtered to `appeal_under_review`. Click into an appeal:

- Detail view shows the original vetting decision (read-only) on the left
- The applicant's appeal text on the right
- **Uphold** button → status `appeal_upheld` (terminal); applicant emailed
- **Overturn** button → status flips back to `vetting_passed`; applicant emailed; payment_pending email also fires (since they now move to the next stage)

The original-reviewer ban is enforced at the SQL level (the appeal queue query excludes appeals on applications where the latest `application_review_decisions.reviewer_email` equals the current admin's email). Soft-blocked, not bulletproof — but `recruitment_admin`s are typically a different person from `reviewer`s anyway.

---

## 7. Applicant-side touchpoints

The applicant doesn't get a new dashboard from this sub-project (the master roadmap's `/apply` lives in B+ as that's when there's actually something for them to do beyond viewing status). For sub-project A:

- **`vetting_passed` email**: "Your application has passed initial review. To proceed to the examination, please pay the GHS X exam fee by [deadline]." + dashboard link (the dashboard at `/apply` will be built in B). For sub-project A, the link points to `/track` with a CTA: "Payment portal will open when sub-project B ships."
- **`vetting_passed` SMS**: "OHCS: your application <ref> has passed vetting. Pay your exam fee by [date] to proceed."
- **`vetting_failed` email**: "Your application was not successful at vetting. Reason: [reason]. You may appeal within [appeal_window_days] days. [Appeal link]" — no SMS (not time-critical and the email contains the reason).
- **`requires_action` email**: "Your application needs additional information before vetting can complete. Please re-upload the following documents: [list with per-doc reasons]. [Resubmit link]" — no SMS (allow them time to read).

The appeal-submit flow uses the existing magic-link auth: applicant clicks the appeal link in their email → magic link → lands on a small appeal-submission form (single textarea + submit button) → POST `/api/applications/me/appeals`.

---

## 8. AI verification (Phase 4 absorbed)

This sub-project absorbs what was originally planned as Phase 4. Everything in the original spec § 8 stands as-is:

- Three check types: `photo`, `certificate`, `identity` (already in `document_types.ai_check_type`)
- Models: `@cf/llava-hf/llava-1.5-7b-hf` (vision), `@cf/meta/llama-3.1-8b-instruct` (PDF text classification)
- PDFs: try `pdf-parse` first (text PDFs), fall back to rendering page 1 to image for vision check
- Confidence threshold: **0.75** (same as original spec)
- Async via `ctx.waitUntil()` — upload returns immediately, AI verdict lands within 5-10s
- Frontend polls `/api/applications/me/requirements` every 3s while any doc is `ai_verdict='unchecked'`
- Soft-warning UX during applicant upload: amber tooltip + confirmation tick required to proceed (applicant can override)
- Versioned prompts: `ai_prompt_version` column already exists; bumped each time the prompt template changes
- Cost: ~$10-30 per recruitment exercise (negligible)

The reviewer surface (this sub-project) consumes the verdicts:
- AI verdict badge on each doc thumbnail in the gallery
- Click a badge to see model used + confidence + raw reason + prompt version
- Reviewer can override with explicit "Override AI" action (logged in `status_transitions` as `actor_role='recruitment_admin'`, even though the doc-level decision is the source of truth — the override is metadata about why the reviewer's decision differs from the AI verdict)

The applicant-side polling and the upload-time soft-warning are existing concerns that were left as `ai_verdict='unchecked'` placeholders in Phase 3. This sub-project wires them to actual model calls.

---

## 9. API endpoints (Pages Functions)

### 9.1 New admin endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/applications` | Paginated list with filters (status, exercise_id, search, claimed-by-me). Already partially specced in original doc § 7.2; this fleshes it out. |
| `POST` | `/api/admin/applications/[id]/claim` | Reviewer claims an application. Sets `review_claimed_by`, `review_claimed_at`. Returns 409 if already claimed. |
| `POST` | `/api/admin/applications/[id]/release` | Releases the claim without making a decision. |
| `GET` | `/api/admin/applications/[id]` | Full detail: form_data, documents (with AI verdicts), prior decisions, status history. |
| `GET` | `/api/admin/applications/[id]/documents/[docTypeId]/url` | Returns 60s signed R2 URL for the preview pane. |
| `POST` | `/api/admin/applications/[id]/vetting` | Submit vetting decision. Body: `{ document_decisions: [...], notes }`. Server computes the roll-up. |
| `GET` | `/api/admin/applications/appeals` | List of `appeal_under_review` apps; excludes appeals on the caller's own decisions. |
| `POST` | `/api/admin/applications/[id]/appeals/resolve` | Body: `{ outcome: 'upheld' \| 'overturned', notes }`. Restricted to `recruitment_admin`. |

### 9.2 New applicant endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/applications/me/appeals` | Submit an appeal. Body: `{ reason }`. Validates that current status is appealable. |

### 9.3 New system endpoints (cron / background)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/system/run-deadlines` | Triggered by Cloudflare cron (daily). Auto-transitions: `requires_action` past deadline → `vetting_failed`; `vetting_passed` past payment deadline → `payment_lapsed` (this latter belongs to sub-project B but the cron framework is set up here). |

The cron uses a shared secret in the `Authorization` header to authenticate; the secret is set via `wrangler secret put SYSTEM_CRON_SECRET`.

---

## 10. Notifications

| Event | Email | SMS | When |
|---|---|---|---|
| `under_review` (claim) | — | — | Internal only, no notification |
| `vetting_passed` | ✅ | ✅ | Immediate; SMS triggers because payment is now time-critical |
| `vetting_failed` | ✅ | — | Immediate; email contains reason + appeal link |
| `requires_action` | ✅ | — | Immediate; email lists per-doc reasons + resubmit link |
| `appeal_under_review` | — | — | Internal queue change only |
| `appeal_upheld` | ✅ | — | Final rejection; same body as `vetting_failed` |
| `appeal_overturned` | ✅ | ✅ | Same as `vetting_passed` (they now proceed) |

All emails go via the existing `sendEmail` helper. SMS uses a new `sendSms` helper added in this sub-project (Hubtel SMS API; tiny wrapper similar to the email helper, with the same `EMAIL_PROVIDER`-style `SMS_PROVIDER` env knob).

The Hubtel SMS account is gated on the user's signup — for v1 dev, the helper falls back to a no-op + console.log when `HUBTEL_SMS_API_KEY` is not set, so the rest of the system works in development.

---

## 11. Security & permissions

- All admin endpoints continue to use the interim `requireAdmin()` header check.
- The appeal queue endpoint additionally checks `actor_role === 'recruitment_admin'` (denies plain `reviewer`).
- The applicant appeal endpoint uses the existing `requireApplicant()` cookie session.
- Signed R2 URLs are 60-second TTL, single-use, scoped to a specific R2 key.
- Per-document review decisions and reasons are visible to the applicant (always) — no internal-only notes in v1.
- Status transitions are append-only — no UPDATE / DELETE on `status_transitions`. (Errors in transitions are corrected by issuing a new compensating transition, so the audit trail captures the fix.)

---

## 12. Error handling & edge cases

| Case | Behaviour |
|---|---|
| Two reviewers open the same `submitted` app | First click claims; second sees a 409 + "claimed by [name] X minutes ago — override or pick another" prompt |
| Reviewer abandons a claim (closes browser) | Claim auto-expires after 30 min idle; cron `/api/system/run-deadlines` clears stale claims |
| Reviewer submits vetting but app was already withdrawn | 409 + "This application is no longer in review" |
| Required doc was never uploaded | Decision UI shows "NOT UPLOADED" — overall outcome cannot be `vetting_passed` (Reject is the only valid choice for that doc; Pass requires ALL required docs Accepted) |
| Applicant resubmits after `requires_action` | Status returns to `submitted`; previous `document_review_decisions` rows preserved as audit trail; new vetting cycle creates new rows |
| AI verification fails (Workers AI down) | Doc gets `ai_verdict='unchecked'`; reviewer makes the call without AI assistance; banner at top of detail view: "AI sanity check unavailable for some docs — review carefully" |
| Appeal submitted twice | Second submission rejected — only one open appeal per terminal failure |
| Appeal window expired | Appeal CTA no longer rendered; submission API returns 409 |

---

## 13. Build phases (high-level — detailed plan to follow)

| Step | Effort |
|---|---|
| Migrations + schema | 0.5 day |
| AI verification wiring (Phase 4 absorbed) | 1.5 days |
| Pages Functions endpoints (queue, claim, decide, appeal) | 1 day |
| Admin React UI (pipeline list + side-by-side detail view) | 1.5 days |
| Email templates (4 transitions) + SMS helper + cron | 0.5 day |
| Tests + smoke + deploy | 0.5 day |

**Total**: ~5 days of focused build (vs 3.5 days estimated in the master roadmap; the AI verification absorbs the difference).

---

## 14. Success criteria

Sub-project A is launch-ready when:

1. A reviewer can log in via the admin UI, see the queue, claim an application, and walk through every uploaded document in the side-by-side viewer.
2. AI verdicts appear as badges on every document and the reviewer can click for full detail.
3. The reviewer can mark each document Accept / Reject / Needs Better Scan with reasons, and on submit the application's status transitions correctly with a roll-up that matches the per-doc decisions.
4. `vetting_passed` triggers email + SMS; `vetting_failed` triggers email with appeal CTA; `requires_action` triggers email with per-doc reasons.
5. An applicant whose status is `vetting_failed` can click their appeal link and submit an appeal via the existing magic-link flow.
6. A `recruitment_admin` can resolve appeals (uphold or overturn) from the appeals queue, and overturning correctly returns the application to `vetting_passed`.
7. Status transitions are durably recorded in `status_transitions`; the table is the audit trail anyone (admin, applicant, lawyer) can rely on.
8. Tests covering all transitions are green; production deploy verified end-to-end on `ohcs.pages.dev`.
9. The original Phase 3 placeholder (every upload `ai_verdict='unchecked'`) is replaced with real model verdicts on production.

---

## 15. Open items deferred to other sub-projects

- **Applicant dashboard at `/apply`**: built in sub-project B (when the applicant first has a meaningful action — paying — the dashboard becomes worth building)
- **Hubtel SMS account onboarding**: needed for B as well; setup happens during B
- **Real admin auth**: still pending the user's design choice; sub-project A continues using the interim header gate
- **Cron secret rotation**: `SYSTEM_CRON_SECRET` setup in Cloudflare Pages secrets (~5 min ops task during deploy)
