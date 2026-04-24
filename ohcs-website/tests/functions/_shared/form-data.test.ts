import { describe, it, expect } from 'vitest';
import { extractPhone, extractFullName } from '../../../functions/_shared/form-data';

describe('extractPhone', () => {
  it('returns the phone string when present', () => {
    expect(extractPhone(JSON.stringify({ phone: '+233241234567' }))).toBe('+233241234567');
  });

  it('returns null on null/empty form_data', () => {
    expect(extractPhone(null)).toBeNull();
    expect(extractPhone('')).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    expect(extractPhone('not json')).toBeNull();
  });

  it('returns null when phone is empty string or missing', () => {
    expect(extractPhone(JSON.stringify({ phone: '   ' }))).toBeNull();
    expect(extractPhone(JSON.stringify({}))).toBeNull();
  });
});

describe('extractFullName', () => {
  it('returns full_name when present and non-empty', () => {
    expect(extractFullName(JSON.stringify({ full_name: 'Akua Mensah' }))).toBe('Akua Mensah');
  });

  it('returns null when missing', () => {
    expect(extractFullName(JSON.stringify({}))).toBeNull();
    expect(extractFullName(null)).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    expect(extractFullName('not json')).toBeNull();
  });
});
