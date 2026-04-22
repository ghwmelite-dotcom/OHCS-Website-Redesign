import { describe, it, expect } from 'vitest';
import { applicationDocKey, extensionForMime } from '../../../functions/_shared/r2-keys';

describe('extensionForMime', () => {
  it('returns the canonical extension for accepted MIMEs', () => {
    expect(extensionForMime('application/pdf')).toBe('pdf');
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('image/png')).toBe('png');
  });

  it('returns "bin" for unknown MIMEs (defensive)', () => {
    expect(extensionForMime('application/octet-stream')).toBe('bin');
  });
});

describe('applicationDocKey', () => {
  it('builds the canonical R2 key', () => {
    expect(applicationDocKey('ex-001', 'OHCS-2026-00001', 'national_id', 'application/pdf'))
      .toBe('ex-001/OHCS-2026-00001/national_id.pdf');
    expect(applicationDocKey('ex-001', 'OHCS-2026-00001', 'passport_photo', 'image/jpeg'))
      .toBe('ex-001/OHCS-2026-00001/passport_photo.jpg');
  });
});
