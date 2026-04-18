import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DirectoratesGrid } from '@/components/home/directorates-grid';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>{children as React.ReactNode}</a>
  ),
}));

vi.mock('@/hooks/use-scroll-reveal', () => ({
  useScrollReveal: () => ({ ref: { current: null }, isVisible: true }),
}));

describe('DirectoratesGrid', () => {
  it('renders the section heading', () => {
    render(<DirectoratesGrid />);
    expect(screen.getByRole('heading', { name: /Directorates/i })).toBeDefined();
  });

  it('renders all 5 directorates', () => {
    render(<DirectoratesGrid />);
    expect(screen.getByText('Career Management Directorate')).toBeDefined();
    expect(screen.getByText(/Finance & Administration/)).toBeDefined();
    expect(screen.getByText(/Research, Statistics/)).toBeDefined();
    expect(screen.getByText(/Planning, Budgeting/)).toBeDefined();
    expect(screen.getByText(/Recruitment, Training/)).toBeDefined();
  });

  it('renders short names', () => {
    render(<DirectoratesGrid />);
    expect(screen.getByText('CMD')).toBeDefined();
    expect(screen.getByText('RTDD')).toBeDefined();
  });

  it('links each card to the directorate page', () => {
    render(<DirectoratesGrid />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/directorates/career-management');
    expect(hrefs).toContain('/directorates/recruitment-training');
  });

  it('renders the View all link', () => {
    render(<DirectoratesGrid />);
    const link = screen.getByRole('link', { name: /View all/i });
    expect(link.getAttribute('href')).toBe('/directorates');
  });

  it('has an accessible section with aria-labelledby', () => {
    const { container } = render(<DirectoratesGrid />);
    const section = container.querySelector('section');
    expect(section?.getAttribute('aria-labelledby')).toBe('directorates-heading');
  });
});
