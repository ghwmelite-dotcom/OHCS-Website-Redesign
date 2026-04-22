export type SniffMime = 'application/pdf' | 'image/jpeg' | 'image/png';

export interface ValidateInput {
  claimedMime: string;
  sizeBytes: number;
  acceptedMimes: string[];
  maxBytes: number;
  head: Uint8Array;
}

export type ValidateResult =
  | { kind: 'ok' }
  | { kind: 'reject'; reason: string };

export function sniffMime(head: Uint8Array): SniffMime | null {
  if (
    head.length >= 4 &&
    head[0] === 0x25 &&
    head[1] === 0x50 &&
    head[2] === 0x44 &&
    head[3] === 0x46
  ) {
    return 'application/pdf';
  }
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    head.length >= 8 &&
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47 &&
    head[4] === 0x0d &&
    head[5] === 0x0a &&
    head[6] === 0x1a &&
    head[7] === 0x0a
  ) {
    return 'image/png';
  }
  return null;
}

export function validateFile(input: ValidateInput): ValidateResult {
  if (!input.acceptedMimes.includes(input.claimedMime)) {
    return {
      kind: 'reject',
      reason: `mime not accepted: ${input.claimedMime}; expected one of ${input.acceptedMimes.join(', ')}`,
    };
  }
  if (input.sizeBytes > input.maxBytes) {
    return {
      kind: 'reject',
      reason: `file too large: ${input.sizeBytes} bytes (max ${input.maxBytes})`,
    };
  }
  const sniffed = sniffMime(input.head);
  if (sniffed && sniffed !== input.claimedMime) {
    return {
      kind: 'reject',
      reason: `mime mismatch: claimed ${input.claimedMime}, sniffed ${sniffed}`,
    };
  }
  return { kind: 'ok' };
}
