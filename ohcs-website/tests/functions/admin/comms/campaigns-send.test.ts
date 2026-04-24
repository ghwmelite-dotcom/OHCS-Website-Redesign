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
