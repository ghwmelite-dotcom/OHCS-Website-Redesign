-- ohcs-website/migrations/0005_application_documents.sql

CREATE TABLE IF NOT EXISTS application_documents (
  id                  TEXT PRIMARY KEY,
  application_id      TEXT NOT NULL,
  document_type_id    TEXT NOT NULL,
  r2_key              TEXT NOT NULL,
  original_filename   TEXT NOT NULL,
  size_bytes          INTEGER NOT NULL,
  mime_type           TEXT NOT NULL,
  sha256              TEXT NOT NULL,
  uploaded_at         INTEGER NOT NULL,
  ai_verdict          TEXT NOT NULL DEFAULT 'unchecked',
  ai_confidence       REAL,
  ai_reason           TEXT,
  ai_prompt_version   TEXT,
  manual_flag         TEXT,
  applicant_confirmed INTEGER NOT NULL DEFAULT 0,
  UNIQUE (application_id, document_type_id)
);

CREATE INDEX IF NOT EXISTS idx_app_docs_application
  ON application_documents(application_id);
