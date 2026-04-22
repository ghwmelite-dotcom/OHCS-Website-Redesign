import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendEmail } from '../../../functions/_shared/email';
import { mockEnv } from '../_helpers/mock-env';

describe('sendEmail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to MailChannels with the expected payload', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(null, { status: 202 }),
    );

    await sendEmail(mockEnv(), {
      to: 'kofi@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      { body: string },
    ];
    const [url, init] = call;
    expect(url).toBe('https://api.mailchannels.net/tx/v1/send');
    const body = JSON.parse(init.body) as {
      personalizations: Array<{ to: Array<{ email: string }> }>;
      from: { email: string; name: string };
      subject: string;
      content: Array<{ type: string; value: string }>;
    };
    expect(body.personalizations[0]!.to[0]!.email).toBe('kofi@example.com');
    expect(body.from.email).toBe('noreply@example.com');
    expect(body.subject).toBe('Hello');
    expect(body.content[0]!.type).toBe('text/html');
    expect(body.content[0]!.value).toBe('<p>Hi</p>');
  });

  it('falls back to Resend on MailChannels 4xx if RESEND_API_KEY is set', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(new Response('rejected', { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'r1' }), { status: 200 }));

    const env = { ...mockEnv(), RESEND_API_KEY: 'test-key' };
    await sendEmail(env, {
      to: 'kofi@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const resendCall = fetchMock.mock.calls[1] as [
      string,
      { headers: { Authorization: string } },
    ];
    expect(resendCall[0]).toBe('https://api.resend.com/emails');
    const resendInit = resendCall[1];
    expect(resendInit.headers.Authorization).toBe('Bearer test-key');
  });

  it('throws when both providers fail', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(new Response('mailchannels failed', { status: 500 }))
      .mockResolvedValueOnce(new Response('resend failed', { status: 500 }));

    const env = { ...mockEnv(), RESEND_API_KEY: 'test-key' };
    await expect(
      sendEmail(env, { to: 'kofi@example.com', subject: 'X', html: '<p>X</p>' }),
    ).rejects.toThrow(/email send failed/i);
  });

  it('throws when MailChannels fails and Resend is not configured', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response('failed', { status: 500 }));

    await expect(
      sendEmail(mockEnv(), { to: 'kofi@example.com', subject: 'X', html: '<p>X</p>' }),
    ).rejects.toThrow(/mailchannels failed/i);
  });
});

describe('sendEmail provider override', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses Resend directly when EMAIL_PROVIDER=resend (skips MailChannels)', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'r1' }), { status: 200 }));

    const env = { ...mockEnv(), EMAIL_PROVIDER: 'resend' as const, RESEND_API_KEY: 'test-key' };
    await sendEmail(env, { to: 'kofi@example.com', subject: 'Hello', html: '<p>Hi</p>' });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]![0]).toBe('https://api.resend.com/emails');
  });

  it('throws when EMAIL_PROVIDER=resend but RESEND_API_KEY is missing', async () => {
    const env = { ...mockEnv(), EMAIL_PROVIDER: 'resend' as const };
    await expect(
      sendEmail(env, { to: 'kofi@example.com', subject: 'X', html: '<p>X</p>' }),
    ).rejects.toThrow(/EMAIL_PROVIDER=resend but RESEND_API_KEY/);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('uses MailChannels only (no Resend fallback) when EMAIL_PROVIDER=mailchannels', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce(new Response('rejected', { status: 401 }));

    const env = { ...mockEnv(), EMAIL_PROVIDER: 'mailchannels' as const, RESEND_API_KEY: 'test-key' };
    await expect(
      sendEmail(env, { to: 'kofi@example.com', subject: 'X', html: '<p>X</p>' }),
    ).rejects.toThrow(/mailchannels failed \(401\)/);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]![0]).toBe('https://api.mailchannels.net/tx/v1/send');
  });
});
