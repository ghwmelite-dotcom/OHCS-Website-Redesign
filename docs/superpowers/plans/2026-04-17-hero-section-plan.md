# Hero Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cinematic 3-slide hero carousel with Kente mesh overlay, floating civic icons, gold bokeh particles, and staggered reveal animations.

**Architecture:** Pure React state machine for slide transitions (no external carousel library). CSS keyframe animations for ambient effects (icons, particles, Ken Burns). The hero is a self-contained client component at `src/components/home/hero.tsx` with slide data defined as a typed constant array. A reusable `useScrollReveal` hook is extracted for later use by other homepage sections.

**Tech Stack:** React 19, Next.js 16, TypeScript strict, Tailwind v4, Vitest + Testing Library

**Design Spec:** `docs/superpowers/specs/2026-04-17-hero-section-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/components/home/hero.tsx` | Main hero carousel — slide state, transitions, all visual layers, CTAs |
| `src/components/home/hero-icons.tsx` | Floating civic icon SVGs — 16 icon components + the FloatingIcons container |
| `src/components/home/hero-particles.tsx` | Gold bokeh particle field — the Particles container with 20 positioned dots |
| `src/hooks/use-scroll-reveal.ts` | Reusable IntersectionObserver hook returning `{ ref, isVisible }` |
| `src/app/globals.css` | Add hero-specific keyframes: `kenBurns`, `floatUp`, `drift`, `heroReveal` |
| `tests/component/hero.test.tsx` | Component tests for hero rendering, slide content, accessibility |
| `tests/unit/use-scroll-reveal.test.ts` | Hook unit test |

---

### Task 1: Add Hero CSS Keyframes to Global Styles

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add hero keyframes before the `@layer base` block**

Add these keyframes after the existing `@keyframes fade-in` block (after line 67) and before `@layer base`:

```css
@keyframes ken-burns {
  from { transform: scale(1); }
  to { transform: scale(1.06); }
}

@keyframes float-up {
  0% {
    transform: translateY(80px) rotate(0deg) scale(0.9);
    opacity: 0;
  }
  6% { opacity: 1; }
  88% { opacity: 1; }
  100% {
    transform: translateY(-650px) rotate(12deg) scale(1.1);
    opacity: 0;
  }
}

@keyframes drift {
  0% {
    transform: translate(0, 0) scale(0.6);
    opacity: 0;
  }
  8% { opacity: var(--max-opacity, 0.7); }
  92% { opacity: var(--max-opacity, 0.7); }
  100% {
    transform: translate(var(--dx, 30px), var(--dy, -200px)) scale(1.3);
    opacity: 0;
  }
}

@keyframes hero-reveal {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes zoom-fade-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.05);
  }
}
```

- [ ] **Step 2: Verify the file parses correctly**

Run: `cd ohcs-website && npx next build --no-lint 2>&1 | head -20`

Expected: No CSS parse errors. (Build may fail for other reasons — that's fine, we only care about CSS.)

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/src/app/globals.css
git commit -m "feat: add hero keyframes — ken-burns, float-up, drift, hero-reveal, zoom-fade-out"
```

---

### Task 2: Create the `useScrollReveal` Hook

**Files:**
- Create: `src/hooks/use-scroll-reveal.ts`
- Create: `tests/unit/use-scroll-reveal.test.ts`

- [ ] **Step 1: Write the failing test**

Create `ohcs-website/tests/unit/use-scroll-reveal.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

describe('useScrollReveal', () => {
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observeMock = vi.fn();
    disconnectMock = vi.fn();

    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((callback: IntersectionObserverCallback) => {
        // Store callback so we can trigger it in tests
        (globalThis as Record<string, unknown>).__ioCallback = callback;
        return { observe: observeMock, disconnect: disconnectMock };
      }),
    );
  });

  it('returns ref and isVisible (initially false)', () => {
    const { result } = renderHook(() => useScrollReveal());
    expect(result.current.isVisible).toBe(false);
    expect(result.current.ref).toBeDefined();
  });

  it('uses the provided threshold', () => {
    renderHook(() => useScrollReveal(0.3));
    expect(IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.3 },
    );
  });

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useScrollReveal());
    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ohcs-website && npx vitest run tests/unit/use-scroll-reveal.test.ts`

Expected: FAIL — module `@/hooks/use-scroll-reveal` not found.

- [ ] **Step 3: Write the hook implementation**

Create `ohcs-website/src/hooks/use-scroll-reveal.ts`:

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ohcs-website && npx vitest run tests/unit/use-scroll-reveal.test.ts`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/src/hooks/use-scroll-reveal.ts ohcs-website/tests/unit/use-scroll-reveal.test.ts
git commit -m "feat: add useScrollReveal hook with IntersectionObserver"
```

---

### Task 3: Create the Floating Civic Icons Component

**Files:**
- Create: `src/components/home/hero-icons.tsx`

- [ ] **Step 1: Create the floating icons component**

Create `ohcs-website/src/components/home/hero-icons.tsx`:

```tsx
/**
 * Floating civic icon SVGs that drift upward through the hero gradient.
 * All icons are decorative — aria-hidden on the container.
 */

const ICON_PATHS: { name: string; size: number; viewBox: string; d: string }[] = [
  {
    name: 'scales',
    size: 32,
    viewBox: '0 0 24 24',
    d: 'M12 2L12 22M4 6L20 6M4 6L2 12C2 12 4 14 7 14C10 14 12 12 12 12M20 6L22 12C22 12 20 14 17 14C14 14 12 12 12 12M2 12L7 12M17 12L22 12',
  },
  {
    name: 'shield',
    size: 28,
    viewBox: '0 0 24 24',
    d: 'M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z',
  },
  {
    name: 'people',
    size: 34,
    viewBox: '0 0 24 24',
    d: 'M9 7a3 3 0 100-6 3 3 0 000 6zM17 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 21v-4c0-2 2-4 6-4s6 2 6 4v4M15 13c2.5 0 6 1 6 4v4',
  },
  {
    name: 'document',
    size: 26,
    viewBox: '0 0 24 24',
    d: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M8 13h8M8 17h5',
  },
  {
    name: 'gear',
    size: 30,
    viewBox: '0 0 24 24',
    d: 'M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  },
  {
    name: 'star',
    size: 24,
    viewBox: '0 0 24 24',
    d: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27l6.91-1.01L12 2z',
  },
  {
    name: 'building',
    size: 30,
    viewBox: '0 0 24 24',
    d: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01',
  },
  {
    name: 'globe',
    size: 28,
    viewBox: '0 0 24 24',
    d: 'M12 12m-10 0a10 10 0 1020 0 10 10 0 10-20 0M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  },
  {
    name: 'handshake',
    size: 32,
    viewBox: '0 0 24 24',
    d: 'M20 8l-6-6H10L4 8M4 8s4 4 8 4 8-4 8-4M8 16l-4 4M16 16l4 4M12 16a2 2 0 100-4 2 2 0 000 4z',
  },
  {
    name: 'book',
    size: 26,
    viewBox: '0 0 24 24',
    d: 'M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2zM9 7h7M9 11h5',
  },
  {
    name: 'award',
    size: 26,
    viewBox: '0 0 24 24',
    d: 'M12 8m-6 0a6 6 0 1012 0 6 6 0 10-12 0M15.477 12.89L17 22l-5-3-5 3 1.523-9.11',
  },
  {
    name: 'flag',
    size: 24,
    viewBox: '0 0 24 24',
    d: 'M4 2v20M4 2h16l-4 5 4 5H4',
  },
  {
    name: 'wreath',
    size: 28,
    viewBox: '0 0 24 24',
    d: 'M6 3C4 5 3 8 3 12s1 7 3 9M18 3c2 2 3 5 3 9s-1 7-3 9M8 4C7 6 6.5 9 6.5 12S7 18 8 20M16 4c1 2 1.5 5 1.5 8S17 18 16 20M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0',
  },
  {
    name: 'compass',
    size: 26,
    viewBox: '0 0 24 24',
    d: 'M12 12m-10 0a10 10 0 1020 0 10 10 0 10-20 0M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z',
  },
  {
    name: 'crown',
    size: 28,
    viewBox: '0 0 24 24',
    d: 'M2 17l2-10 4 4 4-7 4 7 4-4 2 10H2zM4 20h16',
  },
  {
    name: 'torch',
    size: 24,
    viewBox: '0 0 24 24',
    d: 'M12 2s-3 4-3 7a3 3 0 006 0c0-3-3-7-3-7zM12 12v8M8 20h8M10 16h4',
  },
];

/** Staggered layout positions for each icon */
const ICON_LAYOUT: { left: string; duration: string; delay: string }[] = [
  { left: '4%',  duration: '18s', delay: '0s' },
  { left: '11%', duration: '22s', delay: '2s' },
  { left: '19%', duration: '20s', delay: '5s' },
  { left: '27%', duration: '24s', delay: '1s' },
  { left: '34%', duration: '21s', delay: '7s' },
  { left: '7%',  duration: '26s', delay: '4s' },
  { left: '42%', duration: '17s', delay: '6s' },
  { left: '16%', duration: '23s', delay: '9s' },
  { left: '30%', duration: '19s', delay: '1s' },
  { left: '48%', duration: '25s', delay: '3s' },
  { left: '55%', duration: '20s', delay: '8s' },
  { left: '2%',  duration: '27s', delay: '3s' },
  { left: '38%', duration: '18s', delay: '10s' },
  { left: '23%', duration: '22s', delay: '0s' },
  { left: '50%', duration: '24s', delay: '5s' },
  { left: '14%', duration: '19s', delay: '12s' },
];

export function FloatingIcons({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {ICON_PATHS.map((icon, i) => {
        const layout = ICON_LAYOUT[i];
        return (
          <div
            key={icon.name}
            style={{
              position: 'absolute',
              left: layout.left,
              width: icon.size,
              height: icon.size,
              opacity: 0,
              animation: `float-up ${layout.duration} linear ${layout.delay} infinite`,
              filter: 'drop-shadow(0 0 6px rgba(212,160,23,0.25))',
            }}
          >
            <svg
              viewBox={icon.viewBox}
              fill="none"
              stroke="rgba(212,160,23,0.35)"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={icon.d} />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd ohcs-website && npx tsc --noEmit --pretty 2>&1 | grep hero-icons || echo "No errors in hero-icons"`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/src/components/home/hero-icons.tsx
git commit -m "feat: add FloatingIcons — 16 civic SVG icons with drift animation"
```

---

### Task 4: Create the Gold Bokeh Particles Component

**Files:**
- Create: `src/components/home/hero-particles.tsx`

- [ ] **Step 1: Create the particles component**

Create `ohcs-website/src/components/home/hero-particles.tsx`:

```tsx
/**
 * Gold bokeh particle field — 20 glowing dots that float through the hero.
 * All decorative — aria-hidden on the container.
 */

interface ParticleConfig {
  left: string;
  top: string;
  size: number;
  dx: number;
  dy: number;
  maxOpacity: number;
  duration: string;
  delay: string;
}

const PARTICLES: ParticleConfig[] = [
  { left: '6%',  top: '80%', size: 6,  dx: 25,  dy: -380, maxOpacity: 0.7,  duration: '16s', delay: '0s' },
  { left: '14%', top: '90%', size: 5,  dx: -18, dy: -420, maxOpacity: 0.6,  duration: '20s', delay: '2s' },
  { left: '24%', top: '75%', size: 8,  dx: 35,  dy: -350, maxOpacity: 0.75, duration: '18s', delay: '1s' },
  { left: '32%', top: '85%', size: 4,  dx: -12, dy: -400, maxOpacity: 0.55, duration: '22s', delay: '5s' },
  { left: '9%',  top: '95%', size: 9,  dx: 28,  dy: -480, maxOpacity: 0.65, duration: '24s', delay: '3s' },
  { left: '40%', top: '70%', size: 5,  dx: -22, dy: -320, maxOpacity: 0.7,  duration: '17s', delay: '1s' },
  { left: '20%', top: '60%', size: 7,  dx: 18,  dy: -300, maxOpacity: 0.5,  duration: '21s', delay: '7s' },
  { left: '45%', top: '88%', size: 5,  dx: -28, dy: -390, maxOpacity: 0.6,  duration: '19s', delay: '4s' },
  { left: '4%',  top: '65%', size: 8,  dx: 15,  dy: -280, maxOpacity: 0.75, duration: '20s', delay: '6s' },
  { left: '36%', top: '78%', size: 4,  dx: 20,  dy: -340, maxOpacity: 0.5,  duration: '23s', delay: '9s' },
  { left: '50%', top: '92%', size: 6,  dx: -15, dy: -450, maxOpacity: 0.55, duration: '25s', delay: '2s' },
  { left: '17%', top: '72%', size: 5,  dx: 24,  dy: -310, maxOpacity: 0.65, duration: '18s', delay: '8s' },
  { left: '55%', top: '82%', size: 7,  dx: -10, dy: -360, maxOpacity: 0.45, duration: '26s', delay: '1s' },
  { left: '28%', top: '68%', size: 4,  dx: 16,  dy: -280, maxOpacity: 0.7,  duration: '15s', delay: '11s' },
  { left: '60%', top: '75%', size: 5,  dx: -20, dy: -330, maxOpacity: 0.4,  duration: '20s', delay: '4s' },
  { left: '12%', top: '55%', size: 10, dx: 30,  dy: -260, maxOpacity: 0.6,  duration: '22s', delay: '0s' },
  { left: '42%', top: '94%', size: 6,  dx: -14, dy: -440, maxOpacity: 0.65, duration: '19s', delay: '6s' },
  { left: '2%',  top: '85%', size: 7,  dx: 22,  dy: -370, maxOpacity: 0.7,  duration: '21s', delay: '3s' },
  { left: '48%', top: '65%', size: 5,  dx: -18, dy: -290, maxOpacity: 0.5,  duration: '16s', delay: '10s' },
  { left: '33%', top: '58%', size: 8,  dx: 12,  dy: -250, maxOpacity: 0.55, duration: '23s', delay: '7s' },
];

export function GoldParticles({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,160,23,0.8), rgba(212,160,23,0) 70%)',
            boxShadow: `0 0 ${p.size * 2}px rgba(212,160,23,0.3)`,
            opacity: 0,
            animation: `drift ${p.duration} linear ${p.delay} infinite`,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--max-opacity': p.maxOpacity,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd ohcs-website && npx tsc --noEmit --pretty 2>&1 | grep hero-particles || echo "No errors in hero-particles"`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add ohcs-website/src/components/home/hero-particles.tsx
git commit -m "feat: add GoldParticles — 20 bokeh dots with drift animation"
```

---

### Task 5: Create the Hero Carousel Component

**Files:**
- Create: `src/components/home/hero.tsx`
- Create: `tests/component/hero.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `ohcs-website/tests/component/hero.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero } from '@/components/home/hero';

// Mock next/image to render a plain img
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
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
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  it('has a polite aria-live region', () => {
    render(<Hero />);
    const region = screen.getByRole('region', { name: /Hero/i });
    expect(region.getAttribute('aria-live')).toBe('polite');
  });

  it('renders decorative elements as aria-hidden', () => {
    const { container } = render(<Hero />);
    const decorative = container.querySelectorAll('[aria-hidden="true"]');
    // At least: kente mesh, gold lines, floating icons, particles
    expect(decorative.length).toBeGreaterThanOrEqual(4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd ohcs-website && npx vitest run tests/component/hero.test.tsx`

Expected: FAIL — module `@/components/home/hero` not found.

- [ ] **Step 3: Write the Hero component**

Create `ohcs-website/src/components/home/hero.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FloatingIcons } from '@/components/home/hero-icons';
import { GoldParticles } from '@/components/home/hero-particles';

interface Slide {
  image: string;
  alt: string;
  headline: [string, string]; // [line1, accentLine2]
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    image: '/images/hero/head-of-civil-service.jpg',
    alt: 'Head of the Civil Service of Ghana',
    headline: ["Serving Ghana's", 'Public Sector'],
    subtitle:
      'The Office of the Head of Civil Service drives excellence, accountability, and transformation across Ghana\u2019s civil service.',
  },
  {
    image: '/images/hero/chief-director.jpg',
    alt: 'Chief Director of OHCS',
    headline: ['Committed to', 'Excellence'],
    subtitle:
      'Upholding the values of loyalty, excellence, and service in every aspect of Ghana\u2019s public administration.',
  },
  {
    image: '/images/hero/council.jpg',
    alt: 'The Ghana Civil Service Council',
    headline: ["Transforming Ghana's", 'Civil Service'],
    subtitle:
      'Building a modern, accountable, and citizen-centered civil service for Ghana\u2019s future.',
  },
];

const INTERVAL_MS = 8000;
const TRANSITION_MS = 1000;

export function Hero() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);

  const goTo = useCallback(
    (index: number) => {
      if (index === current || transitioning) return;
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(index);
        setTransitioning(false);
      }, TRANSITION_MS);
    },
    [current, transitioning],
  );

  const startAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setCurrent((prev) => {
          const next = (prev + 1) % SLIDES.length;
          setTransitioning(true);
          setTimeout(() => setTransitioning(false), TRANSITION_MS);
          return next;
        });
      }
    }, INTERVAL_MS);
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAutoplay]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  const slide = SLIDES[current];

  return (
    <section
      aria-label="Hero"
      aria-live="polite"
      role="region"
      className="relative w-full h-[500px] sm:h-[550px] lg:h-[600px] overflow-hidden bg-primary-dark"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={resume}
    >
      {/* Background images — all preloaded, one visible at a time */}
      {SLIDES.map((s, i) => (
        <div
          key={s.image}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000 ease-in-out',
            i === current ? 'opacity-100' : 'opacity-0',
            i === current && transitioning && 'animate-[zoom-fade-out_1s_ease-in-out_forwards]',
          )}
        >
          <Image
            src={s.image}
            alt={s.alt}
            fill
            priority={i === 0}
            className="object-cover object-[center_30%] brightness-[0.28] contrast-[1.15] saturate-[0.8]"
            style={{ animation: 'ken-burns 25s ease-in-out infinite alternate' }}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Kente mesh overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          opacity: 0.09,
          backgroundImage: [
            'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
            'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 40px)',
            'repeating-linear-gradient(0deg, #1B5E20 0px, #1B5E20 1px, transparent 1px, transparent 80px)',
            'repeating-linear-gradient(90deg, #B71C1C 0px, #B71C1C 1px, transparent 1px, transparent 80px)',
          ].join(', '),
        }}
      />

      {/* Directional gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(13,59,19,0.95) 0%, rgba(13,59,19,0.75) 45%, rgba(13,59,19,0.4) 70%, rgba(13,59,19,0.2) 100%)',
        }}
      />

      {/* Gold accent lines */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[3px] z-20"
        style={{
          background: 'linear-gradient(90deg, #D4A017, #E8C547 50%, #D4A017)',
          boxShadow: '0 0 12px rgba(212,160,23,0.3)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px z-20"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(212,160,23,0.4) 20%, rgba(212,160,23,0.4) 80%, transparent)',
        }}
      />

      {/* Ambient layers */}
      <FloatingIcons className="z-[5]" />
      <GoldParticles className="z-[4]" />

      {/* Content */}
      <div className="relative z-15 h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16 max-w-[680px]">
        {/* Eyebrow */}
        <div
          className="flex items-center gap-3.5 mb-5 opacity-0"
          style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) forwards' }}
        >
          <span className="w-9 h-0.5 bg-accent" aria-hidden="true" />
          <span className="text-xs uppercase tracking-[3.5px] text-accent font-semibold">
            Republic of Ghana
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-display text-[clamp(2rem,7vw,3.4rem)] font-bold leading-[1.08] mb-6 opacity-0"
          style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s forwards' }}
        >
          {slide.headline[0]}
          <br />
          <span className="text-[#4CAF50]">{slide.headline[1]}</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-[17px] text-white/65 leading-relaxed max-w-[460px] mb-9 opacity-0"
          style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s forwards' }}
        >
          {slide.subtitle}
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 opacity-0"
          style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s forwards' }}
        >
          <Link
            href="/services"
            className={cn(
              'inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg',
              'bg-primary text-white font-semibold text-[15px]',
              'shadow-[0_4px_16px_rgba(27,94,32,0.3)]',
              'hover:bg-primary-light hover:-translate-y-0.5 hover:scale-[1.02]',
              'hover:shadow-[0_8px_24px_rgba(27,94,32,0.4)]',
              'transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            )}
          >
            <Search className="w-[18px] h-[18px]" aria-hidden="true" />
            Find a Service
          </Link>
          <Link
            href="/track"
            className={cn(
              'inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg',
              'bg-accent text-kente-black font-semibold text-[15px]',
              'shadow-[0_4px_16px_rgba(212,160,23,0.25)]',
              'hover:bg-accent-light hover:-translate-y-0.5 hover:scale-[1.02]',
              'hover:shadow-[0_8px_24px_rgba(212,160,23,0.35)]',
              'transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            )}
          >
            <FileSearch className="w-[18px] h-[18px]" aria-hidden="true" />
            Track Submission
          </Link>
        </div>
      </div>

      {/* Slide indicators */}
      <div
        className="absolute bottom-9 left-6 sm:left-10 lg:left-16 flex gap-2 z-20 opacity-0"
        style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s forwards' }}
        role="tablist"
        aria-label="Hero slides"
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1} of ${SLIDES.length}`}
            onClick={() => goTo(i)}
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary-dark',
              i === current
                ? 'w-13 bg-accent shadow-[0_0_8px_rgba(212,160,23,0.4)]'
                : 'w-8 bg-white/15 hover:bg-white/30',
            )}
          />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ohcs-website && npx vitest run tests/component/hero.test.tsx`

Expected: 7 tests PASS.

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `cd ohcs-website && npx vitest run`

Expected: All tests pass (previous 20 + new 7 hero + 3 scroll-reveal = 30).

- [ ] **Step 6: Commit**

```bash
git add ohcs-website/src/components/home/hero.tsx ohcs-website/tests/component/hero.test.tsx
git commit -m "feat: add Hero carousel with cinematic transitions, Kente mesh, and ambient animations"
```

---

### Task 6: Integration — Wire Hero into the Homepage

**Files:**
- Modify: `src/app/[locale]/page.tsx` (or the homepage file)

- [ ] **Step 1: Find the homepage file**

Run: `find ohcs-website/src/app -name "page.tsx" -type f` to locate the homepage entry point.

- [ ] **Step 2: Import and render the Hero at the top of the page**

Add to the homepage file:

```tsx
import { Hero } from '@/components/home/hero';
```

And render `<Hero />` as the first element inside the page's return, before any other content.

- [ ] **Step 3: Start the dev server and verify visually**

Run: `cd ohcs-website && npm run dev`

Open `http://localhost:3000` in the browser. Verify:
- [ ] Hero fills full width with the first slide image dimmed
- [ ] Kente mesh grid lines visible at low opacity
- [ ] Gold accent line across the top
- [ ] Floating civic icons drifting upward (visible gold outlines)
- [ ] Gold bokeh particles floating
- [ ] Text reveals with staggered animation on load
- [ ] Auto-rotation changes slide after 8 seconds
- [ ] Clicking indicators switches slides
- [ ] CTAs are clickable with hover effects
- [ ] Mobile responsive — CTAs stack on small viewport

- [ ] **Step 4: Run full test suite one final time**

Run: `cd ohcs-website && npx vitest run`

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add ohcs-website/src/app/
git commit -m "feat: wire Hero carousel into homepage"
```
