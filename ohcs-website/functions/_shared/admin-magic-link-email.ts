// Distinct admin sign-in template — visually clear that this is for
// staff access to the admin portal, not the applicant flow.

export interface AdminMagicLinkEmailBody {
  subject: string;
  html: string;
  text: string;
}

export function adminMagicLinkEmail(
  resumeUrl: string,
  ttlMinutes: number = 15,
): AdminMagicLinkEmailBody {
  const subject = 'OHCS Admin Sign-In Link — action required';
  const html = `<!doctype html><html><body style="font-family: Arial, sans-serif; color: #1a1a1a; line-height: 1.5; max-width: 580px; margin: 0 auto; padding: 24px;">
<p style="font-size: 18px; font-weight: bold; color: #1B5E20;">OHCS Admin Sign-In</p>
<p>Click the link below to sign in to the OHCS Admin Portal. This link is valid for <strong>${ttlMinutes} minutes</strong> and can be used <strong>once</strong>.</p>
<p style="margin: 24px 0;"><a href="${resumeUrl}" style="background:#1B5E20;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Sign in to OHCS Admin</a></p>
<p style="font-size: 13px; color: #5C5549;">If you did not request this link, please ignore this email and notify the OHCS IT team. No further action is required — the link will expire automatically.</p>
<hr style="border: none; border-top: 1px solid #E5DDD0; margin: 24px 0;">
<p style="font-size: 12px; color: #5C5549;">Office of the Head of the Civil Service · Republic of Ghana</p>
</body></html>`;
  const text = `OHCS Admin Sign-In

Click the link below to sign in to the OHCS Admin Portal. Valid for ${ttlMinutes} minutes, single-use.

${resumeUrl}

If you did not request this link, please ignore this email and notify the OHCS IT team.

Office of the Head of the Civil Service · Republic of Ghana`;
  return { subject, html, text };
}
