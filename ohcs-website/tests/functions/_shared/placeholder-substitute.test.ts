import { describe, it, expect } from 'vitest';
import {
  substitutePlaceholders,
  type PlaceholderContext,
} from '../../../functions/_shared/placeholder-substitute';

const ctx: PlaceholderContext = {
  name: 'Akua Mensah',
  email: 'akua@example.com',
  reference_number: 'OHCS-2026-00007',
  exercise_name: '2026 Graduate Entrance Examination',
  status: 'Vetting Passed',
  appeal_deadline: '2026-05-01',
};

describe('substitutePlaceholders', () => {
  it('substitutes {{name}}', () => {
    expect(substitutePlaceholders('Hi {{name}}, welcome.', ctx, false)).toBe(
      'Hi Akua Mensah, welcome.',
    );
  });

  it('substitutes {{reference_number}} and {{exercise_name}}', () => {
    expect(
      substitutePlaceholders('Ref {{reference_number}} for {{exercise_name}}.', ctx, false),
    ).toBe('Ref OHCS-2026-00007 for 2026 Graduate Entrance Examination.');
  });

  it('passes unknown placeholders through verbatim', () => {
    expect(substitutePlaceholders('Hello {{unknown_field}}', ctx, false)).toBe(
      'Hello {{unknown_field}}',
    );
  });

  it('substitutes empty string for null appeal_deadline', () => {
    expect(
      substitutePlaceholders('Deadline: {{appeal_deadline}}', { ...ctx, appeal_deadline: null }, false),
    ).toBe('Deadline: ');
  });

  it('escapes HTML inside substitutions when isHtml=true', () => {
    expect(
      substitutePlaceholders('Hello {{name}}', { ...ctx, name: '<script>alert("x")</script>' }, true),
    ).toBe('Hello &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });

  it('does NOT escape HTML when isHtml=false (plain text)', () => {
    expect(
      substitutePlaceholders('Hello {{name}}', { ...ctx, name: '<b>x</b>' }, false),
    ).toBe('Hello <b>x</b>');
  });

  it('handles multiple occurrences of the same placeholder', () => {
    expect(
      substitutePlaceholders('{{name}}, your name is {{name}}.', ctx, false),
    ).toBe('Akua Mensah, your name is Akua Mensah.');
  });
});
