# Quick Services Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-card Quick Services section below the hero with staggered scroll-reveal animation and Kente hover accents.

**Architecture:** Single presentational client component using the existing `Card` (with `hoverable` + `kenteAccent` props), `KenteAccent` divider, and `useScrollReveal` hook. Service data is a hardcoded array. No API, no state management beyond scroll visibility.

**Tech Stack:** React 19, Next.js 16, TypeScript strict, Tailwind v4, Vitest + Testing Library, lucide-react

**Design Spec:** `docs/superpowers/specs/2026-04-17-quick-services-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/components/home/quick-services.tsx` | QuickServices section — heading, 4 service cards in a grid with scroll reveal |
| `tests/component/quick-services.test.tsx` | Component tests for rendering, accessibility, card content |
| `src/app/page.tsx` | Modify: add KenteAccent divider + QuickServices below Hero |
| `src/app/[locale]/page.tsx` | Modify: same as above for locale route |

---

### Task 1: Create QuickServices Component with TDD

**Files:**
- Create: `src/components/home/quick-services.tsx`
- Create: `tests/component/quick-services.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `ohcs-website/tests/component/quick-services.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ohcs-website && npx vitest run tests/component/quick-services.test.tsx`

Expected: FAIL — module `@/components/home/quick-services` not found.

- [ ] **Step 3: Write the QuickServices component**

Create `ohcs-website/src/components/home/quick-services.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { UserPlus, FileText, MessageSquareWarning, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

const services = [
  {
    icon: UserPlus,
    title: 'Recruitment',
    description: 'Apply for civil service positions across Ghana.',
    href: '/services/recruitment',
  },
  {
    icon: FileText,
    title: 'Right to Information',
    description: 'Submit RTI requests for public records and data.',
    href: '/services/rti',
  },
  {
    icon: MessageSquareWarning,
    title: 'Complaints & Feedback',
    description: 'Report issues or share feedback about civil service delivery.',
    href: '/services/complaints',
  },
  {
    icon: Download,
    title: 'Publications & Downloads',
    description: 'Access reports, policies, forms, and circulars.',
    href: '/publications',
  },
];

export function QuickServices() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} aria-labelledby="services-heading" className="py-16 lg:py-24">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            id="services-heading"
            className="font-display text-3xl font-bold text-primary-dark mb-3"
          >
            How Can We Help You?
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            Access key civil service resources and submit requests online.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Link
              key={service.href}
              href={service.href}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
            >
              <Card
                hoverable
                kenteAccent
                className={cn(
                  'h-full text-center p-8',
                  isVisible && 'animate-[reveal_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]',
                  !isVisible && 'opacity-0',
                )}
                style={
                  isVisible ? { animationDelay: `${index * 80}ms` } : undefined
                }
              >
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <service.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                <p className="text-sm text-text-muted">{service.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ohcs-website && npx vitest run tests/component/quick-services.test.tsx`

Expected: 7 tests PASS.

- [ ] **Step 5: Run the full test suite**

Run: `cd ohcs-website && npx vitest run`

Expected: All tests pass (previous 29 + 7 new = 36).

- [ ] **Step 6: Verify TypeScript is clean**

Run: `cd ohcs-website && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add ohcs-website/src/components/home/quick-services.tsx ohcs-website/tests/component/quick-services.test.tsx
git commit -m "feat: add QuickServices grid with 4 service cards and scroll reveal"
```

---

### Task 2: Wire QuickServices into the Homepage

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Update the root homepage**

Replace the contents of `ohcs-website/src/app/page.tsx` with:

```tsx
import { Hero } from '@/components/home/hero';
import { KenteAccent } from '@/components/kente/kente-accent';
import { QuickServices } from '@/components/home/quick-services';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <KenteAccent variant="divider" />
      <QuickServices />
    </main>
  );
}
```

- [ ] **Step 2: Update the locale homepage**

Replace the contents of `ohcs-website/src/app/[locale]/page.tsx` with:

```tsx
import { Hero } from '@/components/home/hero';
import { KenteAccent } from '@/components/kente/kente-accent';
import { QuickServices } from '@/components/home/quick-services';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <KenteAccent variant="divider" />
      <QuickServices />
    </main>
  );
}
```

- [ ] **Step 3: Run full test suite**

Run: `cd ohcs-website && npx vitest run`

Expected: All 36 tests pass.

- [ ] **Step 4: Start dev server and verify visually**

Run: `cd ohcs-website && npm run dev`

Open `http://localhost:3000` in the browser. Verify:
- [ ] Kente divider (6px stripe) appears between hero and services section
- [ ] Section heading "How Can We Help You?" visible
- [ ] 4 cards in a row on desktop (2 on tablet, 1 on mobile)
- [ ] Each card shows icon, title, description
- [ ] Hover: card lifts with Kente gold border on left edge
- [ ] Cards animate in with staggered delay on scroll
- [ ] Clicking a card navigates to its service page
- [ ] Focus ring visible when tabbing through cards

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/src/app/page.tsx ohcs-website/src/app/\[locale\]/page.tsx
git commit -m "feat: wire QuickServices and Kente divider into homepage"
```
