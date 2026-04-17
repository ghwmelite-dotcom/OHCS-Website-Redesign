import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KenteAccent } from '@/components/kente/kente-accent';

describe('KenteAccent', () => {
  it('renders divider variant', () => {
    render(<KenteAccent variant="divider" />);
    const el = screen.getByRole('separator');
    expect(el).toBeDefined();
    expect(el.className).toContain('kente-divider');
  });

  it('renders header-band variant', () => {
    render(<KenteAccent variant="header-band" />);
    const el = screen.getByTestId('kente-header-band');
    expect(el).toBeDefined();
  });

  it('renders with custom className', () => {
    render(<KenteAccent variant="divider" className="my-8" />);
    const el = screen.getByRole('separator');
    expect(el.className).toContain('my-8');
  });
});
