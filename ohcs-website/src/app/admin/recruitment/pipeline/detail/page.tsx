'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Loader2,
  LogOut,
  Mail,
  Send,
  User,
} from 'lucide-react';
import {
  getApplicationDetail,
  claimApplication,
  releaseApplication,
  submitVettingDecision,
  type DocDecisionInput,
} from '@/lib/recruitment-api';
import type {
  AdminApplicationDetail,
  DocDecision,
  RequirementWithUpload,
} from '@/types/recruitment';
import { cn } from '@/lib/utils';
import { audit } from '@/lib/audit-logger';
import { DocumentViewer } from '@/components/admin/document-viewer';
import { PerDocDecision } from '@/components/admin/per-doc-decision';

/* ------------------------------------------------------------------ */
/*  Page wrapper — Suspense boundary required for useSearchParams      */
/*  in Next 16 with output: "export"                                   */
/* ------------------------------------------------------------------ */
export default function ReviewerDetailPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <DetailInner />
    </Suspense>
  );
}

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2
        className="h-8 w-8 text-primary animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Working state types                                                */
/* ------------------------------------------------------------------ */
interface DecisionState {
  decision: DocDecision;
  reason: string;
}

type DecisionMap = Record<string, DecisionState>;

type ToastState = { type: 'success' | 'error'; message: string } | null;

/* ------------------------------------------------------------------ */
/*  Inner Component                                                    */
/* ------------------------------------------------------------------ */
function DetailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = (searchParams.get('id') ?? '').trim();

  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [decisions, setDecisions] = useState<DecisionMap>({});
  const [notes, setNotes] = useState('');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  /* ── Redirect when id missing ────────────────────────────────────── */
  useEffect(() => {
    if (!id) router.replace('/admin/recruitment/pipeline/');
  }, [id, router]);

  /* ── Toast auto-dismiss ──────────────────────────────────────────── */
  useEffect(() => {
    if (!toast) return;
    const ms = toast.type === 'error' ? 4000 : 2500;
    const t = setTimeout(() => setToast(null), ms);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Load application detail ─────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      let d = await getApplicationDetail(id);

      // Auto-claim if it's still in `submitted` — this transitions to
      // under_review so the vetting submit endpoint will accept the
      // decision later. Without this, clicking a row from the queue
      // (rather than using "Take next") would leave the app in
      // `submitted` and submit would 409.
      if (d.status === 'submitted') {
        try {
          await claimApplication(id);
          // Re-fetch after the claim so detail.status reflects under_review.
          d = await getApplicationDetail(id);
        } catch (err) {
          // 409 means someone else holds the claim — surface a toast but
          // still show the detail in read-only mode.
          setToast({
            type: 'error',
            message:
              err instanceof Error
                ? `This application is currently being reviewed by someone else. ${err.message}`
                : 'Claim failed.',
          });
        }
      }
      setDetail(d);

      // Pre-seed any existing decisions so the reviewer sees their prior work.
      const seed: DecisionMap = {};
      for (const dec of d.decisions) {
        seed[dec.document_type_id] = {
          decision: dec.decision,
          reason: dec.reason ?? '',
        };
      }
      setDecisions(seed);

      // Default the viewer to the first uploaded doc.
      const firstUploaded = d.requirements.find(
        (r) => r.upload !== null && r.visible,
      );
      if (firstUploaded) setActiveDocId(firstUploaded.document_type_id);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    void load();
  }, [load]);

  /* ── Visible requirements (apply conditional gating) ─────────────── */
  const visibleRequirements = useMemo<RequirementWithUpload[]>(() => {
    if (!detail) return [];
    return detail.requirements
      .filter((r) => r.visible)
      .sort((a, b) => a.display_order - b.display_order);
  }, [detail]);

  /* ── Submit-disabled rule ────────────────────────────────────────── */
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- early returns confuse the compiler; manual memoization preserves identity stability
  const submitGate = useMemo(() => {
    if (!detail) return { ok: false, reason: 'Loading…' };

    for (const r of visibleRequirements) {
      if (!r.is_required) continue;
      const d = decisions[r.document_type_id];
      if (!d) {
        return { ok: false, reason: `Decide on "${r.label}" first.` };
      }
      if (d.decision !== 'accepted' && d.reason.trim().length === 0) {
        return {
          ok: false,
          reason: `Add a reason for "${r.label}".`,
        };
      }
    }
    return { ok: true, reason: '' };
  }, [detail, visibleRequirements, decisions]);

  /* ── Mutators ────────────────────────────────────────────────────── */
  function changeDecision(docId: string, decision: DocDecision, reason: string) {
    setDecisions((prev) => ({
      ...prev,
      [docId]: { decision, reason },
    }));
  }

  /* ── Submit ──────────────────────────────────────────────────────── */
  async function handleSubmit() {
    if (!detail || !submitGate.ok || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const document_decisions: DocDecisionInput[] = visibleRequirements
      .filter((r) => decisions[r.document_type_id])
      .map((r) => {
        // Safe: filter above guarantees presence.
        const d = decisions[r.document_type_id];
        const entry: DocDecisionInput = {
          document_type_id: r.document_type_id,
          decision: d ? d.decision : 'accepted',
        };
        const reason = d?.reason.trim();
        if (reason) entry.reason = reason;
        return entry;
      });

    const trimmedNotes = notes.trim();

    try {
      const result = await submitVettingDecision(detail.id, {
        document_decisions,
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      });
      audit(
        'status_change',
        'recruitment_application',
        detail.id,
        detail.email,
        `Vetting outcome: ${result.outcome}`,
      );
      setToast({ type: 'success', message: `Submitted: ${result.outcome}` });
      // Brief delay so the toast is visible before route change.
      setTimeout(() => router.push('/admin/recruitment/pipeline/'), 600);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit decision',
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Release claim ───────────────────────────────────────────────── */
  async function handleRelease() {
    if (!detail || releasing) return;
    setReleasing(true);
    setSubmitError(null);
    try {
      await releaseApplication(detail.id);
      audit(
        'update',
        'recruitment_application',
        detail.id,
        detail.email,
        'Released review claim',
      );
      router.push('/admin/recruitment/pipeline/');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to release claim',
      );
      setReleasing(false);
    }
  }

  /* ── Render: missing id (redirect already in flight) ─────────────── */
  if (!id) return <PageLoadingFallback />;

  /* ── Render: loading ─────────────────────────────────────────────── */
  if (loading) return <PageLoadingFallback />;

  /* ── Render: error ───────────────────────────────────────────────── */
  if (loadError || !detail) {
    return (
      <div className="p-6">
        <Link
          href="/admin/recruitment/pipeline/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to Pipeline
        </Link>
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Could not load application
              </p>
              <p className="text-sm text-red-700 mt-0.5 break-all">
                {loadError ?? 'Application not found'}
              </p>
            </div>
          </div>
          <button
            onClick={() => void load()}
            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Render: main ────────────────────────────────────────────────── */
  const fullName = detail.form_data.full_name ?? '—';

  return (
    <div className="p-4 lg:p-6">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <Link
            href="/admin/recruitment/pipeline/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back to Pipeline
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-primary-dark">
              {fullName}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-gray-100 text-text-muted">
              {detail.id}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary capitalize">
              {detail.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {detail.email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              Exercise {detail.exercise_id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => void handleRelease()}
            disabled={releasing || submitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-border/60 text-sm font-semibold text-primary-dark rounded-xl hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {releasing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            Release claim
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl p-4 mb-4 border-2',
            toast.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200',
          )}
          role="status"
        >
          {toast.type === 'success' ? (
            <CheckCircle
              className="h-5 w-5 text-green-600 flex-shrink-0"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="h-5 w-5 text-red-600 flex-shrink-0"
              aria-hidden="true"
            />
          )}
          <p
            className={cn(
              'text-sm font-medium',
              toast.type === 'success' ? 'text-green-800' : 'text-red-800',
            )}
          >
            {toast.message}
          </p>
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertCircle
            className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      {/* Side-by-side panes */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Left pane — decisions */}
        <div className="lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-2 space-y-3">
          {visibleRequirements.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-border/40 p-8 text-center">
              <AlertTriangle
                className="h-8 w-8 text-text-muted mx-auto mb-2"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-primary-dark">
                No requirements configured
              </p>
              <p className="text-xs text-text-muted mt-1">
                The exercise has no documents to vet.
              </p>
            </div>
          )}

          {visibleRequirements.map((r) => {
            const state = decisions[r.document_type_id];
            return (
              <PerDocDecision
                key={r.document_type_id}
                requirement={r}
                decision={state?.decision}
                reason={state?.reason ?? ''}
                onChange={(decision, reason) =>
                  changeDecision(r.document_type_id, decision, reason)
                }
                onSelectDoc={(docId) => setActiveDocId(docId)}
                isActive={activeDocId === r.document_type_id}
              />
            );
          })}

          {/* Notes + submit */}
          <div className="bg-white rounded-2xl border-2 border-border/40 p-4 sticky bottom-0">
            <label
              htmlFor="reviewer-notes"
              className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1"
            >
              Reviewer notes (optional)
            </label>
            <textarea
              id="reviewer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes for this review…"
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary resize-none mb-3"
            />

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!submitGate.ok || submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              {submitting ? 'Submitting…' : 'Submit Decision'}
            </button>
            {!submitGate.ok && submitGate.reason && (
              <p className="text-xs text-text-muted mt-2 text-center">
                {submitGate.reason}
              </p>
            )}
          </div>
        </div>

        {/* Right pane — viewer */}
        <div className="lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto">
          <DocumentViewer
            applicationId={detail.id}
            requirements={visibleRequirements}
            activeDocId={activeDocId}
            onSelectDoc={setActiveDocId}
          />
        </div>
      </div>
    </div>
  );
}
