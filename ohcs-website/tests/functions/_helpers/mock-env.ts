import { vi } from 'vitest';
import type { Env } from '../../../functions/_shared/types';

export interface MockEnvOverrides {
  d1Healthy?: boolean;
  r2Healthy?: boolean;
  aiHealthy?: boolean;
  db?: D1Database;
}

export function mockEnv(o: MockEnvOverrides = {}): Env {
  const { d1Healthy = true, r2Healthy = true, aiHealthy = true, db } = o;

  const defaultDb = {
    prepare: vi.fn(() => ({
      first: vi.fn(async () => {
        if (!d1Healthy) throw new Error('D1 unavailable');
        return { ok: 1 };
      }),
    })),
  } as unknown as D1Database;

  const uploads = {
    head: vi.fn(async () => {
      if (!r2Healthy) throw new Error('R2 unavailable');
      return null;
    }),
  } as unknown as R2Bucket;

  const ai = {
    run: vi.fn(async () => {
      if (!aiHealthy) throw new Error('AI unavailable');
      return { response: 'ok' };
    }),
  } as unknown as Ai;

  return {
    DB: db ?? defaultDb,
    UPLOADS: uploads,
    AI: ai,
    APP_NAME: 'OHCS Recruitment (Test)',
    APP_ENV: 'development',
    EMAIL_FROM: 'noreply@example.com',
    EMAIL_FROM_NAME: 'Test',
  };
}
