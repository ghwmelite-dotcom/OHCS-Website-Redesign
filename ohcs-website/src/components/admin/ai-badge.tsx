'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { AiVerdict } from '@/types/recruitment';

export interface AiBadgeProps {
  verdict: AiVerdict;
  confidence: number | null;
  reason: string | null;
}

const VERDICT_STYLES: Record<
  AiVerdict,
  { pill: string; symbol: string; label: string }
> = {
  passed: {
    pill: 'bg-green-50 text-green-700 border-green-200',
    symbol: '✓',
    label: 'AI passed',
  },
  flagged: {
    pill: 'bg-amber-50 text-amber-800 border-amber-200',
    symbol: '⚠',
    label: 'AI flagged',
  },
  unchecked: {
    pill: 'bg-gray-50 text-text-muted border-border/40',
    symbol: '?',
    label: 'AI unchecked',
  },
};

export function AiBadge({ verdict, confidence, reason }: AiBadgeProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const style = VERDICT_STYLES[verdict];

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        wrapRef.current &&
        e.target instanceof Node &&
        !wrapRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const confidencePct =
    verdict !== 'unchecked' && confidence !== null
      ? `${Math.round(confidence * 100)}%`
      : null;

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={`${style.label}. Click for details.`}
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold transition-colors hover:opacity-90',
          style.pill,
        )}
      >
        <span aria-hidden="true">{style.symbol}</span>
        <span>AI</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="AI check details"
          className="absolute z-30 mt-2 left-0 w-72 bg-white rounded-xl border-2 border-border/40 shadow-xl p-4 text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              AI verdict
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold',
                style.pill,
              )}
            >
              <span aria-hidden="true">{style.symbol}</span>
              {verdict}
            </span>
          </div>

          <dl className="space-y-1.5 text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-text-muted">Model</dt>
              <dd className="font-medium text-primary-dark">Workers AI</dd>
            </div>
            {confidencePct && (
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-text-muted">Confidence</dt>
                <dd className="font-medium text-primary-dark">{confidencePct}</dd>
              </div>
            )}
          </dl>

          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Reason
            </p>
            <p className="text-sm text-primary-dark whitespace-pre-line break-words">
              {reason && reason.trim().length > 0
                ? reason
                : 'No additional information.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
