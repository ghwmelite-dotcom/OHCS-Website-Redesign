# OHCS Recruitment — Full Lifecycle Master Roadmap

**Status**: Approved decomposition + cross-cutting design; sub-project specs to follow
**Date**: 2026-04-22
**Owner**: OHCS Website Redesign team
**Builds on**: `docs/superpowers/specs/2026-04-21-recruitment-document-requirements-design.md` (the original spec covered Application + Document Vetting only)

---

## 1. Why this doc

The original recruitment spec (2026-04-21) scoped only the application-and-vetting half of the journey. The OHCS process is fuller:

> Application → Document vetting → Pay exam fee → Sit (online) exam → If pass-mark, online interview → Hire / waitlist / reject

This master doc captures the **cross-cutting design** — status state machine, identity model, notifications, deadlines, and roles — that all four remaining sub-projects must agree on. Each sub-project then gets its own detailed spec + plan + execution cycle, building in dependency order.

The intent is: nobody should design any one sub-project in a vacuum, but nobody should drown in a 1,000-line all-up spec either.

---

## 2. What's already shipped vs. remaining

| Layer | Status | Where |
|---|---|---|
| Phase 0: Cloudflare infrastructure | ✅ | `docs/superpowers/plans/2026-04-21-recruitment-phase-0-infrastructure-plan.md` |
| Phase 1: Admin master library + per-exercise doc requirements | ✅ | `docs/superpowers/plans/2026-04-21-recruitment-phase-1-admin-config-plan.md` |
| Phase 2: Magic-link auth + applicant form wizard | ✅ | `docs/superpowers/plans/2026-04-22-recruitment-phase-2-magic-link-form-plan.md` |
| Phase 3: Document uploads + submit + /track | ✅ | `docs/superpowers/plans/2026-04-22-recruitment-phase-3-uploads-submit-plan.md` |
| Phase 3.5: Active-exercise → D1 + lint cleanup | ✅ | merged in `4794735` (no separate plan; small focused branch) |
| **Sub-project A**: Reviewer Pipeline + Vetting (was Phase 4 + 5) | ❌ pending spec | this doc § 6 |
| **Sub-project B**: Exam-Fee Payment (Hubtel MoMo + bank) | ❌ pending spec | this doc § 7 |
| **Sub-project C**: Online Examination | ❌ pending spec | this doc § 8 |
| **Sub-project D**: Online Interview (Zoom/Teams) | ❌ pending spec | this doc § 9 |
| Final hardening + observability + launch prep | ❌ pending | last phase |

---

## 3. The full status state machine

`applications.status` is already a TEXT column with limited values; this expands it. All transitions are server-side; the React UI is a renderer of the current state. Terminal states are marked **(T)**.

```
draft
  │ (applicant clicks Submit, completeness verified server-side)
  ▼
submitted
  │ (a reviewer opens it in the admin pipeline)
  ▼
under_review
  │
  ├─→ vetting_passed
  │     │ (applicant given X days from this transition to pay; X is per-exercise)
  │     ▼
  │   payment_pending
  │     │
  │     ├─→ paid (Hubtel webhook)
  │     │     │ (cohort sits exam on the fixed exam date)
  │     │     ▼
  │     │   exam_taken
  │     │     │ (auto-grade against per-exercise pass mark)
  │     │     ├─→ exam_passed
  │     │     │     │ (slot picker opens for the cohort)
  │     │     │     ▼
  │     │     │   interview_scheduled
  │     │     │     │ (interview occurs; interviewer submits outcome)
  │     │     │     ▼
  │     │     │   interviewed
  │     │     │     │
  │     │     │     ├─→ shortlisted (T)   — hired
  │     │     │     ├─→ waitlisted        — passed bar, no slot. Admin can promote to shortlisted later.
  │     │     │     └─→ rejected (T)*     — failed interview
  │     │     │
  │     │     └─→ exam_failed (T)*
  │     │
  │     ├─→ payment_lapsed (T)            — deadline passed
  │     └─→ refund_pending → refunded (T) — via Hubtel refund API; see § 4.4
  │
  └─→ vetting_failed (T)*

(*) — Terminal states marked with an asterisk are appealable. See § 4.5.

withdrawn (T)
  Reachable from any non-terminal state via applicant or admin action.
  If transitioning from `paid` (or later), a refund is initiated where eligible.

appeal_under_review
  Reachable from vetting_failed, exam_failed, rejected.
  Resolves to either:
    appeal_upheld (T)   — original failure stands
    appeal_overturned   — applicant returns to the next step they would have proceeded to
```

The complete `ApplicationStatus` enum becomes:

```typescript
type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'requires_action'   // reviewer asked for resubmission of one or more docs
  | 'vetting_passed'
  | 'vetting_failed'
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
  | 'appeal_under_review'
  | 'appeal_upheld'
  | 'withdrawn';
```

Each transition is gated by:
1. **A guard** — server-side check that the current status permits the transition AND any preconditions (paid, declaration agreed, exam pass-mark met, etc.)
2. **An action** — a single Pages Function endpoint that writes the new status + any side effects (email, SMS, refund call, etc.)
3. **A notification** — email always; SMS for time-critical events (see § 4.3).

---

## 4. Cross-cutting concerns

### 4.1 Authentication

- **Applicants**: existing magic-link flow from Phase 2 carries through every stage. The same session cookie unlocks the dashboard, the payment flow, the exam page, the interview slot picker — all of it. No separate logins per stage.
- **Admins**: interim header-based gate from Phase 1 (`X-Admin-User-Email` + `X-Admin-User-Role`) continues until real admin auth ships. Every new admin Pages Function carries the SECURITY disclosure comment block.

### 4.2 Applicant home — the dashboard at `/apply`

A single page magic-link lands on after submit. Renders:

- Reference number (always visible)
- Current stage badge + a "what's next" card (the action they must take, or a wait-message)
- Stage history (collapsible)
- Document gallery (filenames only; no preview)
- Action buttons specific to current stage (Pay, Start Exam, Pick Interview Slot, Withdraw, Appeal)

Specific stage UIs (payment confirmation page, exam interface, interview slot picker) are routes UNDER `/apply` (e.g. `/apply/pay`, `/apply/exam`, `/apply/interview`) but the dashboard is the natural home anyone always returns to.

### 4.3 Notifications

- **Email**: every status transition. Resend (currently sandbox sender; switches to ohcs.gov.gh once DNS is set up).
- **SMS**: only for time-critical events:
  - Payment receipt confirmation (within 1 minute of `paid`)
  - Exam-day reminder (24h before, 1h before)
  - Interview reminder (24h before, 1h before)
  - Slot booking confirmation (immediate)
- **SMS provider**: Hubtel (bundles with the Hubtel payment account — single contract, single dashboard). ~GHS 0.05 per SMS.

### 4.4 Refunds

Refunds are admin-initiated except for `withdrawn` (auto-trigger if status was `paid` or later). Eligible scenarios:

- Applicant withdraws after paying
- OHCS cancels the exercise
- System fault prevents the applicant from sitting the exam (logged in audit trail)

Hubtel's refund API is called server-side; status moves `paid → refund_pending → refunded`. Email + SMS confirm.

Out of scope: refunds for failed exams (standard practice — fees are non-refundable on failure).

### 4.5 Appeals

Three failure points are appealable:

| From | To | Appeal window |
|---|---|---|
| `vetting_failed` | `appeal_under_review` → `vetting_passed` (overturned) or `appeal_upheld` | Per-exercise (default 7 days from notification) |
| `exam_failed` | `appeal_under_review` → `exam_passed` (overturned) or `appeal_upheld` | Per-exercise (default 7 days from results) |
| `rejected` (after interview) | `appeal_under_review` → `interview_scheduled` (overturned, re-interview) or `appeal_upheld` | Per-exercise (default 7 days from notification) |

Appeals are free (no fee). Applicants must submit a written reason via the dashboard. A single admin reviewer (different from the original decision-maker where possible) reviews and resolves. SLA: 14 days max from `appeal_under_review` to resolution.

### 4.6 Deadlines (Hybrid model)

- **Application window** — hard date set per exercise. After this, no new submissions.
- **Vetting + payment** — applicant-relative. Per-exercise config sets "X days to pay after vetting passed" (default 7). Counter starts at the moment status transitions to `vetting_passed`.
- **Exam date** — hard date for the cohort. Set per exercise. Anyone not in `paid` status by 24h before is auto-`payment_lapsed`.
- **Interview window** — hard window (e.g. 1-15 June) per exercise. Slots are open during this window. Anyone in `exam_passed` who doesn't book by the window's close is moved to `waitlisted` (admin can override to `rejected`).
- **Appeal window** — applicant-relative, per-exercise.

### 4.7 Roles (interim, until real admin auth)

For now we keep using `super_admin` and `recruitment_admin` for all new admin endpoints. When real admin auth ships, we'll split into:

| Role | Permissions |
|---|---|
| `super_admin` | everything |
| `recruitment_admin` | configure exercises, run vetting, view all stages, approve refunds |
| `reviewer` | vet documents (read application + uploads, mark pass/fail, write notes) |
| `examiner` | manage question bank, see exam results, set/change pass marks |
| `interviewer` | see only their assigned interview slots, submit interview outcomes |
| `viewer` | read-only access to all pipelines |

Phases 4-8 use the existing `recruitment_admin` for everything; granular roles slot in cleanly later because every admin endpoint already calls `requireAdmin()`.

### 4.8 Single-active exercise invariant

Already enforced server-side (see `feat(recruitment): admin Exercises + public recruitment page read from D1`). Only one exercise can be `active` at a time. This master design assumes single-active and does not need to change.

### 4.9 Data retention

7-year R2 lifecycle is already in place. Same retention applies to:

- Application records (D1)
- Uploaded documents (R2)
- Payment records (D1, with Hubtel transaction id)
- Exam scripts and scores (D1)
- Interview outcomes (D1)
- Interview meeting recordings (NOT recorded by default — see sub-project D)

Audit log retention: also 7 years.

---

## 5. Sub-project order + dependencies

```
A. Reviewer Pipeline + Vetting
   │ (applicants must be vetted before they can pay)
   ▼
B. Payment
   │ (applicants must have paid before they can sit exam)
   ▼
C. Online Examination
   │ (applicants must pass exam before they can interview)
   ▼
D. Online Interview
```

Phase 4 (AI verification) integrates with A — both surface in the reviewer pipeline. Built alongside A.

Final hardening + observability is its own pass after all four sub-projects ship.

---

## 6. Sub-project A: Reviewer Pipeline + Vetting

**One-paragraph summary**: Admin reviewers see a queue of `submitted` applications, click into one to see the form data + document gallery (signed-URL viewer for each file), and either click **Pass Vetting** (status → `vetting_passed`, payment-pending email + SMS sent) or **Fail Vetting** with a written reason (status → `vetting_failed`, applicant emailed reason + appeal CTA). AI verification verdicts from Phase 4 surface as badges on each document. Per-exercise "X days to pay after vetting" config drives the payment_lapsed deadline.

**Detailed spec**: TBD when sub-project A is brainstormed in detail.

**Effort estimate**: ~2 days (plus ~1.5 days for Phase 4 AI verification on top).

## 7. Sub-project B: Exam-Fee Payment

**One-paragraph summary**: Per-exercise fee config (capped at GHS 100). Applicant in `vetting_passed` sees a Pay CTA on dashboard. Picks MoMo (MTN/Telecel/AirtelTigo) or bank transfer; opens Hubtel hosted checkout. Hubtel webhook updates status to `paid`; receipt email + SMS sent. Admin sees per-exercise payment dashboard (paid count, pending count, lapsed count, total collected). Refunds are admin-initiated from the application detail view.

**Detailed spec**: TBD when sub-project B is brainstormed in detail.

**Effort estimate**: ~3-4 days (Hubtel sandbox onboarding may add 1 day if account setup is slow).

## 8. Sub-project C: Online Examination

**One-paragraph summary**: Admin builds a question bank per exercise (multi-choice, true/false, short-answer; per-question point value; correct answer for auto-grade). Sets pass mark and exam duration. Applicant in `paid` status sees an Enter Exam CTA on the exam date. Timed exam UI (server-enforced timer, no client clock trust); auto-saves answers every 10 seconds; one attempt only. On submit (or timer expiry), auto-graded; status → `exam_passed` or `exam_failed`; results emailed.

Anti-cheat scope: full-screen prompt + tab-blur warnings (NOT proctoring; no webcam capture). Applicant identity is the magic-link session.

**Detailed spec**: TBD when sub-project C is brainstormed in detail.

**Effort estimate**: ~5-7 days (the question bank admin + exam UI are the heaviest pieces).

## 9. Sub-project D: Online Interview

**One-paragraph summary**: Admin configures interviewer roster + available slots per exercise. Applicants in `exam_passed` open the slot picker; pick a slot; system creates a Zoom or Teams meeting (decision pending — see open question below) via the platform's API; meeting link emailed + SMS-reminded. Interviewer joins, conducts interview, submits outcome via admin UI: shortlisted / waitlisted / rejected. Outcome triggers final email + SMS to applicant. Admin can promote waitlisted → shortlisted later (manual; not automatic).

**Open question for D's spec**: Zoom or Teams. OHCS uses @ohcs.gov.gh emails — if those are Microsoft 365 mailboxes, Teams integration is more natural (no third-party login). If Google Workspace, neither has an obvious advantage and Zoom's API is somewhat simpler. To be confirmed when D is brainstormed.

**Detailed spec**: TBD when sub-project D is brainstormed in detail.

**Effort estimate**: ~3 days.

---

## 10. Total effort + sequencing

| Sub-project | Effort | Cumulative |
|---|---|---|
| A. Reviewer Pipeline + Vetting (incl. Phase 4 AI) | 3.5 days | 3.5 days |
| B. Payment via Hubtel | 3.5 days | 7 days |
| C. Online Examination | 6 days | 13 days |
| D. Online Interview | 3 days | 16 days |
| Hardening + observability + launch prep | 1 day | 17 days |

**Estimated total**: ~3.5 weeks of focused build to ship the entire end-to-end recruitment lifecycle to public-launch quality, on top of what's already shipped.

This assumes one developer working through the plans sequentially with subagent assistance, plus the existing pace of decisions (~1 day per sub-project for brainstorm + spec + plan + execution).

---

## 11. What's still gated externally

Two pre-launch items remain outside this roadmap because they require external action:

1. **Real admin auth** — three options on the table (Cloudflare Access / magic-link admin / D1 + PBKDF2). User has the design choice on their list. Recommended: Cloudflare Access. Until decided, every admin endpoint carries the SECURITY disclosure comment.
2. **MailChannels DKIM/SPF on `ohcs.gov.gh`** — needs OHCS infra team's DNS access. Currently using Resend sandbox sender (`onboarding@resend.dev`) which only delivers to verified addresses on the OHCS Resend account.

Neither blocks the sub-project builds — they just gate the public launch.

---

## 12. Success criteria

The full lifecycle is launch-ready when:

- An applicant can: log in via magic link → submit application → receive vetting outcome → pay exam fee → sit exam → receive results → book interview → receive final outcome — all from a single dashboard, with email + SMS at each transition.
- An admin can: review submissions → mark vetting outcomes → see payment status → upload exam questions → see exam results → manage interview slots → see interview outcomes → promote waitlisted candidates.
- All status transitions are server-side gated and auditable.
- Refunds work end-to-end via Hubtel.
- Appeals work end-to-end (applicant submits, admin reviews, status updates).
- Real admin auth is in place (Cloudflare Access or chosen alternative).
- ohcs.gov.gh email is configured and SMS via Hubtel is live.

The next document is sub-project A's detailed spec.
