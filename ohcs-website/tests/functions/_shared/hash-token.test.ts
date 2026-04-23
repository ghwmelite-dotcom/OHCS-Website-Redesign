// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { hashToken } from '../../../functions/_shared/hash-token';

describe('hashToken', () => {
  it('produces a 64-char lowercase hex digest', async () => {
    const h = await hashToken('any-token');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', async () => {
    const a = await hashToken('same');
    const b = await hashToken('same');
    expect(a).toBe(b);
  });

  it('produces different digests for different inputs', async () => {
    const a = await hashToken('token-1');
    const b = await hashToken('token-2');
    expect(a).not.toBe(b);
  });

  it('matches a known SHA-256 vector for "abc"', async () => {
    expect(await hashToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
