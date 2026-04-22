import { describe, it, expect } from 'vitest';
import { generateReference, formatReference } from '../../../functions/_shared/reference-number';
import { mockEnv } from '../_helpers/mock-env';
import { makeD1 } from '../_helpers/d1-mock';

describe('formatReference', () => {
  it('zero-pads to 5 digits', () => {
    expect(formatReference(2026, 1)).toBe('OHCS-2026-00001');
    expect(formatReference(2026, 372)).toBe('OHCS-2026-00372');
    expect(formatReference(2027, 100000)).toBe('OHCS-2027-100000');
  });
});

describe('generateReference', () => {
  it('seeds a new sequence row and returns OHCS-YEAR-00001 on first call', async () => {
    const db = makeD1([
      {
        sql: 'INSERT OR IGNORE INTO sequences (key, last) VALUES (?, 0)',
        binds: ['app_ex-001_2026'],
        run: {},
      },
      {
        sql: 'UPDATE sequences SET last = last + 1 WHERE key = ? RETURNING last',
        binds: ['app_ex-001_2026'],
        first: { last: 1 },
      },
    ]);
    const ref = await generateReference(mockEnv({ db }), 'ex-001', 2026);
    expect(ref).toBe('OHCS-2026-00001');
  });

  it('returns the next number when the sequence already exists', async () => {
    const db = makeD1([
      {
        sql: 'INSERT OR IGNORE INTO sequences (key, last) VALUES (?, 0)',
        binds: ['app_ex-001_2026'],
        run: {},
      },
      {
        sql: 'UPDATE sequences SET last = last + 1 WHERE key = ? RETURNING last',
        binds: ['app_ex-001_2026'],
        first: { last: 372 },
      },
    ]);
    const ref = await generateReference(mockEnv({ db }), 'ex-001', 2026);
    expect(ref).toBe('OHCS-2026-00372');
  });
});
