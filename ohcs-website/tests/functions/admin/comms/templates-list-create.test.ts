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
