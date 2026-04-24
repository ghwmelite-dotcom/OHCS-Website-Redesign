'use client';

import { useState } from 'react';
import { Edit3, Trash2, Loader2, Mail, MessageSquare } from 'lucide-react';
import type { CommTemplate } from '@/lib/recruitment-comms-api';
import { deleteTemplate } from '@/lib/recruitment-comms-api';

export function TemplatesTable({
  rows,
  onEdit,
  onChange,
}: {
  rows: CommTemplate[];
  onEdit: (template: CommTemplate) => void;
  onChange: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function handleDelete(t: CommTemplate) {
    if (!confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
    setBusy(t.id);
    try {
      await deleteTemplate(t.id);
      await onChange();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-border/40 overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold text-text-muted">Name</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Subject</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Channels</th>
            <th className="px-4 py-3 font-semibold text-text-muted">Updated</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-border/40">
              <td className="px-4 py-3 font-semibold text-primary-dark">{t.name}</td>
              <td className="px-4 py-3 text-text-muted truncate max-w-[280px]">{t.subject}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span title="Email" className="inline-flex items-center gap-1 text-emerald-700">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </span>
                  {t.sms_body && (
                    <span title="SMS" className="inline-flex items-center gap-1 text-blue-700">
                      <MessageSquare className="h-3.5 w-3.5" /> SMS
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-text-muted">
                {new Date(t.updated_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onEdit(t)}
                  className="text-primary hover:text-primary-light inline-flex items-center gap-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded p-1 mr-2"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(t)}
                  disabled={busy === t.id}
                  className="text-red-700 hover:text-red-900 inline-flex items-center gap-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded p-1"
                >
                  {busy === t.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                No templates yet. Click &ldquo;New Template&rdquo; above to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
