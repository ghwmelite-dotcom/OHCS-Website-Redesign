import { describe, it, expect } from 'vitest';
import { requireAdmin } from '../../../functions/_shared/admin-auth';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1, DEMO_MODE_ON } from '../_helpers/d1-mock';

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/admin/test', { headers });
}

// Helper: build an env with demo mode enabled (so header fallback is reached).
function demoEnv() {
  const db = makeD1([DEMO_MODE_ON]);
  return mockEnv({ db });
}

// Helper: build an env where demo mode is off (defaultDb returns null for site_config).
function nonDemoEnv() {
  return mockEnv({});
}

describe('requireAdmin', () => {
  it('returns admin context when role is super_admin (demo mode header fallback)', async () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'admin@ohcs.gov.gh',
      'X-Admin-User-Role': 'super_admin',
    });
    const result = await requireAdmin(req, demoEnv());
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.admin.email).toBe('admin@ohcs.gov.gh');
      expect(result.admin.role).toBe('super_admin');
    }
  });

  it('returns admin context when role is recruitment_admin (demo mode header fallback)', async () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'recruitment@ohcs.gov.gh',
      'X-Admin-User-Role': 'recruitment_admin',
    });
    const result = await requireAdmin(req, demoEnv());
    expect(result.kind).toBe('ok');
  });

  it('returns admin context when role is viewer (viewer is now a valid admin role)', async () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'viewer@ohcs.gov.gh',
      'X-Admin-User-Role': 'viewer',
    });
    const result = await requireAdmin(req, demoEnv());
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.admin.role).toBe('viewer');
    }
  });

  it('returns 403 response when role is an unknown value (e.g. "reviewer")', async () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'reviewer@ohcs.gov.gh',
      'X-Admin-User-Role': 'reviewer',
    });
    const result = await requireAdmin(req, demoEnv());
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') {
      expect(result.response.status).toBe(403);
    }
  });

  it('returns 401 response when headers are missing (demo mode on)', async () => {
    const req = makeRequest({});
    const result = await requireAdmin(req, demoEnv());
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') {
      expect(result.response.status).toBe(401);
    }
  });

  it('returns 401 when demo mode is off and no cookie present', async () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'admin@ohcs.gov.gh',
      'X-Admin-User-Role': 'super_admin',
    });
    // nonDemoEnv() uses defaultDb which returns null for site_config → demo mode off
    const result = await requireAdmin(req, nonDemoEnv());
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') {
      expect(result.response.status).toBe(401);
    }
  });

  it('returns 401 response when role header is empty (demo mode on)', async () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'admin@ohcs.gov.gh',
      'X-Admin-User-Role': '',
    });
    const result = await requireAdmin(req, demoEnv());
    expect(result.kind).toBe('reject');
  });

  it('returns ok via cookie session BEFORE consulting demo mode', async () => {
    const now = Date.now();
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
        first: {
          session_id: 'sess-cookie',
          email: 'cookie@ohcs.gov.gh',
          created_at: now - 1000,
          expires_at: now + 60_000,
          last_used_at: now - 500,
          role: 'super_admin',
        },
      },
      {
        sql: 'UPDATE admin_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
        run: {},
      },
      // No site_config script — proves the cookie path returned BEFORE the demo check fired.
    ]);
    const req = new Request('https://x/api/admin/something', {
      headers: { Cookie: 'admin_session=sess-cookie' },
    });
    const res = await requireAdmin(req, mockEnv({ db }));
    expect(res.kind).toBe('ok');
    if (res.kind === 'ok') {
      expect(res.admin.email).toBe('cookie@ohcs.gov.gh');
      expect(res.admin.role).toBe('super_admin');
    }
  });
});
