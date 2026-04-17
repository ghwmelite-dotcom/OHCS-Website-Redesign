import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickServices } from '@/components/home/quick-services';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>{children as React.ReactNode}</a>
  ),
}));

vi.mock('@/hooks/use-scroll-reveal', () => ({
  useScrollReveal: () => ({ ref: { current: null }, isVisible: true }),
}));

describe('QuickServices', () => {
  it('renders the section heading', () => {
    render(<QuickServices />);
    expect(
      screen.getByRole('heading', { name: /How Can We Help You/i }),
    ).toBeDefined();
  });

  it('renders the section subtext', () => {
    render(<QuickServices />);
    expect(
      screen.getByText(/Access key civil service resources/i),
    ).toBeDefined();
  });

  it('renders all 4 service cards', () => {
    render(<QuickServices />);
    expect(screen.getByText('Recruitment')).toBeDefined();
    expect(screen.getByText('Right to Information')).toBeDefined();
    expect(screen.getByText('Complaints & Feedback')).toBeDefined();
    expect(screen.getByText('Publications & Downloads')).toBeDefined();
  });

  it('renders service descriptions', () => {
    render(<QuickServices />);
    expect(
      screen.getByText(/Apply for civil service positions/i),
    ).toBeDefined();
    expect(screen.getByText(/Submit RTI requests/i)).toBeDefined();
  });

  it('links each card to the correct service page', () => {
    render(<QuickServices />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/services/recruitment');
    expect(hrefs).toContain('/services/rti');
    expect(hrefs).toContain('/services/complaints');
    expect(hrefs).toContain('/publications');
  });

  it('has an accessible section with aria-labelledby', () => {
    const { container } = render(<QuickServices />);
    const section = container.querySelector('section');
    expect(section?.getAttribute('aria-labelledby')).toBe('services-heading');
  });

  it('renders icons as aria-hidden', () => {
    const { container } = render(<QuickServices />);
    const hiddenSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(hiddenSvgs.length).toBeGreaterThanOrEqual(4);
  });
});
