-- ohcs-website/migrations/0007_review_pipeline.sql

-- Per-document review decisions (one row per (application_id, document_type_id) per cycle).
-- Append-only; latest row per (application_id, document_type_id) is the active one.
CREATE TABLE IF NOT EXISTS document_review_decisions (
  id                 TEXT PRIMARY KEY,
  application_id     TEXT NOT NULL,
  document_type_id   TEXT NOT NULL,
  reviewer_email     TEXT NOT NULL,
  decision           TEXT NOT NULL,    -- 'accepted' | 'rejected' | 'needs_better_scan'
  reason             TEXT,
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drd_app
  ON document_review_decisions(application_id, created_at DESC);

-- Application-level vetting outcomes (one row per vetting cycle).
CREATE TABLE IF NOT EXISTS application_review_decisions (
  id                 TEXT PRIMARY KEY,
  application_id     TEXT NOT NULL,
  reviewer_email     TEXT NOT NULL,
  outcome            TEXT NOT NULL,    -- 'vetting_passed' | 'vetting_failed' | 'requires_action'
  notes              TEXT,
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ard_app
  ON application_review_decisions(application_id, created_at DESC);

-- Status transition audit trail (used by all sub-projects).
CREATE TABLE IF NOT EXISTS status_transitions (
  id              TEXT PRIMARY KEY,
  application_id  TEXT NOT NULL,
  from_status     TEXT NOT NULL,
  to_status       TEXT NOT NULL,
  actor_email     TEXT,
  actor_role      TEXT,
  reason          TEXT,
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_status_transitions_app
  ON status_transitions(application_id, created_at DESC);

-- Per-exercise vetting policy
ALTER TABLE recruitment_exercises
  ADD COLUMN vetting_window_days INTEGER NOT NULL DEFAULT 14;

ALTER TABLE recruitment_exercises
  ADD COLUMN appeal_window_days INTEGER NOT NULL DEFAULT 7;

-- Open-queue claim tracking
ALTER TABLE applications
  ADD COLUMN review_claimed_by TEXT;

ALTER TABLE applications
  ADD COLUMN review_claimed_at INTEGER;

-- Track when an appeal was opened (so we can compute the appeal window deadline).
ALTER TABLE applications
  ADD COLUMN appeal_submitted_at INTEGER;

ALTER TABLE applications
  ADD COLUMN appeal_reason TEXT;
