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
    prepare: vi.fn((sql: string) => {
      let boundArgs: unknown[] = [];
      const stmt = {
        bind: vi.fn((...args: unknown[]) => {
          boundArgs = args;
          return stmt;
        }),
        first: vi.fn(async () => {
          if (!d1Healthy) throw new Error('D1 unavailable');
          // Return null by default so demo-mode check returns false and
          // unauthenticated requests get the expected 401.
          return null;
        }),
        all: vi.fn(async () => {
          if (!d1Healthy) throw new Error('D1 unavailable');
          return { results: [] };
        }),
        run: vi.fn(async () => {
          if (!d1Healthy) throw new Error('D1 unavailable');
          return { meta: { changes: 0 } };
        }),
      };
      return stmt;
    }),
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
