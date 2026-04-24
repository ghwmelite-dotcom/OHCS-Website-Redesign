'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  listCampaigns,
  listCampaignRecipients,
  type CampaignSummary,
  type CampaignRecipient,
} from '@/lib/recruitment-comms-api';
import { getStatusLabel } from '@/lib/application-status';

export function CampaignHistory({ exerciseId }: { exerciseId: string | null }) {
  const [rows, setRows] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Record<string, CampaignRecipient[]>>({});
  const [loadingRecipients, setLoadingRecipients] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    listCampaigns(exerciseId)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  async function toggle(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!recipients[id]) {
      setLoadingRecipients(id);
      try {
        const r = await listCampaignRecipients(id);
        setRecipients((prev) => ({ ...prev, [id]: r }));
      } finally {
        setLoadingRecipients(null);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-border/40 p-8 text-center text-text-muted text-sm">
        No campaigns sent yet for this exercise.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-border/40 divide-y divide-border/20">
      {rows.map((c) => {
        const isOpen = openId === c.id;
        const recs = recipients[c.id];
        return (
          <div key={c.id}>
            <button
              type="button"
              onClick={() => void toggle(c.id)}
              className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary-dark truncate">{c.subject}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {getStatusLabel(c.status_filter)} · {new Date(c.created_at).toLocaleString()} · by {c.sender_email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs flex-shrink-0">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {c.sent_count}
                </span>
                {c.failed_count > 0 && (
                  <span className="inline-flex items-center gap-1 text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" /> {c.failed_count}
                  </span>
                )}
                {c.sms_requested === 1 && (
                  <span className="inline-flex items-center gap-1 text-blue-700">
                    SMS {c.sms_sent_count}/{c.sms_sent_count + c.sms_failed_count}
                  </span>
                )}
              </div>
            </button>
            {isOpen && (
              <div className="px-6 pb-4 bg-gray-50/50">
                {loadingRecipients === c.id && (
                  <div className="py-4 text-center text-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin inline" />
                  </div>
                )}
                {recs && (
                  <table className="w-full text-xs">
                    <thead className="text-text-muted">
                      <tr>
                        <th className="text-left py-2">Application</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Email status</th>
                        <th className="text-left py-2">SMS status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recs.map((r, i) => (
                        <tr key={i} className="border-t border-border/30">
                          <td className="py-2 font-mono">{r.application_id}</td>
                          <td className="py-2">{r.email}</td>
                          <td className="py-2">
                            <span
                              className={
                                r.email_status === 'sent'
                                  ? 'text-emerald-700'
                                  : 'text-red-700'
                              }
                            >
                              {r.email_status}
                            </span>
                            {r.email_error && (
                              <span className="text-text-muted ml-2">({r.email_error})</span>
                            )}
                          </td>
                          <td className="py-2">
                            {r.sms_status ?? '—'}
                            {r.sms_error && (
                              <span className="text-text-muted ml-2">({r.sms_error})</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
