-- ohcs-website/migrations/0002_document_types.sql

CREATE TABLE IF NOT EXISTS document_types (
  id              TEXT PRIMARY KEY,
  label           TEXT NOT NULL,
  description     TEXT,
  default_max_mb  INTEGER NOT NULL,
  accepted_mimes  TEXT NOT NULL,           -- JSON array string
  ai_check_type   TEXT,                    -- 'certificate' | 'photo' | 'identity' | NULL
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- Seed the 15-document master library agreed in the spec
INSERT INTO document_types (id, label, description, default_max_mb, accepted_mimes, ai_check_type, is_active, created_at, updated_at) VALUES
  ('national_id',           'National ID (Ghana Card)',                                          NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'identity',    1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('birth_certificate',     'Birth Certificate',                                                 NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('passport_photo',        'Passport-sized Photograph',                                         NULL, 2, '["image/jpeg","image/png"]',                    'photo',       1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('ssce_wassce',           'SSSCE / WASSCE Certificate',                                        NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('first_degree',          'First Degree Certificate',                                          NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('degree_transcript',     'Degree Transcript',                                                 NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('nss_certificate',       'National Service Certificate (NSS)',                                NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('postgraduate_cert',     'Postgraduate Certificate (Masters / PhD)',                          NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('professional_cert',     'Professional Qualification (ICAG / GhIE / BAR / GMA)',              NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('cv',                    'Curriculum Vitae',                                                  NULL, 5, '["application/pdf"]',                           NULL,          1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('cover_letter',          'Cover Letter / Statement of Purpose',                               NULL, 5, '["application/pdf"]',                           NULL,          1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('reference_letter_1',    'Reference Letter 1',                                                NULL, 5, '["application/pdf"]',                           NULL,          1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('reference_letter_2',    'Reference Letter 2',                                                NULL, 5, '["application/pdf"]',                           NULL,          1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('work_experience_proof', 'Proof of Work Experience',                                          NULL, 5, '["application/pdf","image/jpeg","image/png"]',  'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('medical_certificate_pwd','Medical Certificate (PWD)',                                        NULL, 5, '["application/pdf"]',                           'certificate', 1, strftime('%s','now')*1000, strftime('%s','now')*1000);
