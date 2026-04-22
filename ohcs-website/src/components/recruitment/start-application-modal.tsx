'use client';

import { useEffect, useState } from 'react';
import { X, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { startApplication } from '@/lib/applicant-api';

export interface StartApplicationModalProps {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
}

export function StartApplicationModal({ open, onClose, exerciseId }: StartApplicationModalProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await startApplication({ email, exercise_id: exerciseId });
      setSent(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send link');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Start application"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-primary-dark">Start or Resume Application</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-gray-100 text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-semibold text-primary-dark mb-2">Check your email</h4>
            <p className="text-sm text-text-muted">
              We&apos;ve sent a magic link to{' '}
              <span className="font-semibold text-primary-dark">{sent}</span>. The link expires in
              30 minutes.
            </p>
            <p className="text-xs text-text-muted mt-4">
              Didn&apos;t arrive? Check your spam folder, or close this and try again.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-text-muted">
              Enter your email address. We&apos;ll send you a secure link to start a new
              application or resume one in progress.
            </p>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/40"
                aria-hidden="true"
              />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !email}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                'Send Magic Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
