'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getRequirements } from '@/lib/applicant-api';
import type { ApplicantRequirementsView } from '@/types/recruitment';
import { UploadSlot } from './upload-slot';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; view: ApplicantRequirementsView }
  | { kind: 'error'; message: string };

export function StepDocuments() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  const refresh = useCallback(async () => {
    try {
      const view = await getRequirements();
      setState({ kind: 'ready', view });
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'Could not load required documents.';
      setState({ kind: 'error', message });
    }
  }, []);

  // Initial load — preserve loading state on first mount only
  useEffect(() => {
    void refresh();
  }, [refresh]);

  /* ── Render ───────────────────────────────────────────────────── */
  if (state.kind === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2
          className="h-8 w-8 text-primary animate-spin"
          aria-hidden="true"
        />
        <p className="text-sm text-text-muted">Loading required documents…</p>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-primary-dark mb-1">
            Upload Required Documents
          </h2>
        </div>
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle
              className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-red-800 mb-1">
                Could not load documents
              </h3>
              <p className="text-sm text-red-800/90 break-words">{state.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setState({ kind: 'loading' });
              void refresh();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-800 border-2 border-red-300 bg-white rounded-xl hover:bg-red-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const visible = state.view.requirements
    .filter((r) => r.visible)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark mb-1">
          Upload Required Documents
        </h2>
        <p className="text-sm text-text-muted">
          Upload each required document below. Files are saved automatically — you
          can come back later to finish.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border-2 border-border/40 bg-gray-50 p-6 text-center">
          <p className="text-sm text-primary-dark font-semibold mb-1">
            No documents required for this exercise.
          </p>
          <p className="text-sm text-text-muted">Proceed to Step 5.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {visible.map((req) => (
            <UploadSlot
              key={req.document_type_id}
              requirement={req}
              onChange={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
