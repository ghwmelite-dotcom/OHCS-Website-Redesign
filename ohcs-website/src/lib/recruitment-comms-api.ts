export interface CommTemplate {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  body_text: string;
  body_html: string | null;
  sms_body: string | null;
  created_at: number;
  updated_at: number;
}

export interface SendCampaignInput {
  exercise_id?: string;
  application_id?: string;
  status: string;
  send_sms: boolean;
  template_id?: string;
  subject: string;
  body_text: string;
  body_html?: string;
  sms_body?: string;
}

export interface SendCampaignResult {
  campaign_id: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  sms_requested: boolean;
  sms_sent_count: number;
  sms_failed_count: number;
}

export interface CampaignSummary {
  id: string;
  template_id: string | null;
  exercise_id: string;
  status_filter: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  sms_requested: number;
  sms_sent_count: number;
  sms_failed_count: number;
  subject: string;
  sender_email: string;
  created_at: number;
}

export interface CampaignRecipient {
  application_id: string;
  email: string;
  phone: string | null;
  email_status: string;
  email_error: string | null;
  sms_status: string | null;
  sms_error: string | null;
  created_at: number;
}

async function ok<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  const body = (await res.json()) as { data: T };
  return body.data;
}

export async function listTemplates(): Promise<CommTemplate[]> {
  return ok(await fetch('/api/admin/comms/templates'));
}

export async function getTemplate(id: string): Promise<CommTemplate> {
  return ok(await fetch(`/api/admin/comms/templates/${encodeURIComponent(id)}`));
}

export async function createTemplate(input: Omit<CommTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<{ id: string; name: string }> {
  return ok(
    await fetch('/api/admin/comms/templates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateTemplate(id: string, patch: Partial<CommTemplate>): Promise<{ id: string }> {
  return ok(
    await fetch(`/api/admin/comms/templates/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  );
}

export async function deleteTemplate(id: string): Promise<void> {
  await ok(
    await fetch(`/api/admin/comms/templates/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  );
}

export async function audienceCount(params: {
  exercise_id?: string;
  application_id?: string;
  status: string;
}): Promise<number> {
  const q = new URLSearchParams();
  if (params.exercise_id) q.set('exercise_id', params.exercise_id);
  if (params.application_id) q.set('application_id', params.application_id);
  q.set('status', params.status);
  const result = await ok<{ count: number }>(await fetch(`/api/admin/comms/audience-count?${q}`));
  return result.count;
}

export async function sendCampaign(input: SendCampaignInput): Promise<SendCampaignResult> {
  return ok(
    await fetch('/api/admin/comms/campaigns', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function listCampaigns(exerciseId: string): Promise<CampaignSummary[]> {
  return ok(
    await fetch(`/api/admin/comms/campaigns?exercise_id=${encodeURIComponent(exerciseId)}`),
  );
}

export async function listCampaignRecipients(campaignId: string): Promise<CampaignRecipient[]> {
  return ok(
    await fetch(`/api/admin/comms/campaigns/${encodeURIComponent(campaignId)}/recipients`),
  );
}
