'use client';

import { Mail } from 'lucide-react';
import type { Application, ApplicationFormData } from '@/types/recruitment';

/* Ghana's 16 official regions (post-2019 reorganisation).
 * Brong-Ahafo was formally split into Bono, Bono East, and Ahafo —
 * so it is intentionally NOT in this list. */
const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Western North',
  'Central',
  'Eastern',
  'Volta',
  'Oti',
  'Northern',
  'Savannah',
  'North East',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
] as const;

type Gender = NonNullable<ApplicationFormData['gender']>;

const GENDERS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const NIA_PATTERN = '^GHA-[0-9]{9}-[0-9]$';
const NIA_REGEX = /^GHA-\d{9}-\d$/;

/** True if the (non-empty) value looks like a valid Ghana Card number. */
function isNiaValid(value: string): boolean {
  return NIA_REGEX.test(value);
}

/**
 * Auto-formats raw input into GHA-XXXXXXXXX-X as the user types.
 * Strips everything except digits and the leading GHA prefix, then
 * re-inserts hyphens at the correct positions and caps at 15 chars.
 */
function formatNia(raw: string): string {
  // Strip everything except letters and digits, uppercase
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length === 0) return '';

  // Force the prefix to "GHA"
  let body = cleaned;
  if (body.startsWith('GHA')) body = body.slice(3);
  // If the user typed digits without the GHA prefix, treat the whole
  // string as the digit body
  body = body.replace(/[^0-9]/g, '');

  const digits = body.slice(0, 10); // 9 main + 1 check
  if (digits.length === 0) return 'GHA-';
  if (digits.length <= 9) return `GHA-${digits}`;
  return `GHA-${digits.slice(0, 9)}-${digits.slice(9, 10)}`;
}

interface StepPersonalProps {
  application: Application;
  data: Partial<ApplicationFormData>;
  onChange: (patch: Partial<ApplicationFormData>) => void;
}

export function StepPersonal({ application, data, onChange }: StepPersonalProps) {
  function handleConsentChange(checked: boolean) {
    if (checked) {
      onChange({ consent: { agreed: true, agreed_at: Date.now() } });
    } else {
      onChange({ consent: { agreed: false, agreed_at: Date.now() } });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark mb-1">Personal Details</h2>
        <p className="text-sm text-text-muted">
          Tell us who you are. Fields marked with an asterisk are required.
        </p>
      </div>

      {/* Read-only email */}
      <div className="bg-gray-50 rounded-xl border-2 border-border/40 p-4 flex items-center gap-3">
        <Mail className="h-5 w-5 text-text-muted flex-shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Email (verified)
          </p>
          <p className="text-sm font-semibold text-primary-dark truncate">
            {application.email}
          </p>
        </div>
      </div>

      {/* Full name */}
      <Field label="Full name" htmlFor="full_name" required>
        <input
          id="full_name"
          type="text"
          required
          value={data.full_name ?? ''}
          onChange={(e) => onChange({ full_name: e.target.value })}
          autoComplete="name"
          placeholder="As it appears on your Ghana Card"
          className={inputCls}
        />
      </Field>

      {/* DOB + Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Date of birth" htmlFor="date_of_birth" required>
          <input
            id="date_of_birth"
            type="date"
            required
            value={data.date_of_birth ?? ''}
            onChange={(e) => onChange({ date_of_birth: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field label="Gender" htmlFor="gender-male">
          <div
            role="radiogroup"
            aria-label="Gender"
            className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-1"
          >
            {GENDERS.map((g) => (
              <label
                key={g.value}
                htmlFor={`gender-${g.value}`}
                className="inline-flex items-center gap-2 text-sm text-primary-dark cursor-pointer"
              >
                <input
                  id={`gender-${g.value}`}
                  type="radio"
                  name="gender"
                  value={g.value}
                  checked={data.gender === g.value}
                  onChange={() => onChange({ gender: g.value })}
                  className="h-4 w-4 text-primary border-border/60 focus:ring-primary/30"
                />
                {g.label}
              </label>
            ))}
          </div>
        </Field>
      </div>

      {/* NIA + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field
          label="NIA / Ghana Card number"
          htmlFor="nia_number"
          hint="Format: GHA-XXXXXXXXX-X (15 characters total)"
          error={
            data.nia_number && data.nia_number.length > 0 && !isNiaValid(data.nia_number)
              ? 'Enter a valid Ghana Card number — GHA-, then 9 digits, a hyphen, and the check digit.'
              : null
          }
        >
          <input
            id="nia_number"
            type="text"
            value={data.nia_number ?? ''}
            onChange={(e) => onChange({ nia_number: formatNia(e.target.value) })}
            placeholder="GHA-123456789-0"
            pattern={NIA_PATTERN}
            inputMode="text"
            maxLength={15}
            aria-invalid={
              data.nia_number && data.nia_number.length > 0 && !isNiaValid(data.nia_number)
                ? true
                : undefined
            }
            className={
              data.nia_number && data.nia_number.length > 0 && !isNiaValid(data.nia_number)
                ? inputClsError
                : inputCls
            }
          />
        </Field>

        <Field label="Phone number" htmlFor="phone">
          <input
            id="phone"
            type="tel"
            value={data.phone ?? ''}
            onChange={(e) => onChange({ phone: e.target.value })}
            autoComplete="tel"
            placeholder="+233 XX XXX XXXX"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Postal address */}
      <Field label="Postal address" htmlFor="postal_address">
        <textarea
          id="postal_address"
          value={data.postal_address ?? ''}
          onChange={(e) => onChange({ postal_address: e.target.value })}
          rows={3}
          placeholder="P.O. Box / GhanaPost digital address"
          className={`${inputCls} resize-y`}
        />
      </Field>

      {/* Region */}
      <Field label="Region" htmlFor="region">
        <select
          id="region"
          value={data.region ?? ''}
          onChange={(e) => onChange({ region: e.target.value })}
          className={inputCls}
        >
          <option value="">Select a region…</option>
          {GHANA_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>

      {/* Consent */}
      <div className="bg-amber-50/40 border-2 border-amber-200/60 rounded-xl p-4">
        <label
          htmlFor="consent"
          className="flex items-start gap-3 cursor-pointer text-sm text-primary-dark"
        >
          <input
            id="consent"
            type="checkbox"
            checked={data.consent?.agreed === true}
            onChange={(e) => handleConsentChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 text-primary border-border/60 rounded focus:ring-primary/30"
          />
          <span>
            I consent to OHCS processing my personal data for recruitment evaluation
            under Ghana&apos;s Data Protection Act 2012 (Act 843).
          </span>
        </label>
      </div>
    </div>
  );
}

/* ─── shared classes / sub-components ───────────────────────────── */

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10';

const inputClsError =
  'w-full px-4 py-2.5 rounded-xl border-2 border-red-400 bg-white text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-primary-dark mb-1.5"
      >
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>
      )}
    </div>
  );
}
