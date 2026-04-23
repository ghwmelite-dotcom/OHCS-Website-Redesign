// Escapes the five characters that have meaning in HTML element/attribute
// context. Use on any user- or admin-supplied text before interpolating
// into an outbound email HTML body.

const REPLACEMENTS: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => REPLACEMENTS[ch] ?? ch);
}
