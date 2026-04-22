'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { getDraft } from '@/lib/applicant-api';
import type { Application } from '@/types/recruitment';
import { WizardShell } from '@/components/recruitment/wizard-shell';

/* ------------------------------------------------------------------ */
/*  Default export — Suspense-wrapped shell                            */
/*  useSearchParams() MUST be inside <Suspense> for output: "export". */
/* ------------------------------------------------------------------ */
export default function ApplyFormPage() {
  return (
    <Suspense fallback={<WizardLoadingFallback />}>
      <WizardInner />
    </Suspense>
  );
}

function WizardLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b-2 border-border/40 px-6 py-4">
        <h1 className="text-base font-semibold text-primary-dark">
          Loading your application…
        </h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <Loader2
          className="h-8 w-8 text-primary animate-spin"
          aria-label="Loading application"
        />
      </div>
    </div>
  );
}

function clampStep(raw: string | null): number {
  const n = Number.parseInt(raw ?? '1', 10);
  if (!Number.isFinite(n)) return 1;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}

function isUnauthorized(err: unknown): boolean {
  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status;
    return status === 401;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Inner — owns data fetching + step state                            */
/* ------------------------------------------------------------------ */
function WizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = clampStep(searchParams.get('step'));

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const draft = await getDraft();
      setApplication(draft);
    } catch (err) {
      if (isUnauthorized(err)) {
        router.replace('/services/recruitment/');
        return;
      }
      setLoadError(err instanceof Error ? err.message : 'Failed to load application.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Async fetch + setState pattern; the rule still flags the fetch wrapper.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleStepChange = useCallback(
    (next: number) => {
      const clamped = Math.max(1, Math.min(5, next));
      router.push(`/apply/form/?step=${clamped}`);
    },
    [router],
  );

  if (loading) {
    return <WizardLoadingFallback />;
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border-2 border-red-200 p-6 max-w-md w-full">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle
              className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Could not load your application
              </p>
              <p className="text-sm text-red-700 mt-0.5 break-all">{loadError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!application) {
    return <WizardLoadingFallback />;
  }

  return (
    <WizardShell
      application={application}
      step={step}
      onStepChange={handleStepChange}
    />
  );
}
