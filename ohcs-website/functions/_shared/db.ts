import type { Env } from './types';

export interface RowOf<T> {
  results: T[];
  meta?: Record<string, unknown>;
}

export async function first<T>(
  env: Env,
  sql: string,
  ...binds: unknown[]
): Promise<T | null> {
  return (await env.DB.prepare(sql).bind(...binds).first<T>()) ?? null;
}

export async function all<T>(
  env: Env,
  sql: string,
  ...binds: unknown[]
): Promise<T[]> {
  const result = await env.DB.prepare(sql).bind(...binds).all<T>();
  return result.results ?? [];
}

export async function run(
  env: Env,
  sql: string,
  ...binds: unknown[]
): Promise<void> {
  await env.DB.prepare(sql).bind(...binds).run();
}

export async function batch(env: Env, statements: D1PreparedStatement[]): Promise<void> {
  await env.DB.batch(statements);
}
