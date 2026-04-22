'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitApplication } from '@/lib/applicant-api';
import type { Application, ApplicationFormData } from '@/types/recruitment';

const GENDER_LABELS: Record<NonNullable<ApplicationFormData['gender']>, string> = {
  male: 'Male',
  female: 'Female',
  prefer_not_to_say: 'Prefer not to say',
};

const QUALIFICATION_LABELS: Record<
  NonNullable<ApplicationFormData['highest_qualification']>,
  string
> = {
  first_degree: 'First degree',
  pg_diploma: 'Postgraduate diploma',
  masters: 'Masters',
  phd: 'PhD',
};

const CLASS_LABELS: Record<
  NonNullable<ApplicationFormData['class_of_degree']>,
  string
> = {
  first: 'First class',
  second_upper: 'Second class upper',
  second_lower: 'Second class lower',
  third: 'Third class',
  pass: 'Pass',
};

/* ─── Submit state machine ─────────────────────────────────────────── */
type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; reference: string; submittedAt: number }
  | { kind: 'error'; message: string; missing?: string[] };

interface StepReviewProps {
  application: Application;
  data: Partial<ApplicationFormData>;
  hasProfessionalQualification: boolean;
  isPwd: boolean;
  onChange: (patch: Partial<ApplicationFormData>) => void;
}

export function StepReview({
  application,
  data,
  hasProfessionalQualification,
  isPwd,
  onChange,
}: StepReviewProps) {
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });

  const declared = data.declaration?.agreed === true;
  const canSubmit = declared && submitState.kind === 'idle';

  const handleDeclarationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        declaration: { agreed: e.target.checked, agreed_at: Date.now() },
      });
    },
    [onChange],
  );

  const handleSubmit = useCallback(async () => {
    setSubmitState({ kind: 'submitting' });
    try {
      const result = await submitApplication();
      setSubmitState({
        kind: 'success',
        reference: result.reference_number,
        submittedAt: result.submitted_at,
      });
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'Submission failed — please try again.';
      const missing = parseMissingDocs(message);
      setSubmitState({ kind: 'error', message, missing });
    }
  }, []);

  /* ── Success view replaces the whole form ─────────────────────── */
  if (submitState.kind === 'success') {
    const trackHref = `/track/?ref=${encodeURIComponent(submitState.reference)}`;
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle
              className="h-8 w-8 text-emerald-700"
              aria-hidden="true"
            />
          </div>
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">
            Application submitted
          </h2>
          <p className="text-sm text-emerald-900/90 mb-6 max-w-md mx-auto">
            Thank you. A confirmation email is on its way. Save your reference
            number below — you&apos;ll need it to check your application status.
          </p>

          <div className="inline-flex flex-col items-center gap-1 px-6 py-4 bg-white border-2 border-emerald-200 rounded-2xl mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Reference Number
            </span>
            <span className="text-lg sm:text-xl font-mono font-bold text-primary-dark break-all">
              {submitState.reference}
            </span>
          </div>

          <div>
            <Link
              href={trackHref}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
            >
              Track this application
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const consentLabel = data.consent?.agreed
    ? `Yes — agreed ${formatTimestamp(data.consent.agreed_at)}`
    : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-primary-dark mb-1">
            Review &amp; Submit
          </h2>
          <p className="text-sm text-text-muted">
            Please review every field before submitting. You won&apos;t be able to
            edit your application after submission.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary/5 border-2 border-primary/20 rounded-xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Reference
          </span>
          <span className="text-sm font-mono font-bold text-primary-dark">
            {application.id}
          </span>
        </div>
      </div>

      <Section title="Personal Details">
        <DefList
          rows={[
            ['Email', application.email],
            ['Full name', orDash(data.full_name)],
            ['Date of birth', orDash(data.date_of_birth)],
            ['Gender', data.gender ? GENDER_LABELS[data.gender] : '—'],
            ['NIA number', orDash(data.nia_number)],
            ['Phone', orDash(data.phone)],
            ['Postal address', orDash(data.postal_address)],
            ['Region', orDash(data.region)],
            ['Data-protection consent', consentLabel],
          ]}
        />
      </Section>

      <Section title="Eligibility">
        <DefList
          rows={[
            [
              'Holds a first degree',
              data.holds_first_degree === true ? 'Yes' : 'No',
            ],
            [
              'Has a professional qualification',
              hasProfessionalQualification ? 'Yes' : 'No',
            ],
            ['Person with Disability (PWD)', isPwd ? 'Yes' : 'No'],
          ]}
        />
      </Section>

      <Section title="Education & Experience">
        <DefList
          rows={[
            [
              'Highest qualification',
              data.highest_qualification
                ? QUALIFICATION_LABELS[data.highest_qualification]
                : '—',
            ],
            ['Field of study', orDash(data.field_of_study)],
            ['Institution', orDash(data.institution)],
            [
              'Graduation year',
              data.graduation_year !== undefined
                ? String(data.graduation_year)
                : '—',
            ],
            [
              'Class of degree',
              data.class_of_degree ? CLASS_LABELS[data.class_of_degree] : '—',
            ],
            [
              'Years of experience',
              data.years_experience !== undefined
                ? String(data.years_experience)
                : '—',
            ],
            ['Current employment', orDash(data.current_employment)],
            ['Work history', orDash(data.work_history)],
          ]}
        />
      </Section>

      {/* Declaration */}
      <div className="bg-amber-50/40 border-2 border-amber-200/60 rounded-xl p-4">
        <label
          htmlFor="declaration"
          className="flex items-start gap-3 cursor-pointer text-sm text-primary-dark"
        >
          <input
            id="declaration"
            type="checkbox"
            checked={declared}
            onChange={handleDeclarationChange}
            disabled={submitState.kind === 'submitting'}
            className="mt-0.5 h-4 w-4 text-primary border-border/60 rounded focus:ring-primary/30"
          />
          <span>
            I declare that all information and documents provided are true and
            accurate. I understand that providing false information may result in
            disqualification or prosecution under the Civil Service Act.
          </span>
        </label>
      </div>

      {/* Error card — shows after a failed submit */}
      {submitState.kind === 'error' && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 sm:p-5">
          <div className="flex items-start gap-3 mb-2">
            <AlertCircle
              className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-red-800 mb-1">
                Submission failed
              </h3>
              {submitState.missing && submitState.missing.length > 0 ? (
                <>
                  <p className="text-sm text-red-800/90 mb-2">
                    The following required document
                    {submitState.missing.length === 1 ? ' is' : 's are'} missing:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-800/90 mb-3 space-y-0.5">
                    {submitState.missing.map((id) => (
                      <li key={id} className="font-mono text-xs">
                        {id}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-red-800/90 inline-flex items-center gap-1.5">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Go back to Step 4 to upload them.
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-800/90 break-words">
                  {submitState.message}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmitState({ kind: 'idle' })}
            className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-800 border-2 border-red-300 bg-white rounded-lg hover:bg-red-100 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Submit */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-colors',
            canSubmit
              ? 'bg-primary text-white hover:bg-primary-light'
              : 'bg-gray-200 text-text-muted cursor-not-allowed opacity-70',
          )}
        >
          {submitState.kind === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit Application
            </>
          )}
        </button>
        {!declared && submitState.kind !== 'submitting' && (
          <p className="mt-2 text-xs text-text-muted">
            Tick the declaration above to enable Submit.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── helpers ───────────────────────────────────────────────────── */

/**
 * The submit endpoint returns 400 with body `{"error":"required documents
 * missing","missing":["doc_type_a","doc_type_b"]}`. The api client wraps that
 * in `Error("API 400: <body>")` — try to recover the missing array. Returns
 * undefined if we can't.
 */
function parseMissingDocs(message: string): string[] | undefined {
  if (!message.includes('missing')) return undefined;
  // Find the first JSON object in the message
  const firstBrace = message.indexOf('{');
  const lastBrace = message.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return undefined;
  }
  const slice = message.slice(firstBrace, lastBrace + 1);
  try {
    const parsed: unknown = JSON.parse(slice);
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const obj = parsed as { missing?: unknown };
    if (!Array.isArray(obj.missing)) return undefined;
    const arr = obj.missing.filter((v): v is string => typeof v === 'string');
    return arr.length > 0 ? arr : undefined;
  } catch {
    return undefined;
  }
}

function orDash(value: string | undefined | null): string {
  if (value === undefined || value === null) return '—';
  const trimmed = value.trim();
  return trimmed.length === 0 ? '—' : trimmed;
}

function formatTimestamp(ms: number): string {
  try {
    return new Intl.DateTimeFormat('en-GH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString();
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-2 border-border/40 rounded-xl overflow-hidden">
      <header className="bg-gray-50 px-4 py-2.5 border-b-2 border-border/40">
        <h3 className="text-sm font-bold text-primary-dark uppercase tracking-wider">
          {title}
        </h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DefList({ rows }: { rows: ReadonlyArray<readonly [string, string]> }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2.5">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted sm:col-span-1">
            {label}
          </dt>
          <dd className="text-sm text-primary-dark sm:col-span-2 break-words whitespace-pre-wrap">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
