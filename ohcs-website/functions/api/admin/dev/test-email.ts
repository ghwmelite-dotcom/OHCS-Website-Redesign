//
// SECURITY: see functions/_shared/admin-auth.ts header.
//
// Manual smoke-test endpoint for verifying the email pipeline is wired
// correctly end-to-end. Sends a fixed-content test message to whatever
// address the admin specifies. Will be removed (or kept as a health
// signal) once the magic-link request flow ships in Phase 2.

import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { requireAdmin } from '../../../_shared/admin-auth';
import { parseBody } from '../../../_shared/validate';
import { sendEmail } from '../../../_shared/email';
import { z } from 'zod';

const Body = z.object({
  to: z.string().email(),
});

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;

  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;

  const html = `
    <p>Hello,</p>
    <p>This is a test message from the OHCS Recruitment system, sent via the
    <strong>${env.EMAIL_PROVIDER ?? 'auto'}</strong> email transport
    (<code>${env.EMAIL_FROM}</code>).</p>
    <p>If you received this, the magic-link delivery path is wired
    correctly and Phase 2 can ship.</p>
    <p>— OHCS Recruitment</p>
  `;

  try {
    await sendEmail(env, {
      to: parsed.value.to,
      subject: 'OHCS Recruitment — email pipeline test',
      html,
      text: `OHCS Recruitment email pipeline test. If you received this, the magic-link delivery path is wired correctly. Sent via ${env.EMAIL_PROVIDER ?? 'auto'} from ${env.EMAIL_FROM}.`,
    });
    return json({ data: { sent: true, to: parsed.value.to, provider: env.EMAIL_PROVIDER ?? 'auto' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: 'send failed', detail: message }, { status: 500 });
  }
};
