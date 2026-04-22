'use client';

import { useCallback, useRef, useState } from 'react';
import { CheckCircle, FileText, Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadDocument, deleteDocument } from '@/lib/applicant-api';
import type { RequirementWithUpload } from '@/types/recruitment';

const MB = 1024 * 1024;

/* ─── Slot state machine (discriminated union) ─────────────────────── */
type SlotState =
  | { kind: 'idle' }
  | { kind: 'uploading'; pct: number }
  | { kind: 'error'; message: string };

export interface UploadSlotProps {
  requirement: RequirementWithUpload;
  /** Parent re-fetches requirements after a change so we get a fresh upload row. */
  onChange: () => Promise<void>;
}

/* ─── Helpers ──────────────────────────────────────────────────────── */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < MB) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / MB).toFixed(1)} MB`;
}

function shortMime(mime: string): string {
  // Map common MIMEs to short labels — fall back to the subtype
  if (mime === 'application/pdf') return 'PDF';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'JPG';
  if (mime === 'image/png') return 'PNG';
  if (mime === 'image/webp') return 'WEBP';
  if (mime === 'image/heic' || mime === 'image/heif') return 'HEIC';
  const slash = mime.lastIndexOf('/');
  return slash === -1 ? mime.toUpperCase() : mime.slice(slash + 1).toUpperCase();
}

function acceptAttr(mimes: ReadonlyArray<string>): string {
  return mimes.join(',');
}

/* ─── Component ────────────────────────────────────────────────────── */
export function UploadSlot({ requirement, onChange }: UploadSlotProps) {
  const [state, setState] = useState<SlotState>({ kind: 'idle' });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const maxBytes = requirement.max_mb * MB;

  /* ── Client-side pre-checks (mirror server logic) ─────────────── */
  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxBytes) {
        return `File is ${(file.size / MB).toFixed(1)} MB — maximum allowed is ${requirement.max_mb} MB.`;
      }
      if (file.size === 0) {
        return 'File is empty.';
      }
      const accepted = requirement.accepted_mimes;
      // Browsers occasionally pass "" for unknown types — treat as a soft fail
      if (file.type.length === 0) {
        return 'Could not detect the file type. Please upload a supported format.';
      }
      if (!accepted.includes(file.type)) {
        const list = accepted.map(shortMime).join(', ');
        return `Unsupported file type "${shortMime(file.type)}". Allowed: ${list}.`;
      }
      return null;
    },
    [maxBytes, requirement.max_mb, requirement.accepted_mimes],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const err = validateFile(file);
      if (err) {
        setState({ kind: 'error', message: err });
        return;
      }
      setState({ kind: 'uploading', pct: 0 });
      try {
        await uploadDocument(requirement.document_type_id, file, (pct) =>
          setState({ kind: 'uploading', pct }),
        );
        await onChange();
        setState({ kind: 'idle' });
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : 'Upload failed — please try again.';
        setState({ kind: 'error', message });
      }
    },
    [requirement.document_type_id, validateFile, onChange],
  );

  const handleDelete = useCallback(async () => {
    if (!requirement.upload) return;
    const ok = window.confirm(
      `Remove "${requirement.upload.original_filename}"? You'll need to re-upload it before submitting.`,
    );
    if (!ok) return;
    setState({ kind: 'uploading', pct: 0 }); // re-use spinner
    try {
      await deleteDocument(requirement.document_type_id);
      await onChange();
      setState({ kind: 'idle' });
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'Could not remove the file — please try again.';
      setState({ kind: 'error', message });
    }
  }, [requirement.document_type_id, requirement.upload, onChange]);

  /* ── DOM event wiring ─────────────────────────────────────────── */
  const onPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      // Allow re-selecting the same filename — clear so onChange fires next time
      e.target.value = '';
      if (f) void handleFile(f);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void handleFile(f);
    },
    [handleFile],
  );

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  /* ── Render ───────────────────────────────────────────────────── */
  const isFilled = requirement.upload !== null && state.kind !== 'uploading';
  const isUploading = state.kind === 'uploading';
  const isError = state.kind === 'error';

  return (
    <div className="space-y-2">
      {/* Header row: label + required/optional badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-primary-dark">{requirement.label}</h3>
          {requirement.description && (
            <p className="mt-0.5 text-xs text-text-muted leading-snug">
              {requirement.description}
            </p>
          )}
        </div>
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex-shrink-0',
            requirement.is_required
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-text-muted',
          )}
        >
          {requirement.is_required ? 'Required' : 'Optional'}
        </span>
      </div>

      {/* Hidden file input — triggered by Browse button */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr(requirement.accepted_mimes)}
        onChange={onPickerChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Body — varies by state */}
      {isUploading && (
        <div className="rounded-2xl border-2 border-border/40 bg-white p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2
              className="h-5 w-5 text-primary animate-spin flex-shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-primary-dark">
              Uploading… {state.pct}%
            </p>
          </div>
          <div
            className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-label={`Uploading ${requirement.label}`}
            aria-valuenow={state.pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-primary transition-all duration-150"
              style={{ width: `${state.pct}%` }}
            />
          </div>
        </div>
      )}

      {!isUploading && isFilled && requirement.upload && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle
                  className="h-5 w-5 text-emerald-700"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText
                    className="h-4 w-4 text-emerald-700 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-primary-dark truncate">
                    {requirement.upload.original_filename}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  {shortMime(requirement.upload.mime_type)} ·{' '}
                  {formatBytes(requirement.upload.size_bytes)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={openPicker}
                className="px-2.5 py-1.5 text-xs font-semibold text-primary-dark hover:bg-emerald-100 rounded-lg transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                aria-label={`Remove ${requirement.upload.original_filename}`}
                className="p-1.5 text-text-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isUploading && !isFilled && isError && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">{state.message}</p>
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-800 border-2 border-red-300 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {!isUploading && !isFilled && !isError && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'rounded-2xl border-2 border-dashed p-6 text-center transition-colors',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-border/60 bg-gray-50 hover:border-primary/60 hover:bg-white',
          )}
        >
          <Upload
            className="h-8 w-8 text-text-muted mx-auto mb-2"
            aria-hidden="true"
          />
          <p className="text-sm text-primary-dark mb-1">
            Drag &amp; drop your file here, or
          </p>
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
          >
            Browse files
          </button>
          <p className="mt-3 text-xs text-text-muted">
            {requirement.accepted_mimes.map(shortMime).join(', ')} · max{' '}
            {requirement.max_mb} MB
          </p>
        </div>
      )}
    </div>
  );
}
