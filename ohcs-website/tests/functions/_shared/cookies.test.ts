import { describe, it, expect } from 'vitest';
import {
  readSessionCookie,
  buildSetSessionCookie,
  buildClearSessionCookie,
} from '../../../functions/_shared/cookies';

describe('readSessionCookie', () => {
  it('returns the session_id value when present', () => {
    const req = new Request('https://x', { headers: { Cookie: 'session_id=abc123; theme=dark' } });
    expect(readSessionCookie(req)).toBe('abc123');
  });

  it('returns null when no Cookie header', () => {
    expect(readSessionCookie(new Request('https://x'))).toBeNull();
  });

  it('returns null when session_id is missing', () => {
    const req = new Request('https://x', { headers: { Cookie: 'theme=dark' } });
    expect(readSessionCookie(req)).toBeNull();
  });

  it('handles whitespace and multiple cookies', () => {
    const req = new Request('https://x', { headers: { Cookie: ' theme=dark ; session_id=xyz789 ; locale=en' } });
    expect(readSessionCookie(req)).toBe('xyz789');
  });
});

describe('buildSetSessionCookie', () => {
  it('includes Secure, HttpOnly, SameSite=Lax, Path=/, Max-Age', () => {
    const cookie = buildSetSessionCookie('abc123', 7 * 24 * 60 * 60);
    expect(cookie).toMatch(/^session_id=abc123;/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Max-Age=604800');
  });
});

describe('buildClearSessionCookie', () => {
  it('returns a cookie that expires the session immediately', () => {
    const cookie = buildClearSessionCookie();
    expect(cookie).toMatch(/^session_id=;/);
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/');
  });
});
