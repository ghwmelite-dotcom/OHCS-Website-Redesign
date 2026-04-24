'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { CommTemplate } from '@/lib/recruitment-comms-api';
import { createTemplate, updateTemplate } from '@/lib/recruitment-comms-api';

export function TemplateEditorModal({
  template,
  onClose,
  onSaved,
}: {
  template: CommTemplate | 'new' | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const editing = typeof template !== 'string' && template !== null;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing && typeof template !== 'string' && template !== null) {
      setName(template.name);
      setDescription(template.description ?? '');
      setSubject(template.subject);
      setBodyText(template.body_text);
      setBodyHtml(template.body_html ?? '');
      setSmsBody(template.sms_body ?? '');
    } else {
      setName('');
      setDescription('');
      setSubject('');
      setBodyText('');
      setBodyHtml('');
      setSmsBody('');
    }
    setError(null);
  }, [template, editing]);

  if (template === null) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name,
        description: description || undefined,
        subject,
        body_text: bodyText,
        body_html: bodyHtml || undefined,
        sms_body: smsBody || undefined,
      };
      if (editing && typeof template !== 'string' && template !== null) {
        await updateTemplate(template.id, payload);
      } else {
        await createTemplate({
          name,
          description: description || null,
          subject,
          body_text: bodyText,
          body_html: bodyHtml || null,
          sms_body: smsBody || null,
        });
      }
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-primary-dark">
            {editing ? 'Edit Template' : 'New Template'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-primary-dark"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Subject</label>
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Body (plain text). Available placeholders: <code className="text-xs">{`{{name}} {{email}} {{reference_number}} {{exercise_name}} {{status}}`}</code>
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
            <label className="block text-sm font-semibold mb-1">SMS body (optional, max 320 chars)</label>
            <textarea
              value={smsBody}
              onChange={(e) => setSmsBody(e.target.value.slice(0, 320))}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border-2 border-border/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
            <div className="text-xs text-text-muted mt-1">{smsBody.length}/320</div>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border-2 border-border/60 rounded-xl text-sm font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name || !subject || !bodyText}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
