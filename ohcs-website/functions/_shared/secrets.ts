// Lookup an env-bound secret and throw a typed error if it isn't set.
// Endpoints that depend on a secret should call this once at the top so
// they hard-fail (500) rather than silently fall through to a dev value.

export class MissingSecretError extends Error {
  constructor(public readonly key: string) {
    super(`server misconfigured: ${key} is not set`);
    this.name = 'MissingSecretError';
  }
}

export function requireSecret(env: Record<string, unknown>, key: string): string {
  const v = env[key];
  if (typeof v !== 'string' || v.length === 0) {
    throw new MissingSecretError(key);
  }
  return v;
}
