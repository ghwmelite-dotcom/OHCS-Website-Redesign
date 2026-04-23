'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDocumentSignedUrl } from '@/lib/recruitment-api';
import type { RequirementWithUpload } from '@/types/recruitment';

export interface DocumentViewerProps {
  applicationId: string;
  requirements: RequirementWithUpload[];
  activeDocId: string | null;
  onSelectDoc: (docId: string) => void;
}

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return ImageIcon;
  return FileText;
}

export function DocumentViewer({
  applicationId,
  requirements,
  activeDocId,
  onSelectDoc,
}: DocumentViewerProps) {
  const uploaded = requirements.filter((r) => r.upload !== null);
  const active = uploaded.find(
    (r) => r.document_type_id === activeDocId,
  );

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to first uploaded doc if nothing active.
  useEffect(() => {
    if (activeDocId === null && uploaded.length > 0) {
      const first = uploaded[0];
      if (first) onSelectDoc(first.document_type_id);
    }
  }, [activeDocId, uploaded, onSelectDoc]);

  // Fetch signed URL on active doc change. Stale-flag pattern keeps strict
  // mode happy and avoids racing late responses from prior selections.
  /* eslint-disable react-hooks/set-state-in-effect -- async fetch keyed on active doc */
  useEffect(() => {
    if (!active) {
      setSignedUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSignedUrl(null);

    void (async () => {
      try {
        const url = await getDocumentSignedUrl(
          applicationId,
          active.document_type_id,
        );
        if (cancelled || controller.signal.aborted) return;
        setSignedUrl(url);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load document',
        );
      } finally {
        if (!cancelled && !controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [applicationId, active]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (uploaded.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-border/40 p-12 text-center">
        <FileText
          className="h-10 w-10 text-text-muted mx-auto mb-3"
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-primary-dark">
          No documents uploaded
        </p>
        <p className="text-sm text-text-muted mt-1">
          The applicant has not uploaded any files for this exercise.
        </p>
      </div>
    );
  }

  const activeUpload = active?.upload ?? null;
  const isImage = activeUpload?.mime_type.startsWith('image/') ?? false;
  const isPdf = activeUpload?.mime_type === 'application/pdf';

  return (
    <div className="space-y-4">
      {/* Thumbnail strip — supports ArrowLeft / ArrowRight / Home / End to switch */}
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Uploaded documents"
        onKeyDown={(e) => {
          if (uploaded.length < 2) return;
          const idx = uploaded.findIndex((r) => r.document_type_id === activeDocId);
          if (e.key === 'ArrowRight') {
            const next = uploaded[(idx + 1 + uploaded.length) % uploaded.length];
            if (next) {
              e.preventDefault();
              onSelectDoc(next.document_type_id);
            }
          } else if (e.key === 'ArrowLeft') {
            const prev = uploaded[(idx - 1 + uploaded.length) % uploaded.length];
            if (prev) {
              e.preventDefault();
              onSelectDoc(prev.document_type_id);
            }
          } else if (e.key === 'Home') {
            const first = uploaded[0];
            if (first) {
              e.preventDefault();
              onSelectDoc(first.document_type_id);
            }
          } else if (e.key === 'End') {
            const last = uploaded[uploaded.length - 1];
            if (last) {
              e.preventDefault();
              onSelectDoc(last.document_type_id);
            }
          }
        }}
      >
        {uploaded.map((r) => {
          const Icon = r.upload ? fileIcon(r.upload.mime_type) : FileText;
          const selected = r.document_type_id === activeDocId;
          return (
            <button
              key={r.document_type_id}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelectDoc(r.document_type_id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all max-w-[220px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                selected
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-primary-dark border-border/40 hover:border-primary/50',
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Viewer */}
      <div className="bg-white rounded-2xl border-2 border-border/40 p-4">
        {/* File-meta header */}
        {activeUpload && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-border/40">
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary-dark truncate">
                {active?.label}
              </p>
              <p className="text-xs text-text-muted truncate">
                {activeUpload.original_filename} ·{' '}
                {(activeUpload.size_bytes / 1024).toFixed(0)} KB ·{' '}
                {activeUpload.mime_type}
              </p>
            </div>
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary border-2 border-primary/30 hover:bg-primary/5 transition-colors flex-shrink-0"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download
              </a>
            )}
          </div>
        )}

        {/* Body */}
        {loading && (
          <div className="flex items-center justify-center h-[70vh]">
            <Loader2
              className="h-8 w-8 text-primary animate-spin"
              aria-label="Loading document"
            />
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle
              className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Could not load document
              </p>
              <p className="text-sm text-red-700 mt-0.5 break-all">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && signedUrl && isPdf && (
          <iframe
            src={signedUrl}
            title={active?.label ?? 'Document preview'}
            className="w-full h-[70vh] rounded-xl border-2 border-border/40"
          />
        )}

        {!loading && !error && signedUrl && isImage && (
          /* eslint-disable-next-line @next/next/no-img-element -- signed R2 URL, optimisation not applicable */
          <img
            src={signedUrl}
            alt={active?.label ?? 'Document preview'}
            className="max-w-full max-h-[70vh] mx-auto rounded-xl"
          />
        )}

        {!loading && !error && signedUrl && !isPdf && !isImage && (
          <div className="bg-gray-50 border-2 border-dashed border-border/40 rounded-xl p-12 text-center">
            <FileText
              className="h-10 w-10 text-text-muted mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-primary-dark">
              Cannot preview this file type
            </p>
            <p className="text-sm text-text-muted mt-1 mb-4">
              Use the Download button above to open the file.
            </p>
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download file
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
