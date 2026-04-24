# Admin Recruitment Communications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the demo-only `/admin/recruitment/communications` page with a real template-backed campaign sender that targets applicants by exercise + status, delivers via email (always) and SMS (opt-in), and logs every send with per-recipient outcomes for audit.

**Architecture:** Migration 0011 adds three new tables — `comm_templates`, `comm_campaigns`, `comm_campaign_recipients` — plus optionally seeds 4 starter templates. Eight new endpoints under `/api/admin/comms/*` cover template CRUD, audience preview, send execution, and history drill-down. Three new shared helpers (`form-data`, `placeholder-substitute`, `audience-resolver`) extract patterns currently inlined in `vetting.ts` / `appeals/resolve.ts`. Frontend rewrites the Communications page into Templates / Compose / History sections and adds a "Send message" entry on the reviewer detail page for single-applicant ad-hoc messaging.

**Tech Stack:** Next.js 16 App Router · React 19 · Cloudflare Pages Functions · D1 (SQLite) · Resend (email) · Hubtel (SMS, optional) · Zod · Vitest 4 · Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-04-24-admin-recruitment-communications-design.md`

---

## Pre-flight

Branch: `feat/admin-recruitment-communications`

---

### Task 1: Migration 0011 — comms schema + seed templates

**Files:**
- Create: `ohcs-website/migrations/0011_comm_campaigns.sql`

- [ ] **Step 1: Write the migration**

Create `ohcs-website/migrations/0011_comm_campaigns.sql`:

```sql
-- ohcs-website/migrations/0011_comm_campaigns.sql
--
-- Schema for the admin recruitment communications feature.
-- See spec at docs/superpowers/specs/2026-04-24-admin-recruitment-communications-design.md.

CREATE TABLE IF NOT EXISTS comm_templates (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  description  TEXT,
  subject      TEXT NOT NULL,
  body_text    TEXT NOT NULL,
  body_html    TEXT,
  sms_body     TEXT,
  created_at   INTEGER NOT NULL,
  created_by   TEXT NOT NULL,
  updated_at   INTEGER NOT NULL,
  updated_by   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_templates_name ON comm_templates(name);

CREATE TABLE IF NOT EXISTS comm_campaigns (
  id                 TEXT PRIMARY KEY,
  template_id        TEXT,
  exercise_id        TEXT NOT NULL,
  status_filter      TEXT NOT NULL,
  recipient_count    INTEGER NOT NULL,
  sent_count         INTEGER NOT NULL,
  failed_count       INTEGER NOT NULL,
  sms_requested      INTEGER NOT NULL,
  sms_sent_count     INTEGER NOT NULL DEFAULT 0,
  sms_failed_count   INTEGER NOT NULL DEFAULT 0,
  subject            TEXT NOT NULL,
  body_text          TEXT NOT NULL,
  body_html          TEXT,
  sms_body           TEXT,
  sender_email       TEXT NOT NULL,
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_campaigns_exercise
  ON comm_campaigns(exercise_id, created_at DESC);

CREATE TABLE IF NOT EXISTS comm_campaign_recipients (
  id              TEXT PRIMARY KEY,
  campaign_id     TEXT NOT NULL,
  application_id  TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  email_status    TEXT NOT NULL,
  email_error     TEXT,
  sms_status      TEXT,
  sms_error       TEXT,
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_campaign_recipients_campaign
  ON comm_campaign_recipients(campaign_id);

-- Seed the 4 starter templates that match the demo UI's hardcoded set, so the
-- Templates tab isn't empty on first visit. Idempotent via INSERT OR IGNORE
-- on the unique name.
INSERT OR IGNORE INTO comm_templates (id, name, description, subject, body_text, sms_body, created_at, created_by, updated_at, updated_by) VALUES
  ('seed_app_received', 'Application Received', 'Acknowledge submission', 'Your application has been received',
   'Dear {{name}}, we acknowledge receipt of your application for the {{exercise_name}} recruitment exercise. Your reference number is {{reference_number}}. We will review your application and get back to you shortly.',
   'OHCS: application {{reference_number}} received. Track at https://ohcs.pages.dev/track',
   strftime('%s','now')*1000, 'system_seed', strftime('%s','now')*1000, 'system_seed'),
  ('seed_shortlisted', 'Shortlisted Notification', 'Notify applicants who advance', 'Congratulations — you have been shortlisted',
   'Dear {{name}}, we are pleased to inform you that your application {{reference_number}} for the {{exercise_name}} has been shortlisted. Please proceed to the next stage as outlined in the email below.',
   'OHCS: {{reference_number}} shortlisted. Check email for next steps.',
   strftime('%s','now')*1000, 'system_seed', strftime('%s','now')*1000, 'system_seed'),
  ('seed_exam_scheduled', 'Exam Scheduled', 'Confirm exam logistics', 'Examination date and venue confirmed',
   'Dear {{name}}, your examination for {{exercise_name}} has been scheduled. Please arrive 30 minutes early with a valid government-issued ID. Reference: {{reference_number}}.',
   'OHCS: {{reference_number}} exam scheduled. Check email for date/venue.',
   strftime('%s','now')*1000, 'system_seed', strftime('%s','now')*1000, 'system_seed'),
  ('seed_appointment', 'Appointment Letter', 'Offer of appointment', 'Offer of appointment to the Civil Service',
   'Dear {{name}}, on behalf of the Office of the Head of the Civil Service, we are delighted to offer you the position arising from the {{exercise_name}} recruitment exercise. Your reference is {{reference_number}}. Please report on the date specified in the formal letter to follow.',
   'OHCS: congratulations {{name}} — appointment letter on the way for {{reference_number}}.',
   strftime('%s','now')*1000, 'system_seed', strftime('%s','now')*1000, 'system_seed');
```

- [ ] **Step 2: Apply locally to verify SQL is syntactically valid**

Run: `cd ohcs-website && npm run migrate`
Expected: `✅ Applied 1 migration(s).`

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/migrations/0011_comm_campaigns.sql
git commit -m "feat(comms): migration 0011 — comm_templates/campaigns/recipients + 4 seed templates"
```

---

### Task 2: `_shared/form-data.ts` — promote inline helpers

**Files:**
- Create: `ohcs-website/functions/_shared/form-data.ts`
- Create: `ohcs-website/tests/functions/_shared/form-data.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/_shared/form-data.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { extractPhone, extractFullName } from '../../../functions/_shared/form-data';

describe('extractPhone', () => {
  it('returns the phone string when present', () => {
    expect(extractPhone(JSON.stringify({ phone: '+233241234567' }))).toBe('+233241234567');
  });

  it('returns null on null/empty form_data', () => {
    expect(extractPhone(null)).toBeNull();
    expect(extractPhone('')).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    expect(extractPhone('not json')).toBeNull();
  });

  it('returns null when phone is empty string or missing', () => {
    expect(extractPhone(JSON.stringify({ phone: '   ' }))).toBeNull();
    expect(extractPhone(JSON.stringify({}))).toBeNull();
  });
});

describe('extractFullName', () => {
  it('returns full_name when present and non-empty', () => {
    expect(extractFullName(JSON.stringify({ full_name: 'Akua Mensah' }))).toBe('Akua Mensah');
  });

  it('returns null when missing', () => {
    expect(extractFullName(JSON.stringify({}))).toBeNull();
    expect(extractFullName(null)).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    expect(extractFullName('not json')).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `cd ohcs-website && npx vitest run tests/functions/_shared/form-data.test.ts`

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/_shared/form-data.ts`:

```typescript
// Helpers for safely extracting fields from the applications.form_data JSON
// blob. Promoted from inline copies in vetting.ts / appeals/resolve.ts.

export function extractPhone(formDataJson: string | null): string | null {
  if (!formDataJson) return null;
  try {
    const parsed = JSON.parse(formDataJson) as { phone?: unknown };
    if (typeof parsed.phone === 'string' && parsed.phone.trim().length > 0) {
      return parsed.phone.trim();
    }
  } catch {
    // form_data corrupt — caller decides whether to silently skip.
  }
  return null;
}

export function extractFullName(formDataJson: string | null): string | null {
  if (!formDataJson) return null;
  try {
    const parsed = JSON.parse(formDataJson) as { full_name?: unknown };
    if (typeof parsed.full_name === 'string' && parsed.full_name.trim().length > 0) {
      return parsed.full_name.trim();
    }
  } catch {
    // form_data corrupt
  }
  return null;
}
```

- [ ] **Step 4: Run, verify PASS (7 tests)**

- [ ] **Step 5: Replace inline extractPhone in vetting.ts and appeals/resolve.ts**

In `ohcs-website/functions/api/admin/applications/[id]/vetting.ts`:
- Remove the local `extractPhone` function (around lines 49-60)
- Add import: `import { extractPhone } from '../../../../_shared/form-data';`

In `ohcs-website/functions/api/admin/applications/[id]/appeals/resolve.ts`:
- Replace the inline IIFE that extracts phone (around lines 63-73) with `const phone = extractPhone(app.form_data);`
- Add import: `import { extractPhone } from '../../../../../_shared/form-data';`

- [ ] **Step 6: Run full test suite, confirm no regressions**

Run: `cd ohcs-website && npm test -- --run | tail -5`
Expected: All previous tests still passing + 7 new tests = 251 total.

- [ ] **Step 7: Commit**

```bash
git add ohcs-website/functions/_shared/form-data.ts ohcs-website/tests/functions/_shared/form-data.test.ts ohcs-website/functions/api/admin/applications/[id]/vetting.ts ohcs-website/functions/api/admin/applications/[id]/appeals/resolve.ts
git commit -m "refactor(shared): promote extractPhone + add extractFullName to _shared/form-data"
```

---

### Task 3: `_shared/placeholder-substitute.ts` — render template body

**Files:**
- Create: `ohcs-website/functions/_shared/placeholder-substitute.ts`
- Create: `ohcs-website/tests/functions/_shared/placeholder-substitute.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/_shared/placeholder-substitute.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  substitutePlaceholders,
  type PlaceholderContext,
} from '../../../functions/_shared/placeholder-substitute';

const ctx: PlaceholderContext = {
  name: 'Akua Mensah',
  email: 'akua@example.com',
  reference_number: 'OHCS-2026-00007',
  exercise_name: '2026 Graduate Entrance Examination',
  status: 'Vetting Passed',
  appeal_deadline: '2026-05-01',
};

describe('substitutePlaceholders', () => {
  it('substitutes {{name}}', () => {
    expect(substitutePlaceholders('Hi {{name}}, welcome.', ctx, false)).toBe(
      'Hi Akua Mensah, welcome.',
    );
  });

  it('substitutes {{reference_number}} and {{exercise_name}}', () => {
    expect(
      substitutePlaceholders('Ref {{reference_number}} for {{exercise_name}}.', ctx, false),
    ).toBe('Ref OHCS-2026-00007 for 2026 Graduate Entrance Examination.');
  });

  it('passes unknown placeholders through verbatim', () => {
    expect(substitutePlaceholders('Hello {{unknown_field}}', ctx, false)).toBe(
      'Hello {{unknown_field}}',
    );
  });

  it('substitutes empty string for null appeal_deadline', () => {
    expect(
      substitutePlaceholders('Deadline: {{appeal_deadline}}', { ...ctx, appeal_deadline: null }, false),
    ).toBe('Deadline: ');
  });

  it('escapes HTML inside substitutions when isHtml=true', () => {
    expect(
      substitutePlaceholders('Hello {{name}}', { ...ctx, name: '<script>alert("x")</script>' }, true),
    ).toBe('Hello &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });

  it('does NOT escape HTML when isHtml=false (plain text)', () => {
    expect(
      substitutePlaceholders('Hello {{name}}', { ...ctx, name: '<b>x</b>' }, false),
    ).toBe('Hello <b>x</b>');
  });

  it('handles multiple occurrences of the same placeholder', () => {
    expect(
      substitutePlaceholders('{{name}}, your name is {{name}}.', ctx, false),
    ).toBe('Akua Mensah, your name is Akua Mensah.');
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `cd ohcs-website && npx vitest run tests/functions/_shared/placeholder-substitute.test.ts`

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/_shared/placeholder-substitute.ts`:

```typescript
// Render a template body by substituting {{placeholder}} tokens against
// a strict allowlist. Unknown placeholders pass through verbatim so admins
// see the literal token in the rendered output and can fix the typo.
//
// When isHtml=true, every substituted value is HTML-escaped before
// insertion. When false (plain text), values are inserted as-is.

import { escapeHtml } from './escape-html';

export interface PlaceholderContext {
  name: string;
  email: string;
  reference_number: string;
  exercise_name: string;
  status: string;
  appeal_deadline: string | null;
}

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

export function substitutePlaceholders(
  template: string,
  ctx: PlaceholderContext,
  isHtml: boolean,
): string {
  return template.replace(PLACEHOLDER_RE, (match, key: string) => {
    if (!(key in ctx)) return match; // unknown — pass through
    const value = ctx[key as keyof PlaceholderContext];
    const str = value === null ? '' : String(value);
    return isHtml ? escapeHtml(str) : str;
  });
}
```

- [ ] **Step 4: Run, verify PASS (7 tests)**

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/_shared/placeholder-substitute.ts ohcs-website/tests/functions/_shared/placeholder-substitute.test.ts
git commit -m "feat(comms): placeholder substitution with HTML escape + allowlist"
```

---

### Task 4: `_shared/audience-resolver.ts` — recipient query

**Files:**
- Create: `ohcs-website/functions/_shared/audience-resolver.ts`
- Create: `ohcs-website/tests/functions/_shared/audience-resolver.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/_shared/audience-resolver.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { resolveAudience } from '../../../functions/_shared/audience-resolver';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

describe('resolveAudience', () => {
  it('returns recipients matching exercise_id + status', async () => {
    const db = makeD1([
      {
        sql: 'SELECT id, email, form_data FROM applications WHERE exercise_id = ? AND status = ?',
        all: {
          results: [
            { id: 'OHCS-2026-00001', email: 'a@example.com', form_data: '{"phone":"+233241111111","full_name":"A One"}' },
            { id: 'OHCS-2026-00002', email: 'b@example.com', form_data: null },
          ],
        },
      },
    ]);
    const result = await resolveAudience(mockEnv({ db }), {
      kind: 'status',
      exerciseId: 'ex-001',
      status: 'vetting_passed',
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      applicationId: 'OHCS-2026-00001',
      email: 'a@example.com',
      phone: '+233241111111',
      fullName: 'A One',
    });
    expect(result[1]?.phone).toBeNull();
  });

  it('returns single recipient when kind=single', async () => {
    const db = makeD1([
      {
        sql: 'SELECT id, email, form_data FROM applications WHERE id = ?',
        first: {
          id: 'OHCS-2026-00001',
          email: 'a@example.com',
          form_data: '{"full_name":"Akua","phone":"+233241000000"}',
        },
      },
    ]);
    const result = await resolveAudience(mockEnv({ db }), {
      kind: 'single',
      applicationId: 'OHCS-2026-00001',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.applicationId).toBe('OHCS-2026-00001');
  });

  it('returns empty array when no matches', async () => {
    const db = makeD1([
      {
        sql: 'SELECT id, email, form_data FROM applications WHERE exercise_id = ? AND status = ?',
        all: { results: [] },
      },
    ]);
    const result = await resolveAudience(mockEnv({ db }), {
      kind: 'status',
      exerciseId: 'ex-empty',
      status: 'vetting_passed',
    });
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/_shared/audience-resolver.ts`:

```typescript
import type { Env } from './types';
import { all, first } from './db';
import { extractPhone, extractFullName } from './form-data';

export interface Recipient {
  applicationId: string;
  email: string;
  phone: string | null;
  fullName: string | null;
}

export type AudienceFilter =
  | { kind: 'status'; exerciseId: string; status: string }
  | { kind: 'single'; applicationId: string };

interface Row {
  id: string;
  email: string;
  form_data: string | null;
}

export async function resolveAudience(env: Env, filter: AudienceFilter): Promise<Recipient[]> {
  if (filter.kind === 'single') {
    const row = await first<Row>(
      env,
      'SELECT id, email, form_data FROM applications WHERE id = ?',
      filter.applicationId,
    );
    return row ? [toRecipient(row)] : [];
  }

  const rows = await all<Row>(
    env,
    'SELECT id, email, form_data FROM applications WHERE exercise_id = ? AND status = ?',
    filter.exerciseId,
    filter.status,
  );
  return rows.map(toRecipient);
}

function toRecipient(row: Row): Recipient {
  return {
    applicationId: row.id,
    email: row.email,
    phone: extractPhone(row.form_data),
    fullName: extractFullName(row.form_data),
  };
}
```

- [ ] **Step 4: Run, verify PASS (3 tests)**

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/_shared/audience-resolver.ts ohcs-website/tests/functions/_shared/audience-resolver.test.ts
git commit -m "feat(comms): audience resolver — status+exercise OR single-applicant"
```

---

### Task 5: GET + POST /api/admin/comms/templates — list + create

**Files:**
- Create: `ohcs-website/functions/api/admin/comms/templates/index.ts`
- Create: `ohcs-website/tests/functions/admin/comms/templates-list-create.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/admin/comms/templates-list-create.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { onRequestGet, onRequestPost } from '../../../../functions/api/admin/comms/templates/index';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../../_helpers/d1-mock';

const RECRUIT = { 'X-Admin-User-Email': 'r@ohcs.gov.gh', 'X-Admin-User-Role': 'recruitment_admin' };
const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/comms/templates', () => {
  it('lists templates for any admin role (read)', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT id, name, description, subject, body_text, body_html, sms_body, created_at, updated_at FROM comm_templates ORDER BY name ASC',
        all: { results: [{ id: 't1', name: 'Test', subject: 'S', body_text: 'B' }] },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/comms/templates', { headers: VIEWER }), db),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string }[] };
    expect(body.data).toHaveLength(1);
  });
});

describe('POST /api/admin/comms/templates', () => {
  it('creates a template for recruitment_admin', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'INSERT INTO comm_templates (id, name, description, subject, body_text, body_html, sms_body, created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/comms/templates', {
          method: 'POST',
          headers: { ...RECRUIT, 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'New Template',
            subject: 'Hi {{name}}',
            body_text: 'Hello {{name}}, your reference is {{reference_number}}.',
          }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(201);
  });

  it('rejects 403 for viewer trying to create', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/comms/templates', {
          method: 'POST',
          headers: { ...VIEWER, 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'X', subject: 'X', body_text: 'X' }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(403);
  });

  it('rejects 400 on missing required fields', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/comms/templates', {
          method: 'POST',
          headers: { ...RECRUIT, 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'X' }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/api/admin/comms/templates/index.ts`:

```typescript
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { parseBody } from '../../../../_shared/validate';
import { all, run } from '../../../../_shared/db';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { z } from 'zod';

const Body = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  subject: z.string().min(1).max(300),
  body_text: z.string().min(1).max(20000),
  body_html: z.string().max(40000).optional(),
  sms_body: z.string().max(320).optional(),
});

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  body_text: string;
  body_html: string | null;
  sms_body: string | null;
  created_at: number;
  updated_at: number;
}

function genId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;

  const rows = await all<TemplateRow>(
    env,
    'SELECT id, name, description, subject, body_text, body_html, sms_body, created_at, updated_at FROM comm_templates ORDER BY name ASC',
  );
  return json({ data: rows });
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'super_admin' && auth.admin.role !== 'recruitment_admin') {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;
  const now = Date.now();
  const id = genId();

  await run(
    env,
    'INSERT INTO comm_templates (id, name, description, subject, body_text, body_html, sms_body, created_at, created_by, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id,
    v.name,
    v.description ?? null,
    v.subject,
    v.body_text,
    v.body_html ?? null,
    v.sms_body ?? null,
    now,
    auth.admin.email,
    now,
    auth.admin.email,
  );

  return json({ data: { id, name: v.name } }, { status: 201 });
};
```

- [ ] **Step 4: Run, verify PASS (4 tests)**

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/api/admin/comms ohcs-website/tests/functions/admin/comms
git commit -m "feat(comms): GET + POST /api/admin/comms/templates"
```

---

### Task 6: GET + PATCH + DELETE /api/admin/comms/templates/[id]

**Files:**
- Create: `ohcs-website/functions/api/admin/comms/templates/[id].ts`
- Create: `ohcs-website/tests/functions/admin/comms/templates-update-delete.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/admin/comms/templates-update-delete.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  onRequestGet,
  onRequestPatch,
  onRequestDelete,
} from '../../../../functions/api/admin/comms/templates/[id]';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../../_helpers/d1-mock';

const RECRUIT = { 'X-Admin-User-Email': 'r@ohcs.gov.gh', 'X-Admin-User-Role': 'recruitment_admin' };
const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };

function ctx(req: Request, id: string, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: { id }, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/comms/templates/[id]', () => {
  it('returns the template for any admin', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT id, name, description, subject, body_text, body_html, sms_body, created_at, updated_at FROM comm_templates WHERE id = ?',
        first: { id: 't1', name: 'X', subject: 'S', body_text: 'B' },
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/comms/templates/t1', { headers: VIEWER }), 't1', db),
    );
    expect(res.status).toBe(200);
  });

  it('404 when not found', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT id, name, description, subject, body_text, body_html, sms_body, created_at, updated_at FROM comm_templates WHERE id = ?',
      },
    ]);
    const res = await onRequestGet(
      ctx(new Request('https://x/api/admin/comms/templates/ghost', { headers: VIEWER }), 'ghost', db),
    );
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/admin/comms/templates/[id]', () => {
  it('updates fields for recruitment_admin', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'UPDATE comm_templates SET name = COALESCE(?, name), description = COALESCE(?, description), subject = COALESCE(?, subject), body_text = COALESCE(?, body_text), body_html = COALESCE(?, body_html), sms_body = COALESCE(?, sms_body), updated_at = ?, updated_by = ? WHERE id = ?',
        run: {},
      },
    ]);
    const res = await onRequestPatch(
      ctx(
        new Request('https://x/api/admin/comms/templates/t1', {
          method: 'PATCH',
          headers: { ...RECRUIT, 'content-type': 'application/json' },
          body: JSON.stringify({ subject: 'Updated' }),
        }),
        't1',
        db,
      ),
    );
    expect(res.status).toBe(200);
  });

  it('rejects 403 for viewer', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestPatch(
      ctx(
        new Request('https://x/api/admin/comms/templates/t1', {
          method: 'PATCH',
          headers: { ...VIEWER, 'content-type': 'application/json' },
          body: JSON.stringify({ subject: 'X' }),
        }),
        't1',
        db,
      ),
    );
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/admin/comms/templates/[id]', () => {
  it('deletes for recruitment_admin', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      { sql: 'DELETE FROM comm_templates WHERE id = ?', run: {} },
    ]);
    const res = await onRequestDelete(
      ctx(new Request('https://x/api/admin/comms/templates/t1', { method: 'DELETE', headers: RECRUIT }), 't1', db),
    );
    expect(res.status).toBe(200);
  });

  it('rejects 403 for viewer', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestDelete(
      ctx(new Request('https://x/api/admin/comms/templates/t1', { method: 'DELETE', headers: VIEWER }), 't1', db),
    );
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/api/admin/comms/templates/[id].ts`:

```typescript
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { parseBody } from '../../../../_shared/validate';
import { first, run } from '../../../../_shared/db';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { z } from 'zod';

const PatchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  subject: z.string().min(1).max(300).optional(),
  body_text: z.string().min(1).max(20000).optional(),
  body_html: z.string().max(40000).optional(),
  sms_body: z.string().max(320).optional(),
});

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  body_text: string;
  body_html: string | null;
  sms_body: string | null;
  created_at: number;
  updated_at: number;
}

function requireRecruitmentAdmin(role: string): boolean {
  return role === 'super_admin' || role === 'recruitment_admin';
}

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;

  const row = await first<TemplateRow>(
    env,
    'SELECT id, name, description, subject, body_text, body_html, sms_body, created_at, updated_at FROM comm_templates WHERE id = ?',
    params.id,
  );
  if (!row) return json({ error: 'not found' }, { status: 404 });
  return json({ data: row });
};

export const onRequestPatch: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (!requireRecruitmentAdmin(auth.admin.role)) {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, PatchBody);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;
  const now = Date.now();

  await run(
    env,
    'UPDATE comm_templates SET name = COALESCE(?, name), description = COALESCE(?, description), subject = COALESCE(?, subject), body_text = COALESCE(?, body_text), body_html = COALESCE(?, body_html), sms_body = COALESCE(?, sms_body), updated_at = ?, updated_by = ? WHERE id = ?',
    v.name ?? null,
    v.description ?? null,
    v.subject ?? null,
    v.body_text ?? null,
    v.body_html ?? null,
    v.sms_body ?? null,
    now,
    auth.admin.email,
    params.id,
  );

  return json({ data: { id: params.id } });
};

export const onRequestDelete: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (!requireRecruitmentAdmin(auth.admin.role)) {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  await run(env, 'DELETE FROM comm_templates WHERE id = ?', params.id);
  return json({ data: { id: params.id, deleted: true } });
};
```

- [ ] **Step 4: Run, verify PASS (5 tests)**

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/api/admin/comms/templates/[id].ts ohcs-website/tests/functions/admin/comms/templates-update-delete.test.ts
git commit -m "feat(comms): GET + PATCH + DELETE /api/admin/comms/templates/[id]"
```

---

### Task 7: GET /api/admin/comms/audience-count

**Files:**
- Create: `ohcs-website/functions/api/admin/comms/audience-count.ts`
- Create: `ohcs-website/tests/functions/admin/comms/audience-count.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/admin/comms/audience-count.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../../../functions/api/admin/comms/audience-count';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../../_helpers/d1-mock';

const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/comms/audience-count', () => {
  it('returns count for status filter', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT COUNT(*) AS n FROM applications WHERE exercise_id = ? AND status = ?',
        first: { n: 42 },
      },
    ]);
    const res = await onRequestGet(
      ctx(
        new Request('https://x/api/admin/comms/audience-count?exercise_id=ex-001&status=vetting_passed', {
          headers: VIEWER,
        }),
        db,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { count: number } };
    expect(body.data.count).toBe(42);
  });

  it('returns 1 for status=single (no D1 lookup needed beyond demo mode)', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql: 'SELECT COUNT(*) AS n FROM applications WHERE id = ?',
        first: { n: 1 },
      },
    ]);
    const res = await onRequestGet(
      ctx(
        new Request('https://x/api/admin/comms/audience-count?application_id=OHCS-2026-00001&status=single', {
          headers: VIEWER,
        }),
        db,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { count: number } };
    expect(body.data.count).toBe(1);
  });

  it('rejects 400 when status missing', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestGet(
      ctx(
        new Request('https://x/api/admin/comms/audience-count?exercise_id=ex-001', {
          headers: VIEWER,
        }),
        db,
      ),
    );
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/api/admin/comms/audience-count.ts`:

```typescript
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { first } from '../../../_shared/db';
import { requireAdmin } from '../../../_shared/admin-auth';

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  if (!status) return json({ error: 'status required' }, { status: 400 });

  if (status === 'single') {
    const applicationId = url.searchParams.get('application_id');
    if (!applicationId) return json({ error: 'application_id required for single' }, { status: 400 });
    const row = await first<{ n: number }>(
      env,
      'SELECT COUNT(*) AS n FROM applications WHERE id = ?',
      applicationId,
    );
    return json({ data: { count: row?.n ?? 0 } });
  }

  const exerciseId = url.searchParams.get('exercise_id');
  if (!exerciseId) return json({ error: 'exercise_id required' }, { status: 400 });

  const row = await first<{ n: number }>(
    env,
    'SELECT COUNT(*) AS n FROM applications WHERE exercise_id = ? AND status = ?',
    exerciseId,
    status,
  );
  return json({ data: { count: row?.n ?? 0 } });
};
```

- [ ] **Step 4: Run, verify PASS (3 tests)**

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/api/admin/comms/audience-count.ts ohcs-website/tests/functions/admin/comms/audience-count.test.ts
git commit -m "feat(comms): GET /api/admin/comms/audience-count — live recipient preview"
```

---

### Task 8: POST /api/admin/comms/campaigns — the send action (the big one)

This is the most complex endpoint. Resolves audience, substitutes placeholders per recipient, sends email + optional SMS, records campaign + per-recipient outcomes.

**Files:**
- Create: `ohcs-website/functions/api/admin/comms/campaigns/index.ts`
- Create: `ohcs-website/tests/functions/admin/comms/campaigns-send.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/admin/comms/campaigns-send.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestPost } from '../../../../functions/api/admin/comms/campaigns/index';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../../_helpers/d1-mock';

const RECRUIT = { 'X-Admin-User-Email': 'r@ohcs.gov.gh', 'X-Admin-User-Role': 'recruitment_admin' };
const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };

function ctx(req: Request, db?: D1Database) {
  return { request: req, env: mockEnv({ db }), params: {}, waitUntil: () => {}, data: {} };
}

describe('POST /api/admin/comms/campaigns — send', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'r1' }), { status: 200 })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends to status-filter audience and records campaign + recipients', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      // rate limit check
      {
        sql:
          'SELECT COUNT(*) AS n FROM comm_campaigns WHERE sender_email = ? AND created_at > ?',
        first: { n: 0 },
      },
      // exercise lookup for {{exercise_name}}
      {
        sql: 'SELECT name FROM recruitment_exercises WHERE id = ?',
        first: { name: 'Test Exercise' },
      },
      // audience resolve
      {
        sql:
          'SELECT id, email, form_data FROM applications WHERE exercise_id = ? AND status = ?',
        all: {
          results: [
            { id: 'OHCS-2026-00001', email: 'a@example.com', form_data: '{"full_name":"A","phone":"+233241000001"}' },
            { id: 'OHCS-2026-00002', email: 'b@example.com', form_data: null },
          ],
        },
      },
      // insert campaign
      {
        sql:
          'INSERT INTO comm_campaigns (id, template_id, exercise_id, status_filter, recipient_count, sent_count, failed_count, sms_requested, sms_sent_count, sms_failed_count, subject, body_text, body_html, sms_body, sender_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      // insert recipient (one per recipient) — wildcard binds match all
      {
        sql:
          'INSERT INTO comm_campaign_recipients (id, campaign_id, application_id, email, phone, email_status, email_error, sms_status, sms_error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/comms/campaigns', {
          method: 'POST',
          headers: { ...RECRUIT, 'content-type': 'application/json' },
          body: JSON.stringify({
            exercise_id: 'ex-001',
            status: 'vetting_passed',
            send_sms: false,
            subject: 'Hi {{name}}',
            body_text: 'Ref {{reference_number}}',
          }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { recipient_count: number; sent_count: number; failed_count: number };
    };
    expect(body.data.recipient_count).toBe(2);
    expect(body.data.sent_count).toBe(2);
    expect(body.data.failed_count).toBe(0);
  });

  it('returns 400 when audience exceeds 50', async () => {
    const oversized = Array.from({ length: 51 }, (_, i) => ({
      id: `OHCS-2026-${String(i).padStart(5, '0')}`,
      email: `a${i}@x.com`,
      form_data: null,
    }));
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT COUNT(*) AS n FROM comm_campaigns WHERE sender_email = ? AND created_at > ?',
        first: { n: 0 },
      },
      {
        sql: 'SELECT name FROM recruitment_exercises WHERE id = ?',
        first: { name: 'Test' },
      },
      {
        sql:
          'SELECT id, email, form_data FROM applications WHERE exercise_id = ? AND status = ?',
        all: { results: oversized },
      },
    ]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/comms/campaigns', {
          method: 'POST',
          headers: { ...RECRUIT, 'content-type': 'application/json' },
          body: JSON.stringify({
            exercise_id: 'ex-001',
            status: 'submitted',
            send_sms: false,
            subject: 'X',
            body_text: 'X',
          }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limit hit (3 campaigns / 5min)', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT COUNT(*) AS n FROM comm_campaigns WHERE sender_email = ? AND created_at > ?',
        first: { n: 3 },
      },
    ]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/comms/campaigns', {
          method: 'POST',
          headers: { ...RECRUIT, 'content-type': 'application/json' },
          body: JSON.stringify({
            exercise_id: 'ex-001',
            status: 'vetting_passed',
            send_sms: false,
            subject: 'X',
            body_text: 'X',
          }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(429);
  });

  it('rejects 403 for viewer', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/comms/campaigns', {
          method: 'POST',
          headers: { ...VIEWER, 'content-type': 'application/json' },
          body: JSON.stringify({
            exercise_id: 'ex-001',
            status: 'vetting_passed',
            send_sms: false,
            subject: 'X',
            body_text: 'X',
          }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(403);
  });

  it('handles single-applicant audience', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT COUNT(*) AS n FROM comm_campaigns WHERE sender_email = ? AND created_at > ?',
        first: { n: 0 },
      },
      // No exercise lookup needed for single — pass empty exercise_name placeholder context
      {
        sql: 'SELECT id, email, form_data FROM applications WHERE id = ?',
        first: {
          id: 'OHCS-2026-00001',
          email: 'a@example.com',
          form_data: '{"full_name":"A"}',
        },
      },
      {
        sql:
          'INSERT INTO comm_campaigns (id, template_id, exercise_id, status_filter, recipient_count, sent_count, failed_count, sms_requested, sms_sent_count, sms_failed_count, subject, body_text, body_html, sms_body, sender_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
      {
        sql:
          'INSERT INTO comm_campaign_recipients (id, campaign_id, application_id, email, phone, email_status, email_error, sms_status, sms_error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const res = await onRequestPost(
      ctx(
        new Request('https://x/api/admin/comms/campaigns', {
          method: 'POST',
          headers: { ...RECRUIT, 'content-type': 'application/json' },
          body: JSON.stringify({
            application_id: 'OHCS-2026-00001',
            status: 'single',
            send_sms: false,
            subject: 'Single send',
            body_text: 'Hi {{name}}',
          }),
        }),
        db,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { recipient_count: number } };
    expect(body.data.recipient_count).toBe(1);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement**

Create `ohcs-website/functions/api/admin/comms/campaigns/index.ts`:

```typescript
//
// SECURITY: see functions/_shared/admin-auth.ts header.
// Send a recruitment communications campaign — synchronous, capped at 50
// recipients, rate-limited per admin (3 per rolling 5 min). Email always;
// SMS opt-in via send_sms flag (silently downgrades when Hubtel key unset).

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { parseBody } from '../../../../_shared/validate';
import { all, first, run } from '../../../../_shared/db';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { sendEmail } from '../../../../_shared/email';
import { sendSms } from '../../../../_shared/sms';
import { resolveAudience } from '../../../../_shared/audience-resolver';
import {
  substitutePlaceholders,
  type PlaceholderContext,
} from '../../../../_shared/placeholder-substitute';
import { getStatusLabel } from '../../../../../src/lib/application-status';
import { z } from 'zod';

const Body = z
  .object({
    exercise_id: z.string().optional(),
    application_id: z.string().optional(),
    status: z.string().min(1).max(60),
    send_sms: z.boolean(),
    template_id: z.string().optional(),
    subject: z.string().min(1).max(300),
    body_text: z.string().min(1).max(20000),
    body_html: z.string().max(40000).optional(),
    sms_body: z.string().max(320).optional(),
  })
  .refine(
    (v) => (v.status === 'single' ? !!v.application_id : !!v.exercise_id),
    { message: 'exercise_id required (or application_id when status=single)' },
  );

const AUDIENCE_CAP = 50;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function recruitmentAdmin(role: string): boolean {
  return role === 'super_admin' || role === 'recruitment_admin';
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (!recruitmentAdmin(auth.admin.role)) {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;
  const now = Date.now();

  // Rate limit per admin
  const recent = await first<{ n: number }>(
    env,
    'SELECT COUNT(*) AS n FROM comm_campaigns WHERE sender_email = ? AND created_at > ?',
    auth.admin.email,
    now - RATE_LIMIT_WINDOW_MS,
  );
  if (recent && recent.n >= RATE_LIMIT_MAX) {
    return json(
      { error: 'too many campaigns; please wait 5 minutes' },
      { status: 429, headers: { 'retry-after': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) } },
    );
  }

  // Resolve {{exercise_name}} (skip lookup for single-applicant)
  let exerciseName = '';
  if (v.status !== 'single' && v.exercise_id) {
    const ex = await first<{ name: string }>(
      env,
      'SELECT name FROM recruitment_exercises WHERE id = ?',
      v.exercise_id,
    );
    exerciseName = ex?.name ?? '';
  }

  // Resolve audience
  const recipients = v.status === 'single'
    ? await resolveAudience(env, { kind: 'single', applicationId: v.application_id! })
    : await resolveAudience(env, {
        kind: 'status',
        exerciseId: v.exercise_id!,
        status: v.status,
      });

  if (recipients.length > AUDIENCE_CAP) {
    return json(
      { error: `audience too large (${recipients.length}); cap is ${AUDIENCE_CAP}. Narrow the filter.` },
      { status: 400 },
    );
  }

  // SMS gate — silently downgrade if no Hubtel key
  const smsActive = v.send_sms && !!env.HUBTEL_SMS_API_KEY;

  // Insert campaign row
  const campaignId = genId('camp');
  let sentCount = 0;
  let failedCount = 0;
  let smsSentCount = 0;
  let smsFailedCount = 0;

  // Per-recipient send loop
  for (const r of recipients) {
    const ctx: PlaceholderContext = {
      name: r.fullName ?? r.email.split('@')[0] ?? r.email,
      email: r.email,
      reference_number: r.applicationId,
      exercise_name: exerciseName,
      status: getStatusLabel(v.status),
      appeal_deadline: null,
    };
    const subject = substitutePlaceholders(v.subject, ctx, false);
    const bodyText = substitutePlaceholders(v.body_text, ctx, false);
    const bodyHtml = v.body_html ? substitutePlaceholders(v.body_html, ctx, true) : undefined;
    const smsBody = v.sms_body ? substitutePlaceholders(v.sms_body, ctx, false) : undefined;

    let emailStatus: 'sent' | 'failed' = 'sent';
    let emailError: string | null = null;
    try {
      await sendEmail(env, {
        to: r.email,
        subject,
        html: bodyHtml ?? `<p>${bodyText.replace(/\n/g, '</p><p>')}</p>`,
        text: bodyText,
      });
      sentCount += 1;
    } catch (err) {
      emailStatus = 'failed';
      emailError = err instanceof Error ? err.message : String(err);
      failedCount += 1;
    }

    let smsStatus: 'sent' | 'failed' | null = null;
    let smsError: string | null = null;
    if (smsActive && r.phone && smsBody) {
      try {
        await sendSms(env, { to: r.phone, message: smsBody });
        smsStatus = 'sent';
        smsSentCount += 1;
      } catch (err) {
        smsStatus = 'failed';
        smsError = err instanceof Error ? err.message : String(err);
        smsFailedCount += 1;
      }
    }

    await run(
      env,
      'INSERT INTO comm_campaign_recipients (id, campaign_id, application_id, email, phone, email_status, email_error, sms_status, sms_error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      genId('crec'),
      campaignId,
      r.applicationId,
      r.email,
      r.phone,
      emailStatus,
      emailError,
      smsStatus,
      smsError,
      now,
    );
  }

  await run(
    env,
    'INSERT INTO comm_campaigns (id, template_id, exercise_id, status_filter, recipient_count, sent_count, failed_count, sms_requested, sms_sent_count, sms_failed_count, subject, body_text, body_html, sms_body, sender_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    campaignId,
    v.template_id ?? null,
    v.exercise_id ?? '(single)',
    v.status,
    recipients.length,
    sentCount,
    failedCount,
    smsActive ? 1 : 0,
    smsSentCount,
    smsFailedCount,
    v.subject,
    v.body_text,
    v.body_html ?? null,
    v.sms_body ?? null,
    auth.admin.email,
    now,
  );

  return json({
    data: {
      campaign_id: campaignId,
      recipient_count: recipients.length,
      sent_count: sentCount,
      failed_count: failedCount,
      sms_requested: smsActive,
      sms_sent_count: smsSentCount,
      sms_failed_count: smsFailedCount,
    },
  });
};
```

- [ ] **Step 4: Run, verify PASS (5 tests)**

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/functions/api/admin/comms/campaigns/index.ts ohcs-website/tests/functions/admin/comms/campaigns-send.test.ts
git commit -m "feat(comms): POST /api/admin/comms/campaigns — synchronous send with cap + rate limit"
```

---

### Task 9: GET /api/admin/comms/campaigns + GET /campaigns/[id]/recipients

**Files:**
- Modify: `ohcs-website/functions/api/admin/comms/campaigns/index.ts` (add `onRequestGet`)
- Create: `ohcs-website/functions/api/admin/comms/campaigns/[id]/recipients.ts`
- Create: `ohcs-website/tests/functions/admin/comms/campaigns-list.test.ts`

- [ ] **Step 1: Write failing tests**

Create `ohcs-website/tests/functions/admin/comms/campaigns-list.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { onRequestGet as listCampaigns } from '../../../../functions/api/admin/comms/campaigns/index';
import { onRequestGet as listRecipients } from '../../../../functions/api/admin/comms/campaigns/[id]/recipients';
import { mockEnv } from '../../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../../_helpers/d1-mock';

const VIEWER = { 'X-Admin-User-Email': 'v@ohcs.gov.gh', 'X-Admin-User-Role': 'viewer' };

function ctx(req: Request, db?: D1Database, params: Record<string, string> = {}) {
  return { request: req, env: mockEnv({ db }), params, waitUntil: () => {}, data: {} };
}

describe('GET /api/admin/comms/campaigns', () => {
  it('lists past campaigns by exercise', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT id, template_id, exercise_id, status_filter, recipient_count, sent_count, failed_count, sms_requested, sms_sent_count, sms_failed_count, subject, sender_email, created_at FROM comm_campaigns WHERE exercise_id = ? ORDER BY created_at DESC',
        all: {
          results: [
            { id: 'camp_1', subject: 'Hi', recipient_count: 5, sent_count: 5, failed_count: 0 },
          ],
        },
      },
    ]);
    const res = await listCampaigns(
      ctx(
        new Request('https://x/api/admin/comms/campaigns?exercise_id=ex-001', { headers: VIEWER }),
        db,
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string }[] };
    expect(body.data).toHaveLength(1);
  });

  it('rejects 400 when exercise_id missing', async () => {
    const db = makeD1([DEMO_MODE_ON]);
    const res = await listCampaigns(
      ctx(new Request('https://x/api/admin/comms/campaigns', { headers: VIEWER }), db),
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/comms/campaigns/[id]/recipients', () => {
  it('lists per-recipient outcomes for a campaign', async () => {
    const db = makeD1([
      DEMO_MODE_ON,
      {
        sql:
          'SELECT application_id, email, phone, email_status, email_error, sms_status, sms_error, created_at FROM comm_campaign_recipients WHERE campaign_id = ? ORDER BY created_at ASC',
        all: {
          results: [
            { application_id: 'OHCS-2026-00001', email: 'a@x', email_status: 'sent' },
            { application_id: 'OHCS-2026-00002', email: 'b@x', email_status: 'failed', email_error: 'bounce' },
          ],
        },
      },
    ]);
    const res = await listRecipients(
      ctx(
        new Request('https://x/api/admin/comms/campaigns/camp_1/recipients', { headers: VIEWER }),
        db,
        { id: 'camp_1' },
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { application_id: string }[] };
    expect(body.data).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Add `onRequestGet` to `campaigns/index.ts`**

Append to the existing `ohcs-website/functions/api/admin/comms/campaigns/index.ts` (after the existing `onRequestPost`):

```typescript
interface CampaignSummary {
  id: string;
  template_id: string | null;
  exercise_id: string;
  status_filter: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  sms_requested: number;
  sms_sent_count: number;
  sms_failed_count: number;
  subject: string;
  sender_email: string;
  created_at: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;

  const url = new URL(request.url);
  const exerciseId = url.searchParams.get('exercise_id');
  if (!exerciseId) return json({ error: 'exercise_id required' }, { status: 400 });

  const rows = await all<CampaignSummary>(
    env,
    'SELECT id, template_id, exercise_id, status_filter, recipient_count, sent_count, failed_count, sms_requested, sms_sent_count, sms_failed_count, subject, sender_email, created_at FROM comm_campaigns WHERE exercise_id = ? ORDER BY created_at DESC',
    exerciseId,
  );
  return json({ data: rows });
};
```

- [ ] **Step 4: Implement recipients endpoint**

Create `ohcs-website/functions/api/admin/comms/campaigns/[id]/recipients.ts`:

```typescript
//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../../../_shared/types';
import { json } from '../../../../../_shared/json';
import { all } from '../../../../../_shared/db';
import { requireAdmin } from '../../../../../_shared/admin-auth';

interface RecipientRow {
  application_id: string;
  email: string;
  phone: string | null;
  email_status: string;
  email_error: string | null;
  sms_status: string | null;
  sms_error: string | null;
  created_at: number;
}

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;

  const rows = await all<RecipientRow>(
    env,
    'SELECT application_id, email, phone, email_status, email_error, sms_status, sms_error, created_at FROM comm_campaign_recipients WHERE campaign_id = ? ORDER BY created_at ASC',
    params.id,
  );
  return json({ data: rows });
};
```

- [ ] **Step 5: Run, verify PASS (3 tests)**

- [ ] **Step 6: Commit**

```bash
git add ohcs-website/functions/api/admin/comms/campaigns ohcs-website/tests/functions/admin/comms/campaigns-list.test.ts
git commit -m "feat(comms): GET /api/admin/comms/campaigns (list) + /[id]/recipients (drill-down)"
```

---

### Task 10: Frontend client lib

**Files:**
- Create: `ohcs-website/src/lib/recruitment-comms-api.ts`

- [ ] **Step 1: Implement (typed client; no test — exercised through component usage)**

Create `ohcs-website/src/lib/recruitment-comms-api.ts`:

```typescript
export interface CommTemplate {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  body_text: string;
  body_html: string | null;
  sms_body: string | null;
  created_at: number;
  updated_at: number;
}

export interface SendCampaignInput {
  exercise_id?: string;
  application_id?: string;
  status: string;
  send_sms: boolean;
  template_id?: string;
  subject: string;
  body_text: string;
  body_html?: string;
  sms_body?: string;
}

export interface SendCampaignResult {
  campaign_id: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  sms_requested: boolean;
  sms_sent_count: number;
  sms_failed_count: number;
}

export interface CampaignSummary {
  id: string;
  template_id: string | null;
  exercise_id: string;
  status_filter: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  sms_requested: number;
  sms_sent_count: number;
  sms_failed_count: number;
  subject: string;
  sender_email: string;
  created_at: number;
}

export interface CampaignRecipient {
  application_id: string;
  email: string;
  phone: string | null;
  email_status: string;
  email_error: string | null;
  sms_status: string | null;
  sms_error: string | null;
  created_at: number;
}

async function ok<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  const body = (await res.json()) as { data: T };
  return body.data;
}

export async function listTemplates(): Promise<CommTemplate[]> {
  return ok(await fetch('/api/admin/comms/templates'));
}

export async function getTemplate(id: string): Promise<CommTemplate> {
  return ok(await fetch(`/api/admin/comms/templates/${encodeURIComponent(id)}`));
}

export async function createTemplate(input: Omit<CommTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: string; name: string }> {
  return ok(
    await fetch('/api/admin/comms/templates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateTemplate(id: string, patch: Partial<CommTemplate>): Promise<{ id: string }> {
  return ok(
    await fetch(`/api/admin/comms/templates/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  );
}

export async function deleteTemplate(id: string): Promise<void> {
  await ok(
    await fetch(`/api/admin/comms/templates/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  );
}

export async function audienceCount(params: {
  exercise_id?: string;
  application_id?: string;
  status: string;
}): Promise<number> {
  const q = new URLSearchParams();
  if (params.exercise_id) q.set('exercise_id', params.exercise_id);
  if (params.application_id) q.set('application_id', params.application_id);
  q.set('status', params.status);
  const result = await ok<{ count: number }>(await fetch(`/api/admin/comms/audience-count?${q}`));
  return result.count;
}

export async function sendCampaign(input: SendCampaignInput): Promise<SendCampaignResult> {
  return ok(
    await fetch('/api/admin/comms/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function listCampaigns(exerciseId: string): Promise<CampaignSummary[]> {
  return ok(
    await fetch(`/api/admin/comms/campaigns?exercise_id=${encodeURIComponent(exerciseId)}`),
  );
}

export async function listCampaignRecipients(campaignId: string): Promise<CampaignRecipient[]> {
  return ok(
    await fetch(`/api/admin/comms/campaigns/${encodeURIComponent(campaignId)}/recipients`),
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd ohcs-website && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/src/lib/recruitment-comms-api.ts
git commit -m "feat(comms): typed client lib for /api/admin/comms"
```

---

### Task 11: Templates table + editor modal components

**Files:**
- Create: `ohcs-website/src/components/admin/comms/templates-table.tsx`
- Create: `ohcs-website/src/components/admin/comms/template-editor-modal.tsx`

- [ ] **Step 1: Implement TemplatesTable**

Create `ohcs-website/src/components/admin/comms/templates-table.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Edit3, Trash2, Loader2, Mail, MessageSquare } from 'lucide-react';
import type { CommTemplate } from '@/lib/recruitment-comms-api';
import { deleteTemplate } from '@/lib/recruitment-comms-api';

export function TemplatesTable({
  rows,
  onEdit,
  onChange,
}: {
  rows: CommTemplate[];
  onEdit: (template: CommTemplate) => void;
  onChange: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function handleDelete(t: CommTemplate) {
    if (!confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
    setBusy(t.id);
    try {
      await deleteTemplate(t.id);
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
            <th className="px-4 py-3 font-semibold text-text-muted">Name</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Subject</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Channels</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Updated</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-border/40">
              <td className="px-4 py-3 font-semibold text-primary-dark">{t.name}</td>
              <td className="px-4 py-3 text-text-muted truncate max-w-[280px]">{t.subject}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span title="Email" className="inline-flex items-center gap-1 text-emerald-700">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </span>
                  {t.sms_body && (
                    <span title="SMS" className="inline-flex items-center gap-1 text-blue-700">
                      <MessageSquare className="h-3.5 w-3.5" /> SMS
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-text-muted">
                {new Date(t.updated_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onEdit(t)}
                  className="text-primary hover:text-primary-light inline-flex items-center gap-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded p-1 mr-2"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(t)}
                  disabled={busy === t.id}
                  className="text-red-700 hover:text-red-900 inline-flex items-center gap-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded p-1"
                >
                  {busy === t.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                No templates yet. Click &ldquo;New Template&rdquo; above to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Implement TemplateEditorModal**

Create `ohcs-website/src/components/admin/comms/template-editor-modal.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { CommTemplate } from '@/lib/recruitment-comms-api';
import { createTemplate, updateTemplate } from '@/lib/recruitment-comms-api';

export function TemplateEditorModal({
  template,
  onClose,
  onSaved,
}: {
  template: CommTemplate | 'new' | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const editing = template !== 'new' && template !== null;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing && template !== null && template !== 'new') {
      setName(template.name);
      setDescription(template.description ?? '');
      setSubject(template.subject);
      setBodyText(template.body_text);
      setBodyHtml(template.body_html ?? '');
      setSmsBody(template.sms_body ?? '');
    } else {
      setName('');
      setDescription('');
      setSubject('');
      setBodyText('');
      setBodyHtml('');
      setSmsBody('');
    }
    setError(null);
  }, [template, editing]);

  if (template === null) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name,
        description: description || undefined,
        subject,
        body_text: bodyText,
        body_html: bodyHtml || undefined,
        sms_body: smsBody || undefined,
      };
      if (editing && template !== 'new' && template !== null) {
        await updateTemplate(template.id, payload);
      } else {
        await createTemplate({
          name,
          description: description || null,
          subject,
          body_text: bodyText,
          body_html: bodyHtml || null,
          sms_body: smsBody || null,
        });
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary-dark">
            {editing ? 'Edit Template' : 'New Template'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-primary-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Subject</label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Body (plain text). Available placeholders: <code className="text-xs">{`{{name}} {{email}} {{reference_number}} {{exercise_name}} {{status}}`}</code>
            </label>
            <textarea
              required
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">SMS body (optional, max 320 chars)</label>
            <textarea
              value={smsBody}
              onChange={(e) => setSmsBody(e.target.value.slice(0, 320))}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
            <div className="text-xs text-text-muted mt-1">{smsBody.length}/320</div>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border-2 border-border/60 rounded-xl text-sm font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name || !subject || !bodyText}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `cd ohcs-website && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add ohcs-website/src/components/admin/comms
git commit -m "feat(comms): templates table + editor modal components"
```

---

### Task 12: Compose form + audience picker + history components

**Files:**
- Create: `ohcs-website/src/components/admin/comms/compose-form.tsx`
- Create: `ohcs-website/src/components/admin/comms/campaign-history.tsx`

- [ ] **Step 1: Implement ComposeForm**

Create `ohcs-website/src/components/admin/comms/compose-form.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import {
  audienceCount,
  sendCampaign,
  listTemplates,
  type CommTemplate,
  type SendCampaignInput,
  type SendCampaignResult,
} from '@/lib/recruitment-comms-api';
import {
  APPLICATION_STATUS_LABELS,
} from '@/lib/application-status';

const RECIPIENT_CAP = 50;

export function ComposeForm({
  exerciseId,
  fixedApplicationId,
  smsAvailable,
  onSent,
}: {
  exerciseId: string | null;
  fixedApplicationId?: string;
  smsAvailable: boolean;
  onSent: (result: SendCampaignResult) => void;
}) {
  const [templates, setTemplates] = useState<CommTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [status, setStatus] = useState<string>(fixedApplicationId ? 'single' : 'submitted');
  const [count, setCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listTemplates().then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    setError(null);
    if (fixedApplicationId) {
      setCount(1);
      return;
    }
    if (!exerciseId || !status || status === 'single') {
      setCount(null);
      return;
    }
    let cancelled = false;
    void audienceCount({ exercise_id: exerciseId, status })
      .then((n) => {
        if (!cancelled) setCount(n);
      })
      .catch(() => {
        if (!cancelled) setCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [exerciseId, status, fixedApplicationId]);

  function loadTemplate(id: string) {
    setTemplateId(id);
    if (!id) return;
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSubject(t.subject);
    setBodyText(t.body_text);
    setSmsBody(t.sms_body ?? '');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exerciseId && !fixedApplicationId) {
      setError('Pick an exercise or applicant first');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input: SendCampaignInput = {
        status,
        send_sms: sendSms,
        subject,
        body_text: bodyText,
        ...(smsBody ? { sms_body: smsBody } : {}),
        ...(templateId ? { template_id: templateId } : {}),
      };
      if (fixedApplicationId) {
        input.application_id = fixedApplicationId;
      } else if (exerciseId) {
        input.exercise_id = exerciseId;
      }
      const result = await sendCampaign(input);
      onSent(result);
      setSubject('');
      setBodyText('');
      setSmsBody('');
      setTemplateId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSubmitting(false);
    }
  }

  const tooMany = count !== null && count > RECIPIENT_CAP;
  const noAudience = count === 0;
  const canSend =
    !submitting &&
    !!subject &&
    !!bodyText &&
    count !== null &&
    !tooMany &&
    !noAudience &&
    (fixedApplicationId || (exerciseId && status));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!fixedApplicationId && (
        <>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Load from template (optional)
            </label>
            <select
              value={templateId}
              onChange={(e) => loadTemplate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            >
              <option value="">— write ad-hoc —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Send to applicants whose status is
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            >
              {Object.entries(APPLICATION_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Subject
        </label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder='e.g. "Your application is ready for the next step"'
          className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Message body (placeholders: <code className="text-xs">{`{{name}} {{reference_number}} {{exercise_name}}`}</code>)
        </label>
        <textarea
          required
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendSms}
            onChange={(e) => setSendSms(e.target.checked)}
            disabled={!smsAvailable}
            className="h-4 w-4"
          />
          <span className={smsAvailable ? '' : 'text-text-muted'}>
            Also send SMS{!smsAvailable && ' (unavailable — Hubtel not provisioned)'}
          </span>
        </label>
        {sendSms && smsAvailable && (
          <textarea
            value={smsBody}
            onChange={(e) => setSmsBody(e.target.value.slice(0, 320))}
            placeholder="SMS body (max 320 chars). Leave empty to skip SMS for this send."
            rows={2}
            className="w-full mt-2 px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
          />
        )}
      </div>

      <div className="rounded-xl border-2 border-border/40 bg-gray-50 p-3 text-sm flex items-center justify-between">
        <span className="text-text-muted">
          {fixedApplicationId
            ? '1 recipient (single applicant)'
            : count === null
            ? 'Pick an exercise + status to see recipient count.'
            : `${count} recipient${count === 1 ? '' : 's'} match this filter`}
        </span>
        {tooMany && (
          <span className="inline-flex items-center gap-1 text-amber-800 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Audience too large (cap {RECIPIENT_CAP})
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={!canSend}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {submitting
          ? 'Sending…'
          : fixedApplicationId
          ? 'Send to this applicant'
          : count === null
          ? 'Send'
          : `Send to ${count} applicant${count === 1 ? '' : 's'}`}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Implement CampaignHistory**

Create `ohcs-website/src/components/admin/comms/campaign-history.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  listCampaigns,
  listCampaignRecipients,
  type CampaignSummary,
  type CampaignRecipient,
} from '@/lib/recruitment-comms-api';
import { getStatusLabel } from '@/lib/application-status';

export function CampaignHistory({ exerciseId }: { exerciseId: string | null }) {
  const [rows, setRows] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Record<string, CampaignRecipient[]>>({});
  const [loadingRecipients, setLoadingRecipients] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    listCampaigns(exerciseId)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  async function toggle(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!recipients[id]) {
      setLoadingRecipients(id);
      try {
        const r = await listCampaignRecipients(id);
        setRecipients((prev) => ({ ...prev, [id]: r }));
      } finally {
        setLoadingRecipients(null);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-border/40 p-8 text-center text-text-muted text-sm">
        No campaigns sent yet for this exercise.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-border/40 divide-y divide-border/20">
      {rows.map((c) => {
        const isOpen = openId === c.id;
        const recs = recipients[c.id];
        return (
          <div key={c.id}>
            <button
              type="button"
              onClick={() => void toggle(c.id)}
              className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary-dark truncate">{c.subject}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {getStatusLabel(c.status_filter)} · {new Date(c.created_at).toLocaleString()} · by {c.sender_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs flex-shrink-0">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {c.sent_count}
                </span>
                {c.failed_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" /> {c.failed_count}
                  </span>
                )}
                {c.sms_requested === 1 && (
                  <span className="inline-flex items-center gap-1 text-blue-700">
                    SMS {c.sms_sent_count}/{c.sms_sent_count + c.sms_failed_count}
                  </span>
                )}
              </div>
            </button>
            {isOpen && (
              <div className="px-6 pb-4 bg-gray-50/50">
                {loadingRecipients === c.id && (
                  <div className="py-4 text-center text-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin inline" />
                  </div>
                )}
                {recs && (
                  <table className="w-full text-xs">
                    <thead className="text-text-muted">
                      <tr>
                        <th className="text-left py-2">Application</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Email status</th>
                        <th className="text-left py-2">SMS status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recs.map((r, i) => (
                        <tr key={i} className="border-t border-border/30">
                          <td className="py-2 font-mono">{r.application_id}</td>
                          <td className="py-2">{r.email}</td>
                          <td className="py-2">
                            <span
                              className={
                                r.email_status === 'sent'
                                  ? 'text-emerald-700'
                                  : 'text-red-700'
                              }
                            >
                              {r.email_status}
                            </span>
                            {r.email_error && (
                              <span className="text-text-muted ml-2">({r.email_error})</span>
                            )}
                          </td>
                          <td className="py-2">
                            {r.sms_status ?? '—'}
                            {r.sms_error && (
                              <span className="text-text-muted ml-2">({r.sms_error})</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd ohcs-website && npx tsc --noEmit
git add ohcs-website/src/components/admin/comms
git commit -m "feat(comms): compose form + campaign history components"
```

---

### Task 13: Rewrite the Communications page

**Files:**
- Modify: `ohcs-website/src/app/admin/recruitment/communications/page.tsx`

- [ ] **Step 1: Replace the existing demo page wholesale**

Replace `ohcs-website/src/app/admin/recruitment/communications/page.tsx` with:

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, Plus, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { TemplatesTable } from '@/components/admin/comms/templates-table';
import { TemplateEditorModal } from '@/components/admin/comms/template-editor-modal';
import { ComposeForm } from '@/components/admin/comms/compose-form';
import { CampaignHistory } from '@/components/admin/comms/campaign-history';
import { listTemplates, type CommTemplate, type SendCampaignResult } from '@/lib/recruitment-comms-api';

const TABS = [
  { label: 'Dashboard', href: '/admin/recruitment', icon: LayoutDashboard },
  { label: 'Exercises', href: '/admin/recruitment/exercises', icon: FolderOpen },
  { label: 'Pipeline', href: '/admin/recruitment/pipeline', icon: Kanban },
  { label: 'Examinations', href: '/admin/recruitment/examinations', icon: GraduationCap },
  { label: 'Communications', href: '/admin/recruitment/communications', icon: MessageSquare },
  { label: 'Analytics', href: '/admin/recruitment/analytics', icon: BarChart3 },
  { label: 'Anti-Fraud', href: '/admin/recruitment/anti-fraud', icon: ShieldAlert },
  { label: 'Merit List', href: '/admin/recruitment/merit-list', icon: Trophy },
];

function RecruitmentTabs({ current }: { current: string }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-border/40 p-1.5 mb-8 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {TABS.map((tab) => {
          const isActive = current === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-primary-dark hover:bg-primary/5',
              )}
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface ActiveExercise {
  id: string;
  name: string;
}

type Section = 'compose' | 'templates' | 'history';

export default function CommunicationsPage() {
  const [section, setSection] = useState<Section>('compose');
  const [exercise, setExercise] = useState<ActiveExercise | null>(null);
  const [templates, setTemplates] = useState<CommTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<CommTemplate | 'new' | null>(null);
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  // Load active exercise + sms availability + templates
  useEffect(() => {
    void fetch('/api/exercises/active').then((r) => r.ok ? r.json() : null).then((b: { data?: ActiveExercise } | null) => {
      if (b?.data) setExercise({ id: b.data.id, name: b.data.name });
    });
    void fetch('/api/admin/site-config').then((r) => r.ok ? r.json() : { data: [] }).then((b: { data: { key: string; value: string }[] }) => {
      const row = b.data.find((c) => c.key === 'hubtel_sms_available');
      // If we don't have an explicit flag, infer from a probe — for v1 we just default to false.
      setSmsAvailable(row?.value === 'true');
    });
    void refreshTemplates();
  }, []);

  async function refreshTemplates() {
    try {
      const t = await listTemplates();
      setTemplates(t);
    } catch {
      // ignored
    }
  }

  function onSent(result: SendCampaignResult) {
    setToast(
      `Sent: ${result.sent_count} email${result.sent_count === 1 ? '' : 's'}` +
        (result.failed_count > 0 ? `, ${result.failed_count} failed` : '') +
        (result.sms_requested ? `, ${result.sms_sent_count} SMS` : ''),
    );
    setHistoryKey((k) => k + 1);
    setTimeout(() => setToast(null), 5000);
  }

  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/communications" />

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary-dark">Communication Centre</h2>
        <p className="text-sm text-text-muted mt-1">
          {exercise
            ? `Active exercise: ${exercise.name}`
            : 'No active recruitment exercise — campaigns are scoped to active exercises.'}
        </p>
      </div>

      {toast && (
        <div className="flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-6">
          <CheckCircle className="h-5 w-5 text-emerald-700 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium text-emerald-900">{toast}</p>
        </div>
      )}

      <div className="flex border-b border-border/40 mb-6" role="tablist">
        {(['compose', 'templates', 'history'] as Section[]).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={section === s}
            onClick={() => setSection(s)}
            className={cn(
              'px-4 py-2 text-sm font-semibold transition-colors capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              section === s
                ? 'text-primary border-b-2 border-primary -mb-[2px]'
                : 'text-text-muted hover:text-primary-dark',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {section === 'compose' && (
        <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
          {!exercise ? (
            <p className="text-sm text-text-muted text-center py-12">
              No active exercise — open Exercises and activate one before composing.
            </p>
          ) : (
            <ComposeForm
              exerciseId={exercise.id}
              smsAvailable={smsAvailable}
              onSent={onSent}
            />
          )}
        </div>
      )}

      {section === 'templates' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-muted">
              Reusable email + SMS templates. Use placeholders like {`{{name}}`} for personalisation.
            </p>
            <button
              type="button"
              onClick={() => setEditingTemplate('new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light"
            >
              <Plus className="h-4 w-4" /> New Template
            </button>
          </div>
          <TemplatesTable
            rows={templates}
            onEdit={(t) => setEditingTemplate(t)}
            onChange={refreshTemplates}
          />
          <TemplateEditorModal
            template={editingTemplate}
            onClose={() => setEditingTemplate(null)}
            onSaved={refreshTemplates}
          />
        </div>
      )}

      {section === 'history' && (
        <div key={historyKey}>
          {!exercise ? (
            <p className="text-sm text-text-muted text-center py-12">
              No active exercise selected.
            </p>
          ) : (
            <CampaignHistory exerciseId={exercise.id} />
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + run tests**

```bash
cd ohcs-website && npx tsc --noEmit && npm test -- --run | tail -3
```

Expected: 0 typecheck errors, 281 tests passing.

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/src/app/admin/recruitment/communications/page.tsx
git commit -m "feat(comms): rewrite Communications page — Compose / Templates / History"
```

---

### Task 14: Single-applicant message button on reviewer detail page

**Files:**
- Create: `ohcs-website/src/components/admin/comms/single-applicant-message-modal.tsx`
- Modify: `ohcs-website/src/app/admin/recruitment/pipeline/detail/page.tsx`

- [ ] **Step 1: Build the single-applicant modal wrapper**

Create `ohcs-website/src/components/admin/comms/single-applicant-message-modal.tsx`:

```typescript
'use client';

import { X } from 'lucide-react';
import { ComposeForm } from './compose-form';
import type { SendCampaignResult } from '@/lib/recruitment-comms-api';

export function SingleApplicantMessageModal({
  applicationId,
  applicantEmail,
  smsAvailable,
  onClose,
  onSent,
}: {
  applicationId: string;
  applicantEmail: string;
  smsAvailable: boolean;
  onClose: () => void;
  onSent: (result: SendCampaignResult) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-primary-dark">Message Applicant</h2>
            <p className="text-xs text-text-muted">
              {applicationId} · {applicantEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-primary-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ComposeForm
          exerciseId={null}
          fixedApplicationId={applicationId}
          smsAvailable={smsAvailable}
          onSent={(r) => {
            onSent(r);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the "Send message" button on the reviewer detail page**

In `ohcs-website/src/app/admin/recruitment/pipeline/detail/page.tsx`:

Find the existing header area where the "Release claim" button lives (around line 349-362). Add a "Send message" button immediately before "Release claim". Sketch:

```typescript
import { SingleApplicantMessageModal } from '@/components/admin/comms/single-applicant-message-modal';
import { MessageSquare } from 'lucide-react';

// Add state in the component:
const [messageOpen, setMessageOpen] = useState(false);
const [smsAvailable, setSmsAvailable] = useState(false);

// In the existing useEffect or a new one, fetch the SMS availability flag:
useEffect(() => {
  void fetch('/api/admin/site-config').then((r) => r.ok ? r.json() : { data: [] }).then((b: { data: { key: string; value: string }[] }) => {
    setSmsAvailable(b.data.find((c) => c.key === 'hubtel_sms_available')?.value === 'true');
  });
}, []);

// In the JSX header area, before the Release claim button:
<button
  type="button"
  onClick={() => setMessageOpen(true)}
  className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-border/60 text-sm font-semibold text-primary-dark rounded-xl hover:border-primary hover:text-primary transition-colors"
>
  <MessageSquare className="h-4 w-4" aria-hidden="true" />
  Send message
</button>

// At the very end of the rendered JSX (just before the closing `</div>` of the page):
{messageOpen && detail && (
  <SingleApplicantMessageModal
    applicationId={detail.id}
    applicantEmail={detail.email}
    smsAvailable={smsAvailable}
    onClose={() => setMessageOpen(false)}
    onSent={() => setToast({ type: 'success', message: 'Message sent.' })}
  />
)}
```

Apply this carefully — read the existing `detail/page.tsx` to find the exact insertion points.

- [ ] **Step 3: Typecheck + run tests**

```bash
cd ohcs-website && npx tsc --noEmit && npm test -- --run | tail -3
```

- [ ] **Step 4: Commit**

```bash
git add ohcs-website/src/components/admin/comms/single-applicant-message-modal.tsx ohcs-website/src/app/admin/recruitment/pipeline/detail/page.tsx
git commit -m "feat(comms): single-applicant message modal on reviewer detail page"
```

---

### Task 15: Apply migration 0011 to remote D1

**Files:** None (operational task)

- [ ] **Step 1: Run remote migration**

Run: `cd ohcs-website && npm run migrate:remote`
Expected: `✅ Applied 1 migration(s).` (only 0011)

- [ ] **Step 2: Verify schema**

Run: `cd ohcs-website && npx wrangler d1 execute ohcs-recruitment --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'comm_%' ORDER BY name"`
Expected output includes: `comm_campaign_recipients`, `comm_campaigns`, `comm_templates`.

- [ ] **Step 3: Verify seed templates loaded**

Run: `cd ohcs-website && npx wrangler d1 execute ohcs-recruitment --remote --command="SELECT id, name FROM comm_templates"`
Expected: 4 rows (seed_app_received, seed_shortlisted, seed_exam_scheduled, seed_appointment).

---

### Task 16: Merge to master, deploy via auto-deploy, smoke test

**Files:** None (operational task)

- [ ] **Step 1: Merge feature branch to master**

```bash
git checkout master
git merge --no-ff feat/admin-recruitment-communications -m "Merge branch 'feat/admin-recruitment-communications' — comms"
```

- [ ] **Step 2: Push to GitHub (triggers auto-deploy)**

```bash
git push origin master
```

The GitHub Actions deploy workflow will fire automatically. Watch:
`https://github.com/ghwmelite-dotcom/OHCS-Website-Redesign/actions`

- [ ] **Step 3: Wait for deploy to complete (~2 min) then smoke test**

```bash
curl -s https://ohcs.pages.dev/api/health
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://ohcs.pages.dev/admin/recruitment/communications/
```

Expected: 200 on both. Health check shows d1/r2/workers_ai all ok.

- [ ] **Step 4: Browser smoke test**

Visit `https://ohcs.pages.dev/admin/recruitment/communications/`:
- Templates tab shows the 4 seeded templates
- Compose tab shows status dropdown + ad-hoc form (or "no active exercise" if none)
- History tab shows empty state

If there's an active exercise, send a test campaign to a status with no real applicants (so we don't accidentally email anyone), confirm it appears in History with `recipient_count: 0`.

- [ ] **Step 5: Delete merged branch**

```bash
git branch -d feat/admin-recruitment-communications
```

---

## Self-review checklist

- [ ] **Spec coverage**: every section in the spec has at least one task above (§5.1 schema → Task 1; §5.2 endpoints → Tasks 5-9; §5.3 frontend → Tasks 11-14; §5.4 audience resolver → Task 4; §5.5 placeholders → Task 3; §5.6 security → all endpoint tasks check RBAC + rate limit + cap; §5.7 failure modes → Task 8 send loop; §6 file layout → all tasks; §7 cutover → Task 15; §8 migration safety → Task 1)
- [ ] **No placeholders**: every code block is complete
- [ ] **Type consistency**: `Recipient`, `PlaceholderContext`, `CommTemplate`, `SendCampaignInput`, `SendCampaignResult` shapes used consistently across tasks
- [ ] **Test count**: Task 2 (7) + Task 3 (7) + Task 4 (3) + Task 5 (4) + Task 6 (5) + Task 7 (3) + Task 8 (5) + Task 9 (3) = **37 new tests**, bringing total from 244 → 281

## Estimated effort

- Tasks 1-4: ~60 min (migration + 3 helpers with TDD)
- Tasks 5-9: ~120 min (5 endpoints — Task 8 alone is ~45 min)
- Tasks 10-14: ~150 min (frontend lib + 5 components/pages)
- Tasks 15-16: ~20 min (deploy + smoke)

**Total: ~6 hours of focused work.**
