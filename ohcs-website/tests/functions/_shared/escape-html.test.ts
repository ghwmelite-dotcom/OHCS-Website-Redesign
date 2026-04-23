import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../../../functions/_shared/escape-html';

describe('escapeHtml', () => {
  it('escapes the five HTML metacharacters', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
  });

  it("escapes single quote and ampersand", () => {
    expect(escapeHtml("Tom & Jerry's")).toBe('Tom &amp; Jerry&#39;s');
  });

  it('leaves safe text untouched', () => {
    expect(escapeHtml('plain text 123')).toBe('plain text 123');
  });

  it('escapes ampersand once (no double-encoding of pre-escaped entities)', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});
