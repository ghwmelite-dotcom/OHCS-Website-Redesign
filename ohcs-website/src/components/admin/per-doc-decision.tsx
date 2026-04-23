'use client';

import { AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocDecision, RequirementWithUpload } from '@/types/recruitment';
import { AiBadge } from './ai-badge';

export interface PerDocDecisionProps {
  requirement: RequirementWithUpload;
  decision: DocDecision | undefined;
  reason: string;
  onChange: (decision: DocDecision, reason: string) => void;
  onSelectDoc: (docId: string) => void;
  isActive?: boolean;
}

interface DecisionOption {
  key: DocDecision;
  label: string;
  icon: typeof CheckCircle;
  active: string;
  inactive: string;
}

const DECISION_OPTIONS: DecisionOption[] = [
  {
    key: 'accepted',
    label: 'Accept',
    icon: CheckCircle,
    active: 'bg-green-600 text-white border-green-600 shadow-sm',
    inactive: 'bg-white text-green-700 border-green-200 hover:bg-green-50',
  },
  {
    key: 'rejected',
    label: 'Reject',
    icon: XCircle,
    active: 'bg-red-600 text-white border-red-600 shadow-sm',
    inactive: 'bg-white text-red-700 border-red-200 hover:bg-red-50',
  },
  {
    key: 'needs_better_scan',
    label: 'Needs Better Scan',
    icon: RefreshCw,
    active: 'bg-amber-600 text-white border-amber-600 shadow-sm',
    inactive: 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50',
  },
];

export function PerDocDecision({
  requirement,
  decision,
  reason,
  onChange,
  onSelectDoc,
  isActive = false,
}: PerDocDecisionProps) {
  const notUploaded = requirement.upload === null;
  const requiredButMissing = notUploaded && requirement.is_required;
  const reasonRequired = decision !== undefined && decision !== 'accepted';
  const reasonError = reasonRequired && reason.trim().length === 0;

  function handleHeaderActivate() {
    if (requirement.upload) {
      onSelectDoc(requirement.document_type_id);
    }
  }

  return (
    <article
      className={cn(
        'bg-white rounded-2xl border-2 p-4 transition-all',
        isActive
          ? 'border-primary shadow-md ring-2 ring-primary/10'
          : 'border-border/40 hover:border-primary/40',
      )}
    >
      {/* Header: clickable to swap viewer */}
      <button
        type="button"
        onClick={handleHeaderActivate}
        disabled={notUploaded}
        className={cn(
          'w-full flex items-start justify-between gap-3 text-left rounded-xl -m-1 p-1 transition-colors',
          requirement.upload
            ? 'cursor-pointer hover:bg-primary/5'
            : 'cursor-default',
        )}
        aria-label={
          requirement.upload
            ? `Open ${requirement.label} in viewer`
            : `${requirement.label} (not uploaded)`
        }
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-primary-dark truncate">
              {requirement.label}
            </h3>
            {requirement.is_required ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                Required
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-text-muted">
                Optional
              </span>
            )}
            {requirement.upload && (
              <AiBadge
                verdict={requirement.upload.ai_verdict}
                confidence={null}
                reason={requirement.upload.ai_reason}
              />
            )}
          </div>
          {requirement.upload ? (
            <p className="text-xs text-text-muted truncate">
              {requirement.upload.original_filename}
            </p>
          ) : (
            <p className="text-xs text-text-muted">No file uploaded</p>
          )}
        </div>

        {requiredButMissing && (
          <span className="inline-flex flex-shrink-0 items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Not Uploaded
          </span>
        )}
      </button>

      {/* Decision pills */}
      <div
        className="mt-3 grid grid-cols-3 gap-1.5"
        role="radiogroup"
        aria-label={`Decision for ${requirement.label}`}
      >
        {DECISION_OPTIONS.map((opt) => {
          const isSelected = decision === opt.key;
          // Force-disable Accept when required-but-missing
          const isDisabled =
            requiredButMissing && opt.key === 'accepted';
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isDisabled}
              onClick={() => onChange(opt.key, reason)}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border-2 text-xs font-semibold transition-all',
                isSelected ? opt.active : opt.inactive,
                isDisabled && 'opacity-40 cursor-not-allowed hover:bg-white',
              )}
            >
              <opt.icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reason textarea */}
      {reasonRequired && (
        <div className="mt-3">
          <label
            htmlFor={`reason-${requirement.document_type_id}`}
            className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1"
          >
            Reason <span className="text-red-600">*</span>
          </label>
          <textarea
            id={`reason-${requirement.document_type_id}`}
            value={reason}
            onChange={(e) => {
              if (decision !== undefined) onChange(decision, e.target.value);
            }}
            rows={2}
            placeholder={
              decision === 'rejected'
                ? 'Explain why this document is being rejected…'
                : 'Explain what the applicant should re-scan or re-upload…'
            }
            aria-invalid={reasonError}
            className={cn(
              'w-full px-3 py-2 rounded-xl border-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none',
              reasonError
                ? 'border-red-300 focus:border-red-500'
                : 'border-border/60 focus:border-primary',
            )}
          />
          {reasonError && (
            <p className="text-xs text-red-700 mt-1">
              A reason is required for this decision.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
