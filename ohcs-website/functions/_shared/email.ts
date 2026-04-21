import type { Env } from './types';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const MAILCHANNELS_URL = 'https://api.mailchannels.net/tx/v1/send';
const RESEND_URL = 'https://api.resend.com/emails';

async function sendViaMailChannels(env: Env, input: SendEmailInput): Promise<Response> {
  const body = {
    personalizations: [{ to: [{ email: input.to }] }],
    from: { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
    subject: input.subject,
    content: [
      { type: 'text/html', value: input.html },
      ...(input.text ? [{ type: 'text/plain', value: input.text }] : []),
    ],
  };

  return fetch(MAILCHANNELS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function sendViaResend(env: Env, input: SendEmailInput): Promise<Response> {
  return fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
    }),
  });
}

export async function sendEmail(env: Env, input: SendEmailInput): Promise<void> {
  const mc = await sendViaMailChannels(env, input);
  if (mc.ok) return;

  const mcText = await mc.text();
  if (!env.RESEND_API_KEY) {
    throw new Error(`mailchannels failed (${mc.status}): ${mcText}`);
  }

  const rs = await sendViaResend(env, input);
  if (rs.ok) return;

  const rsText = await rs.text();
  throw new Error(
    `email send failed: mailchannels=${mc.status} ${mcText} | resend=${rs.status} ${rsText}`,
  );
}
