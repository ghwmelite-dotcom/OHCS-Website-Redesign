//
// SECURITY: see functions/_shared/admin-auth.ts header.
// Send a recruitment communications campaign — synchronous, capped at 50
// recipients, rate-limited per admin (3 per rolling 5 min). Email always;
// SMS opt-in via send_sms flag (silently downgrades when Hubtel key unset).

import type { PagesFunction, Env } from '../../../../_shared/types';
import { json } from '../../../../_shared/json';
import { parseBody } from '../../../../_shared/validate';
import { first, run } from '../../../../_shared/db';
import { requireAdmin } from '../../../../_shared/admin-auth';
import { sendEmail } from '../../../../_shared/email';
import { sendSms } from '../../../../_shared/sms';
import { resolveAudience } from '../../../../_shared/audience-resolver';
import {
  substitutePlaceholders,
  type PlaceholderContext,
} from '../../../../_shared/placeholder-substitute';
import { getStatusLabel } from '../../../../../src/lib/application-status';
import { z } from 'zod';

const Body = z
  .object({
    exercise_id: z.string().optional(),
    application_id: z.string().optional(),
    status: z.string().min(1).max(60),
    send_sms: z.boolean(),
    template_id: z.string().optional(),
    subject: z.string().min(1).max(300),
    body_text: z.string().min(1).max(20000),
    body_html: z.string().max(40000).optional(),
    sms_body: z.string().max(320).optional(),
  })
  .refine(
    (v) => (v.status === 'single' ? !!v.application_id : !!v.exercise_id),
    { message: 'exercise_id required (or application_id when status=single)' },
  );

const AUDIENCE_CAP = 50;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function recruitmentAdmin(role: string): boolean {
  return role === 'super_admin' || role === 'recruitment_admin';
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (!recruitmentAdmin(auth.admin.role)) {
    return json({ error: 'recruitment_admin role required' }, { status: 403 });
  }

  const parsed = await parseBody(request, Body);
  if (parsed.kind === 'reject') return parsed.response;
  const v = parsed.value;
  const now = Date.now();

  // Rate limit per admin
  const recent = await first<{ n: number }>(
    env,
    'SELECT COUNT(*) AS n FROM comm_campaigns WHERE sender_email = ? AND created_at > ?',
    auth.admin.email,
    now - RATE_LIMIT_WINDOW_MS,
  );
  if (recent && recent.n >= RATE_LIMIT_MAX) {
    return json(
      { error: 'too many campaigns; please wait 5 minutes' },
      { status: 429, headers: { 'retry-after': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) } },
    );
  }

  // Resolve {{exercise_name}} (skip lookup for single-applicant)
  let exerciseName = '';
  if (v.status !== 'single' && v.exercise_id) {
    const ex = await first<{ name: string }>(
      env,
      'SELECT name FROM recruitment_exercises WHERE id = ?',
      v.exercise_id,
    );
    exerciseName = ex?.name ?? '';
  }

  // Resolve audience
  const recipients =
    v.status === 'single'
      ? await resolveAudience(env, { kind: 'single', applicationId: v.application_id! })
      : await resolveAudience(env, {
          kind: 'status',
          exerciseId: v.exercise_id!,
          status: v.status,
        });

  if (recipients.length > AUDIENCE_CAP) {
    return json(
      {
        error: `audience too large (${recipients.length}); cap is ${AUDIENCE_CAP}. Narrow the filter.`,
      },
      { status: 400 },
    );
  }

  // SMS gate — silently downgrade if no Hubtel key
  const smsActive = v.send_sms && !!env.HUBTEL_SMS_API_KEY;

  // Campaign-level counters
  const campaignId = genId('camp');
  let sentCount = 0;
  let failedCount = 0;
  let smsSentCount = 0;
  let smsFailedCount = 0;

  // Per-recipient send loop — email failure does NOT abort the loop
  for (const r of recipients) {
    const ctx: PlaceholderContext = {
      name: r.fullName ?? r.email.split('@')[0] ?? r.email,
      email: r.email,
      reference_number: r.applicationId,
      exercise_name: exerciseName,
      status: getStatusLabel(v.status),
      appeal_deadline: null,
    };
    const subject = substitutePlaceholders(v.subject, ctx, false);
    const bodyText = substitutePlaceholders(v.body_text, ctx, false);
    const bodyHtml = v.body_html ? substitutePlaceholders(v.body_html, ctx, true) : undefined;
    const smsBody = v.sms_body ? substitutePlaceholders(v.sms_body, ctx, false) : undefined;

    let emailStatus: 'sent' | 'failed' = 'sent';
    let emailError: string | null = null;
    try {
      await sendEmail(env, {
        to: r.email,
        subject,
        html: bodyHtml ?? `<p>${bodyText.replace(/\n/g, '</p><p>')}</p>`,
        text: bodyText,
      });
      sentCount += 1;
    } catch (err) {
      emailStatus = 'failed';
      emailError = err instanceof Error ? err.message : String(err);
      failedCount += 1;
    }

    let smsStatus: 'sent' | 'failed' | null = null;
    let smsError: string | null = null;
    // SMS opt-in but no phone: skip for this recipient (don't fail email)
    if (smsActive && r.phone && smsBody) {
      try {
        await sendSms(env, { to: r.phone, message: smsBody });
        smsStatus = 'sent';
        smsSentCount += 1;
      } catch (err) {
        smsStatus = 'failed';
        smsError = err instanceof Error ? err.message : String(err);
        smsFailedCount += 1;
      }
    }

    await run(
      env,
      'INSERT INTO comm_campaign_recipients (id, campaign_id, application_id, email, phone, email_status, email_error, sms_status, sms_error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      genId('crec'),
      campaignId,
      r.applicationId,
      r.email,
      r.phone,
      emailStatus,
      emailError,
      smsStatus,
      smsError,
      now,
    );
  }

  // Insert campaign summary row after all sends
  await run(
    env,
    'INSERT INTO comm_campaigns (id, template_id, exercise_id, status_filter, recipient_count, sent_count, failed_count, sms_requested, sms_sent_count, sms_failed_count, subject, body_text, body_html, sms_body, sender_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    campaignId,
    v.template_id ?? null,
    v.exercise_id ?? '(single)',
    v.status,
    recipients.length,
    sentCount,
    failedCount,
    smsActive ? 1 : 0,
    smsSentCount,
    smsFailedCount,
    v.subject,
    v.body_text,
    v.body_html ?? null,
    v.sms_body ?? null,
    auth.admin.email,
    now,
  );

  return json({
    data: {
      campaign_id: campaignId,
      recipient_count: recipients.length,
      sent_count: sentCount,
      failed_count: failedCount,
      sms_requested: smsActive,
      sms_sent_count: smsSentCount,
      sms_failed_count: smsFailedCount,
    },
  });
};
