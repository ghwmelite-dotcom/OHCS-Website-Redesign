-- ohcs-website/migrations/0003_exercise_document_requirements.sql

CREATE TABLE IF NOT EXISTS exercise_document_requirements (
  id                  TEXT PRIMARY KEY,
  exercise_id         TEXT NOT NULL,
  document_type_id    TEXT NOT NULL,
  is_required         INTEGER NOT NULL DEFAULT 1,
  conditional_on      TEXT,                  -- 'has_professional_qualification' | 'is_pwd' | NULL
  display_order       INTEGER NOT NULL,
  max_mb_override     INTEGER,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL,
  UNIQUE (exercise_id, document_type_id)
);

CREATE INDEX IF NOT EXISTS idx_edr_exercise
  ON exercise_document_requirements(exercise_id, display_order);
