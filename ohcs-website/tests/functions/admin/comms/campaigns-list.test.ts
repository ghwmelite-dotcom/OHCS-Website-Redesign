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
