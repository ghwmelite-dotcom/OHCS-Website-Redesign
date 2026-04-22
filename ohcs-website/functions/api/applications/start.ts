import type { PagesFunction } from '../../_shared/types';
import { json } from '../../_shared/json';
import { parseBody } from '../../_shared/validate';
import { run } from '../../_shared/db';
import { sendEmail } from '../../_shared/email';
import { magicLinkEmail } from '../../_shared/magic-link-email';
import { z } from 'zod';

const TOKEN_TTL_MS = 30 * 60 * 1000;

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

  const token = generateToken();
  const now = Date.now();
  const expires = now + TOKEN_TTL_MS;

  await run(
    env,
    'INSERT INTO magic_link_tokens (token, email, exercise_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    token,
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
