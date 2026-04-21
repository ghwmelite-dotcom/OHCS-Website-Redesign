-- ohcs-website/migrations/0001_initial_meta.sql
CREATE TABLE IF NOT EXISTS _migrations (
  id           TEXT PRIMARY KEY,
  applied_at   INTEGER NOT NULL
);
