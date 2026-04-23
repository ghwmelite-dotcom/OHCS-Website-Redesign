-- ohcs-website/migrations/0009_pipeline_indexes.sql
--
-- Indexes the audit found missing on the pipeline tables:
--   * applications.status — used by /api/admin/applications (list filter)
--     and /api/admin/applications/appeals (appeal queue)
--   * applications.review_claimed_at — used by the cron sweep that
--     releases stale claims (run-deadlines.ts)
--   * applications.review_claimed_by — used by /api/admin/applications
--     when filtering "claimed by me"

CREATE INDEX IF NOT EXISTS idx_applications_status
  ON applications(status);

CREATE INDEX IF NOT EXISTS idx_applications_review_claimed_at
  ON applications(review_claimed_at);

CREATE INDEX IF NOT EXISTS idx_applications_review_claimed_by
  ON applications(review_claimed_by);
