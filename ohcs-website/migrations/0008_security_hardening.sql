-- ohcs-website/migrations/0008_security_hardening.sql
--
-- Magic-link tokens are now stored as SHA-256 hex digests in the existing
-- `token` column rather than as raw tokens. Any in-flight tokens issued
-- against the previous storage format become unverifiable on deploy, so
-- we clear them; affected applicants simply request a new link.

DELETE FROM magic_link_tokens;
