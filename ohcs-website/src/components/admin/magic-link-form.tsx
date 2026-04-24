'use client';

import { useState } from 'react';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';

export function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many sign-in requests. Please wait 15 minutes and try again.');
        } else {
          setError('Could not send sign-in link. Please try again or contact IT.');
        }
        return;
      }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-lg font-bold text-primary-dark mb-2">Check your inbox</h3>
        <p className="text-sm text-text-muted">
          If <strong>{email}</strong> is registered as an OHCS admin, a sign-in link has been sent.
          The link expires in 15 minutes and can be used once.
        </p>
        <p className="text-xs text-text-muted mt-4">
          Didn&rsquo;t receive it? Check spam, or{' '}
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            className="underline font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label htmlFor="admin-email" className="block text-sm font-semibold text-primary-dark">
        OHCS admin email
      </label>
      <div className="relative">
        <Mail
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
          aria-hidden="true"
        />
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@ohcs.gov.gh"
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-border/60 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !email}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Mail className="h-4 w-4" aria-hidden="true" />
        )}
        {submitting ? 'Sending link…' : 'Send sign-in link'}
      </button>
      <p className="text-xs text-text-muted text-center">
        We&rsquo;ll email you a one-time link valid for 15 minutes. No password needed.
      </p>
    </form>
  );
}
