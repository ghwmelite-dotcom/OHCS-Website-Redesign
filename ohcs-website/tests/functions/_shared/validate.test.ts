import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseBody } from '../../../functions/_shared/validate';

function jsonRequest(body: unknown): Request {
  return new Request('https://example.com/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const schema = z.object({ name: z.string().min(1), count: z.number().int().nonnegative() });

describe('parseBody', () => {
  it('returns parsed value on valid input', async () => {
    const result = await parseBody(jsonRequest({ name: 'kofi', count: 3 }), schema);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value).toEqual({ name: 'kofi', count: 3 });
    }
  });

  it('returns 400 on schema violation', async () => {
    const result = await parseBody(jsonRequest({ name: '', count: -1 }), schema);
    expect(result.kind).toBe('reject');
    if (result.kind === 'reject') {
      expect(result.response.status).toBe(400);
      const body = (await result.response.json()) as { error: string; issues: unknown[] };
      expect(body.error).toBe('invalid request body');
      expect(Array.isArray(body.issues)).toBe(true);
    }
  });

  it('returns 400 on malformed JSON', async () => {
    const req = new Request('https://example.com/x', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    const result = await parseBody(req, schema);
    expect(result.kind).toBe('reject');
  });
});
