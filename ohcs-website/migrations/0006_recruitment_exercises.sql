-- ohcs-website/migrations/0006_recruitment_exercises.sql
--
-- Until now, recruitment exercises lived only in the admin React state
-- (seeded from a hardcoded array, persisted only to localStorage). This
-- moves them into D1 so the public site can know which exercise is
-- active without browser-local state, and so applicants always submit
-- against a server-validated exercise_id.

CREATE TABLE IF NOT EXISTS recruitment_exercises (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  start_date   TEXT NOT NULL,             -- 'YYYY-MM-DD'
  end_date     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'active' | 'closed' | 'completed'
  positions    INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recruitment_exercises_status
  ON recruitment_exercises(status);

-- Seed the 3 exercises that were hardcoded in
-- src/app/admin/recruitment/exercises/page.tsx INITIAL_EXERCISES.
-- The application counts that were also hardcoded are intentionally
-- omitted — the API computes them from the applications table.
INSERT OR IGNORE INTO recruitment_exercises
  (id, name, description, start_date, end_date, status, positions, created_at, updated_at)
VALUES
  (
    'ex-001',
    '2026 Graduate Entrance Examination',
    'Civil Service Online Graduate Entrance Examination for new graduates seeking to join the public service.',
    '2026-03-15', '2026-04-30',
    'active', 24,
    strftime('%s','now')*1000, strftime('%s','now')*1000
  ),
  (
    'ex-002',
    '2025 Senior Officer Recruitment',
    'Recruitment of experienced professionals for senior officer positions across MDAs.',
    '2025-09-01', '2025-11-30',
    'completed', 12,
    strftime('%s','now')*1000, strftime('%s','now')*1000
  ),
  (
    'ex-003',
    '2026 Technical Specialist Drive',
    'Targeted recruitment for IT, Engineering, and Scientific Officer roles in technical agencies.',
    '2026-05-01', '2026-06-30',
    'draft', 8,
    strftime('%s','now')*1000, strftime('%s','now')*1000
  );
