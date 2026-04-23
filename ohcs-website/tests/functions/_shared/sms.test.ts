import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendSms } from '../../../functions/_shared/sms';
import { mockEnv } from '../_helpers/mock-env';

describe('sendSms', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs and returns when HUBTEL_SMS_API_KEY is not set (dev mode)', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await sendSms(mockEnv(), { to: '+233241234567', message: 'Hello' });
    expect(consoleSpy).toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('posts to Hubtel SMS API when key is set', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ Status: 0 }), { status: 200 }),
    );
    const env = { ...mockEnv(), HUBTEL_SMS_API_KEY: 'test-key', HUBTEL_SMS_FROM: 'OHCS' };
    await sendSms(env, { to: '+233241234567', message: 'Hello' });
    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    const url = call[0];
    const init = call[1];
    expect(url).toContain('hubtel.com');
    expect(init.headers.Authorization).toMatch(/^Basic /);
    const body = JSON.parse(init.body) as { From: string; To: string; Content: string };
    expect(body.To).toBe('+233241234567');
    expect(body.Content).toBe('Hello');
    expect(body.From).toBe('OHCS');
  });

  it('throws when Hubtel returns non-2xx', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response('rejected', { status: 401 }),
    );
    const env = { ...mockEnv(), HUBTEL_SMS_API_KEY: 'test-key', HUBTEL_SMS_FROM: 'OHCS' };
    await expect(
      sendSms(env, { to: '+233241234567', message: 'X' }),
    ).rejects.toThrow(/hubtel sms failed \(401\)/i);
  });
});
