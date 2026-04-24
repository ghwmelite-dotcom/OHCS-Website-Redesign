// Helpers for safely extracting fields from the applications.form_data JSON
// blob. Promoted from inline copies in vetting.ts / appeals/resolve.ts.

export function extractPhone(formDataJson: string | null): string | null {
  if (!formDataJson) return null;
  try {
    const parsed = JSON.parse(formDataJson) as { phone?: unknown };
    if (typeof parsed.phone === 'string' && parsed.phone.trim().length > 0) {
      return parsed.phone.trim();
    }
  } catch {
    // form_data corrupt — caller decides whether to silently skip.
  }
  return null;
}

export function extractFullName(formDataJson: string | null): string | null {
  if (!formDataJson) return null;
  try {
    const parsed = JSON.parse(formDataJson) as { full_name?: unknown };
    if (typeof parsed.full_name === 'string' && parsed.full_name.trim().length > 0) {
      return parsed.full_name.trim();
    }
  } catch {
    // form_data corrupt
  }
  return null;
}
