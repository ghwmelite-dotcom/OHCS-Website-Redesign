import { describe, it, expect } from 'vitest';
import { complaintFormSchema, trackFormSchema } from '@/lib/validations';

describe('complaintFormSchema', () => {
  it('accepts valid complaint data', () => {
    const result = complaintFormSchema.safeParse({
      name: 'Kwame Asante',
      email: 'kwame@example.com',
      phone: '0241234567',
      subject: 'Service delay',
      body: 'I experienced a significant delay when processing my request at the regional office.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = complaintFormSchema.safeParse({ name: '', body: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = complaintFormSchema.safeParse({
      name: 'Kwame',
      email: 'not-an-email',
      body: 'My complaint details here.',
    });
    expect(result.success).toBe(false);
  });
});

describe('trackFormSchema', () => {
  it('accepts valid reference number with email', () => {
    const result = trackFormSchema.safeParse({
      referenceNumber: 'OHCS-CMP-20260416-A7F3',
      contact: 'kwame@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid reference number with phone', () => {
    const result = trackFormSchema.safeParse({
      referenceNumber: 'OHCS-RTI-20260416-B2D1',
      contact: '0241234567',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty reference number', () => {
    const result = trackFormSchema.safeParse({
      referenceNumber: '',
      contact: 'kwame@example.com',
    });
    expect(result.success).toBe(false);
  });
});
