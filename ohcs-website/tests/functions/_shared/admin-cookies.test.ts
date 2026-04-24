import { describe, it, expect } from 'vitest';
import {
  buildSetAdminSessionCookie,
  buildClearAdminSessionCookie,
  parseAdminSessionId,
} from '../../../functions/_shared/admin-cookies';

describe('admin cookies', () => {
  describe('buildSetAdminSessionCookie', () => {
    it('produces a Secure HttpOnly SameSite=Lax cookie with Max-Age', () => {
      const v = buildSetAdminSessionCookie('sess-abc', 14400);
      expect(v).toContain('admin_session=sess-abc');
      expect(v).toContain('HttpOnly');
      expect(v).toContain('Secure');
      expect(v).toContain('SameSite=Lax');
      expect(v).toContain('Path=/');
      expect(v).toContain('Max-Age=14400');
    });
  });

  describe('buildClearAdminSessionCookie', () => {
    it('expires the cookie immediately', () => {
      const v = buildClearAdminSessionCookie();
      expect(v).toContain('admin_session=;');
      expect(v).toContain('Max-Age=0');
    });
  });

  describe('parseAdminSessionId', () => {
    it('extracts admin_session from a cookie header', () => {
      const req = new Request('https://x', {
        headers: { cookie: 'foo=bar; admin_session=abc123; baz=qux' },
      });
      expect(parseAdminSessionId(req)).toBe('abc123');
    });

    it('returns null when admin_session cookie missing', () => {
      const req = new Request('https://x', { headers: { cookie: 'foo=bar' } });
      expect(parseAdminSessionId(req)).toBeNull();
    });

    it('returns null when no Cookie header at all', () => {
      const req = new Request('https://x');
      expect(parseAdminSessionId(req)).toBeNull();
    });

    it('returns null when admin_session is empty string', () => {
      const req = new Request('https://x', {
        headers: { cookie: 'admin_session=' },
      });
      expect(parseAdminSessionId(req)).toBeNull();
    });
  });
});
