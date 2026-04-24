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
