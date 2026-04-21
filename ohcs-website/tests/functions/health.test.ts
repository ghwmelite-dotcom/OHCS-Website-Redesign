import { describe, it, expect } from 'vitest';
import { onRequestGet } from '../../functions/api/health';
import { mockEnv } from './_helpers/mock-env';

interface HealthBody {
  status: 'ok' | 'degraded';
  checks: { d1: 'ok' | 'error'; r2: 'ok' | 'error'; workers_ai: 'ok' | 'error' };
  app: string;
  env: string;
  version: string;
  ts: number;
}

function makeContext(env = mockEnv()) {
  return {
    request: new Request('https://example.com/api/health'),
    env,
    params: {},
    waitUntil: () => {},
    data: {},
  };
}

async function readBody(res: Response): Promise<HealthBody> {
  return (await res.json()) as HealthBody;
}

describe('GET /api/health', () => {
  it('returns 200 with status:ok when all bindings are healthy', async () => {
    const res = await onRequestGet(makeContext());
    expect(res.status).toBe(200);
    const body = await readBody(res);
    expect(body.status).toBe('ok');
    expect(body.checks).toEqual({
      d1: 'ok',
      r2: 'ok',
      workers_ai: 'ok',
    });
    expect(body.app).toBe('OHCS Recruitment (Test)');
    expect(body.env).toBe('development');
  });

  it('returns 503 with status:degraded when D1 is unhealthy', async () => {
    const env = mockEnv({ d1Healthy: false });
    const res = await onRequestGet(makeContext(env));
    expect(res.status).toBe(503);
    const body = await readBody(res);
    expect(body.status).toBe('degraded');
    expect(body.checks.d1).toBe('error');
    expect(body.checks.r2).toBe('ok');
    expect(body.checks.workers_ai).toBe('ok');
  });

  it('returns 503 when R2 is unhealthy', async () => {
    const env = mockEnv({ r2Healthy: false });
    const res = await onRequestGet(makeContext(env));
    expect(res.status).toBe(503);
    const body = await readBody(res);
    expect(body.checks.r2).toBe('error');
  });

  it('returns 503 when AI is unhealthy', async () => {
    const env = mockEnv({ aiHealthy: false });
    const res = await onRequestGet(makeContext(env));
    expect(res.status).toBe(503);
    const body = await readBody(res);
    expect(body.checks.workers_ai).toBe('error');
  });

  it('sets cache-control: no-store', async () => {
    const res = await onRequestGet(makeContext());
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
