import type { PagesFunction } from '../../_shared/types';
import { json } from '../../_shared/json';
import { parseBody } from '../../_shared/validate';
import { first, run } from '../../_shared/db';
import { sendEmail } from '../../_shared/email';
import { magicLinkEmail } from '../../_shared/magic-link-email';
import { hashToken } from '../../_shared/hash-token';
import { z } from 'zod';

const TOKEN_TTL_MS = 30 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_PER_EMAIL = 3;

const Body = z.object({
  email: z.string().email().toLowerCase(),
  exercise_id: z.string().min(1),
});

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;
  const { email, exercise_id } = parsed.value;

  // Defense in depth: confirm the exercise exists AND is currently active
  // before issuing a magic link. Stops applicants from starting an
  // application against a draft / closed / completed exercise even if
  // the public site somehow exposes the wrong id.
  const exercise = await first<{ status: string }>(
    env,
    'SELECT status FROM recruitment_exercises WHERE id = ?',
    exercise_id,
  );
  if (!exercise) {
    return json({ error: 'unknown exercise', code: 'EXERCISE_NOT_FOUND' }, { status: 404 });
  }
  if (exercise.status !== 'active') {
    return json(
      { error: 'exercise is not accepting applications', status: exercise.status },
      { status: 409 },
    );
  }

  const now = Date.now();

  // Per-email rate limit: cap magic-link issuance to RATE_LIMIT_MAX_PER_EMAIL
  // within the rolling RATE_LIMIT_WINDOW. Defends against spam/harassment
  // via the email-blast endpoint and prevents Resend quota burn.
  const recent = await first<{ n: number }>(
    env,
    'SELECT COUNT(*) AS n FROM magic_link_tokens WHERE email = ? AND created_at > ?',
    email,
    now - RATE_LIMIT_WINDOW_MS,
  );
  if (recent && recent.n >= RATE_LIMIT_MAX_PER_EMAIL) {
    return json(
      { error: 'too many magic-link requests; please try again later' },
      { status: 429, headers: { 'retry-after': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) } },
    );
  }

  const token = generateToken();
  const tokenHash = await hashToken(token);
  const expires = now + TOKEN_TTL_MS;

  await run(
    env,
    'INSERT INTO magic_link_tokens (token, email, exercise_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    tokenHash,
    email,
    exercise_id,
    now,
    expires,
  );

  // The magic-link URL points directly at the API endpoint, which 302s to
  // /apply/form/?step=1 after setting the session cookie. No intermediate
  // React landing page is needed.
  const origin = new URL(request.url).origin;
  const resumeUrl = `${origin}/api/applications/magic/${encodeURIComponent(token)}`;
  const body = magicLinkEmail(resumeUrl);

  try {
    await sendEmail(env, { to: email, subject: body.subject, html: body.html, text: body.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: 'email send failed', detail: message }, { status: 502 });
  }

  return json({ data: { sent: true, exercise_id } });
};
