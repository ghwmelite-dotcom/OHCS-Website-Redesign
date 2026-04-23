// SHA-256 hex digest of a string. Used to store magic-link tokens at rest
// so a read-only D1 dump never yields active session-grant tokens.

export async function hashToken(raw: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(raw));
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}
