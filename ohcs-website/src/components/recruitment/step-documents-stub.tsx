'use client';

import { AlertTriangle } from 'lucide-react';

export function StepDocumentsStub() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary-dark mb-1">Documents</h2>
        <p className="text-sm text-text-muted">
          This step will let you upload supporting documents like your transcript,
          NIA card, and professional certificates.
        </p>
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle
              className="h-6 w-6 text-amber-700"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-amber-900 mb-2">
              Document uploads coming in Phase 3
            </h3>
            <p className="text-sm text-amber-900/90 leading-relaxed">
              Document upload support will be available in the next release. For
              now, you can navigate to Step 5 to review what you&apos;ve entered.
              The Submit button will unlock once Step 4 is functional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
