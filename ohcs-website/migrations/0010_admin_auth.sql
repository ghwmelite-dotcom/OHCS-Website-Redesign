-- ohcs-website/migrations/0010_admin_auth.sql
--
-- Replaces the interim header-based admin auth with a real
-- D1-backed allowlist + magic-link sessions. See design spec at
-- docs/superpowers/specs/2026-04-24-admin-magic-link-auth-design.md.

CREATE TABLE IF NOT EXISTS admin_users (
  email         TEXT PRIMARY KEY,
  role          TEXT NOT NULL,
  display_name  TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL,
  created_by    TEXT,
  updated_at    INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

CREATE TABLE IF NOT EXISTS admin_magic_tokens (
  token        TEXT PRIMARY KEY,
  email        TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  used_at      INTEGER,
  ip_address   TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_magic_tokens_email
  ON admin_magic_tokens(email, created_at);

CREATE TABLE IF NOT EXISTS admin_sessions (
  session_id    TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  last_used_at  INTEGER NOT NULL,
  ip_address    TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_email
  ON admin_sessions(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires
  ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS site_config (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL,
  updated_at    INTEGER NOT NULL,
  updated_by    TEXT
);

INSERT OR IGNORE INTO site_config (key, value, updated_at)
  VALUES ('admin_demo_mode_enabled', 'true', strftime('%s','now')*1000);

-- Bootstrap super_admin so the system is never lockable-out.
-- Resolved 2026-04-24: seeded as the new account holder so magic-link
-- works the moment demo mode is disabled.
INSERT OR IGNORE INTO admin_users
  (email, role, display_name, is_active, created_at, created_by, updated_at)
VALUES
  ('ohcsghana.main@gmail.com', 'super_admin', 'OHCS Bootstrap Admin', 1,
   strftime('%s','now')*1000, 'system_bootstrap', strftime('%s','now')*1000);
