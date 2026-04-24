// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { onRequestGet as onRequestUrl } from '../../../functions/api/admin/applications/[id]/documents/[docTypeId]/url';
import { onRequestGet as onRequestFile } from '../../../functions/api/admin/applications/[id]/documents/[docTypeId]/file';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

const ADMIN_HEADERS = {
  'X-Admin-User-Email': 'admin@ohcs.gov.gh',
  'X-Admin-User-Role': 'super_admin',
};

interface SecretEnv {
  SYSTEM_CRON_SECRET?: string;
}

function ctx(req: Request, env: ReturnType<typeof mockEnv> & SecretEnv) {
  return {
    request: req,
    env,
    params: { id: 'OHCS-2026-00001', docTypeId: 'national_id' },
    waitUntil: () => {},
    data: {},
  };
}

describe('GET /api/admin/applications/[id]/documents/[docTypeId]/url', () => {
  it('hard-fails 500 when SYSTEM_CRON_SECRET is unset', async () => {
    const db = makeD1([
      { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } },
    ]);
    const env = { ...mockEnv({ db }) };
    const req = new Request(
      'https://x/api/admin/applications/OHCS-2026-00001/documents/national_id/url',
      { headers: ADMIN_HEADERS },
    );
    const res = await onRequestUrl(ctx(req, env));
    expect(res.status).toBe(500);
  });

  it('returns a signed URL when secret is set and document exists', async () => {
    const db = makeD1([
      { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } },
      {
        sql:
          'SELECT r2_key FROM application_documents WHERE application_id = ? AND document_type_id = ?',
        first: { r2_key: 'apps/OHCS-2026-00001/national_id.jpg' },
      },
    ]);
    const env = { ...mockEnv({ db }), SYSTEM_CRON_SECRET: 'real-secret' };
    const req = new Request(
      'https://x/api/admin/applications/OHCS-2026-00001/documents/national_id/url',
      { headers: ADMIN_HEADERS },
    );
    const res = await onRequestUrl(ctx(req, env));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { url: string; expires_at: number } };
    expect(body.data.url).toMatch(/expires=\d+&sig=/);
    expect(body.data.expires_at).toBeGreaterThan(Date.now());
  });
});

describe('GET /api/admin/applications/[id]/documents/[docTypeId]/file', () => {
  it('hard-fails 500 when SYSTEM_CRON_SECRET is unset (even with token in URL)', async () => {
    const env = mockEnv({});
    const req = new Request(
      'https://x/api/admin/applications/OHCS-2026-00001/documents/national_id/file?expires=99999999999&sig=anything',
    );
    const res = await onRequestFile(ctx(req, env));
    expect(res.status).toBe(500);
  });

  it('returns 401 when sig is missing', async () => {
    const env = { ...mockEnv({}), SYSTEM_CRON_SECRET: 'real-secret' };
    const req = new Request(
      'https://x/api/admin/applications/OHCS-2026-00001/documents/national_id/file?expires=99999999999',
    );
    const res = await onRequestFile(ctx(req, env));
    expect(res.status).toBe(401);
  });

  it('returns 401 on a forged sig', async () => {
    const env = { ...mockEnv({}), SYSTEM_CRON_SECRET: 'real-secret' };
    const req = new Request(
      'https://x/api/admin/applications/OHCS-2026-00001/documents/national_id/file?expires=99999999999&sig=forged',
    );
    const res = await onRequestFile(ctx(req, env));
    expect(res.status).toBe(401);
  });
});
