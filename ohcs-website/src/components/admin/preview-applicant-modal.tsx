'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, FileText, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentType, ConditionalTrigger } from '@/types/recruitment';
import type { RequirementInput } from '@/lib/recruitment-api';

export interface PreviewApplicantModalProps {
  open: boolean;
  onClose: () => void;
  documentTypes: DocumentType[];
  requirements: RequirementInput[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function reasonText(trigger: ConditionalTrigger): string {
  return trigger === 'is_pwd'
    ? 'you are a Person with Disability'
    : 'you hold a professional qualification';
}

/**
 * Friendly short labels for common MIME types. Falls back to the raw MIME.
 * Used for the "PDF, JPG, PNG" line under each drop zone.
 */
function shortMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m === 'application/pdf') return 'PDF';
  if (m === 'image/jpeg' || m === 'image/jpg') return 'JPG';
  if (m === 'image/png') return 'PNG';
  if (m === 'image/webp') return 'WEBP';
  if (m === 'image/heic') return 'HEIC';
  if (m === 'application/msword') return 'DOC';
  if (m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
  // Fallback: take the part after "/" uppercased (e.g. "image/avif" -> "AVIF")
  const slash = m.indexOf('/');
  return slash >= 0 ? m.slice(slash + 1).toUpperCase() : m.toUpperCase();
}

function formatMimes(mimes: string[]): string {
  if (mimes.length === 0) return 'Any file type';
  // De-dupe while preserving order.
  const seen = new Set<string>();
  const friendly: string[] = [];
  for (const m of mimes) {
    const s = shortMime(m);
    if (!seen.has(s)) {
      seen.add(s);
      friendly.push(s);
    }
  }
  return friendly.join(', ');
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PreviewApplicantModal({
  open,
  onClose,
  documentTypes,
  requirements,
}: PreviewApplicantModalProps) {
  const [hasProQual, setHasProQual] = useState(false);
  const [isPwd, setIsPwd] = useState(false);

  /* Toggles default to false because the parent passes a fresh `key`
     when opening the modal — React fully remounts and state resets
     deterministically without a setState-in-effect anti-pattern. */

  /* ESC to close — only attach the listener while open. */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* Fast lookup table. */
  const docTypeById = useMemo(() => {
    const m = new Map<string, DocumentType>();
    for (const dt of documentTypes) m.set(dt.id, dt);
    return m;
  }, [documentTypes]);

  /* Apply the simulation toggles + sort by display_order. */
  const visible = useMemo(() => {
    const filtered = requirements.filter((r) => {
      if (r.conditional_on === null) return true;
      if (r.conditional_on === 'has_professional_qualification') return hasProQual;
      if (r.conditional_on === 'is_pwd') return isPwd;
      return false;
    });
    return [...filtered].sort((a, b) => a.display_order - b.display_order);
  }, [requirements, hasProQual, isPwd]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Preview as applicant"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 lg:px-8 pt-6 pb-4 border-b-2 border-border/40 sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <h3 className="text-lg lg:text-xl font-bold text-primary-dark">
              Preview: How Applicants See This
            </h3>
            <p className="text-sm text-text-muted mt-0.5">
              This is exactly what candidates will see in Step 4 of the application form.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 lg:px-8 py-6 space-y-6">
          {/* Simulation toggles */}
          <div className="bg-primary/5 border-2 border-primary/15 rounded-2xl p-4 lg:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark mb-3">
              Simulate Applicant Profile
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-start gap-2.5 flex-1 cursor-pointer p-2.5 rounded-xl hover:bg-white/60 transition-colors">
                <input
                  type="checkbox"
                  checked={hasProQual}
                  onChange={(e) => setHasProQual(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-2 border-border/60 text-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-primary-dark leading-tight">
                  I hold a professional qualification
                </span>
              </label>
              <label className="flex items-start gap-2.5 flex-1 cursor-pointer p-2.5 rounded-xl hover:bg-white/60 transition-colors">
                <input
                  type="checkbox"
                  checked={isPwd}
                  onChange={(e) => setIsPwd(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-2 border-border/60 text-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-primary-dark leading-tight">
                  I am a Person with Disability (PWD)
                </span>
              </label>
            </div>
          </div>

          {/* Step header + fake progress bar */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h4 className="text-base lg:text-lg font-bold text-primary-dark">
                Step 4 of 5: Upload Required Documents
              </h4>
              <span className="text-xs font-semibold text-text-muted">60%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: '60%' }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Drop zones */}
          {visible.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-border/40 rounded-2xl p-8 text-center">
              <p className="text-sm text-text-muted">
                No documents would be required for this configuration.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map((r, i) => {
                const dt = docTypeById.get(r.document_type_id);
                const label = dt?.label ?? r.document_type_id;
                const accepted = dt ? formatMimes(dt.accepted_mimes) : 'Any file type';
                const resolvedMb =
                  r.max_mb_override ?? dt?.default_max_mb ?? null;
                const sizeText = resolvedMb !== null ? `Max ${resolvedMb} MB` : 'Max —';
                const conditional = r.conditional_on;
                return (
                  <div
                    key={`${r.document_type_id}-${i}`}
                    className="bg-white border-2 border-dashed border-border/40 rounded-2xl p-5 lg:p-6 hover:border-primary/40 transition-colors"
                  >
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2 min-w-0">
                        {r.is_required ? (
                          <CheckCircle
                            className="h-4 w-4 text-primary flex-shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <FileText
                            className="h-4 w-4 text-text-muted flex-shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <h5 className="text-sm lg:text-base font-bold text-primary-dark truncate">
                          {label}
                        </h5>
                      </div>
                      <span
                        className={cn(
                          'flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold',
                          r.is_required
                            ? 'bg-primary/10 text-primary-dark'
                            : 'bg-gray-100 text-text-muted',
                        )}
                      >
                        {r.is_required ? 'Required' : 'Optional'}
                      </span>
                    </div>

                    {/* Drop zone visual */}
                    <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 bg-gray-50/60 rounded-xl">
                      <FileText
                        className="h-8 w-8 text-text-muted/70"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-text-muted text-center">
                        Drag and drop, or{' '}
                        <span
                          title="Preview only — uploads are disabled here"
                          className="inline-flex items-center px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold cursor-not-allowed select-none"
                        >
                          Browse Files
                        </span>
                      </p>
                      <p className="text-xs text-text-muted">
                        {accepted} &middot; {sizeText}
                      </p>
                    </div>

                    {/* Conditional explanation */}
                    {conditional !== null && (
                      <p className="mt-3 text-xs text-text-muted italic">
                        Required because you indicated {reasonText(conditional)}.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom hint */}
          <div className="flex items-start gap-2 text-xs text-text-muted pt-2">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Toggle the simulation switches above to preview how conditional documents appear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
