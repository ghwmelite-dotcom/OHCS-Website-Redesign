-- ohcs-website/migrations/0011_comm_campaigns.sql
--
-- Schema for the admin recruitment communications feature.
-- See spec at docs/superpowers/specs/2026-04-24-admin-recruitment-communications-design.md.

CREATE TABLE IF NOT EXISTS comm_templates (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  description  TEXT,
  subject      TEXT NOT NULL,
  body_text    TEXT NOT NULL,
  body_html    TEXT,
  sms_body     TEXT,
  created_at   INTEGER NOT NULL,
  created_by   TEXT NOT NULL,
  updated_at   INTEGER NOT NULL,
  updated_by   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_templates_name ON comm_templates(name);

CREATE TABLE IF NOT EXISTS comm_campaigns (
  id                 TEXT PRIMARY KEY,
  template_id        TEXT,
  exercise_id        TEXT NOT NULL,
  status_filter      TEXT NOT NULL,
  recipient_count    INTEGER NOT NULL,
  sent_count         INTEGER NOT NULL,
  failed_count       INTEGER NOT NULL,
  sms_requested      INTEGER NOT NULL,
  sms_sent_count     INTEGER NOT NULL DEFAULT 0,
  sms_failed_count   INTEGER NOT NULL DEFAULT 0,
  subject            TEXT NOT NULL,
  body_text          TEXT NOT NULL,
  body_html          TEXT,
  sms_body           TEXT,
  sender_email       TEXT NOT NULL,
  created_at         INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_campaigns_exercise
  ON comm_campaigns(exercise_id, created_at DESC);

CREATE TABLE IF NOT EXISTS comm_campaign_recipients (
  id              TEXT PRIMARY KEY,
  campaign_id     TEXT NOT NULL,
  application_id  TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  email_status    TEXT NOT NULL,
  email_error     TEXT,
  sms_status      TEXT,
  sms_error       TEXT,
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_campaign_recipients_campaign
  ON comm_campaign_recipients(campaign_id);

-- Seed the 4 starter templates that match the demo UI's hardcoded set, so the
-- Templates tab isn't empty on first visit. Idempotent via INSERT OR IGNORE
-- on the unique name.
INSERT OR IGNORE INTO comm_templates (id, name, description, subject, body_text, sms_body, created_at, created_by, updated_at, updated_by) VALUES
  ('seed_app_received', 'Application Received', 'Acknowledge submission', 'Your application has been received',
   'Dear {{name}}, we acknowledge receipt of your application for the {{exercise_name}} recruitment exercise. Your reference number is {{reference_number}}. We will review your application and get back to you shortly.',
   'OHCS: application {{reference_number}} received. Track at https://ohcs.pages.dev/track',
   strftime('%s','now')*1000, 'system_seed', strftime('%s','now')*1000, 'system_seed'),
  ('seed_shortlisted', 'Shortlisted Notification', 'Notify applicants who advance', 'Congratulations — you have been shortlisted',
   'Dear {{name}}, we are pleased to inform you that your application {{reference_number}} for the {{exercise_name}} has been shortlisted. Please proceed to the next stage as outlined in the email below.',
   'OHCS: {{reference_number}} shortlisted. Check email for next steps.',
   strftime('%s','now')*1000, 'system_seed', strftime('%s','now')*1000, 'system_seed'),
  ('seed_exam_scheduled', 'Exam Scheduled', 'Confirm exam logistics', 'Examination date and venue confirmed',
   'Dear {{name}}, your examination for {{exercise_name}} has been scheduled. Please arrive 30 minutes early with a valid government-issued ID. Reference: {{reference_number}}.',
   'OHCS: {{reference_number}} exam scheduled. Check email for date/venue.',
   strftime('%s','now')*1000, 'system_seed', strftime('%s','now')*1000, 'system_seed'),
  ('seed_appointment', 'Appointment Letter', 'Offer of appointment', 'Offer of appointment to the Civil Service',
   'Dear {{name}}, on behalf of the Office of the Head of the Civil Service, we are delighted to offer you the position arising from the {{exercise_name}} recruitment exercise. Your reference is {{reference_number}}. Please report on the date specified in the formal letter to follow.',
   'OHCS: congratulations {{name}} — appointment letter on the way for {{reference_number}}.',
   strftime('%s','now')*1000, 'system_seed', strftime('%s','now')*1000, 'system_seed');
