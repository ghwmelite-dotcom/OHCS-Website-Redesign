'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { audit } from '@/lib/audit-logger';
import {
  listDocumentTypes,
  getExerciseRequirements,
  putExerciseRequirements,
  type RequirementInput,
} from '@/lib/recruitment-api';
import type {
  DocumentType,
  ExerciseRequirement,
  ConditionalTrigger,
} from '@/types/recruitment';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, Plus, X, Save, Eye, GripVertical,
  Loader2, AlertTriangle, ArrowLeft, AlertCircle, CheckCircle, FileText,
} from 'lucide-react';
import { PreviewApplicantModal } from '@/components/admin/preview-applicant-modal';

/* ------------------------------------------------------------------ */
/*  Tab Navigation (local copy to avoid cross-page client import)     */
/* ------------------------------------------------------------------ */
const TABS = [
  { label: 'Dashboard', href: '/admin/recruitment', icon: LayoutDashboard },
  { label: 'Exercises', href: '/admin/recruitment/exercises', icon: FolderOpen },
  { label: 'Pipeline', href: '/admin/recruitment/pipeline', icon: Kanban },
  { label: 'Examinations', href: '/admin/recruitment/examinations', icon: GraduationCap },
  { label: 'Communications', href: '/admin/recruitment/communications', icon: MessageSquare },
  { label: 'Analytics', href: '/admin/recruitment/analytics', icon: BarChart3 },
  { label: 'Anti-Fraud', href: '/admin/recruitment/anti-fraud', icon: ShieldAlert },
  { label: 'Merit List', href: '/admin/recruitment/merit-list', icon: Trophy },
];

function RecruitmentTabs({ current }: { current: string }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-border/40 p-1.5 mb-8 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {TABS.map((tab) => {
          const isActive = current === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-primary-dark hover:bg-primary/5',
              )}
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toast type                                                         */
/* ------------------------------------------------------------------ */
type ToastState = { type: 'success' | 'error'; message: string } | null;

/* ------------------------------------------------------------------ */
/*  Helpers — narrow ConditionalTrigger from a string                  */
/* ------------------------------------------------------------------ */
const TRIGGER_OPTIONS: ConditionalTrigger[] = [
  'has_professional_qualification',
  'is_pwd',
];

function toTrigger(v: string): ConditionalTrigger {
  return v === 'is_pwd' ? 'is_pwd' : 'has_professional_qualification';
}

interface StoredExerciseLite {
  id?: unknown;
}

function exerciseExistsLocally(exerciseId: string): boolean {
  if (typeof window === 'undefined') return true; // don't warn during SSR
  try {
    const raw = localStorage.getItem('ohcs_recruitment_exercises');
    if (!raw) return false;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    return parsed.some(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        typeof (item as StoredExerciseLite).id === 'string' &&
        (item as StoredExerciseLite).id === exerciseId,
    );
  } catch {
    return false;
  }
}

function toRequirementInputs(reqs: ExerciseRequirement[]): RequirementInput[] {
  return [...reqs]
    .sort((a, b) => a.display_order - b.display_order)
    .map((r, i) => ({
      document_type_id: r.document_type_id,
      is_required: r.is_required,
      conditional_on: r.conditional_on,
      display_order: i,
      max_mb_override: r.max_mb_override,
    }));
}

/* ------------------------------------------------------------------ */
/*  Page wrapper — useSearchParams MUST be inside a Suspense boundary  */
/*  for the static export build to succeed (Next 16).                  */
/* ------------------------------------------------------------------ */
export default function ExerciseDocumentsPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <ExerciseDocumentsInner />
    </Suspense>
  );
}

function PageLoadingFallback() {
  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/exercise-documents" />
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" aria-label="Loading" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner Component                                                    */
/* ------------------------------------------------------------------ */
function ExerciseDocumentsInner() {
  const searchParams = useSearchParams();
  const exerciseId = (searchParams.get('exerciseId') ?? '').trim();

  // Empty state — no exerciseId in URL.
  if (!exerciseId) {
    return (
      <div>
        <RecruitmentTabs current="/admin/recruitment/exercise-documents" />
        <div className="bg-white rounded-2xl border-2 border-dashed border-border/40 p-12 text-center max-w-2xl mx-auto">
          <FolderOpen className="h-10 w-10 text-text-muted mx-auto mb-3" aria-hidden="true" />
          <p className="text-base font-semibold text-primary-dark">Pick an exercise</p>
          <p className="text-sm text-text-muted mt-1 mb-6">
            Open an exercise from the list to configure which documents applicants must upload.
          </p>
          <Link
            href="/admin/recruitment/exercises"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Exercises
          </Link>
        </div>
      </div>
    );
  }

  return <ConfigureRequirements exerciseId={exerciseId} />;
}

/* ------------------------------------------------------------------ */
/*  Configure Requirements — main editor                               */
/* ------------------------------------------------------------------ */
function ConfigureRequirements({ exerciseId }: { exerciseId: string }) {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [initial, setInitial] = useState<RequirementInput[]>([]);
  const [requirements, setRequirements] = useState<RequirementInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [missingFromStore, setMissingFromStore] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const addMenuRef = useRef<HTMLDivElement | null>(null);

  /* ── Toast auto-dismiss ─────────────────────────────────────────── */
  useEffect(() => {
    if (!toast) return;
    const ms = toast.type === 'error' ? 4000 : 3000;
    const t = setTimeout(() => setToast(null), ms);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Click-outside to close add menu ────────────────────────────── */
  useEffect(() => {
    if (!showAddMenu) return;
    function onClick(e: MouseEvent) {
      if (
        addMenuRef.current &&
        e.target instanceof Node &&
        !addMenuRef.current.contains(e.target)
      ) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showAddMenu]);

  /* ── Local-store presence check (warning banner) ────────────────── */
  useEffect(() => {
    // Reads localStorage; lazy useState() init would crash SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMissingFromStore(!exerciseExistsLocally(exerciseId));
  }, [exerciseId]);

  /* ── Initial load ───────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [types, reqs] = await Promise.all([
        listDocumentTypes(),
        getExerciseRequirements(exerciseId),
      ]);
      const sortedTypes = [...types].sort((a, b) => a.label.localeCompare(b.label));
      const inputs = toRequirementInputs(reqs);
      setDocTypes(sortedTypes);
      setInitial(inputs);
      setRequirements(inputs);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load requirements.');
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    // Async fetch + setState pattern; the rule still flags the fetch wrapper.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  /* ── Derived: dirty? ────────────────────────────────────────────── */
  const isDirty = useMemo(
    () => JSON.stringify(requirements) !== JSON.stringify(initial),
    [requirements, initial],
  );

  /* ── Derived: doc type lookup ───────────────────────────────────── */
  const docTypeById = useMemo(() => {
    const m = new Map<string, DocumentType>();
    for (const dt of docTypes) m.set(dt.id, dt);
    return m;
  }, [docTypes]);

  /* ── Derived: which active types are not yet added ──────────────── */
  const availableToAdd = useMemo(() => {
    const taken = new Set(requirements.map((r) => r.document_type_id));
    return docTypes.filter((dt) => dt.is_active && !taken.has(dt.id));
  }, [docTypes, requirements]);

  /* ── Mutators ───────────────────────────────────────────────────── */
  function updateAt(index: number, patch: Partial<RequirementInput>) {
    setRequirements((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function removeAt(index: number) {
    setRequirements((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((r, i) => ({ ...r, display_order: i })),
    );
  }

  function addRequirement(documentTypeId: string) {
    setRequirements((prev) => [
      ...prev,
      {
        document_type_id: documentTypeId,
        is_required: true,
        conditional_on: null,
        display_order: prev.length,
        max_mb_override: null,
      },
    ]);
    setShowAddMenu(false);
  }

  function setMode(index: number, mode: 'required' | 'optional' | 'conditional') {
    if (mode === 'required') {
      updateAt(index, { is_required: true, conditional_on: null });
    } else if (mode === 'optional') {
      updateAt(index, { is_required: false, conditional_on: null });
    } else {
      // conditional — keep is_required = true; default trigger
      const cur = requirements[index];
      const trigger: ConditionalTrigger =
        cur?.conditional_on ?? 'has_professional_qualification';
      updateAt(index, { is_required: true, conditional_on: trigger });
    }
  }

  function getMode(r: RequirementInput): 'required' | 'optional' | 'conditional' {
    if (r.conditional_on !== null) return 'conditional';
    return r.is_required ? 'required' : 'optional';
  }

  /* ── Drag-and-drop ──────────────────────────────────────────────── */
  function onDragStart(index: number) {
    setDragIndex(index);
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }
  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    setRequirements((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      if (!moved) return prev;
      next.splice(targetIndex, 0, moved);
      return next.map((r, i) => ({ ...r, display_order: i }));
    });
    setDragIndex(null);
  }
  function onDragEnd() {
    setDragIndex(null);
  }

  /* ── Save ───────────────────────────────────────────────────────── */
  async function handleSave() {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      // Re-stamp display_order to be safe (in case anything got out of sync).
      const payload: RequirementInput[] = requirements.map((r, i) => ({
        ...r,
        display_order: i,
      }));
      const result = await putExerciseRequirements(exerciseId, payload);
      audit(
        'update',
        'recruitment_exercise',
        exerciseId,
        exerciseId,
        'Updated document requirements',
      );
      setInitial(payload);
      setRequirements(payload);
      setToast({
        type: 'success',
        message: `Saved ${result.count} requirement${result.count === 1 ? '' : 's'}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save requirements.';
      setToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  }

  function handlePreview() {
    setPreviewOpen(true);
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/exercise-documents" />

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/recruitment/exercises"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Exercises
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-primary-dark">Configure Documents</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-gray-100 text-text-muted">
                {exerciseId}
              </span>
            </div>
            <p className="text-sm text-text-muted">
              Pick which documents this exercise requires applicants to upload.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handlePreview}
              className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-border/60 text-sm font-semibold text-primary-dark rounded-xl hover:border-primary hover:text-primary transition-colors"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Preview as Applicant
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={!isDirty || saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Local-store warning */}
      {!loading && missingFromStore && (
        <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Exercise not found in local store
            </p>
            <p className="text-sm text-amber-800 mt-0.5">
              Saving requirements is allowed but the applicant view may not match what they actually see.
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl p-4 mb-6 border-2',
            toast.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200',
          )}
          role="status"
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" aria-hidden="true" />
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2
            className="h-8 w-8 text-primary animate-spin"
            aria-label="Loading exercise requirements"
          />
        </div>
      )}

      {/* Load error */}
      {!loading && loadError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-red-800">Could not load requirements</p>
              <p className="text-sm text-red-700 mt-0.5 break-all">{loadError}</p>
            </div>
          </div>
          <button
            onClick={() => void load()}
            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Editor */}
      {!loading && !loadError && (
        <>
          {/* Add from Master Library */}
          <div className="mb-6 relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              disabled={availableToAdd.length === 0}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors',
                availableToAdd.length === 0
                  ? 'bg-gray-100 text-text-muted cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-light',
              )}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {availableToAdd.length === 0 ? 'All documents added' : 'Add from Master Library'}
            </button>

            {showAddMenu && availableToAdd.length > 0 && (
              <div
                className="absolute left-0 top-full mt-2 w-80 max-h-80 overflow-y-auto bg-white rounded-2xl border-2 border-border/40 shadow-xl z-20 p-1.5"
                role="menu"
              >
                {availableToAdd.map((dt) => (
                  <button
                    key={dt.id}
                    onClick={() => addRequirement(dt.id)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-primary/5 transition-colors flex flex-col gap-0.5"
                    role="menuitem"
                  >
                    <span className="text-sm font-semibold text-primary-dark">{dt.label}</span>
                    <span className="text-xs font-mono text-text-muted">{dt.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Empty state */}
          {requirements.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-border/40 p-12 text-center">
              <FileText className="h-10 w-10 text-text-muted mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-primary-dark">No required documents yet</p>
              <p className="text-sm text-text-muted mt-1">
                Pick from the master library above to get started.
              </p>
            </div>
          )}

          {/* Requirements list */}
          {requirements.length > 0 && (
            <div className="space-y-3">
              {requirements.map((r, index) => {
                const dt = docTypeById.get(r.document_type_id);
                const mode = getMode(r);
                const placeholderMb = dt ? `default ${dt.default_max_mb}` : 'default';
                return (
                  <div
                    key={`${r.document_type_id}-${index}`}
                    draggable
                    onDragStart={() => onDragStart(index)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(index)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      'bg-white rounded-2xl border-2 p-4 lg:p-5 transition-shadow',
                      dragIndex === index
                        ? 'border-primary shadow-lg opacity-60'
                        : 'border-border/40 hover:shadow-md',
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Drag handle */}
                      <button
                        type="button"
                        aria-label="Drag to reorder"
                        className="flex-shrink-0 p-1.5 text-text-muted hover:text-primary cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="h-5 w-5" aria-hidden="true" />
                      </button>

                      {/* Label + id */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-primary-dark">
                            {dt?.label ?? r.document_type_id}
                          </h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-gray-100 text-text-muted">
                            {r.document_type_id}
                          </span>
                          {!dt && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
                              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                              unknown type
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mode pills */}
                      <div
                        className="inline-flex bg-gray-100 rounded-xl p-1 flex-shrink-0"
                        role="radiogroup"
                        aria-label={`Requirement mode for ${dt?.label ?? r.document_type_id}`}
                      >
                        {(['required', 'optional', 'conditional'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            role="radio"
                            aria-checked={mode === opt}
                            onClick={() => setMode(index, opt)}
                            className={cn(
                              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors capitalize',
                              mode === opt
                                ? 'bg-white text-primary-dark shadow-sm'
                                : 'text-text-muted hover:text-primary-dark',
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      {/* Conditional trigger */}
                      {mode === 'conditional' && (
                        <select
                          value={r.conditional_on ?? 'has_professional_qualification'}
                          onChange={(e) =>
                            updateAt(index, { conditional_on: toTrigger(e.target.value) })
                          }
                          aria-label="Conditional trigger"
                          className="px-3 py-2 rounded-xl border-2 border-border/60 bg-white text-xs font-medium focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none flex-shrink-0"
                        >
                          {TRIGGER_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Max MB override */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <label
                          htmlFor={`max-mb-${index}`}
                          className="text-xs font-semibold text-text-muted uppercase tracking-wider"
                        >
                          Max MB
                        </label>
                        <input
                          id={`max-mb-${index}`}
                          type="number"
                          min={1}
                          max={50}
                          value={r.max_mb_override ?? ''}
                          placeholder={placeholderMb}
                          onChange={(e) => {
                            const v = e.target.value;
                            const n = v === '' ? null : Number(v);
                            updateAt(index, {
                              max_mb_override:
                                n === null || !Number.isFinite(n) ? null : n,
                            });
                          }}
                          className="w-20 px-2.5 py-2 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                        />
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeAt(index)}
                        aria-label={`Remove ${dt?.label ?? r.document_type_id}`}
                        className="flex-shrink-0 p-2 rounded-xl text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <PreviewApplicantModal
        key={previewOpen ? 'open' : 'closed'}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentTypes={docTypes}
        requirements={requirements}
      />
    </div>
  );
}
