import { describe, it, expect } from 'vitest';
import { requireAdmin } from '../../../functions/_shared/admin-auth';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/admin/test', { headers });
}

// Helper: build an env with demo mode enabled (so header fallback is reached).
function demoEnv() {
  const db = makeD1([
    { sql: 'SELECT value FROM site_config WHERE key = ?', first: { value: 'true' } },
  ]);
  return mockEnv({ db });
}

// Helper: build an env where demo mode is off (defaultDb returns null for site_config).
function noAuthEnv() {
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
    // noAuthEnv() uses defaultDb which returns null for site_config → demo mode off
    const result = await requireAdmin(req, noAuthEnv());
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
});
