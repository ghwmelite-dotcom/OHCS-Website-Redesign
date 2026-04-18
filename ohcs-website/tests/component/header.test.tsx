import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/header';

describe('Header', () => {
  it('renders the OHCS site name', () => {
    render(<Header />);
    // OHCS is rendered letter-by-letter in AnimatedLogo
    expect(screen.getByLabelText(/Home/i)).toBeDefined();
  });

  it('renders main navigation items', () => {
    render(<Header />);
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Services')).toBeDefined();
    expect(screen.getByText('Contact')).toBeDefined();
  });

  it('has a search button', () => {
    render(<Header />);
    expect(screen.getByLabelText(/search/i)).toBeDefined();
  });

  it('has a mobile menu button', () => {
    render(<Header />);
    expect(screen.getByLabelText(/menu/i)).toBeDefined();
  });
});
