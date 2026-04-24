//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../../../_shared/types';
import { json } from '../../../../../_shared/json';
import { requireAdmin } from '../../../../../_shared/admin-auth';
import { parseBody } from '../../../../../_shared/validate';
import { first, run } from '../../../../../_shared/db';
import { sendEmail } from '../../../../../_shared/email';
import { sendSms } from '../../../../../_shared/sms';
import { escapeHtml } from '../../../../../_shared/escape-html';
import { z } from 'zod';

const Body = z.object({
  outcome: z.enum(['upheld', 'overturned']),
  notes: z.string().min(10).max(4000),
});

export const onRequestPost: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.admin.role !== 'recruitment_admin' && auth.admin.role !== 'super_admin') {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  const body = await parseBody(request, Body);
  if (body.kind === 'reject') return body.response;

  const app = await first<{ status: string; email: string; form_data: string | null }>(
    env,
    'SELECT status, email, form_data FROM applications WHERE id = ?',
    params.id,
  );
  if (!app) return json({ error: 'not found' }, { status: 404 });
  if (app.status !== 'appeal_under_review') {
    return json(
      { error: 'application is not in appeal review', status: app.status },
      { status: 409 },
    );
  }

  const now = Date.now();
  const newStatus = body.value.outcome === 'overturned' ? 'vetting_passed' : 'appeal_upheld';

  await run(
    env,
    'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    `tx_${now}_${Math.random().toString(36).slice(2, 10)}`,
    params.id,
    'appeal_under_review',
    newStatus,
    auth.admin.email,
    auth.admin.role,
    `Appeal ${body.value.outcome}: ${body.value.notes}`,
    now,
  );
  await run(env, 'UPDATE applications SET status = ? WHERE id = ?', newStatus, params.id);

  try {
    if (body.value.outcome === 'overturned') {
      await sendEmail(env, {
        to: app.email,
        subject: 'OHCS Recruitment — appeal upheld, application proceeds',
        html: `<p>Your appeal on application <strong>${escapeHtml(params.id)}</strong> has been overturned. You may now proceed to pay the exam fee.</p>`,
        text: `Your appeal on application ${params.id} was overturned. Please pay the exam fee to proceed.`,
      });
      const phone = (() => {
        if (!app.form_data) return null;
        try {
          const parsed = JSON.parse(app.form_data) as { phone?: unknown };
          return typeof parsed.phone === 'string' && parsed.phone.trim().length > 0
            ? parsed.phone.trim()
            : null;
        } catch {
          return null;
        }
      })();
      if (phone) {
        await sendSms(env, {
          to: phone,
          message: `OHCS: your appeal on ${params.id} was successful. Pay exam fee to proceed.`,
        });
      }
    } else {
      await sendEmail(env, {
        to: app.email,
        subject: 'OHCS Recruitment — appeal outcome',
        html: `<p>Your appeal on application <strong>${escapeHtml(params.id)}</strong> has been reviewed and the original decision stands.</p><p>Notes: ${escapeHtml(body.value.notes)}</p>`,
        text: `Your appeal on application ${params.id} was upheld. Notes: ${body.value.notes}`,
      });
    }
  } catch (err) {
    console.error('appeal notification failed', err);
  }

  return json({ data: { status: newStatus } });
};
