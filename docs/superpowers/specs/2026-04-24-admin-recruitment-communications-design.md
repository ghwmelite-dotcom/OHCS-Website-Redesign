# Admin Recruitment Communications — Design Spec

**Date:** 2026-04-24
**Status:** Draft — awaiting user review
**Sub-project:** Replaces the demo-only Communications page under
`/admin/recruitment/communications` with a real template-backed
campaign sender that targets applicants by exercise + status,
delivers via the existing email + SMS pipelines, and logs every
send for audit.

---

## 1. Goal

Wire up `/admin/recruitment/communications` so a recruitment admin
can: (a) maintain a library of reusable email/SMS templates with
placeholders; (b) compose ad-hoc messages or load a template;
(c) target applicants by application status within an active
exercise; (d) send to email always and SMS optionally; (e) review
a complete audit trail of past campaigns and their per-recipient
delivery outcomes.

## 2. Why

The existing page (`src/app/admin/recruitment/communications/page.tsx`)
is currently a stub flagged by the 2026-04-23 audit and the 2026-04-24
DemoBanner work — hardcoded templates, fake send logs, non-functional
buttons. The recruitment workflow demands a real channel for
broadcasts ("exam date confirmed", "results published", "appeal
deadline tomorrow") that today only exist as transactional emails
emitted by per-status code paths in `vetting.ts` / `appeals/resolve.ts`.

## 3. Locked-in decisions (from 2026-04-24 alignment)

| # | Decision | Choice |
|---|---|---|
| 1 | Composition mode | **Both** — start from a saved template OR write ad-hoc. Templates are stored in D1, editable via the UI. |
| 2 | Audience targeting | **By application status + exercise** + **single-applicant** entry point from the reviewer detail page. |
| 3 | Channels | **Email always; SMS opt-in checkbox per send.** When `HUBTEL_SMS_API_KEY` is unset, the SMS checkbox is disabled with a tooltip. |
| 4 | RBAC | **`recruitment_admin` + `super_admin`** can compose and send. All admin roles can read history. |
| 5 | Send model | **Synchronous up to 50 recipients per campaign.** Above that, the API returns 400 with "audience too large; narrow the filter or split into batches." |

## 4. Out of scope

- Scheduled / future-dated sends (admin-fired only for v1)
- Attachments (text-only for v1)
- Multi-language template variants (English only — translation comes when the broader public site goes multilingual)
- Open / click tracking pixels (privacy + complexity for v1)
- Template versioning history (current value is the only value; edits overwrite)
- Recipient unsubscribe flow (legitimate transactional comms — applicants opted in to receive recruitment notifications when they applied)
- A queue / background job system for >50 recipients (clearly documented; future work)
- BCC the sending admin
- Reply-to handling (uses existing `EMAIL_FROM` for the from address)

## 5. Architecture

### 5.1 Schema additions (`migrations/0011_comm_campaigns.sql`)

```sql
-- Reusable templates. Names are unique. Bodies use {{placeholder}} syntax;
-- substitution is performed at send time using a strict allowlist (see §5.6).
CREATE TABLE IF NOT EXISTS comm_templates (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  description  TEXT,
  subject      TEXT NOT NULL,
  body_text    TEXT NOT NULL,
  body_html    TEXT,                       -- optional; falls back to body_text when null
  sms_body     TEXT,                       -- optional; max 320 chars after substitution
  created_at   INTEGER NOT NULL,
  created_by   TEXT NOT NULL,
  updated_at   INTEGER NOT NULL,
  updated_by   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_templates_name ON comm_templates(name);

-- One row per campaign (i.e. per send action by an admin).
CREATE TABLE IF NOT EXISTS comm_campaigns (
  id                 TEXT PRIMARY KEY,
  template_id        TEXT,                 -- NULL when ad-hoc
  exercise_id        TEXT NOT NULL,
  status_filter      TEXT NOT NULL,        -- ApplicationStatus enum value, or 'single' for one-off
  recipient_count    INTEGER NOT NULL,
  sent_count         INTEGER NOT NULL,     -- subset that succeeded on email path
  failed_count       INTEGER NOT NULL,     -- subset that failed on email path
  sms_requested      INTEGER NOT NULL,     -- 0 or 1; whether the admin opted into SMS
  sms_sent_count     INTEGER NOT NULL DEFAULT 0,
  sms_failed_count   INTEGER NOT NULL DEFAULT 0,
  subject            TEXT NOT NULL,        -- snapshot of subject at send time
  body_text          TEXT NOT NULL,        -- snapshot of body at send time
  body_html          TEXT,                 -- snapshot
  sms_body           TEXT,                 -- snapshot
  sender_email       TEXT NOT NULL,        -- the admin who hit Send
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_campaigns_exercise
  ON comm_campaigns(exercise_id, created_at DESC);

-- One row per recipient per campaign. Drill-down audit.
CREATE TABLE IF NOT EXISTS comm_campaign_recipients (
  id              TEXT PRIMARY KEY,
  campaign_id     TEXT NOT NULL,
  application_id  TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  email_status    TEXT NOT NULL,           -- 'sent' | 'failed'
  email_error     TEXT,                    -- populated when email_status='failed'
  sms_status      TEXT,                    -- 'sent' | 'failed' | NULL when SMS not requested
  sms_error       TEXT,
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_campaign_recipients_campaign
  ON comm_campaign_recipients(campaign_id);
```

### 5.2 New API endpoints

| Method + path | Purpose | Auth |
|---|---|---|
| `GET /api/admin/comms/templates` | List all templates | recruitment_admin+ |
| `POST /api/admin/comms/templates` | Create template | recruitment_admin+ |
| `GET /api/admin/comms/templates/[id]` | Get one template (for editing) | recruitment_admin+ |
| `PATCH /api/admin/comms/templates/[id]` | Update template | recruitment_admin+ |
| `DELETE /api/admin/comms/templates/[id]` | Delete template | recruitment_admin+ |
| `GET /api/admin/comms/audience-count?exercise_id=…&status=…` | Live recipient count for compose UI | recruitment_admin+ |
| `POST /api/admin/comms/campaigns` | Send a campaign. Body: `{exercise_id, status, send_sms, subject, body_text, body_html?, sms_body?, template_id?}`. Synchronous, returns 200 with `{campaign_id, recipient_count, sent_count, failed_count, sms_sent_count, sms_failed_count}` or 400 if audience > 50. | recruitment_admin+ |
| `GET /api/admin/comms/campaigns?exercise_id=…` | List past campaigns | All admin roles |
| `GET /api/admin/comms/campaigns/[id]/recipients` | Per-recipient drill-down for one campaign | All admin roles |

### 5.3 Frontend changes

**Replace `src/app/admin/recruitment/communications/page.tsx`** — remove all hardcoded data, the DemoBanner, the static template list. Build a tabbed interior (or three sections) covering:

1. **Templates** — table of templates with edit/delete; "New Template" button opens a modal/form with subject, body_text (markdown-ish or plain), body_html (optional), sms_body (optional, with live char count and 320-char warning); placeholder helper showing the available `{{name}}` etc. with a sample-substitute preview.

2. **Compose** — left side: "Load template" dropdown (clears subject/body if changed) + subject + body inputs + "Send via SMS too" checkbox. Right side: audience picker (exercise dropdown defaulted to active exercise + status dropdown of ApplicationStatus values + live recipient count). Bottom: "Send to N applicants" button (disabled when count > 50 or count == 0). On click → POST → success toast with stats summary.

3. **History** — table of past campaigns (subject, audience description, sent_at, sent/failed/sms counts), each row expandable to show per-recipient outcomes from `/recipients` endpoint.

**Single-applicant entry point** — on `/admin/recruitment/pipeline/detail/?id=…`, add a "Send message" button next to the existing "Release claim" button. Clicking it opens a modal with the same compose form but pre-filled `status=single` + `application_id=<id>`. The send endpoint already supports this via the `status='single'` filter — see §5.4.

### 5.4 Audience resolution logic

The recipient list for a campaign is computed server-side at send time (not at compose time, except for the live count) so the count is always accurate to the moment of dispatch.

```
SELECT id, email, form_data
FROM applications
WHERE exercise_id = ?
  AND status = ?
```

When `status = 'single'`, the resolver instead does:
```
SELECT id, email, form_data
FROM applications
WHERE id = ?
```

Phone is extracted from `form_data` JSON via the existing `extractPhone()` pattern (already present in `vetting.ts` and `appeals/resolve.ts` — promote to a shared helper as part of this work).

### 5.5 Placeholder substitution

Supported placeholders (allowlist — anything not in this list passes through verbatim):

| Placeholder | Substituted with |
|---|---|
| `{{name}}` | `form_data.full_name` if present, else falls back to local-part of email |
| `{{email}}` | The applicant's email |
| `{{reference_number}}` | `applications.id` (e.g., `OHCS-2026-00001`) |
| `{{exercise_name}}` | `recruitment_exercises.name` |
| `{{status}}` | Human label from `src/lib/application-status.ts` |
| `{{appeal_deadline}}` | Computed from `appeal_submitted_at + appeal_window_days * 86400000` if applicable, else empty string |

Substitution is performed once per recipient just before send. The campaign snapshot (`comm_campaigns.subject`, `body_text`, etc.) stores the **un-substituted** version for audit clarity.

### 5.6 Security

- **HTML escaping**: `body_html` is sent as-is (admin authored, trusted), but placeholder substitutions inside it are HTML-escaped via `_shared/escape-html.ts` (already shipped in security batch 1).
- **Rate limit**: send endpoint enforces 3 campaigns per admin per 5-min rolling window (per-admin, not per-template — same pattern as magic-link rate limit).
- **Audience cap**: hard 50 recipients per campaign. Returns 400 above that with a clear error.
- **RBAC**: every endpoint calls `requireAdmin(request, env)` then checks role. Send + template management require `recruitment_admin` or `super_admin`. Read-only endpoints accept any admin role.
- **SMS gating**: `send_sms=true` is silently downgraded to `false` when `HUBTEL_SMS_API_KEY` is unset. The frontend disables the checkbox in this case so the admin sees clear UI; the server enforces it as a defence-in-depth.
- **Audit**: every send writes `comm_campaigns` + `comm_campaign_recipients` rows in the same transaction-ish flow (D1 doesn't have multi-statement transactions but the order is: insert campaign → loop send + insert recipient row per result).

### 5.7 Failure modes

- **Email send fails for one recipient**: continue with remaining recipients; record `email_status='failed'` + `email_error=<message>` on the recipient row; campaign-level counts reflect partial.
- **All emails fail**: campaign still saved; admin sees "0 sent, N failed" toast and can drill into history for per-recipient errors.
- **SMS opt-in but no phone for a recipient**: skip SMS for that recipient (don't fail the email path); recipient row has `sms_status=NULL`.
- **HUBTEL_SMS_API_KEY unset but admin somehow set send_sms=true**: server downgrades to email-only with no error; campaign records `sms_requested=0`.
- **Audience > 50**: server returns 400 immediately, no campaign row inserted, no emails sent.

## 6. File layout

```
ohcs-website/
├── migrations/
│   └── 0011_comm_campaigns.sql                     [new]
├── functions/
│   ├── _shared/
│   │   ├── form-data.ts                            [new — extractPhone, extractFullName promoted from inline]
│   │   ├── placeholder-substitute.ts               [new — render template body with allowlist]
│   │   └── audience-resolver.ts                    [new — query D1 for recipients, returns Recipient[]]
│   └── api/admin/comms/
│       ├── templates/
│       │   ├── index.ts                            [new — GET list, POST create]
│       │   └── [id].ts                             [new — GET, PATCH, DELETE]
│       ├── audience-count.ts                       [new — GET]
│       └── campaigns/
│           ├── index.ts                            [new — GET list, POST send]
│           └── [id]/
│               └── recipients.ts                   [new — GET]
├── src/
│   ├── app/admin/recruitment/
│   │   ├── communications/
│   │   │   └── page.tsx                            [rewrite — three sections, real data]
│   │   └── pipeline/detail/
│   │       └── page.tsx                            [modify — add "Send message" button]
│   ├── components/admin/comms/
│   │   ├── templates-table.tsx                     [new]
│   │   ├── template-editor-modal.tsx               [new]
│   │   ├── compose-form.tsx                        [new — used by main page + single-applicant modal]
│   │   ├── audience-picker.tsx                     [new]
│   │   ├── campaign-history.tsx                    [new]
│   │   └── single-applicant-message-modal.tsx      [new]
│   └── lib/
│       └── recruitment-comms-api.ts                [new — typed client]
└── tests/functions/
    ├── _shared/
    │   ├── form-data.test.ts                       [new]
    │   ├── placeholder-substitute.test.ts          [new]
    │   └── audience-resolver.test.ts               [new]
    └── admin/comms/
        ├── templates-crud.test.ts                  [new]
        ├── audience-count.test.ts                  [new]
        ├── campaigns-send.test.ts                  [new — biggest test surface]
        └── campaigns-list.test.ts                  [new]
```

## 7. Cutover plan

This is purely additive — no replacement of existing flows.

1. Migration 0011 ships → 3 new tables, no existing data touched
2. Backend endpoints ship → no admin endpoint behaviour changes
3. Frontend ships → the existing Communications page is replaced; the DemoBanner disappears from this page
4. Optional: seed migration adds 4 starter templates matching the existing UI's hardcoded ones (Application Received, Shortlisted, Exam Scheduled, Appointment Letter) so the templates table isn't empty on first visit. This keeps continuity with the visual demo.

## 8. Migration safety

- Migration 0011 is `IF NOT EXISTS` — safely idempotent
- Pure additive — no `ALTER TABLE` on existing tables
- Defaults handle the case where existing campaigns rows hypothetically pre-exist (they don't on first deploy)

## 9. Tests to ship (TDD)

| File | Coverage | Tests |
|---|---|---|
| `_shared/form-data.test.ts` | extractPhone (already existed inline) + extractFullName | 4 |
| `_shared/placeholder-substitute.test.ts` | Each allowlisted placeholder + unknown placeholder pass-through + escaping inside HTML body | 7 |
| `_shared/audience-resolver.test.ts` | Status+exercise filter + single-applicant filter + empty results | 3 |
| `admin/comms/templates-crud.test.ts` | GET list (recruitment_admin), POST/PATCH/DELETE (super and recruitment), 403 for viewer on writes, 200 for viewer on read | 7 |
| `admin/comms/audience-count.test.ts` | Returns count for status filter, returns 1 for single, requires admin | 3 |
| `admin/comms/campaigns-send.test.ts` | Email-only happy path · Email + SMS (with phone present) · SMS opt-in but no Hubtel key (downgrade) · One recipient fails (partial success) · Audience > 50 → 400 · Single-applicant send · Rate limit 3/5min → 429 · Placeholders substituted in subject + body · 403 for viewer | 9 |
| `admin/comms/campaigns-list.test.ts` | List by exercise, drill-down recipients, RBAC | 4 |

**Total new tests: 37.** Brings total from 244 → 281.

## 10. What this delivers

Once shipped:

- The Communications page becomes a real workspace, not a stub
- Recruitment admins can broadcast announcements scoped to active applicants by status — the most-requested missing feature
- Per-applicant ad-hoc messaging from the reviewer detail page, useful for clarifications and chases
- Complete audit trail (campaign + per-recipient) for compliance
- DemoBanner removed from this page; the audit's "stub admin pages with mock data" item drops by one

## 11. Open questions

None at this stage — the 5 alignment decisions covered the design choices that mattered. Implementation detail decisions (exact Tailwind classes, table column order, etc.) belong in the plan, not the spec.
