-- ohcs-website/migrations/0004_applications_and_sessions.sql

CREATE TABLE IF NOT EXISTS applications (
  id                              TEXT PRIMARY KEY,            -- 'OHCS-2026-00372'
  exercise_id                     TEXT NOT NULL,
  email                           TEXT NOT NULL,
  status                          TEXT NOT NULL DEFAULT 'draft',
  has_professional_qualification  INTEGER NOT NULL DEFAULT 0,
  is_pwd                          INTEGER NOT NULL DEFAULT 0,
  form_data                       TEXT,                        -- JSON blob
  created_at                      INTEGER NOT NULL,
  submitted_at                    INTEGER,
  last_saved_at                   INTEGER NOT NULL,
  UNIQUE (exercise_id, email)
);

CREATE INDEX IF NOT EXISTS idx_applications_email_exercise
  ON applications(email, exercise_id);

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  token          TEXT PRIMARY KEY,
  email          TEXT NOT NULL,
  exercise_id    TEXT NOT NULL,
  application_id TEXT,
  created_at     INTEGER NOT NULL,
  expires_at     INTEGER NOT NULL,
  used_at        INTEGER
);

CREATE INDEX IF NOT EXISTS idx_magic_tokens_email_exercise
  ON magic_link_tokens(email, exercise_id);

CREATE TABLE IF NOT EXISTS application_sessions (
  session_id     TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  expires_at     INTEGER NOT NULL,
  last_used_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_application
  ON application_sessions(application_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires
  ON application_sessions(expires_at);

CREATE TABLE IF NOT EXISTS sequences (
  key   TEXT PRIMARY KEY,
  last  INTEGER NOT NULL DEFAULT 0
);
