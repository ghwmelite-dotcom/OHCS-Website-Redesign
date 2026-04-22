export interface SubmitEmailBody {
  subject: string;
  html: string;
  text: string;
}

export function submitEmail(referenceNumber: string, trackUrl: string): SubmitEmailBody {
  const subject = `OHCS Recruitment — application ${referenceNumber} received`;
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #006633; margin: 0 0 16px;">Application received</h2>
      <p>Thank you for applying. We've received your application and it will move into screening shortly.</p>
      <p style="margin: 24px 0;">
        <strong>Reference number:</strong>
        <span style="font-family: ui-monospace, monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${referenceNumber}</span>
      </p>
      <p>You can check status any time at:</p>
      <p style="margin: 16px 0;"><a href="${trackUrl}" style="color: #006633;">${trackUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      <p style="color: #6b7280; font-size: 13px;">Keep this email for your records. OHCS will contact you on the address you provided if you are shortlisted.</p>
    </div>`;
  const text = `OHCS Recruitment — application received

Reference number: ${referenceNumber}

Check status: ${trackUrl}

Keep this email for your records. OHCS will contact you on the address you provided if you are shortlisted.`;
  return { subject, html, text };
}
