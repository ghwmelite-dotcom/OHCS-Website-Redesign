import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewsEventsSection } from '@/components/home/news-events-section';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>{children as React.ReactNode}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, priority: _priority, alt, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={typeof alt === 'string' ? alt : ''} {...rest} />;
  },
}));

vi.mock('@/hooks/use-scroll-reveal', () => ({
  useScrollReveal: () => ({ ref: { current: null }, isVisible: true }),
}));

describe('NewsEventsSection', () => {
  it('renders the Latest News heading', () => {
    render(<NewsEventsSection />);
    expect(screen.getByRole('heading', { name: /Latest News/i })).toBeDefined();
  });

  it('renders the Upcoming Events heading', () => {
    render(<NewsEventsSection />);
    expect(screen.getByRole('heading', { name: /Upcoming Events/i })).toBeDefined();
  });

  it('renders 3 news article titles', () => {
    render(<NewsEventsSection />);
    expect(screen.getByText(/Nigeria's Federal Civil Service/i)).toBeDefined();
    expect(screen.getByText(/2026 Civil Service Training Programme/i)).toBeDefined();
    expect(screen.getByText(/Public Sector Reforms Agenda/i)).toBeDefined();
  });

  it('renders 3 event titles', () => {
    render(<NewsEventsSection />);
    expect(screen.getByText(/Civil Service Week 2026/i)).toBeDefined();
    expect(screen.getByText(/Digital Governance Workshop/i)).toBeDefined();
    expect(screen.getByText(/Quarterly Civil Service Council/i)).toBeDefined();
  });

  it('renders View all links for both sections', () => {
    render(<NewsEventsSection />);
    const viewAllLinks = screen.getAllByText(/View all/i);
    expect(viewAllLinks).toHaveLength(2);
  });

  it('links news View all to /news', () => {
    render(<NewsEventsSection />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/news');
    expect(hrefs).toContain('/events');
  });

  it('renders event locations', () => {
    render(<NewsEventsSection />);
    expect(screen.getByText(/Accra International Conference Centre/i)).toBeDefined();
    expect(screen.getByText(/GIMPA Campus/i)).toBeDefined();
  });
});
