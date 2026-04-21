'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { audit } from '@/lib/audit-logger';
import {
  listDocumentTypes,
  createDocumentType,
  patchDocumentType,
  deactivateDocumentType,
  type CreateDocumentTypeInput,
} from '@/lib/recruitment-api';
import type { DocumentType, AiCheckType } from '@/types/recruitment';
import {
  LayoutDashboard, FolderOpen, Kanban, GraduationCap, MessageSquare,
  BarChart3, ShieldAlert, Trophy, Plus, X, FileText,
  Loader2, CheckCircle, AlertCircle, Pencil, Trash2,
} from 'lucide-react';

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
/*  Form state                                                         */
/* ------------------------------------------------------------------ */
interface FormState {
  id: string;
  label: string;
  description: string;
  default_max_mb: string;        // kept as string so the input is controllable
  accepted_mimes: string;        // comma-separated raw input
  ai_check_type: '' | 'certificate' | 'photo' | 'identity';
}

const EMPTY_FORM: FormState = {
  id: '',
  label: '',
  description: '',
  default_max_mb: '5',
  accepted_mimes: 'application/pdf, image/jpeg, image/png',
  ai_check_type: '',
};

const ID_REGEX = /^[a-z0-9_]+$/;

type ToastState = { type: 'success' | 'error'; message: string } | null;

interface ParsedForm {
  id: string;
  label: string;
  description: string | null;
  default_max_mb: number;
  accepted_mimes: string[];
  ai_check_type: AiCheckType;
}

function parseMimes(raw: string): string[] {
  return raw
    .split(',')
    .map((m) => m.trim())
    .filter((m) => m.length > 0);
}

function validateAndParse(form: FormState, isEdit: boolean): { ok: true; value: ParsedForm } | { ok: false; error: string } {
  const id = form.id.trim();
  const label = form.label.trim();
  const description = form.description.trim();
  const maxMb = Number(form.default_max_mb);
  const mimes = parseMimes(form.accepted_mimes);

  if (!isEdit) {
    if (!id) return { ok: false, error: 'ID is required.' };
    if (!ID_REGEX.test(id)) return { ok: false, error: 'ID must contain only lowercase letters, numbers, and underscores.' };
  }
  if (!label) return { ok: false, error: 'Label is required.' };
  if (label.length > 200) return { ok: false, error: 'Label must be 200 characters or fewer.' };
  if (description.length > 500) return { ok: false, error: 'Description must be 500 characters or fewer.' };
  if (!Number.isFinite(maxMb) || maxMb < 1 || maxMb > 50) {
    return { ok: false, error: 'Max size must be a number between 1 and 50.' };
  }
  if (mimes.length === 0) return { ok: false, error: 'At least one accepted MIME type is required.' };

  const ai: AiCheckType = form.ai_check_type === '' ? null : form.ai_check_type;

  return {
    ok: true,
    value: {
      id,
      label,
      description: description ? description : null,
      default_max_mb: maxMb,
      accepted_mimes: mimes,
      ai_check_type: ai,
    },
  };
}

function toFormState(d: DocumentType): FormState {
  return {
    id: d.id,
    label: d.label,
    description: d.description ?? '',
    default_max_mb: String(d.default_max_mb),
    accepted_mimes: d.accepted_mimes.join(', '),
    ai_check_type: d.ai_check_type ?? '',
  };
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function DocumentTypesPage() {
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<DocumentType | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);

  /* ── Toast auto-dismiss ─────────────────────────────────────────── */
  useEffect(() => {
    if (!toast) return;
    const ms = toast.type === 'error' ? 4000 : 3000;
    const t = setTimeout(() => setToast(null), ms);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Loading ────────────────────────────────────────────────────── */
  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listDocumentTypes();
      const sorted = [...data].sort((a, b) => a.label.localeCompare(b.label));
      setDocTypes(sorted);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load document types.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /* ── Modal helpers ──────────────────────────────────────────────── */
  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowCreate(true);
  }
  function closeCreate() {
    setShowCreate(false);
    setFormError(null);
  }
  function openEdit(dt: DocumentType) {
    setForm(toFormState(dt));
    setFormError(null);
    setEditing(dt);
  }
  function closeEdit() {
    setEditing(null);
    setFormError(null);
  }

  /* ── Mutations ──────────────────────────────────────────────────── */
  async function handleCreate() {
    const parsed = validateAndParse(form, false);
    if (!parsed.ok) {
      setFormError(parsed.error);
      return;
    }
    const input: CreateDocumentTypeInput = {
      id: parsed.value.id,
      label: parsed.value.label,
      description: parsed.value.description,
      default_max_mb: parsed.value.default_max_mb,
      accepted_mimes: parsed.value.accepted_mimes,
      ai_check_type: parsed.value.ai_check_type ?? undefined,
    };
    setSubmitting(true);
    setFormError(null);
    try {
      await createDocumentType(input);
      audit('create', 'admin_user', input.id, input.label, 'Created document type');
      await refresh();
      closeCreate();
      setToast({ type: 'success', message: `Document type "${input.label}" created.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create document type.';
      setFormError(msg);
      setToast({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate() {
    if (!editing) return;
    const parsed = validateAndParse(form, true);
    if (!parsed.ok) {
      setFormError(parsed.error);
      return;
    }
    const patch: Partial<CreateDocumentTypeInput> = {
      label: parsed.value.label,
      description: parsed.value.description,
      default_max_mb: parsed.value.default_max_mb,
      accepted_mimes: parsed.value.accepted_mimes,
      ai_check_type: parsed.value.ai_check_type ?? undefined,
    };
    setSubmitting(true);
    setFormError(null);
    try {
      await patchDocumentType(editing.id, patch);
      audit('update', 'admin_user', editing.id, parsed.value.label, 'Updated document type');
      await refresh();
      closeEdit();
      setToast({ type: 'success', message: `Document type "${parsed.value.label}" updated.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update document type.';
      setFormError(msg);
      setToast({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(dt: DocumentType) {
    const confirmed = window.confirm(
      `Deactivate "${dt.label}"? It will be hidden from new exercises but kept for historical records.`,
    );
    if (!confirmed) return;
    try {
      await deactivateDocumentType(dt.id);
      audit('deactivate', 'admin_user', dt.id, dt.label, 'Deactivated document type');
      await refresh();
      setToast({ type: 'success', message: `Document type "${dt.label}" deactivated.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate document type.';
      setToast({ type: 'error', message: msg });
    }
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div>
      <RecruitmentTabs current="/admin/recruitment/document-types" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary-dark">Document Library</h2>
          <p className="text-sm text-text-muted mt-1">
            Manage the master list of documents that can be required of applicants across recruitment exercises.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Document Type
        </button>
      </div>

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

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" aria-label="Loading document types" />
        </div>
      )}

      {/* Error state */}
      {!loading && loadError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-red-800">Could not load document types</p>
              <p className="text-sm text-red-700 mt-0.5 break-all">{loadError}</p>
            </div>
          </div>
          <button
            onClick={() => void refresh()}
            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !loadError && docTypes.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-border/40 p-12 text-center">
          <FileText className="h-10 w-10 text-text-muted mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-primary-dark">No document types yet</p>
          <p className="text-sm text-text-muted mt-1">
            Add your first document type to start composing recruitment exercise requirements.
          </p>
        </div>
      )}

      {/* List */}
      {!loading && !loadError && docTypes.length > 0 && (
        <div className="grid gap-6">
          {docTypes.map((dt) => (
            <div
              key={dt.id}
              className="bg-white rounded-2xl border-2 border-border/40 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-primary-dark">{dt.label}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-gray-100 text-text-muted">
                      {dt.id}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                        dt.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700',
                      )}
                    >
                      {dt.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Description */}
                  {dt.description && (
                    <p className="text-sm text-text-muted mb-4 max-w-2xl">{dt.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/5 text-primary-dark">
                      <FileText className="h-3 w-3" aria-hidden="true" />
                      Max {dt.default_max_mb} MB
                    </span>
                    {dt.accepted_mimes.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-gray-100 text-text-muted"
                      >
                        {m}
                      </span>
                    ))}
                    {dt.ai_check_type && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        AI: {dt.ai_check_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action row */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(dt)}
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-border/60 text-sm font-semibold text-primary-dark rounded-xl hover:border-primary hover:text-primary transition-colors"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </button>
                  {dt.is_active && (
                    <button
                      onClick={() => void handleDeactivate(dt)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <DocumentTypeModal
          title="New Document Type"
          submitLabel="Create Document Type"
          form={form}
          setForm={setForm}
          formError={formError}
          submitting={submitting}
          isEdit={false}
          onCancel={closeCreate}
          onSubmit={() => void handleCreate()}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <DocumentTypeModal
          title={`Edit "${editing.label}"`}
          submitLabel="Save Changes"
          form={form}
          setForm={setForm}
          formError={formError}
          submitting={submitting}
          isEdit={true}
          onCancel={closeEdit}
          onSubmit={() => void handleUpdate()}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal component                                                    */
/* ------------------------------------------------------------------ */
interface ModalProps {
  title: string;
  submitLabel: string;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  formError: string | null;
  submitting: boolean;
  isEdit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function DocumentTypeModal({
  title,
  submitLabel,
  form,
  setForm,
  formError,
  submitting,
  isEdit,
  onCancel,
  onSubmit,
}: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-primary-dark">{title}</h3>
          <button
            onClick={onCancel}
            aria-label="Close modal"
            className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* ID */}
          <div>
            <label htmlFor="dt-id" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              ID
            </label>
            <input
              id="dt-id"
              type="text"
              value={form.id}
              disabled={isEdit}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              placeholder="e.g. degree_certificate"
              pattern="^[a-z0-9_]+$"
              className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none disabled:bg-gray-50 disabled:text-text-muted"
            />
            <p className="text-xs text-text-muted mt-1">
              lowercase letters, numbers, underscores
              {isEdit && ' (cannot be changed)'}
            </p>
          </div>

          {/* Label */}
          <div>
            <label htmlFor="dt-label" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Label
            </label>
            <input
              id="dt-label"
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              maxLength={200}
              placeholder="e.g. Degree Certificate"
              className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="dt-desc" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Description (optional)
            </label>
            <textarea
              id="dt-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              maxLength={500}
              placeholder="Helpful text shown to applicants..."
              className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none resize-none"
            />
            <p className="text-xs text-text-muted mt-1">
              {form.description.length}/500
            </p>
          </div>

          {/* Max MB + AI check type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dt-max" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Default Max (MB)
              </label>
              <input
                id="dt-max"
                type="number"
                min={1}
                max={50}
                value={form.default_max_mb}
                onChange={(e) => setForm((f) => ({ ...f, default_max_mb: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="dt-ai" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                AI Check Type
              </label>
              <select
                id="dt-ai"
                value={form.ai_check_type}
                onChange={(e) => {
                  const v = e.target.value;
                  const next: FormState['ai_check_type'] =
                    v === 'certificate' || v === 'photo' || v === 'identity' ? v : '';
                  setForm((f) => ({ ...f, ai_check_type: next }));
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
              >
                <option value="">(none)</option>
                <option value="certificate">certificate</option>
                <option value="photo">photo</option>
                <option value="identity">identity</option>
              </select>
            </div>
          </div>

          {/* Accepted MIMEs */}
          <div>
            <label htmlFor="dt-mimes" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Accepted MIME Types
            </label>
            <input
              id="dt-mimes"
              type="text"
              value={form.accepted_mimes}
              onChange={(e) => setForm((f) => ({ ...f, accepted_mimes: e.target.value }))}
              placeholder="application/pdf, image/jpeg, image/png"
              className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
            />
            <p className="text-xs text-text-muted mt-1">
              Comma-separated. Common: application/pdf, image/jpeg, image/png
            </p>
          </div>

          {/* Inline form error */}
          {formError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-800">{formError}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-5 py-2.5 border-2 border-border/60 text-sm font-semibold text-text-muted rounded-xl hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
