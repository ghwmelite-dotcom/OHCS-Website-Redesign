import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeadershipSpotlight } from '@/components/home/leadership-spotlight';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props;
    return <img {...rest} />;
  },
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>{children as React.ReactNode}</a>
  ),
}));

vi.mock('@/hooks/use-scroll-reveal', () => ({
  useScrollReveal: () => ({ ref: { current: null }, isVisible: true }),
}));

describe('LeadershipSpotlight', () => {
  it('renders the section heading', () => {
    render(<LeadershipSpotlight />);
    expect(screen.getByRole('heading', { name: /Our Leadership/i })).toBeDefined();
  });

  it('renders the Head of Civil Service name', () => {
    render(<LeadershipSpotlight />);
    expect(screen.getByText('Evans Aggrey-Darkoh, Ph.D.')).toBeDefined();
  });

  it('renders the Chief Director name', () => {
    render(<LeadershipSpotlight />);
    expect(screen.getByText('Mr. Sylvanus Kofi Adzornu')).toBeDefined();
  });

  it('renders both titles', () => {
    render(<LeadershipSpotlight />);
    expect(screen.getByText(/Head of the Civil Service/i)).toBeDefined();
    expect(screen.getByText(/Chief Director/i)).toBeDefined();
  });

  it('renders the View all leadership link', () => {
    render(<LeadershipSpotlight />);
    const link = screen.getByRole('link', { name: /View all leadership/i });
    expect(link.getAttribute('href')).toBe('/about/leadership');
  });

  it('renders leader photos', () => {
    const { container } = render(<LeadershipSpotlight />);
    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThanOrEqual(2);
  });
});
