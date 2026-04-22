'use client';

import { AlertCircle } from 'lucide-react';
import type { ApplicationFormData } from '@/types/recruitment';

interface StepEligibilityProps {
  data: Partial<ApplicationFormData>;
  hasProfessionalQualification: boolean;
  isPwd: boolean;
  onChange: (patch: Partial<ApplicationFormData>) => void;
  onFlagChange: (
    flag: 'has_professional_qualification' | 'is_pwd',
    value: boolean,
  ) => void;
  showRequiredWarning: boolean;
}

export function StepEligibility({
  data,
  hasProfessionalQualification,
  isPwd,
  onChange,
  onFlagChange,
  showRequiredWarning,
}: StepEligibilityProps) {
  const holdsFirstDegree = data.holds_first_degree === true;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark mb-1">Eligibility</h2>
        <p className="text-sm text-text-muted">
          Confirm a few quick eligibility criteria. We use these to tailor the
          documents you&apos;ll need to upload.
        </p>
      </div>

      {showRequiredWarning && !holdsFirstDegree && (
        <div className="flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <AlertCircle
            className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-red-800">
              A first degree is required to apply
            </p>
            <p className="text-sm text-red-700 mt-0.5">
              Please confirm you hold at least a first degree to continue, or log
              out and review the eligibility criteria.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <CheckboxCard
          id="holds_first_degree"
          checked={holdsFirstDegree}
          onChange={(v) => onChange({ holds_first_degree: v })}
          label="I hold at least a first degree"
          description="Required. Bachelor's degree from a recognised tertiary institution."
          required
          invalid={showRequiredWarning && !holdsFirstDegree}
        />

        <CheckboxCard
          id="has_professional_qualification"
          checked={hasProfessionalQualification}
          onChange={(v) => onFlagChange('has_professional_qualification', v)}
          label="I hold a professional qualification"
          description="e.g. ICAG, CIMA, Bar (Ghana School of Law), CIMG, or similar."
        />

        <CheckboxCard
          id="is_pwd"
          checked={isPwd}
          onChange={(v) => onFlagChange('is_pwd', v)}
          label="I am a Person with Disability (PWD)"
          description="Optional. Self-declaration unlocks PWD-specific support and may require additional verification."
        />
      </div>
    </div>
  );
}

interface CheckboxCardProps {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
  required?: boolean;
  invalid?: boolean;
}

function CheckboxCard({
  id,
  checked,
  onChange,
  label,
  description,
  required,
  invalid,
}: CheckboxCardProps) {
  return (
    <label
      htmlFor={id}
      className={[
        'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors',
        invalid
          ? 'border-red-300 bg-red-50/50'
          : checked
            ? 'border-primary bg-primary/5'
            : 'border-border/60 bg-white hover:border-primary/50',
      ].join(' ')}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 text-primary border-border/60 rounded focus:ring-primary/30"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-primary-dark">
          {label}
          {required && <span className="text-red-600 ml-0.5">*</span>}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
    </label>
  );
}
