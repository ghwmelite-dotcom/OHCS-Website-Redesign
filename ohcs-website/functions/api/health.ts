import type { PagesFunction, Env } from '../_shared/types';
import { json } from '../_shared/json';

type CheckStatus = 'ok' | 'error';

async function checkD1(env: Env): Promise<CheckStatus> {
  try {
    await env.DB.prepare('SELECT 1 as ok').first();
    return 'ok';
  } catch {
    return 'error';
  }
}

async function checkR2(env: Env): Promise<CheckStatus> {
  try {
    await env.UPLOADS.head('__healthcheck__');
    return 'ok';
  } catch {
    return 'error';
  }
}

async function checkAI(env: Env): Promise<CheckStatus> {
  try {
    await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: 'ok',
      max_tokens: 1,
    });
    return 'ok';
  } catch {
    return 'error';
  }
}

export const onRequestGet: PagesFunction = async ({ env }) => {
  const [d1, r2, workers_ai] = await Promise.all([
    checkD1(env),
    checkR2(env),
    checkAI(env),
  ]);

  const allOk = d1 === 'ok' && r2 === 'ok' && workers_ai === 'ok';

  return json(
    {
      status: allOk ? 'ok' : 'degraded',
      checks: { d1, r2, workers_ai },
      app: env.APP_NAME,
      env: env.APP_ENV,
      version: '1.0.0',
      ts: Date.now(),
    },
    { status: allOk ? 200 : 503 },
  );
};
