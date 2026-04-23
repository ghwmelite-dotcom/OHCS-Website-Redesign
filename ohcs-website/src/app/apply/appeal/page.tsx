'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { getDraft, submitAppeal } from '@/lib/applicant-api';

function AppealInner() {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    getDraft()
      .then((d) => setReferenceNumber(d.id))
      .catch(() => router.replace('/services/recruitment/'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitAppeal(reason);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary-dark mb-2">Appeal received</h1>
        <p className="text-text-muted">
          Your appeal on application <span className="font-mono">{referenceNumber}</span> has been
          submitted. We&apos;ll email you when a decision is made (typically within 14 days).
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold text-primary-dark mb-2">Submit an appeal</h1>
      <p className="text-text-muted text-sm mb-6">
        Application <span className="font-mono">{referenceNumber}</span>. Explain why you believe the
        original decision should be reconsidered. Be specific — generic appeals tend to be
        unsuccessful.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={8}
          required
          minLength={20}
          maxLength={4000}
          placeholder="Explain your case in detail (minimum 20 characters)…"
          className="w-full px-4 py-3 rounded-xl border-2 border-border/60 text-sm focus:border-primary focus:outline-none"
        />
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || reason.trim().length < 20}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            'Submit appeal'
          )}
        </button>
      </form>
    </div>
  );
}

export default function AppealPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <AppealInner />
    </Suspense>
  );
}
