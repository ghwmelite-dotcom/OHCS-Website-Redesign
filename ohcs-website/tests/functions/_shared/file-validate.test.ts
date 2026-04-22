import { describe, it, expect } from 'vitest';
import { sniffMime, validateFile } from '../../../functions/_shared/file-validate';

const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RANDOM = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

describe('sniffMime', () => {
  it('detects PDF', () => expect(sniffMime(PDF_MAGIC)).toBe('application/pdf'));
  it('detects JPEG', () => expect(sniffMime(JPEG_MAGIC)).toBe('image/jpeg'));
  it('detects PNG', () => expect(sniffMime(PNG_MAGIC)).toBe('image/png'));
  it('returns null for unrecognised bytes', () => expect(sniffMime(RANDOM)).toBeNull());
});

describe('validateFile', () => {
  it('passes when MIME, sniff, and size all match', () => {
    const r = validateFile({
      claimedMime: 'application/pdf',
      sizeBytes: 1024,
      acceptedMimes: ['application/pdf', 'image/jpeg'],
      maxBytes: 5 * 1024 * 1024,
      head: PDF_MAGIC,
    });
    expect(r.kind).toBe('ok');
  });

  it('rejects when claimed MIME is not in accepted list', () => {
    const r = validateFile({
      claimedMime: 'image/gif',
      sizeBytes: 1024,
      acceptedMimes: ['application/pdf'],
      maxBytes: 5_000_000,
      head: PDF_MAGIC,
    });
    expect(r.kind).toBe('reject');
    if (r.kind === 'reject') expect(r.reason).toMatch(/mime/i);
  });

  it('rejects when oversized', () => {
    const r = validateFile({
      claimedMime: 'application/pdf',
      sizeBytes: 6 * 1024 * 1024,
      acceptedMimes: ['application/pdf'],
      maxBytes: 5 * 1024 * 1024,
      head: PDF_MAGIC,
    });
    expect(r.kind).toBe('reject');
    if (r.kind === 'reject') expect(r.reason).toMatch(/size|too large/i);
  });

  it('rejects when sniffed MIME does not match claimed', () => {
    const r = validateFile({
      claimedMime: 'application/pdf',
      sizeBytes: 1024,
      acceptedMimes: ['application/pdf'],
      maxBytes: 5_000_000,
      head: JPEG_MAGIC,
    });
    expect(r.kind).toBe('reject');
    if (r.kind === 'reject') expect(r.reason).toMatch(/mismatch|sniff/i);
  });
});
