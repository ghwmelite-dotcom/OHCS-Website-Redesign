import { describe, it, expect } from 'vitest';
import { requireAdmin } from '../../../functions/_shared/admin-auth';

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/admin/test', { headers });
}

describe('requireAdmin', () => {
  it('returns admin context when role is super_admin', () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'admin@ohcs.gov.gh',
      'X-Admin-User-Role': 'super_admin',
    });
    const result = requireAdmin(req);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.admin.email).toBe('admin@ohcs.gov.gh');
      expect(result.admin.role).toBe('super_admin');
    }
  });

  it('returns admin context when role is recruitment_admin', () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'recruitment@ohcs.gov.gh',
      'X-Admin-User-Role': 'recruitment_admin',
    });
    const result = requireAdmin(req);
    expect(result.kind).toBe('ok');
  });

  it('returns 403 response when role is viewer', () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'viewer@ohcs.gov.gh',
      'X-Admin-User-Role': 'viewer',
    });
    const result = requireAdmin(req);
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') {
      expect(result.response.status).toBe(403);
    }
  });

  it('returns 401 response when headers are missing', () => {
    const req = makeRequest({});
    const result = requireAdmin(req);
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') {
      expect(result.response.status).toBe(401);
    }
  });

  it('returns 401 response when role header is empty', () => {
    const req = makeRequest({
      'X-Admin-User-Email': 'admin@ohcs.gov.gh',
      'X-Admin-User-Role': '',
    });
    const result = requireAdmin(req);
    expect(result.kind).toBe('reject');
  });
});
