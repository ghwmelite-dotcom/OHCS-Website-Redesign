/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  AI: Ai;
  APP_NAME: string;
  APP_ENV: 'production' | 'preview' | 'development';
  EMAIL_FROM: string;
  EMAIL_FROM_NAME: string;
  RESEND_API_KEY?: string;
}

export type PagesFunction<E = Env, P extends string = string> = (context: {
  request: Request;
  env: E;
  params: Record<P, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  data: Record<string, unknown>;
}) => Response | Promise<Response>;
