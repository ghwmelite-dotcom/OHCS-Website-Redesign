const TYPE_CODES: Record<string, string> = {
  recruitment: 'REC',
  rti: 'RTI',
  complaint: 'CMP',
  feedback: 'FBK',
};

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomChars(length: number): string {
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += CHARS[byte % CHARS.length];
  }
  return result;
}

export function generateReferenceNumber(type: string): string {
  const code = TYPE_CODES[type];
  if (!code) {
    throw new Error(`Unknown submission type: ${type}`);
  }

  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');

  const random = randomChars(4);

  return `OHCS-${code}-${date}-${random}`;
}
