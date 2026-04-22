'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHero } from '@/components/layout/page-hero';
import { Button } from '@/components/ui/button';
import { trackFormSchema, type TrackFormData } from '@/lib/validations';
import { trackSubmission } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

type TrackingResult = {
  referenceNumber: string;
  type: string;
  status: string;
  subject: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: Array<{ id: string; status: string; note: string | null; created_at: string }>;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'in-review': 'bg-blue-100 text-blue-800 border-blue-200',
  'in-progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = statusColors[status] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border capitalize',
        colorClass,
      )}
    >
      {status.replace(/-/g, ' ')}
    </span>
  );
}

export default function TrackPage() {
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrackFormData>({
    resolver: zodResolver(trackFormSchema),
  });

  const onSubmit = async (data: TrackFormData) => {
    setTrackError(null);
    setResult(null);
    try {
      // Recruitment application references look like OHCS-YYYY-NNNNN
      // and live in a different table. Branch the lookup accordingly.
      if (/^OHCS-\d{4}-\d+$/i.test(data.referenceNumber.trim())) {
        const { trackApplication } = await import('@/lib/applicant-api');
        const r = await trackApplication(data.referenceNumber.trim(), data.contact);
        setResult({
          referenceNumber: r.reference_number,
          type: 'recruitment',
          status: r.status,
          subject: `Recruitment exercise ${r.exercise_id}`,
          createdAt: new Date(r.created_at).toISOString(),
          updatedAt: new Date(r.submitted_at ?? r.created_at).toISOString(),
          timeline: r.submitted_at
            ? [
                {
                  id: 'created',
                  status: 'received',
                  note: 'Application created',
                  created_at: new Date(r.created_at).toISOString(),
                },
                {
                  id: 'submitted',
                  status: r.status,
                  note: 'Application submitted',
                  created_at: new Date(r.submitted_at).toISOString(),
                },
              ]
            : [
                {
                  id: 'created',
                  status: 'draft',
                  note: 'Application not yet submitted',
                  created_at: new Date(r.created_at).toISOString(),
                },
              ],
        });
        return;
      }
      const response = await trackSubmission(data.referenceNumber, data.contact);
      setResult(response.data);
    } catch (err) {
      setTrackError(
        err instanceof Error ? err.message : 'Unable to find your submission. Please check your details.',
      );
    }
  };

  return (
    <>
      <PageHero
        title="Track Your Submission"
        subtitle="Enter your reference number and the email or phone number you used when submitting to check the current status."
        breadcrumbs={[{ label: 'Track Submission' }]}
        accent="gold"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-10">
            {trackError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm">
                {trackError}
              </div>
            )}

            <div>
              <label
                htmlFor="referenceNumber"
                className="block text-sm font-semibold text-primary-dark mb-2"
              >
                Reference Number <span className="text-red-500">*</span>
              </label>
              <input
                id="referenceNumber"
                type="text"
                placeholder="OHCS-2026-00001 or OHCS-CMP-20260418-A7F3"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border-2 bg-white text-base transition-colors font-mono',
                  errors.referenceNumber
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-border/60 focus:border-primary',
                  'focus:outline-none',
                )}
                {...register('referenceNumber')}
              />
              {errors.referenceNumber && (
                <p className="mt-1.5 text-sm text-red-500">{errors.referenceNumber.message}</p>
              )}
              <p className="mt-1 text-xs text-text-muted">
                Recruitment applications: <span className="font-mono">OHCS-YYYY-NNNNN</span>
                {' · '}
                Complaints / RTI: <span className="font-mono">OHCS-XXX-YYYYMMDD-XXXX</span>
              </p>
            </div>

            <div>
              <label
                htmlFor="contact"
                className="block text-sm font-semibold text-primary-dark mb-2"
              >
                Email or Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="contact"
                type="text"
                placeholder="you@example.com or +233 XX XXX XXXX"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border-2 bg-white text-base transition-colors',
                  errors.contact
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-border/60 focus:border-primary',
                  'focus:outline-none',
                )}
                {...register('contact')}
              />
              {errors.contact && (
                <p className="mt-1.5 text-sm text-red-500">{errors.contact.message}</p>
              )}
            </div>

            <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
              Track Submission
            </Button>
          </form>

          {result && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-primary-dark">
                    Submission Details
                  </h2>
                  <StatusBadge status={result.status} />
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-text-muted font-medium">Reference</dt>
                    <dd className="font-mono font-semibold text-primary-dark">
                      {result.referenceNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted font-medium">Type</dt>
                    <dd className="capitalize text-primary-dark">{result.type}</dd>
                  </div>
                  {result.subject && (
                    <div className="sm:col-span-2">
                      <dt className="text-text-muted font-medium">Subject</dt>
                      <dd className="text-primary-dark">{result.subject}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-text-muted font-medium">Submitted</dt>
                    <dd className="text-primary-dark">{formatDate(result.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted font-medium">Last Updated</dt>
                    <dd className="text-primary-dark">{formatDate(result.updatedAt)}</dd>
                  </div>
                </dl>
              </div>

              {result.timeline.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-border/40 p-6">
                  <h2 className="font-display text-xl font-bold text-primary-dark mb-6">
                    Timeline
                  </h2>
                  <ol className="relative border-l-2 border-primary/20 ml-3 space-y-6">
                    {result.timeline.map((entry) => (
                      <li key={entry.id} className="ml-6">
                        <div className="absolute -left-[9px] w-4 h-4 rounded-full bg-primary border-2 border-white" />
                        <div className="flex items-center gap-3 mb-1">
                          <StatusBadge status={entry.status} />
                          <time className="text-xs text-text-muted">
                            {formatDate(entry.created_at)}
                          </time>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-text-muted mt-1">{entry.note}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
