'use client';

import { useEffect, useState } from 'react';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import {
  audienceCount,
  sendCampaign,
  listTemplates,
  type CommTemplate,
  type SendCampaignInput,
  type SendCampaignResult,
} from '@/lib/recruitment-comms-api';
import {
  APPLICATION_STATUS_LABELS,
} from '@/lib/application-status';

const RECIPIENT_CAP = 50;

export function ComposeForm({
  exerciseId,
  fixedApplicationId,
  smsAvailable,
  onSent,
}: {
  exerciseId: string | null;
  fixedApplicationId?: string;
  smsAvailable: boolean;
  onSent: (result: SendCampaignResult) => void;
}) {
  const [templates, setTemplates] = useState<CommTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [status, setStatus] = useState<string>(fixedApplicationId ? 'single' : 'submitted');
  const [count, setCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listTemplates().then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    setError(null);
    if (fixedApplicationId) {
      setCount(1);
      return;
    }
    if (!exerciseId || !status || status === 'single') {
      setCount(null);
      return;
    }
    let cancelled = false;
    void audienceCount({ exercise_id: exerciseId, status })
      .then((n) => {
        if (!cancelled) setCount(n);
      })
      .catch(() => {
        if (!cancelled) setCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [exerciseId, status, fixedApplicationId]);

  function loadTemplate(id: string) {
    setTemplateId(id);
    if (!id) return;
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSubject(t.subject);
    setBodyText(t.body_text);
    setSmsBody(t.sms_body ?? '');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exerciseId && !fixedApplicationId) {
      setError('Pick an exercise or applicant first');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input: SendCampaignInput = {
        status,
        send_sms: sendSms,
        subject,
        body_text: bodyText,
        ...(smsBody ? { sms_body: smsBody } : {}),
        ...(templateId ? { template_id: templateId } : {}),
      };
      if (fixedApplicationId) {
        input.application_id = fixedApplicationId;
      } else if (exerciseId) {
        input.exercise_id = exerciseId;
      }
      const result = await sendCampaign(input);
      onSent(result);
      setSubject('');
      setBodyText('');
      setSmsBody('');
      setTemplateId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSubmitting(false);
    }
  }

  const tooMany = count !== null && count > RECIPIENT_CAP;
  const noAudience = count === 0;
  const canSend =
    !submitting &&
    !!subject &&
    !!bodyText &&
    count !== null &&
    !tooMany &&
    !noAudience &&
    (fixedApplicationId || (exerciseId && status));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!fixedApplicationId && (
        <>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Load from template (optional)
            </label>
            <select
              value={templateId}
              onChange={(e) => loadTemplate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            >
              <option value="">— write ad-hoc —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Send to applicants whose status is
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            >
              {Object.entries(APPLICATION_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Subject
        </label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder='e.g. "Your application is ready for the next step"'
          className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Message body (placeholders: <code className="text-xs">{`{{name}} {{reference_number}} {{exercise_name}}`}</code>)
        </label>
        <textarea
          required
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendSms}
            onChange={(e) => setSendSms(e.target.checked)}
            disabled={!smsAvailable}
            className="h-4 w-4"
          />
          <span className={smsAvailable ? '' : 'text-text-muted'}>
            Also send SMS{!smsAvailable && ' (unavailable — Hubtel not provisioned)'}
          </span>
        </label>
        {sendSms && smsAvailable && (
          <textarea
            value={smsBody}
            onChange={(e) => setSmsBody(e.target.value.slice(0, 320))}
            placeholder="SMS body (max 320 chars). Leave empty to skip SMS for this send."
            rows={2}
            className="w-full mt-2 px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
          />
        )}
      </div>

      <div className="rounded-xl border-2 border-border/40 bg-gray-50 p-3 text-sm flex items-center justify-between">
        <span className="text-text-muted">
          {fixedApplicationId
            ? '1 recipient (single applicant)'
            : count === null
            ? 'Pick an exercise + status to see recipient count.'
            : `${count} recipient${count === 1 ? '' : 's'} match this filter`}
        </span>
        {tooMany && (
          <span className="inline-flex items-center gap-1 text-amber-800 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Audience too large (cap {RECIPIENT_CAP})
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={!canSend}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {submitting
          ? 'Sending…'
          : fixedApplicationId
          ? 'Send to this applicant'
          : count === null
          ? 'Send'
          : `Send to ${count} applicant${count === 1 ? '' : 's'}`}
      </button>
    </form>
  );
}
