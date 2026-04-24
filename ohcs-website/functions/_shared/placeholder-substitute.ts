// Render a template body by substituting {{placeholder}} tokens against
// a strict allowlist. Unknown placeholders pass through verbatim so admins
// see the literal token in the rendered output and can fix the typo.
//
// When isHtml=true, every substituted value is HTML-escaped before
// insertion. When false (plain text), values are inserted as-is.

import { escapeHtml } from './escape-html';

export interface PlaceholderContext {
  name: string;
  email: string;
  reference_number: string;
  exercise_name: string;
  status: string;
  appeal_deadline: string | null;
}

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

export function substitutePlaceholders(
  template: string,
  ctx: PlaceholderContext,
  isHtml: boolean,
): string {
  return template.replace(PLACEHOLDER_RE, (match, key: string) => {
    if (!(key in ctx)) return match; // unknown — pass through
    const value = ctx[key as keyof PlaceholderContext];
    const str = value === null ? '' : String(value);
    return isHtml ? escapeHtml(str) : str;
  });
}
