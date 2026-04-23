//
// SECURITY: see functions/_shared/admin-auth.ts header.

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { parseBody } from '../../../../_shared/validate';
import { first, run } from '../../../../_shared/db';
import { sendEmail } from '../../../../_shared/email';
import { sendSms } from '../../../../_shared/sms';
import { escapeHtml } from '../../../../_shared/escape-html';
import { z } from 'zod';

const Body = z.object({
  document_decisions: z
    .array(
      z.object({
        document_type_id: z.string().min(1),
        decision: z.enum(['accepted', 'rejected', 'needs_better_scan']),
        reason: z.string().max(2000).optional(),
      }),
    )
    .min(1)
    .refine(
      (arr) => arr.every((d) => d.decision === 'accepted' || (d.reason && d.reason.trim().length > 0)),
      { message: 'reason required for non-accepted decisions' },
    ),
  notes: z.string().max(2000).optional(),
});

function rollUp(
  decisions: Array<{ decision: string }>,
): 'vetting_passed' | 'vetting_failed' | 'requires_action' {
  if (decisions.some((d) => d.decision === 'rejected')) return 'vetting_failed';
  if (decisions.some((d) => d.decision === 'needs_better_scan')) return 'requires_action';
  return 'vetting_passed';
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface AppRow {
  status: string;
  exercise_id: string;
  email: string;
  form_data: string | null;
}

function extractPhone(formDataJson: string | null): string | null {
  if (!formDataJson) return null;
  try {
    const parsed = JSON.parse(formDataJson) as { phone?: unknown };
    if (typeof parsed.phone === 'string' && parsed.phone.trim().length > 0) {
      return parsed.phone.trim();
    }
  } catch {
    // form_data corrupt — silently skip SMS
  }
  return null;
}

export const onRequestPost: PagesFunction<Env, 'id'> = async ({ request, env, params }) => {
  const auth = requireAdmin(request);
  if (auth.kind === 'reject') return auth.response;

  const app = await first<AppRow>(
    env,
    'SELECT status, exercise_id, email, form_data FROM applications WHERE id = ?',
    params.id,
  );
  if (!app) return json({ error: 'not found' }, { status: 404 });
  if (app.status !== 'under_review') {
    return json(
      { error: 'application is not under review', status: app.status },
      { status: 409 },
    );
  }

  const body = await parseBody(request, Body);
  if (body.kind === 'reject') return body.response;
  const v = body.value;

  const outcome = rollUp(v.document_decisions);
  const now = Date.now();

  // 1) Insert one row per per-doc decision
  for (const d of v.document_decisions) {
    await run(
      env,
      'INSERT INTO document_review_decisions (id, application_id, document_type_id, reviewer_email, decision, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      genId('drd'),
      params.id,
      d.document_type_id,
      auth.admin.email,
      d.decision,
      d.reason ?? null,
      now,
    );
  }

  // 2) Insert overall vetting decision
  await run(
    env,
    'INSERT INTO application_review_decisions (id, application_id, reviewer_email, outcome, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    genId('ard'),
    params.id,
    auth.admin.email,
    outcome,
    v.notes ?? null,
    now,
  );

  // 3) Status transition + clear claim
  await run(
    env,
    'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    genId('tx'),
    params.id,
    'under_review',
    outcome,
    auth.admin.email,
    auth.admin.role,
    `Vetting decision: ${outcome}`,
    now,
  );
  await run(
    env,
    'UPDATE applications SET status = ?, review_claimed_by = NULL, review_claimed_at = NULL WHERE id = ?',
    outcome,
    params.id,
  );

  // 4) Notifications (best-effort — don't roll back the decision)
  try {
    if (outcome === 'vetting_passed') {
      await sendEmail(env, {
        to: app.email,
        subject: 'OHCS Recruitment — vetting passed, please pay exam fee',
        html: `<p>Your application <strong>${escapeHtml(params.id)}</strong> has passed initial review.</p><p>To proceed to the examination, please pay the exam fee. The payment portal will open soon.</p>`,
        text: `Your application ${params.id} has passed initial review. Please pay the exam fee to proceed.`,
      });
      const phone = extractPhone(app.form_data);
      if (phone) {
        await sendSms(env, {
          to: phone,
          message: `OHCS: your application ${params.id} has passed vetting. Pay your exam fee to proceed.`,
        });
      }
    } else if (outcome === 'vetting_failed') {
      const notesHtml = v.notes ? escapeHtml(v.notes) : '(no overall notes)';
      await sendEmail(env, {
        to: app.email,
        subject: 'OHCS Recruitment — vetting outcome',
        html: `<p>Your application <strong>${escapeHtml(params.id)}</strong> was not successful at vetting.</p><p>Notes: ${notesHtml}</p><p>You may submit an appeal within the appeal window.</p>`,
        text: `Your application ${params.id} was not successful at vetting. Notes: ${v.notes ?? '(none)'}`,
      });
    } else {
      const reasonsList = v.document_decisions
        .filter((d) => d.decision !== 'accepted')
        .map(
          (d) =>
            `<li><strong>${escapeHtml(d.document_type_id)}</strong>: ${escapeHtml(d.reason ?? '')}</li>`,
        )
        .join('');
      await sendEmail(env, {
        to: app.email,
        subject: 'OHCS Recruitment — additional information needed',
        html: `<p>Your application <strong>${escapeHtml(params.id)}</strong> needs additional information before vetting can complete:</p><ul>${reasonsList}</ul>`,
        text: `Your application ${params.id} needs additional information. Please re-upload the indicated documents.`,
      });
    }
  } catch (err) {
    console.error('vetting notification failed', err);
  }

  return json({ data: { outcome } });
};
