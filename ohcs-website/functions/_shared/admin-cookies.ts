const COOKIE_NAME = 'admin_session';

export function buildSetAdminSessionCookie(
  sessionId: string,
  maxAgeSeconds: number,
): string {
  return [
    `${COOKIE_NAME}=${sessionId}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

export function buildClearAdminSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function parseAdminSessionId(request: Request): string | null {
  const header = request.headers.get('cookie') ?? request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq);
    if (name === COOKIE_NAME) {
      const value = part.slice(eq + 1);
      return value.length > 0 ? value : null;
    }
  }
  return null;
}
