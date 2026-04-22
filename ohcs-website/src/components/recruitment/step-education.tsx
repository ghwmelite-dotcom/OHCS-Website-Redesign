'use client';

import type { ApplicationFormData } from '@/types/recruitment';

type Qualification = NonNullable<ApplicationFormData['highest_qualification']>;
type ClassOfDegree = NonNullable<ApplicationFormData['class_of_degree']>;

const QUALIFICATIONS: ReadonlyArray<{ value: Qualification; label: string }> = [
  { value: 'first_degree', label: 'First degree' },
  { value: 'pg_diploma', label: 'Postgraduate diploma' },
  { value: 'masters', label: 'Masters' },
  { value: 'phd', label: 'PhD' },
];

const CLASSES: ReadonlyArray<{ value: ClassOfDegree; label: string }> = [
  { value: 'first', label: 'First class' },
  { value: 'second_upper', label: 'Second class upper' },
  { value: 'second_lower', label: 'Second class lower' },
  { value: 'third', label: 'Third class' },
  { value: 'pass', label: 'Pass' },
];

const WORK_HISTORY_MAX = 2000;

interface StepEducationProps {
  data: Partial<ApplicationFormData>;
  onChange: (patch: Partial<ApplicationFormData>) => void;
}

export function StepEducation({ data, onChange }: StepEducationProps) {
  const currentYear = new Date().getFullYear();
  const minYear = 1950;
  const maxYear = currentYear + 5;
  const workHistoryLen = (data.work_history ?? '').length;

  function handleNumberChange(
    raw: string,
    key: 'graduation_year' | 'years_experience',
  ) {
    if (raw === '') {
      onChange({ [key]: undefined } as Partial<ApplicationFormData>);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange({ [key]: n } as Partial<ApplicationFormData>);
  }

  function handleQualificationChange(raw: string) {
    if (raw === '') {
      onChange({ highest_qualification: undefined });
      return;
    }
    const valid = QUALIFICATIONS.some((q) => q.value === raw);
    if (!valid) return;
    onChange({ highest_qualification: raw as Qualification });
  }

  function handleClassChange(raw: string) {
    if (raw === '') {
      onChange({ class_of_degree: undefined });
      return;
    }
    const valid = CLASSES.some((c) => c.value === raw);
    if (!valid) return;
    onChange({ class_of_degree: raw as ClassOfDegree });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark mb-1">
          Education &amp; Experience
        </h2>
        <p className="text-sm text-text-muted">
          Tell us about your highest qualification and work history. Document
          uploads (transcripts, certificates) come in Step 4.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Highest qualification" htmlFor="highest_qualification">
          <select
            id="highest_qualification"
            value={data.highest_qualification ?? ''}
            onChange={(e) => handleQualificationChange(e.target.value)}
            className={inputCls}
          >
            <option value="">Select…</option>
            {QUALIFICATIONS.map((q) => (
              <option key={q.value} value={q.value}>
                {q.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Class of degree" htmlFor="class_of_degree">
          <select
            id="class_of_degree"
            value={data.class_of_degree ?? ''}
            onChange={(e) => handleClassChange(e.target.value)}
            className={inputCls}
          >
            <option value="">Select…</option>
            {CLASSES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Field of study" htmlFor="field_of_study">
        <input
          id="field_of_study"
          type="text"
          value={data.field_of_study ?? ''}
          onChange={(e) => onChange({ field_of_study: e.target.value })}
          placeholder="e.g. Public Administration, Economics"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Institution" htmlFor="institution">
          <input
            id="institution"
            type="text"
            value={data.institution ?? ''}
            onChange={(e) => onChange({ institution: e.target.value })}
            placeholder="e.g. University of Ghana, Legon"
            className={inputCls}
          />
        </Field>

        <Field label="Graduation year" htmlFor="graduation_year">
          <input
            id="graduation_year"
            type="number"
            min={minYear}
            max={maxYear}
            value={data.graduation_year ?? ''}
            onChange={(e) => handleNumberChange(e.target.value, 'graduation_year')}
            placeholder={String(currentYear)}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Years of experience" htmlFor="years_experience">
          <input
            id="years_experience"
            type="number"
            min={0}
            max={60}
            value={data.years_experience ?? ''}
            onChange={(e) => handleNumberChange(e.target.value, 'years_experience')}
            placeholder="0"
            className={inputCls}
          />
        </Field>

        <Field label="Current employment" htmlFor="current_employment">
          <input
            id="current_employment"
            type="text"
            value={data.current_employment ?? ''}
            onChange={(e) => onChange({ current_employment: e.target.value })}
            placeholder="e.g. Assistant Director, Ministry of Finance"
            className={inputCls}
          />
        </Field>
      </div>

      <Field
        label="Work history"
        htmlFor="work_history"
        hint={`${workHistoryLen}/${WORK_HISTORY_MAX} characters`}
      >
        <textarea
          id="work_history"
          value={data.work_history ?? ''}
          onChange={(e) => {
            const v = e.target.value.slice(0, WORK_HISTORY_MAX);
            onChange({ work_history: v });
          }}
          rows={6}
          maxLength={WORK_HISTORY_MAX}
          placeholder="Briefly outline your roles, responsibilities, and key achievements (most recent first)."
          className={`${inputCls} resize-y`}
        />
      </Field>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-primary-dark mb-1.5"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
