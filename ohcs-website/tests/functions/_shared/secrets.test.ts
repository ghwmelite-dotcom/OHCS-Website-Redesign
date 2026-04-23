import { describe, it, expect } from 'vitest';
import { requireSecret, MissingSecretError } from '../../../functions/_shared/secrets';

describe('requireSecret', () => {
  it('returns the value when the secret is set', () => {
    expect(requireSecret({ FOO: 'bar' }, 'FOO')).toBe('bar');
  });

  it('throws MissingSecretError when the secret is undefined', () => {
    expect(() => requireSecret({}, 'FOO')).toThrowError(MissingSecretError);
  });

  it('throws MissingSecretError when the secret is empty', () => {
    expect(() => requireSecret({ FOO: '' }, 'FOO')).toThrowError(MissingSecretError);
  });

  it('throws MissingSecretError when the secret is the wrong type', () => {
    expect(() => requireSecret({ FOO: 123 }, 'FOO')).toThrowError(MissingSecretError);
  });

  it('the thrown error carries the missing key name', () => {
    try {
      requireSecret({}, 'BAZ');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(MissingSecretError);
      expect((err as MissingSecretError).key).toBe('BAZ');
    }
  });
});
