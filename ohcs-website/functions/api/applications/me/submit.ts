import type { PagesFunction } from '../../../_shared/types';
import { json } from '../../../_shared/json';
import { first, all, run } from '../../../_shared/db';
import { requireApplicant } from '../../../_shared/applicant-session';
import { sendEmail } from '../../../_shared/email';
import { submitEmail } from '../../../_shared/submit-email';

interface FlagsAndForm {
  has_professional_qualification: number;
  is_pwd: number;
  form_data: string | null;
}

interface RequirementSummary {
  document_type_id: string;
  is_required: number;
  conditional_on: string | null;
}

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const auth = await requireApplicant(request, env);
  if (auth.kind === 'reject') return auth.response;
  if (auth.application.status !== 'draft') {
    return json(
      { error: 'application is not in draft', status: auth.application.status },
      { status: 409 },
    );
  }

  const row = await first<FlagsAndForm>(
    env,
    'SELECT has_professional_qualification, is_pwd, form_data FROM applications WHERE id = ?',
    auth.application.id,
  );
  if (!row) return json({ error: 'application not found' }, { status: 404 });

  const formData = row.form_data ? (JSON.parse(row.form_data) as Record<string, unknown>) : {};
  const declaration = formData.declaration as { agreed?: boolean } | undefined;
  if (!declaration || declaration.agreed !== true) {
    return json({ error: 'declaration must be agreed' }, { status: 400 });
  }

  const reqs = await all<RequirementSummary>(
    env,
    'SELECT document_type_id, is_required, conditional_on FROM exercise_document_requirements WHERE exercise_id = ? AND is_required = 1',
    auth.application.exercise_id,
  );
  const hasPro = row.has_professional_qualification === 1;
  const isPwd = row.is_pwd === 1;
  const requiredNow = reqs.filter((r) => {
    if (r.conditional_on === null) return true;
    if (r.conditional_on === 'has_professional_qualification') return hasPro;
    if (r.conditional_on === 'is_pwd') return isPwd;
    return true;
  });

  const uploads = await all<{ document_type_id: string }>(
    env,
    'SELECT document_type_id FROM application_documents WHERE application_id = ?',
    auth.application.id,
  );
  const uploaded = new Set(uploads.map((u) => u.document_type_id));
  const missing = requiredNow
    .filter((r) => !uploaded.has(r.document_type_id))
    .map((r) => r.document_type_id);

  if (missing.length > 0) {
    return json({ error: 'required documents missing', missing }, { status: 400 });
  }

  const now = Date.now();
  await run(
    env,
    'INSERT INTO status_transitions (id, application_id, from_status, to_status, actor_email, actor_role, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    `tx_${now}_${Math.random().toString(36).slice(2, 10)}`,
    auth.application.id,
    'draft',
    'submitted',
    auth.application.email,
    'applicant',
    'Application submitted',
    now,
  );
  await run(
    env,
    'UPDATE applications SET status = ?, submitted_at = ? WHERE id = ?',
    'submitted',
    now,
    auth.application.id,
  );

  // Best-effort confirmation email — don't roll back the submission if email fails.
  try {
    const origin = new URL(request.url).origin;
    const trackUrl = `${origin}/track/?ref=${encodeURIComponent(auth.application.id)}`;
    const body = submitEmail(auth.application.id, trackUrl);
    await sendEmail(env, {
      to: auth.application.email,
      subject: body.subject,
      html: body.html,
      text: body.text,
    });
  } catch (err) {
    console.error('submit confirmation email failed', err);
  }

  return json({
    data: { reference_number: auth.application.id, status: 'submitted', submitted_at: now },
  });
};
