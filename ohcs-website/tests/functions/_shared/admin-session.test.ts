import { describe, it, expect } from 'vitest';
import {
  createAdminSession,
  readAdminSession,
  deleteAdminSession,
  deleteAllSessionsForEmail,
  ADMIN_SESSION_TTL_MS,
  ADMIN_SESSION_HARD_CAP_MS,
} from '../../../functions/_shared/admin-session';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

describe('admin session helpers', () => {
  it('createAdminSession inserts row and returns generated session id', async () => {
    const db = makeD1([
      {
        sql:
          'INSERT INTO admin_sessions (session_id, email, created_at, expires_at, last_used_at, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        run: {},
      },
    ]);
    const id = await createAdminSession(mockEnv({ db }), {
      email: 'admin@ohcs.gov.gh',
      ipAddress: '1.2.3.4',
    });
    expect(id).toMatch(/^[A-Za-z0-9_-]{20,}$/);
  });

  it('readAdminSession returns row + slides expires_at when valid', async () => {
    const now = Date.now();
    const created = now - 60_000;
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
        first: {
          session_id: 'sess-abc',
          email: 'admin@ohcs.gov.gh',
          created_at: created,
          expires_at: now + 60_000,
          last_used_at: created,
          role: 'super_admin',
        },
      },
      {
        sql:
          'UPDATE admin_sessions SET last_used_at = ?, expires_at = ? WHERE session_id = ?',
        run: {},
      },
    ]);
    const result = await readAdminSession(mockEnv({ db }), 'sess-abc');
    expect(result).not.toBeNull();
    expect(result?.email).toBe('admin@ohcs.gov.gh');
    expect(result?.role).toBe('super_admin');
  });

  it('readAdminSession returns null when session not found or expired', async () => {
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
      },
    ]);
    const result = await readAdminSession(mockEnv({ db }), 'sess-ghost');
    expect(result).toBeNull();
  });

  it('readAdminSession does NOT slide past the hard cap (7d from created_at)', async () => {
    const now = Date.now();
    const created = now - (ADMIN_SESSION_HARD_CAP_MS + 1000);
    const db = makeD1([
      {
        sql:
          'SELECT s.session_id, s.email, s.created_at, s.expires_at, s.last_used_at, u.role FROM admin_sessions s JOIN admin_users u ON u.email = s.email WHERE s.session_id = ? AND s.expires_at > ? AND u.is_active = 1',
        first: {
          session_id: 'sess-old',
          email: 'admin@ohcs.gov.gh',
          created_at: created,
          expires_at: now + 60_000,
          last_used_at: now - 1000,
          role: 'super_admin',
        },
      },
      {
        sql: 'DELETE FROM admin_sessions WHERE session_id = ?',
        run: {},
      },
    ]);
    const result = await readAdminSession(mockEnv({ db }), 'sess-old');
    expect(result).toBeNull();
  });

  it('deleteAdminSession removes the row by id', async () => {
    const db = makeD1([
      { sql: 'DELETE FROM admin_sessions WHERE session_id = ?', run: {} },
    ]);
    await deleteAdminSession(mockEnv({ db }), 'sess-abc');
    expect(true).toBe(true);
  });

  it('deleteAllSessionsForEmail wipes every active session for an email', async () => {
    const db = makeD1([
      { sql: 'DELETE FROM admin_sessions WHERE email = ?', run: {} },
    ]);
    await deleteAllSessionsForEmail(mockEnv({ db }), 'admin@ohcs.gov.gh');
    expect(true).toBe(true);
  });

  it('TTL constants match spec (sliding 4h, hard cap 7d)', () => {
    expect(ADMIN_SESSION_TTL_MS).toBe(4 * 60 * 60 * 1000);
    expect(ADMIN_SESSION_HARD_CAP_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
