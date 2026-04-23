// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { hmacSign, hmacVerify, constantTimeEquals } from '../../../functions/_shared/hmac';

describe('hmacSign / hmacVerify', () => {
  it('round-trips a payload with the same secret', async () => {
    const sig = await hmacSign('test-secret', 'app-1:doc-1:1700000000');
    expect(sig).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await hmacVerify('test-secret', 'app-1:doc-1:1700000000', sig)).toBe(true);
  });

  it('rejects a tampered payload', async () => {
    const sig = await hmacSign('test-secret', 'app-1:doc-1:1700000000');
    expect(await hmacVerify('test-secret', 'app-1:doc-2:1700000000', sig)).toBe(false);
  });

  it('rejects a wrong secret', async () => {
    const sig = await hmacSign('secret-a', 'payload');
    expect(await hmacVerify('secret-b', 'payload', sig)).toBe(false);
  });

  it('produces deterministic output for the same input', async () => {
    const a = await hmacSign('s', 'p');
    const b = await hmacSign('s', 'p');
    expect(a).toBe(b);
  });
});

describe('constantTimeEquals', () => {
  it('returns true for identical strings', () => {
    expect(constantTimeEquals('hello', 'hello')).toBe(true);
  });

  it('returns false for different strings of the same length', () => {
    expect(constantTimeEquals('hello', 'world')).toBe(false);
  });

  it('returns false for strings of different length without short-circuiting', () => {
    expect(constantTimeEquals('short', 'longer')).toBe(false);
  });

  it('returns true for two empty strings', () => {
    expect(constantTimeEquals('', '')).toBe(true);
  });
});
