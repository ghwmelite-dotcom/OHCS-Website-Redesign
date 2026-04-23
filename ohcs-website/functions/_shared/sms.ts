import type { Env } from './types';

export interface SendSmsInput {
  to: string;        // E.164 format, e.g. '+233241234567'
  message: string;
}

const HUBTEL_URL = 'https://sms.hubtel.com/v1/messages/send';

export async function sendSms(env: Env, input: SendSmsInput): Promise<void> {
  if (!env.HUBTEL_SMS_API_KEY || !env.HUBTEL_SMS_FROM) {
    if (env.APP_ENV !== 'production') {
      console.log(
        `[sms:dev] would send to=${input.to} content=${JSON.stringify(input.message)}`,
      );
    }
    return;
  }

  const res = await fetch(HUBTEL_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Basic ${env.HUBTEL_SMS_API_KEY}`,
    },
    body: JSON.stringify({
      From: env.HUBTEL_SMS_FROM,
      To: input.to,
      Content: input.message,
    }),
  });

  if (!res.ok) {
    throw new Error(`hubtel sms failed (${res.status}): ${await res.text()}`);
  }
}
