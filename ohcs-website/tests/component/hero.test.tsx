import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/home/hero';

// Mock next/image to render a plain img
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>{children as React.ReactNode}</a>
  ),
}));

describe('Hero', () => {

  it('renders the first slide headline', () => {
    render(<Hero />);
    expect(screen.getByText(/Serving Ghana's/)).toBeDefined();
    expect(screen.getByText(/Public Sector/)).toBeDefined();
  });

  it('renders the eyebrow text', () => {
    render(<Hero />);
    expect(screen.getByText('Republic of Ghana')).toBeDefined();
  });

  it('renders both CTA buttons', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: /Find a Service/ })).toBeDefined();
    expect(screen.getByRole('link', { name: /Track Submission/ })).toBeDefined();
  });

  it('renders 3 slide indicators', () => {
    render(<Hero />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('marks the first indicator as selected', () => {
    render(<Hero />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('false');
  });

  it('has a polite aria-live region', () => {
    render(<Hero />);
    const region = screen.getByRole('region', { name: /Hero/i });
    expect(region.getAttribute('aria-live')).toBe('polite');
  });

  it('renders decorative elements as aria-hidden', () => {
    const { container } = render(<Hero />);
    const decorative = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorative.length).toBeGreaterThanOrEqual(4);
  });
});
