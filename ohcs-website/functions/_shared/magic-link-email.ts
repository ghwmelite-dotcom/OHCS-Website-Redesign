export interface MagicLinkEmailBody {
  subject: string;
  html: string;
  text: string;
}

export function magicLinkEmail(resumeUrl: string): MagicLinkEmailBody {
  const subject = 'Continue your OHCS Recruitment application';
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #006633; margin: 0 0 16px;">OHCS Recruitment</h2>
      <p>Click the button below to continue or resume your application. The link expires in 30 minutes.</p>
      <p style="margin: 32px 0;">
        <a href="${resumeUrl}" style="display: inline-block; padding: 12px 24px; background: #006633; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Continue Application
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 13px;">${resumeUrl}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      <p style="color: #6b7280; font-size: 13px;">If you didn't request this email, you can safely ignore it. OHCS will never ask for your password or payment.</p>
    </div>
  `;
  const text = `OHCS Recruitment

Click the link below to continue or resume your application. The link expires in 30 minutes.

${resumeUrl}

If you didn't request this email, you can safely ignore it. OHCS will never ask for your password or payment.`;
  return { subject, html, text };
}
