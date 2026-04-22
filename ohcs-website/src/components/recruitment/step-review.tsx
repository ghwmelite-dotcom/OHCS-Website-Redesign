'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Application, ApplicationFormData } from '@/types/recruitment';

const SUBMIT_DISABLED_TOOLTIP =
  'Document uploads coming in Phase 3 — submission unlocks then.';

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

interface StepReviewProps {
  application: Application;
  data: Partial<ApplicationFormData>;
  hasProfessionalQualification: boolean;
  isPwd: boolean;
}

export function StepReview({
  application,
  data,
  hasProfessionalQualification,
  isPwd,
}: StepReviewProps) {
  const [declared, setDeclared] = useState(false);

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
            onChange={(e) => setDeclared(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-primary border-border/60 rounded focus:ring-primary/30"
          />
          <span>
            I declare that all information and documents provided are true and
            accurate. I understand that providing false information may result in
            disqualification or prosecution under the Civil Service Act.
          </span>
        </label>
      </div>

      {/* Disabled Submit (Phase 2 stub) */}
      <div className="pt-2">
        <button
          type="button"
          disabled
          title={SUBMIT_DISABLED_TOOLTIP}
          aria-label={`Submit Application — ${SUBMIT_DISABLED_TOOLTIP}`}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl',
            'bg-gray-200 text-text-muted cursor-not-allowed opacity-70',
          )}
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Submit Application
        </button>
        <p className="mt-2 text-xs text-text-muted">{SUBMIT_DISABLED_TOOLTIP}</p>
      </div>
    </div>
  );
}

/* ─── helpers ───────────────────────────────────────────────────── */

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
