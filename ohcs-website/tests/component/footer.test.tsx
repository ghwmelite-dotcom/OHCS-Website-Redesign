import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/footer';

describe('Footer', () => {
  it('renders OHCS name', () => {
    render(<Footer />);
    // OHCS is rendered letter-by-letter in AnimatedLogo
    expect(screen.getByLabelText(/Home/i)).toBeDefined();
  });

  it('renders contact section heading', () => {
    render(<Footer />);
    expect(screen.getByRole('heading', { name: /Get in Touch/i })).toBeDefined();
  });

  it('renders quick links section heading', () => {
    render(<Footer />);
    expect(screen.getByRole('heading', { name: /Quick Links/i })).toBeDefined();
  });

  it('renders copyright notice with current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeDefined();
  });

  it('renders social media links', () => {
    render(<Footer />);
    expect(screen.getByLabelText('Facebook')).toBeDefined();
    expect(screen.getByLabelText('X (Twitter)')).toBeDefined();
    expect(screen.getByLabelText('Instagram')).toBeDefined();
  });

  it('renders contact details', () => {
    render(<Footer />);
    expect(screen.getByText(/info@ohcs\.gov\.gh/)).toBeDefined();
    expect(screen.getByText(/\+233/)).toBeDefined();
  });

  it('renders policy navigation', () => {
    render(<Footer />);
    expect(screen.getByRole('navigation', { name: /Policy links/i })).toBeDefined();
  });
});
