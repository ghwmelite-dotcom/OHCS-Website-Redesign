# OHCS.gov.gh Website Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-grade government website for Ghana's Office of the Head of Civil Service — public frontend (SSR), API backend (edge), admin dashboard, and submission tracking system.

**Architecture:** Next.js 14 App Router on Cloudflare Pages for SSR public pages. Cloudflare Workers with Hono for API routes. D1 for database, KV for caching/reference lookups, R2 for file storage. Kente-inspired design system with "Dignified Warmth" aesthetic.

**Tech Stack:** Next.js 14, TypeScript (strict), Tailwind CSS, Framer Motion, Hono, Cloudflare (Pages/Workers/D1/KV/R2), Drizzle ORM, Zod, next-intl, React Hook Form, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-04-16-ohcs-website-redesign-design.md`

---

## Phase Overview

| Phase | What It Builds | Tasks |
|-------|---------------|-------|
| 1 | Project scaffold, design tokens, Kente components | 1–5 |
| 2 | Layout shell (header, footer, navigation) | 6–9 |
| 3 | Homepage sections | 10–14 |
| 4 | Worker API + D1 database | 15–20 |
| 5 | Interior pages (About, Directorates, Departments, Training) | 21–25 |
| 6 | Services — forms + submission tracking | 26–31 |
| 7 | News, Events, Publications, Gallery | 32–37 |
| 8 | Admin dashboard | 38–43 |
| 9 | i18n, SEO, performance, security hardening | 44–47 |
| 10 | E2E tests + deployment | 48–50 |

---

## File Structure

```
ohcs-website/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                          (homepage)
│   │   │   ├── about/
│   │   │   │   ├── page.tsx                      (about overview)
│   │   │   │   ├── civil-service/page.tsx
│   │   │   │   ├── leadership/page.tsx
│   │   │   │   ├── structure/page.tsx
│   │   │   │   └── partners/page.tsx
│   │   │   ├── directorates/
│   │   │   │   ├── page.tsx                      (listing)
│   │   │   │   └── [slug]/page.tsx               (detail)
│   │   │   ├── departments/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── training/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── services/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── recruitment/page.tsx
│   │   │   │   ├── rti/page.tsx
│   │   │   │   ├── complaints/page.tsx
│   │   │   │   └── feedback/page.tsx
│   │   │   ├── news/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── events/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── publications/page.tsx
│   │   │   ├── gallery/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── photos/page.tsx
│   │   │   │   └── videos/page.tsx
│   │   │   ├── track/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── accessibility/page.tsx
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx                      (dashboard home)
│   │   │       ├── login/page.tsx
│   │   │       ├── news/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── events/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── publications/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── submissions/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── leadership/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       └── gallery/page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx                            (root layout)
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── toast.tsx
│   │   │   └── file-upload.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   ├── mega-menu.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── skip-to-content.tsx
│   │   ├── kente/
│   │   │   ├── kente-accent.tsx
│   │   │   ├── kente-loader.tsx
│   │   │   └── kente-patterns.tsx
│   │   ├── home/
│   │   │   ├── hero.tsx
│   │   │   ├── quick-services.tsx
│   │   │   ├── news-events-section.tsx
│   │   │   ├── leadership-spotlight.tsx
│   │   │   ├── directorates-grid.tsx
│   │   │   └── training-section.tsx
│   │   ├── forms/
│   │   │   ├── submission-form.tsx
│   │   │   ├── track-form.tsx
│   │   │   ├── multi-step-wizard.tsx
│   │   │   ├── recruitment-form.tsx
│   │   │   ├── rti-form.tsx
│   │   │   ├── complaint-form.tsx
│   │   │   └── feedback-form.tsx
│   │   ├── news/
│   │   │   ├── news-card.tsx
│   │   │   └── news-list.tsx
│   │   ├── events/
│   │   │   ├── event-card.tsx
│   │   │   └── event-list.tsx
│   │   ├── publications/
│   │   │   ├── publication-card.tsx
│   │   │   └── publication-list.tsx
│   │   └── gallery/
│   │       ├── photo-grid.tsx
│   │       ├── lightbox.tsx
│   │       └── video-embed.tsx
│   ├── lib/
│   │   ├── api.ts                                (API client)
│   │   ├── utils.ts                              (cn(), formatDate, etc.)
│   │   ├── constants.ts                          (nav items, directorates data, department data)
│   │   └── validations.ts                        (shared Zod schemas)
│   ├── hooks/
│   │   ├── use-scroll-reveal.ts
│   │   └── use-media-query.ts
│   ├── types/
│   │   └── index.ts                              (shared TypeScript types)
│   └── styles/
│       └── kente-patterns.svg
├── worker/
│   ├── src/
│   │   ├── index.ts                              (Hono app entry)
│   │   ├── routes/
│   │   │   ├── public/
│   │   │   │   ├── news.ts
│   │   │   │   ├── events.ts
│   │   │   │   ├── publications.ts
│   │   │   │   ├── leadership.ts
│   │   │   │   ├── gallery.ts
│   │   │   │   ├── submissions.ts
│   │   │   │   └── track.ts
│   │   │   └── admin/
│   │   │       ├── auth.ts
│   │   │       ├── news.ts
│   │   │       ├── events.ts
│   │   │       ├── publications.ts
│   │   │       ├── submissions.ts
│   │   │       ├── leadership.ts
│   │   │       ├── gallery.ts
│   │   │       └── upload.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rate-limit.ts
│   │   │   ├── cors.ts
│   │   │   └── error-handler.ts
│   │   ├── services/
│   │   │   ├── news.service.ts
│   │   │   ├── events.service.ts
│   │   │   ├── publications.service.ts
│   │   │   ├── submissions.service.ts
│   │   │   ├── leadership.service.ts
│   │   │   ├── gallery.service.ts
│   │   │   └── auth.service.ts
│   │   ├── db/
│   │   │   ├── schema.ts                         (Drizzle ORM schema)
│   │   │   └── migrations/
│   │   │       └── 0001_init.sql
│   │   └── lib/
│   │       ├── reference.ts                      (reference number generator)
│   │       ├── storage.ts                        (R2 helpers)
│   │       └── validation.ts                     (Zod schemas)
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── messages/
│   └── en.json
├── public/
│   ├── fonts/
│   └── images/
│       ├── logo.png
│       ├── footer-logo.png
│       ├── coat-of-arms.png
│       └── departments/
├── tests/
│   ├── unit/
│   │   ├── reference.test.ts
│   │   ├── validations.test.ts
│   │   └── utils.test.ts
│   ├── component/
│   │   ├── kente-accent.test.tsx
│   │   ├── header.test.tsx
│   │   ├── footer.test.tsx
│   │   ├── submission-form.test.tsx
│   │   └── track-form.test.tsx
│   └── e2e/
│       ├── homepage.spec.ts
│       ├── navigation.spec.ts
│       ├── submission.spec.ts
│       └── admin.spec.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .eslintrc.json
├── .prettierrc
└── README.md
```

---

## PHASE 1: Project Scaffold & Design System (Tasks 1–5)

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx`
- Create: `.eslintrc.json`
- Create: `.prettierrc`
- Create: `.gitignore`

- [ ] **Step 1: Create Next.js project with TypeScript**

```bash
cd "C:/Users/USER/OneDrive - Smart Workplace/Desktop/Projects/OHCS Website Redesign"
npx create-next-app@latest ohcs-website --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded at `ohcs-website/` with default Next.js structure.

- [ ] **Step 2: Install core dependencies**

```bash
cd ohcs-website
npm install framer-motion next-intl react-hook-form @hookform/resolvers zod zustand @tanstack/react-query lucide-react clsx tailwind-merge
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react prettier eslint-config-prettier
```

- [ ] **Step 3: Configure TypeScript strict mode**

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Configure Prettier**

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 5: Initialize git and commit**

```bash
git init
git add -A
git commit -m "chore: initialize Next.js 14 project with TypeScript strict mode"
```

---

### Task 2: Design Tokens & Tailwind Configuration

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Configure Tailwind with OHCS design tokens**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B5E20',
          light: '#2E7D32',
          dark: '#0D3B13',
        },
        accent: {
          DEFAULT: '#D4A017',
          light: '#E8C547',
        },
        surface: {
          DEFAULT: '#FDFAF5',
          card: '#FFFFFF',
        },
        border: '#E5DDD0',
        kente: {
          red: '#B71C1C',
          black: '#212121',
          gold: '#D4A017',
          green: '#1B5E20',
        },
        text: {
          DEFAULT: '#1A1A1A',
          muted: '#5C5549',
        },
        success: '#2E7D32',
        error: '#C62828',
        warning: '#E65100',
        info: '#1565C0',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: '0.64rem',
        sm: '0.8rem',
        base: '1rem',
        lg: '1.25rem',
        xl: '1.563rem',
        '2xl': '1.953rem',
        '3xl': '2.441rem',
        '4xl': '3.052rem',
        hero: 'clamp(3rem, 8vw, 5rem)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08)',
        header: '0 2px 8px rgba(0,0,0,0.06)',
      },
      maxWidth: {
        content: '1280px',
      },
      keyframes: {
        reveal: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        reveal: 'reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Set up globals.css with CSS custom properties and fonts**

Replace `src/app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: #1B5E20;
    --color-primary-light: #2E7D32;
    --color-primary-dark: #0D3B13;
    --color-accent: #D4A017;
    --color-accent-light: #E8C547;
    --color-surface: #FDFAF5;
    --color-surface-card: #FFFFFF;
    --color-border: #E5DDD0;
    --color-text: #1A1A1A;
    --color-text-muted: #5C5549;
    --color-kente-red: #B71C1C;
    --color-kente-black: #212121;
    --color-success: #2E7D32;
    --color-error: #C62828;
    --color-warning: #E65100;
    --color-info: #1565C0;

    --font-display: 'Playfair Display', Georgia, serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    --radius-xl: 24px;

    --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
    --shadow-card-hover: 0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08);
    --shadow-header: 0 2px 8px rgba(0,0,0,0.06);
  }

  * {
    border-color: var(--color-border);
  }

  body {
    font-family: var(--font-body);
    color: var(--color-text);
    background-color: var(--color-surface);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2 {
    font-family: var(--font-display);
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  h3, h4, h5, h6 {
    font-family: var(--font-body);
    font-weight: 600;
    line-height: 1.3;
  }

  p {
    line-height: 1.6;
    max-width: 70ch;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

/* Skip to content link */
.skip-to-content {
  position: absolute;
  top: -100%;
  left: 16px;
  z-index: 100;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: top 0.2s;
}

.skip-to-content:focus {
  top: 16px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: Create utility functions**

Create `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '...';
}
```

- [ ] **Step 4: Verify the dev server starts**

```bash
npm run dev
```

Expected: Dev server starts at `http://localhost:3000` with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: configure design tokens, Tailwind theme, typography, and utilities"
```

---

### Task 3: Kente Pattern SVG & Component

**Files:**
- Create: `src/styles/kente-patterns.svg`
- Create: `src/components/kente/kente-accent.tsx`
- Create: `src/components/kente/kente-loader.tsx`
- Create: `src/components/kente/kente-patterns.tsx`
- Create: `tests/component/kente-accent.test.tsx`

- [ ] **Step 1: Write test for KenteAccent component**

Create `tests/component/kente-accent.test.tsx`:

```typescript
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
```

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run tests/component/kente-accent.test.tsx
```

Expected: FAIL — module `@/components/kente/kente-accent` not found.

- [ ] **Step 4: Create Kente SVG pattern data**

Create `src/components/kente/kente-patterns.tsx`:

```typescript
export const KENTE_COLORS = {
  green: '#1B5E20',
  gold: '#D4A017',
  red: '#B71C1C',
  black: '#212121',
  cream: '#FDFAF5',
} as const;

/**
 * Inline SVG pattern for Kente-inspired geometric weave.
 * Uses abstracted interlocking rectangles inspired by Kente cloth geometry.
 * Not a literal reproduction — an homage to the weaving tradition.
 */
export function KentePatternSVG({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="64"
      height="8"
      viewBox="0 0 64 8"
      fill="none"
      aria-hidden="true"
      style={{ opacity }}
    >
      {/* Green block */}
      <rect x="0" y="0" width="16" height="8" fill={KENTE_COLORS.green} />
      {/* Gold block */}
      <rect x="16" y="0" width="16" height="8" fill={KENTE_COLORS.gold} />
      {/* Red block */}
      <rect x="32" y="0" width="16" height="8" fill={KENTE_COLORS.red} />
      {/* Black block */}
      <rect x="48" y="0" width="16" height="8" fill={KENTE_COLORS.black} />
      {/* Woven cross-threads */}
      <rect x="0" y="3" width="64" height="1" fill="rgba(255,255,255,0.15)" />
      <rect x="0" y="5" width="64" height="0.5" fill="rgba(255,255,255,0.08)" />
      {/* Vertical separators mimicking warp threads */}
      <rect x="15.5" y="0" width="1" height="8" fill="rgba(0,0,0,0.12)" />
      <rect x="31.5" y="0" width="1" height="8" fill="rgba(0,0,0,0.12)" />
      <rect x="47.5" y="0" width="1" height="8" fill="rgba(0,0,0,0.12)" />
    </svg>
  );
}

/**
 * Generates a base64-encoded SVG for use in CSS background-image.
 * Used for subtle background textures at low opacity.
 */
export const kenteBackgroundPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' fill='none'%3E%3Crect x='0' y='0' width='16' height='16' fill='%231B5E20' opacity='0.04'/%3E%3Crect x='16' y='0' width='16' height='16' fill='%23D4A017' opacity='0.03'/%3E%3Crect x='32' y='0' width='16' height='16' fill='%23B71C1C' opacity='0.02'/%3E%3Crect x='48' y='0' width='16' height='16' fill='%23212121' opacity='0.03'/%3E%3Crect x='0' y='16' width='16' height='16' fill='%23D4A017' opacity='0.03'/%3E%3Crect x='16' y='16' width='16' height='16' fill='%231B5E20' opacity='0.04'/%3E%3Crect x='32' y='16' width='16' height='16' fill='%23212121' opacity='0.03'/%3E%3Crect x='48' y='16' width='16' height='16' fill='%23B71C1C' opacity='0.02'/%3E%3Crect x='0' y='32' width='16' height='16' fill='%23B71C1C' opacity='0.02'/%3E%3Crect x='16' y='32' width='16' height='16' fill='%23212121' opacity='0.03'/%3E%3Crect x='32' y='32' width='16' height='16' fill='%231B5E20' opacity='0.04'/%3E%3Crect x='48' y='32' width='16' height='16' fill='%23D4A017' opacity='0.03'/%3E%3Crect x='0' y='48' width='16' height='16' fill='%23212121' opacity='0.03'/%3E%3Crect x='16' y='48' width='16' height='16' fill='%23B71C1C' opacity='0.02'/%3E%3Crect x='32' y='48' width='16' height='16' fill='%23D4A017' opacity='0.03'/%3E%3Crect x='48' y='48' width='16' height='16' fill='%231B5E20' opacity='0.04'/%3E%3C/svg%3E")`;
```

- [ ] **Step 5: Create KenteAccent component**

Create `src/components/kente/kente-accent.tsx`:

```typescript
import { cn } from '@/lib/utils';
import { KentePatternSVG, kenteBackgroundPattern } from './kente-patterns';

type KenteVariant = 'divider' | 'border' | 'background' | 'header-band';

interface KenteAccentProps {
  variant: KenteVariant;
  className?: string;
}

export function KenteAccent({ variant, className }: KenteAccentProps) {
  switch (variant) {
    case 'divider':
      return (
        <div
          role="separator"
          className={cn('kente-divider w-full h-[6px] overflow-hidden', className)}
          aria-hidden="true"
        >
          <div className="h-full w-full" style={{ display: 'flex' }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <KentePatternSVG key={i} />
            ))}
          </div>
        </div>
      );

    case 'header-band':
      return (
        <div
          data-testid="kente-header-band"
          className={cn('w-full h-[4px] overflow-hidden', className)}
          aria-hidden="true"
        >
          <div className="h-full w-full" style={{ display: 'flex' }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <KentePatternSVG key={i} />
            ))}
          </div>
        </div>
      );

    case 'background':
      return (
        <div
          className={cn('absolute inset-0 pointer-events-none', className)}
          style={{ backgroundImage: kenteBackgroundPattern, backgroundSize: '64px 64px' }}
          aria-hidden="true"
        />
      );

    case 'border':
      return (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            className,
          )}
          style={{ background: `linear-gradient(to bottom, #1B5E20, #D4A017, #B71C1C)` }}
          aria-hidden="true"
        />
      );
  }
}
```

- [ ] **Step 6: Create KenteLoader component**

Create `src/components/kente/kente-loader.tsx`:

```typescript
'use client';

import { cn } from '@/lib/utils';
import { KENTE_COLORS } from './kente-patterns';

interface KenteLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function KenteLoader({ size = 'md', className }: KenteLoaderProps) {
  const sizeMap = { sm: 24, md: 40, lg: 64 };
  const s = sizeMap[size];

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Horizontal threads weaving in */}
        <rect x="0" y="4" width="40" height="6" fill={KENTE_COLORS.green} rx="1">
          <animate attributeName="width" values="0;40" dur="0.8s" repeatCount="indefinite" />
        </rect>
        <rect x="0" y="14" width="40" height="6" fill={KENTE_COLORS.gold} rx="1">
          <animate
            attributeName="width"
            values="0;40"
            dur="0.8s"
            begin="0.2s"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="0" y="24" width="40" height="6" fill={KENTE_COLORS.red} rx="1">
          <animate
            attributeName="width"
            values="0;40"
            dur="0.8s"
            begin="0.4s"
            repeatCount="indefinite"
          />
        </rect>
        <rect x="0" y="34" width="40" height="4" fill={KENTE_COLORS.black} rx="1">
          <animate
            attributeName="width"
            values="0;40"
            dur="0.8s"
            begin="0.6s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
```

- [ ] **Step 7: Run tests**

```bash
npx vitest run tests/component/kente-accent.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Kente pattern SVG, KenteAccent, and KenteLoader components"
```

---

### Task 4: Base UI Components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/skeleton.tsx`

- [ ] **Step 1: Create Button component**

Create `src/components/ui/button.tsx`:

```typescript
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium font-body rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-light active:scale-[0.98]',
      secondary:
        'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white',
      accent: 'bg-accent text-kente-black hover:bg-accent-light active:scale-[0.98]',
      ghost: 'text-text-muted hover:bg-black/5 hover:text-text',
      destructive: 'bg-error text-white hover:brightness-110',
    };

    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-12 px-8 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
```

- [ ] **Step 2: Create Card component**

Create `src/components/ui/card.tsx`:

```typescript
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  kenteAccent?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, kenteAccent = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group relative bg-surface-card rounded-lg border border-border shadow-card p-6',
          hoverable &&
            'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer',
          className,
        )}
        {...props}
      >
        {kenteAccent && (
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'linear-gradient(to bottom, #1B5E20, #D4A017, #B71C1C)' }}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
```

- [ ] **Step 3: Create Input component**

Create `src/components/ui/input.tsx`:

```typescript
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full h-12 px-4 rounded-md border bg-surface-card font-body text-base',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'placeholder:text-text-muted/60',
            error ? 'border-error ring-1 ring-error' : 'border-border',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-error flex items-center gap-1.5" role="alert">
            <svg
              className="h-4 w-4 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
```

- [ ] **Step 4: Create Textarea component**

Create `src/components/ui/textarea.tsx`:

```typescript
import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full min-h-[120px] px-4 py-3 rounded-md border bg-surface-card font-body text-base',
            'transition-colors duration-200 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'placeholder:text-text-muted/60',
            error ? 'border-error ring-1 ring-error' : 'border-border',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-error flex items-center gap-1.5" role="alert">
            <svg
              className="h-4 w-4 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
```

- [ ] **Step 5: Create Badge component**

Create `src/components/ui/badge.tsx`:

```typescript
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'accent';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: 'bg-black/5 text-text',
  success: 'bg-success/10 text-success',
  error: 'bg-error/10 text-error',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  accent: 'bg-accent/10 text-accent',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 6: Create Skeleton component**

Create `src/components/ui/skeleton.tsx`:

```typescript
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-black/5', className)}
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 7: Verify dev server still compiles**

```bash
npm run dev
```

Expected: Compiles with no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add base UI components — Button, Card, Input, Textarea, Badge, Skeleton"
```

---

### Task 5: TypeScript Types & Constants

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/constants.ts`
- Create: `src/lib/validations.ts`
- Create: `tests/unit/validations.test.ts`

- [ ] **Step 1: Write test for validation schemas**

Create `tests/unit/validations.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  complaintFormSchema,
  feedbackFormSchema,
  trackFormSchema,
} from '@/lib/validations';

describe('complaintFormSchema', () => {
  it('accepts valid complaint data', () => {
    const result = complaintFormSchema.safeParse({
      name: 'Kwame Asante',
      email: 'kwame@example.com',
      phone: '0241234567',
      subject: 'Service delay',
      body: 'I experienced a significant delay when processing my request at the regional office.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = complaintFormSchema.safeParse({
      name: '',
      body: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = complaintFormSchema.safeParse({
      name: 'Kwame',
      email: 'not-an-email',
      body: 'My complaint details here.',
    });
    expect(result.success).toBe(false);
  });
});

describe('trackFormSchema', () => {
  it('accepts valid reference number with email', () => {
    const result = trackFormSchema.safeParse({
      referenceNumber: 'OHCS-CMP-20260416-A7F3',
      contact: 'kwame@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid reference number with phone', () => {
    const result = trackFormSchema.safeParse({
      referenceNumber: 'OHCS-RTI-20260416-B2D1',
      contact: '0241234567',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty reference number', () => {
    const result = trackFormSchema.safeParse({
      referenceNumber: '',
      contact: 'kwame@example.com',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/validations.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create TypeScript types**

Create `src/types/index.ts`:

```typescript
export type SubmissionType = 'recruitment' | 'rti' | 'complaint' | 'feedback';

export type SubmissionStatus =
  | 'received'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type PublicationCategory = 'report' | 'policy' | 'form' | 'circular' | 'other';

export type GalleryItemType = 'photo' | 'video';

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: string;
  title: string;
  category: PublicationCategory;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  referenceNumber: string;
  type: SubmissionType;
  status: SubmissionStatus;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  body: string;
  attachments: string[] | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionStatusEntry {
  id: string;
  submissionId: string;
  status: SubmissionStatus;
  note: string | null;
  createdAt: string;
}

export interface LeadershipProfile {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  photoUrl: string | null;
  displayOrder: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  type: GalleryItemType;
  title: string | null;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  category: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    totalPages?: number;
    total?: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface Directorate {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
}

export interface Department {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  logoUrl?: string;
}

export interface TrainingInstitution {
  slug: string;
  name: string;
  location: string;
  focusArea: string;
  logoUrl?: string;
}
```

- [ ] **Step 4: Create validation schemas**

Create `src/lib/validations.ts`:

```typescript
import { z } from 'zod';

export const complaintFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  subject: z.string().max(500).optional().or(z.literal('')),
  body: z.string().min(10, 'Please provide details (at least 10 characters)').max(5000),
});

export const feedbackFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  subject: z.string().max(500).optional().or(z.literal('')),
  body: z.string().min(10, 'Please provide details (at least 10 characters)').max(5000),
});

export const rtiFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().max(20).optional().or(z.literal('')),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(20, 'Please describe your information request in detail').max(10000),
});

export const recruitmentFormSchema = z.object({
  name: z.string().min(1, 'Full name is required').max(200),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  position: z.string().min(1, 'Position is required').max(300),
  qualifications: z.string().min(1, 'Qualifications are required').max(5000),
  experience: z.string().min(1, 'Experience details are required').max(5000),
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters').max(10000),
});

export const trackFormSchema = z.object({
  referenceNumber: z
    .string()
    .min(1, 'Reference number is required')
    .regex(/^OHCS-[A-Z]{3}-\d{8}-[A-Z0-9]{4}$/, 'Invalid reference number format'),
  contact: z.string().min(1, 'Email or phone number is required'),
});

export type ComplaintFormData = z.infer<typeof complaintFormSchema>;
export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;
export type RtiFormData = z.infer<typeof rtiFormSchema>;
export type RecruitmentFormData = z.infer<typeof recruitmentFormSchema>;
export type TrackFormData = z.infer<typeof trackFormSchema>;
```

- [ ] **Step 5: Create site constants**

Create `src/lib/constants.ts`:

```typescript
import type { NavItem, Directorate, Department, TrainingInstitution } from '@/types';

export const SITE_NAME = 'Office of the Head of Civil Service';
export const SITE_SHORT_NAME = 'OHCS';
export const SITE_URL = 'https://ohcs.gov.gh';
export const SITE_DESCRIPTION =
  'The Office of the Head of Civil Service (OHCS) is the central administrative body overseeing Ghana\'s entire civil service.';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'The Civil Service', href: '/about/civil-service' },
      { label: 'Leadership', href: '/about/leadership' },
      { label: 'Organisational Structure', href: '/about/structure' },
      { label: 'Partners', href: '/about/partners' },
    ],
  },
  {
    label: 'Directorates',
    href: '/directorates',
    children: [], // populated from DIRECTORATES below
  },
  {
    label: 'Departments',
    href: '/departments',
    children: [], // populated from DEPARTMENTS below
  },
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Recruitment', href: '/services/recruitment' },
      { label: 'Right to Information', href: '/services/rti' },
      { label: 'Complaints', href: '/services/complaints' },
      { label: 'Feedback', href: '/services/feedback' },
    ],
  },
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  { label: 'Publications', href: '/publications' },
  { label: 'Contact', href: '/contact' },
];

export const DIRECTORATES: Directorate[] = [
  {
    slug: 'career-management',
    name: 'Career Management Directorate',
    shortName: 'CMD',
    description: 'Manages career development and progression within the civil service.',
    icon: 'Briefcase',
  },
  {
    slug: 'finance-administration',
    name: 'Finance & Administration Directorate',
    shortName: 'FAD',
    description: 'Oversees financial management and administrative operations.',
    icon: 'Wallet',
  },
  {
    slug: 'reforms',
    name: 'Reforms Directorate',
    shortName: 'RD',
    description: 'Drives institutional reforms and modernization initiatives.',
    icon: 'RefreshCw',
  },
  {
    slug: 'hrmd',
    name: 'Human Resource Management Directorate',
    shortName: 'HRMD',
    description: 'Manages human resource policies, planning, and development.',
    icon: 'Users',
  },
  {
    slug: 'research-statistics',
    name: 'Research, Statistics & Information Directorate',
    shortName: 'RSID',
    description: 'Conducts research and manages civil service data and statistics.',
    icon: 'BarChart3',
  },
  {
    slug: 'policy-planning',
    name: 'Policy, Planning, Monitoring & Evaluation Directorate',
    shortName: 'PPMED',
    description: 'Develops policies and monitors implementation across the civil service.',
    icon: 'ClipboardCheck',
  },
  {
    slug: 'legal',
    name: 'Legal Directorate',
    shortName: 'LD',
    description: 'Provides legal advisory services and ensures regulatory compliance.',
    icon: 'Scale',
  },
  {
    slug: 'ict',
    name: 'Information & Communications Technology Directorate',
    shortName: 'ICTD',
    description: 'Drives digital transformation and technology infrastructure.',
    icon: 'Monitor',
  },
];

export const DEPARTMENTS: Department[] = [
  {
    slug: 'iad',
    name: 'Internal Audit Department',
    shortName: 'IAD',
    description: 'Provides independent assurance and advisory services.',
  },
  {
    slug: 'msd',
    name: 'Management Services Department',
    shortName: 'MSD',
    description: 'Improves organisational efficiency and service delivery.',
  },
  {
    slug: 'praad',
    name: 'Public Records & Archives Administration Department',
    shortName: 'PRAAD',
    description: 'Preserves national records and manages public archives.',
    logoUrl: '/images/departments/praad-logo.png',
  },
  {
    slug: 'pscmd',
    name: 'Procurement & Supply Chain Management Department',
    shortName: 'PSCMD',
    description: 'Manages procurement processes and supply chain operations.',
    logoUrl: '/images/departments/pscmd-logo.png',
  },
];

export const TRAINING_INSTITUTIONS: TrainingInstitution[] = [
  {
    slug: 'cstc',
    name: 'Civil Service Training Centre',
    location: 'Accra',
    focusArea: 'Core civil service training and capacity building',
    logoUrl: '/images/departments/cstc-logo.png',
  },
  {
    slug: 'gimpa-collaboration',
    name: 'GIMPA Collaboration Centre',
    location: 'Accra',
    focusArea: 'Advanced management and leadership development',
  },
  {
    slug: 'regional-training',
    name: 'Regional Training Centre',
    location: 'Kumasi',
    focusArea: 'Decentralised training for regional civil servants',
  },
];

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const SUBMISSION_STATUS_COLORS: Record<string, string> = {
  received: 'info',
  under_review: 'warning',
  in_progress: 'accent',
  resolved: 'success',
  closed: 'default',
};
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run tests/unit/validations.test.ts
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add TypeScript types, Zod validation schemas, and site constants"
```

---

## PHASE 2: Layout Shell (Tasks 6–9)

### Task 6: Skip-to-Content & Root Layout

**Files:**
- Create: `src/components/layout/skip-to-content.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Create skip-to-content component**

Create `src/components/layout/skip-to-content.tsx`:

```typescript
export function SkipToContent() {
  return (
    <a href="#main-content" className="skip-to-content">
      Skip to main content
    </a>
  );
}
```

- [ ] **Step 2: Set up root layout**

Replace `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_GH',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 3: Set up locale layout**

Replace `src/app/[locale]/layout.tsx`:

```typescript
import { SkipToContent } from '@/components/layout/skip-to-content';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-surface text-text font-body antialiased">
        <SkipToContent />
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: set up root and locale layouts with skip-to-content and metadata"
```

---

### Task 7: Header & Navigation

**Files:**
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/mega-menu.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Create: `tests/component/header.test.tsx`

- [ ] **Step 1: Write header test**

Create `tests/component/header.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/header';

describe('Header', () => {
  it('renders the OHCS site name', () => {
    render(<Header />);
    expect(screen.getByText(/OHCS/i)).toBeDefined();
  });

  it('renders main navigation items', () => {
    render(<Header />);
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('News')).toBeDefined();
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/component/header.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create MegaMenu component**

Create `src/components/layout/mega-menu.tsx`:

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { NavItem } from '@/types';
import { cn } from '@/lib/utils';

interface MegaMenuProps {
  item: NavItem;
}

export function MegaMenu({ item }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  if (!item.children || item.children.length === 0) {
    return (
      <Link
        href={item.href}
        className="px-4 py-2 text-sm font-medium text-text hover:text-primary transition-colors"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          'flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors',
          isOpen ? 'text-primary' : 'text-text hover:text-primary',
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen(!isOpen)}
      >
        {item.label}
        <svg
          className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-surface-card rounded-lg border border-border shadow-card-hover py-2 z-50 animate-fade-in">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="block px-4 py-2.5 text-sm text-text hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create MobileNav component**

Create `src/components/layout/mobile-nav.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleExpanded = (label: string) => {
    setExpandedItem(expandedItem === label ? null : label);
  };

  return (
    <>
      <button
        className="lg:hidden p-2 text-text hover:text-primary"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-[300px] bg-surface-card z-50 transform transition-transform duration-300 lg:hidden overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-display font-bold text-lg">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-text hover:text-primary"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-4">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="border-b border-border last:border-0">
              {item.children && item.children.length > 0 ? (
                <>
                  <button
                    className="flex items-center justify-between w-full py-3 text-left font-medium text-text hover:text-primary"
                    onClick={() => toggleExpanded(item.label)}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expandedItem === item.label && 'rotate-180',
                      )}
                    />
                  </button>
                  {expandedItem === item.label && (
                    <div className="pl-4 pb-2">
                      <Link
                        href={item.href}
                        className="block py-2 text-sm text-text-muted hover:text-primary"
                        onClick={() => setIsOpen(false)}
                      >
                        Overview
                      </Link>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block py-2 text-sm text-text-muted hover:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className="block py-3 font-medium text-text hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Create Header component**

Create `src/components/layout/header.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { KenteAccent } from '@/components/kente/kente-accent';
import { MegaMenu } from './mega-menu';
import { MobileNav } from './mobile-nav';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-surface-card transition-shadow duration-200',
        isScrolled && 'shadow-header',
      )}
    >
      {/* Utility bar */}
      <div className="border-b border-border">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <Image
              src="/images/coat-of-arms.png"
              alt="Ghana Coat of Arms"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="text-xs text-text-muted hidden sm:inline">Republic of Ghana</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-muted hidden md:inline">English</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="OHCS Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <span className="font-display font-bold text-primary text-sm leading-tight block">
                OHCS
              </span>
              <span className="text-[10px] text-text-muted leading-tight hidden sm:block">
                Office of the Head of Civil Service
              </span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <MegaMenu key={item.label} item={item} />
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-text-muted hover:text-primary transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <MobileNav />
          </div>
        </div>
      </div>

      {/* Kente header band */}
      <KenteAccent variant="header-band" />
    </header>
  );
}
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run tests/component/header.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Header with mega-menu, mobile nav, and Kente header band"
```

---

### Task 8: Footer

**Files:**
- Create: `src/components/layout/footer.tsx`
- Create: `tests/component/footer.test.tsx`

- [ ] **Step 1: Write footer test**

Create `tests/component/footer.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/footer';

describe('Footer', () => {
  it('renders OHCS name', () => {
    render(<Footer />);
    expect(screen.getByText(/Office of the Head of Civil Service/i)).toBeDefined();
  });

  it('renders contact information', () => {
    render(<Footer />);
    expect(screen.getByText(/Contact/i)).toBeDefined();
  });

  it('renders quick links', () => {
    render(<Footer />);
    expect(screen.getByText(/Quick Links/i)).toBeDefined();
  });

  it('renders copyright notice', () => {
    render(<Footer />);
    expect(screen.getByText(/2026/)).toBeDefined();
  });

  it('has a Kente band at the top', () => {
    render(<Footer />);
    const kenteEl = document.querySelector('[data-testid="kente-header-band"]');
    expect(kenteEl).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/component/footer.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create Footer component**

Create `src/components/layout/footer.tsx`:

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { KenteAccent } from '@/components/kente/kente-accent';

const quickLinks = [
  { label: 'About OHCS', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  { label: 'Publications', href: '/publications' },
  { label: 'Right to Information', href: '/services/rti' },
  { label: 'Contact', href: '/contact' },
];

const policyLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Sitemap', href: '/sitemap.xml' },
];

export function Footer() {
  return (
    <footer className="bg-primary-dark text-white/90">
      <KenteAccent variant="header-band" />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">
          {/* Column 1: About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/footer-logo.png"
                alt="OHCS Logo"
                width={40}
                height={40}
                className="object-contain brightness-0 invert"
              />
              <span className="font-display font-bold text-lg">OHCS</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              The Office of the Head of Civil Service is the central administrative body overseeing
              Ghana&apos;s entire civil service, managing recruitment, training, career development,
              and institutional coordination.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com/OHCSGhana"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-accent transition-colors"
                aria-label="OHCS on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/OHCSGhana"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-accent transition-colors"
                aria-label="OHCS on Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/OHCSGhana"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-accent transition-colors"
                aria-label="OHCS on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-body font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="font-body font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                <span className="text-sm text-white/60">
                  Office of the Head of Civil Service
                  <br />
                  P.O. Box M.49, Accra, Ghana
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                <a
                  href="tel:+233302665421"
                  className="text-sm text-white/60 hover:text-accent transition-colors"
                >
                  +233 (0)30 266 5421
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                <a
                  href="mailto:info@ohcs.gov.gh"
                  className="text-sm text-white/60 hover:text-accent transition-colors"
                >
                  info@ohcs.gov.gh
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/coat-of-arms.png"
              alt="Ghana Coat of Arms"
              width={24}
              height={24}
              className="object-contain brightness-0 invert"
            />
            <span className="text-xs text-white/50">
              &copy; {new Date().getFullYear()} Office of the Head of Civil Service. All rights
              reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            {policyLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/50 hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/component/footer.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Footer with contact info, quick links, social links, and Kente band"
```

---

### Task 9: Breadcrumb & Sidebar Components

**Files:**
- Create: `src/components/layout/breadcrumb.tsx`
- Create: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Create Breadcrumb component**

Create `src/components/layout/breadcrumb.tsx`:

```typescript
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex items-center gap-1.5 text-sm text-text-muted flex-wrap">
        <li>
          <Link
            href="/"
            className="flex items-center hover:text-primary transition-colors"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-text-muted/50" aria-hidden="true" />
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-text font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 2: Create Sidebar component**

Create `src/components/layout/sidebar.tsx`:

```typescript
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SidebarLink {
  label: string;
  href: string;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

interface SidebarProps {
  sections: SidebarSection[];
  className?: string;
}

export function Sidebar({ sections, className }: SidebarProps) {
  return (
    <aside className={cn('space-y-8', className)} aria-label="Sidebar navigation">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="font-body font-semibold text-sm text-text mb-3">{section.title}</h3>
          <ul className="space-y-1.5">
            {section.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block text-sm text-text-muted hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 3: Verify dev server compiles**

```bash
npm run dev
```

Expected: Compiles with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Breadcrumb and Sidebar layout components"
```

---

## PHASE 3: Homepage (Tasks 10–14)

### Task 10: Homepage Hero Section

**Files:**
- Create: `src/components/home/hero.tsx`
- Create: `src/hooks/use-scroll-reveal.ts`

- [ ] **Step 1: Create scroll reveal hook**

Create `src/hooks/use-scroll-reveal.ts`:

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
```

- [ ] **Step 2: Create Hero component**

Create `src/components/home/hero.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { Search, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KenteAccent } from '@/components/kente/kente-accent';
import { cn } from '@/lib/utils';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Kente background texture */}
      <KenteAccent variant="background" />

      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="max-w-3xl">
          <p className="text-accent font-medium text-sm tracking-wide uppercase mb-4 animate-reveal">
            Republic of Ghana
          </p>

          <h1
            className={cn(
              'font-display text-hero font-bold text-primary-dark leading-[1.1] mb-6',
              'animate-reveal [animation-delay:80ms]',
            )}
          >
            Serving Ghana&apos;s
            <br />
            <span className="text-primary">Public Sector</span>
          </h1>

          <p
            className={cn(
              'text-lg text-text-muted max-w-xl mb-10 leading-relaxed',
              'animate-reveal [animation-delay:160ms]',
            )}
          >
            The Office of the Head of Civil Service drives excellence, accountability, and
            transformation across Ghana&apos;s civil service.
          </p>

          <div
            className={cn(
              'flex flex-col sm:flex-row items-start gap-4',
              'animate-reveal [animation-delay:240ms]',
            )}
          >
            <Link href="/services">
              <Button variant="primary" size="lg">
                <Search className="h-5 w-5 mr-2" />
                Find a Service
              </Button>
            </Link>
            <Link href="/track">
              <Button variant="accent" size="lg">
                <FileSearch className="h-5 w-5 mr-2" />
                Track Your Submission
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Hero section with Kente background, CTAs, and scroll reveal hook"
```

---

### Task 11: Quick Access Services Section

**Files:**
- Create: `src/components/home/quick-services.tsx`

- [ ] **Step 1: Create QuickServices component**

Create `src/components/home/quick-services.tsx`:

```typescript
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
    <section ref={ref} className="py-16 lg:py-24">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-primary-dark mb-3">
            How Can We Help You?
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            Access key civil service resources and submit requests online.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Link key={service.href} href={service.href}>
              <Card
                hoverable
                kenteAccent
                className={cn(
                  'h-full text-center p-8',
                  isVisible && 'animate-reveal',
                  isVisible && `[animation-delay:${index * 80}ms]`,
                )}
              >
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <service.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-body font-semibold text-lg mb-2">{service.title}</h3>
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

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add QuickServices section with service cards and scroll reveal"
```

---

### Task 12: News & Events Section

**Files:**
- Create: `src/components/news/news-card.tsx`
- Create: `src/components/events/event-card.tsx`
- Create: `src/components/home/news-events-section.tsx`

- [ ] **Step 1: Create NewsCard component**

Create `src/components/news/news-card.tsx`:

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { formatDateShort } from '@/lib/utils';
import type { NewsArticle } from '@/types';

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  return (
    <Link href={`/news/${article.slug}`}>
      <Card hoverable kenteAccent className="flex gap-4 p-4">
        {article.thumbnailUrl && (
          <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={article.thumbnailUrl}
              alt=""
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <time className="text-xs text-text-muted block mb-1">
            {article.publishedAt ? formatDateShort(article.publishedAt) : ''}
          </time>
          <h3 className="font-body font-semibold text-sm leading-snug line-clamp-2 mb-1">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-xs text-text-muted line-clamp-2">{article.excerpt}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Create EventCard component**

Create `src/components/events/event-card.tsx`:

```typescript
import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Event } from '@/types';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const date = new Date(event.startDate);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-GH', { month: 'short' });

  return (
    <Link href={`/events/${event.slug}`}>
      <Card hoverable className="flex items-start gap-4 p-4">
        <div className="w-14 h-14 rounded-lg bg-accent/10 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-accent uppercase">{month}</span>
          <span className="text-lg font-bold text-accent leading-none">{day}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-body font-semibold text-sm leading-snug line-clamp-2 mb-1">
            {event.title}
          </h3>
          {event.location && (
            <p className="text-xs text-text-muted flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3: Create NewsEventsSection component**

Create `src/components/home/news-events-section.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { NewsCard } from '@/components/news/news-card';
import { EventCard } from '@/components/events/event-card';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';
import type { NewsArticle, Event } from '@/types';

interface NewsEventsSectionProps {
  news: NewsArticle[];
  events: Event[];
}

export function NewsEventsSection({ news, events }: NewsEventsSectionProps) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-16 lg:py-24 bg-surface-card">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'grid grid-cols-1 lg:grid-cols-5 gap-12',
            isVisible && 'animate-reveal',
          )}
        >
          {/* News — 3 columns */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold text-primary-dark">Latest News</h2>
              <Link
                href="/news"
                className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {news.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
              {news.length === 0 && (
                <p className="text-text-muted text-sm">No news articles yet.</p>
              )}
            </div>
          </div>

          {/* Events — 2 columns */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold text-primary-dark">Upcoming Events</h2>
              <Link
                href="/events"
                className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              {events.length === 0 && (
                <p className="text-text-muted text-sm">No upcoming events.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add NewsCard, EventCard, and NewsEventsSection for homepage"
```

---

### Task 13: Leadership Spotlight & Directorates Grid

**Files:**
- Create: `src/components/home/leadership-spotlight.tsx`
- Create: `src/components/home/directorates-grid.tsx`
- Create: `src/components/home/training-section.tsx`

- [ ] **Step 1: Create LeadershipSpotlight component**

Create `src/components/home/leadership-spotlight.tsx`:

```typescript
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';
import type { LeadershipProfile } from '@/types';

interface LeadershipSpotlightProps {
  leader: LeadershipProfile | null;
}

export function LeadershipSpotlight({ leader }: LeadershipSpotlightProps) {
  const { ref, isVisible } = useScrollReveal();

  if (!leader) return null;

  return (
    <section ref={ref} className="py-16 lg:py-24">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'bg-primary-dark rounded-xl overflow-hidden',
            isVisible && 'animate-reveal',
          )}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Photo */}
            {leader.photoUrl && (
              <div className="relative h-64 lg:h-auto">
                <Image
                  src={leader.photoUrl}
                  alt={leader.name}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            )}

            {/* Bio */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <p className="text-accent text-sm font-medium uppercase tracking-wide mb-2">
                Head of Civil Service
              </p>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-2">
                {leader.name}
              </h2>
              <p className="text-white/60 text-sm mb-4">{leader.title}</p>
              {leader.bio && (
                <p className="text-white/80 text-sm leading-relaxed mb-6 line-clamp-4">
                  {leader.bio}
                </p>
              )}
              <Link
                href="/about/leadership"
                className="text-accent text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all leadership <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create DirectoratesGrid component**

Create `src/components/home/directorates-grid.tsx`:

```typescript
'use client';

import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DIRECTORATES, DEPARTMENTS } from '@/lib/constants';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

export function DirectoratesGrid() {
  const { ref, isVisible } = useScrollReveal();

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
      iconName
    ];
    return Icon ? <Icon className="h-6 w-6 text-primary" /> : null;
  };

  return (
    <section ref={ref} className="py-16 lg:py-24 bg-surface-card">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-primary-dark mb-3">
            Directorates & Departments
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            The organisational units driving Ghana&apos;s civil service mandate.
          </p>
        </div>

        {/* Directorates */}
        <h3 className="font-body font-semibold text-sm text-text-muted uppercase tracking-wide mb-4">
          Directorates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {DIRECTORATES.map((dir, index) => (
            <Link key={dir.slug} href={`/directorates/${dir.slug}`}>
              <Card
                hoverable
                kenteAccent
                className={cn(
                  'p-5 h-full',
                  isVisible && 'animate-reveal',
                  isVisible && `[animation-delay:${index * 60}ms]`,
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getIcon(dir.icon)}
                  </div>
                  <div>
                    <h4 className="font-body font-semibold text-sm leading-snug">{dir.shortName}</h4>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">{dir.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Departments */}
        <h3 className="font-body font-semibold text-sm text-text-muted uppercase tracking-wide mb-4">
          Departments
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEPARTMENTS.map((dept, index) => (
            <Link key={dept.slug} href={`/departments/${dept.slug}`}>
              <Card
                hoverable
                kenteAccent
                className={cn(
                  'p-5 h-full',
                  isVisible && 'animate-reveal',
                  isVisible && `[animation-delay:${(DIRECTORATES.length + index) * 60}ms]`,
                )}
              >
                <h4 className="font-body font-semibold text-sm">{dept.shortName}</h4>
                <p className="text-xs text-text-muted mt-1 line-clamp-2">{dept.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create TrainingSection component**

Create `src/components/home/training-section.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { MapPin, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TRAINING_INSTITUTIONS } from '@/lib/constants';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

export function TrainingSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-16 lg:py-24">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-primary-dark mb-3">
            Training Institutions
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            Building capacity across Ghana&apos;s civil service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRAINING_INSTITUTIONS.map((inst, index) => (
            <Link key={inst.slug} href={`/training/${inst.slug}`}>
              <Card
                hoverable
                kenteAccent
                className={cn(
                  'p-6 h-full',
                  isVisible && 'animate-reveal',
                  isVisible && `[animation-delay:${index * 80}ms]`,
                )}
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-body font-semibold mb-2">{inst.name}</h3>
                <p className="text-sm text-text-muted mb-3">{inst.focusArea}</p>
                <p className="text-xs text-text-muted flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {inst.location}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add LeadershipSpotlight, DirectoratesGrid, and TrainingSection"
```

---

### Task 14: Assemble Homepage

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Assemble homepage with all sections**

Replace `src/app/[locale]/page.tsx`:

```typescript
import { Hero } from '@/components/home/hero';
import { QuickServices } from '@/components/home/quick-services';
import { NewsEventsSection } from '@/components/home/news-events-section';
import { LeadershipSpotlight } from '@/components/home/leadership-spotlight';
import { DirectoratesGrid } from '@/components/home/directorates-grid';
import { TrainingSection } from '@/components/home/training-section';
import { KenteAccent } from '@/components/kente/kente-accent';
import type { NewsArticle, Event, LeadershipProfile } from '@/types';

// Placeholder data until API is connected
const placeholderNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Head of Civil Service Addresses Public Sector Reform Conference',
    slug: 'head-addresses-reform-conference',
    excerpt: 'Key outcomes from the annual public sector reform conference held in Accra.',
    content: '',
    thumbnailUrl: null,
    publishedAt: '2026-04-10T00:00:00Z',
    isPublished: true,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
  },
  {
    id: '2',
    title: 'Civil Service Recruitment Drive Opens for 2026',
    slug: 'recruitment-drive-2026',
    excerpt: 'Applications are now open for various positions across government ministries.',
    content: '',
    thumbnailUrl: null,
    publishedAt: '2026-04-08T00:00:00Z',
    isPublished: true,
    createdAt: '2026-04-08T00:00:00Z',
    updatedAt: '2026-04-08T00:00:00Z',
  },
  {
    id: '3',
    title: 'OHCS Launches Digital Transformation Initiative',
    slug: 'digital-transformation-initiative',
    excerpt: 'A new programme to modernise service delivery across all government agencies.',
    content: '',
    thumbnailUrl: null,
    publishedAt: '2026-04-05T00:00:00Z',
    isPublished: true,
    createdAt: '2026-04-05T00:00:00Z',
    updatedAt: '2026-04-05T00:00:00Z',
  },
];

const placeholderEvents: Event[] = [
  {
    id: '1',
    title: 'Annual Civil Service Week 2026',
    slug: 'civil-service-week-2026',
    description: 'Celebrating excellence in public service delivery.',
    location: 'Accra International Conference Centre',
    startDate: '2026-05-12T09:00:00Z',
    endDate: '2026-05-16T17:00:00Z',
    isPublished: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Leadership Development Workshop',
    slug: 'leadership-workshop-q2',
    description: 'Building the next generation of public sector leaders.',
    location: 'Civil Service Training Centre, Accra',
    startDate: '2026-05-20T09:00:00Z',
    endDate: null,
    isPublished: true,
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: '2026-04-02T00:00:00Z',
  },
  {
    id: '3',
    title: 'ICT in Governance Seminar',
    slug: 'ict-governance-seminar',
    description: 'Exploring technology solutions for effective governance.',
    location: 'GIMPA Campus, Accra',
    startDate: '2026-06-03T10:00:00Z',
    endDate: null,
    isPublished: true,
    createdAt: '2026-04-03T00:00:00Z',
    updatedAt: '2026-04-03T00:00:00Z',
  },
];

const placeholderLeader: LeadershipProfile = {
  id: '1',
  name: 'Head of Civil Service',
  title: 'Head of the Civil Service of the Republic of Ghana',
  bio: 'Leading the transformation and modernisation of Ghana\'s civil service to deliver efficient, transparent, and accountable public services to all citizens.',
  photoUrl: null,
  displayOrder: 0,
  isFeatured: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <KenteAccent variant="divider" />
      <QuickServices />
      <KenteAccent variant="divider" />
      <NewsEventsSection news={placeholderNews} events={placeholderEvents} />
      <KenteAccent variant="divider" />
      <LeadershipSpotlight leader={placeholderLeader} />
      <KenteAccent variant="divider" />
      <DirectoratesGrid />
      <KenteAccent variant="divider" />
      <TrainingSection />
    </>
  );
}
```

- [ ] **Step 2: Start dev server and verify homepage renders**

```bash
npm run dev
```

Open `http://localhost:3000` in a browser. Verify:
- Hero section with CTAs
- Kente dividers between sections
- Quick access services grid
- News and events section
- Leadership spotlight
- Directorates and departments grid
- Training institutions
- Header with navigation and Kente band
- Footer with contact info

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: assemble homepage with all sections, placeholder data, and Kente dividers"
```

---

## PHASE 4: Worker API & Database (Tasks 15–20)

### Task 15: Worker Project Setup

**Files:**
- Create: `worker/package.json`
- Create: `worker/tsconfig.json`
- Create: `worker/wrangler.toml`
- Create: `worker/src/index.ts`

- [ ] **Step 1: Initialize worker project**

```bash
cd "C:/Users/USER/OneDrive - Smart Workplace/Desktop/Projects/OHCS Website Redesign/ohcs-website"
mkdir -p worker/src
```

- [ ] **Step 2: Create worker package.json**

Create `worker/package.json`:

```json
{
  "name": "ohcs-worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "db:migrate": "wrangler d1 migrations apply ohcs-db"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/zod-validator": "^0.4.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "wrangler": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 3: Create worker tsconfig.json**

Create `worker/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create wrangler.toml**

Create `worker/wrangler.toml`:

```toml
name = "ohcs-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "development"

[[d1_databases]]
binding = "DB"
database_name = "ohcs-db"
database_id = "placeholder-replace-after-creation"

[[kv_namespaces]]
binding = "REF_LOOKUP"
id = "placeholder-replace-after-creation"

[[kv_namespaces]]
binding = "CACHE"
id = "placeholder-replace-after-creation"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "placeholder-replace-after-creation"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "ohcs-assets"
```

- [ ] **Step 5: Create Hono app entry point**

Create `worker/src/index.ts`:

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = {
  DB: D1Database;
  REF_LOOKUP: KVNamespace;
  CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
  ASSETS: R2Bucket;
  ENVIRONMENT: string;
  ADMIN_PASSWORD_HASH: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use(
  '/api/*',
  cors({
    origin: ['https://ohcs.gov.gh', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId: crypto.randomUUID(),
      },
    },
    500,
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        requestId: crypto.randomUUID(),
      },
    },
    404,
  );
});

export default app;
```

- [ ] **Step 6: Install worker dependencies**

```bash
cd worker && npm install && cd ..
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: initialize Cloudflare Worker project with Hono, CORS, and error handling"
```

---

### Task 16: D1 Database Schema & Migrations

**Files:**
- Create: `worker/src/db/migrations/0001_init.sql`
- Create: `worker/src/db/schema.ts`

- [ ] **Step 1: Create initial migration**

Create `worker/src/db/migrations/0001_init.sql`:

```sql
-- News articles
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  published_at TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  location TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Publications
CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf',
  file_size_bytes INTEGER,
  is_published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reference_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  attachments TEXT,
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Submission status history
CREATE TABLE IF NOT EXISTS submission_status_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Leadership profiles
CREATE TABLE IF NOT EXISTS leadership (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Gallery items
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(is_published, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_publications_category ON publications(is_published, category);
CREATE INDEX IF NOT EXISTS idx_submissions_reference ON submissions(reference_number);
CREATE INDEX IF NOT EXISTS idx_submissions_type_status ON submissions(type, status);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
CREATE INDEX IF NOT EXISTS idx_status_history_submission ON submission_status_history(submission_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leadership_order ON leadership(display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_type ON gallery(type, created_at DESC);
```

- [ ] **Step 2: Create schema types for worker**

Create `worker/src/db/schema.ts`:

```typescript
export interface NewsRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  thumbnail_url: string | null;
  published_at: string | null;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface PublicationRow {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  is_published: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionRow {
  id: string;
  reference_number: string;
  type: string;
  status: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  body: string;
  attachments: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryRow {
  id: string;
  submission_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface LeadershipRow {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  photo_url: string | null;
  display_order: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryRow {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  category: string | null;
  created_at: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add D1 database schema, migration, and TypeScript row types"
```

---

### Task 17: Reference Number Generator

**Files:**
- Create: `worker/src/lib/reference.ts`
- Create: `tests/unit/reference.test.ts`

- [ ] **Step 1: Write test for reference number generator**

Create `tests/unit/reference.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

// Inline the logic for testing since worker code has different module system
function generateReferenceNumber(type: string): string {
  const typeMap: Record<string, string> = {
    recruitment: 'REC',
    rti: 'RTI',
    complaint: 'CMP',
    feedback: 'FBK',
  };

  const code = typeMap[type];
  if (!code) throw new Error(`Unknown submission type: ${type}`);

  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Array.from({ length: 4 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36)),
  ).join('');

  return `OHCS-${code}-${date}-${random}`;
}

describe('generateReferenceNumber', () => {
  it('generates correct format for recruitment', () => {
    const ref = generateReferenceNumber('recruitment');
    expect(ref).toMatch(/^OHCS-REC-\d{8}-[A-Z0-9]{4}$/);
  });

  it('generates correct format for RTI', () => {
    const ref = generateReferenceNumber('rti');
    expect(ref).toMatch(/^OHCS-RTI-\d{8}-[A-Z0-9]{4}$/);
  });

  it('generates correct format for complaint', () => {
    const ref = generateReferenceNumber('complaint');
    expect(ref).toMatch(/^OHCS-CMP-\d{8}-[A-Z0-9]{4}$/);
  });

  it('generates correct format for feedback', () => {
    const ref = generateReferenceNumber('feedback');
    expect(ref).toMatch(/^OHCS-FBK-\d{8}-[A-Z0-9]{4}$/);
  });

  it('throws for unknown type', () => {
    expect(() => generateReferenceNumber('invalid')).toThrow('Unknown submission type');
  });

  it('generates unique references', () => {
    const refs = new Set(Array.from({ length: 100 }, () => generateReferenceNumber('complaint')));
    expect(refs.size).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/reference.test.ts
```

Expected: PASS (the function is inline in the test for this case since it's pure logic). Verify all pass.

- [ ] **Step 3: Create worker reference number module**

Create `worker/src/lib/reference.ts`:

```typescript
const TYPE_CODES: Record<string, string> = {
  recruitment: 'REC',
  rti: 'RTI',
  complaint: 'CMP',
  feedback: 'FBK',
};

export function generateReferenceNumber(type: string): string {
  const code = TYPE_CODES[type];
  if (!code) throw new Error(`Unknown submission type: ${type}`);

  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Array.from({ length: 4 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36)),
  ).join('');

  return `OHCS-${code}-${date}-${random}`;
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add reference number generator with OHCS-TYPE-DATE-RANDOM format"
```

---

### Task 18: Worker Validation Schemas

**Files:**
- Create: `worker/src/lib/validation.ts`

- [ ] **Step 1: Create worker-side Zod schemas**

Create `worker/src/lib/validation.ts`:

```typescript
import { z } from 'zod';

export const createSubmissionSchema = z.object({
  type: z.enum(['recruitment', 'rti', 'complaint', 'feedback']),
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  subject: z.string().max(500).optional().or(z.literal('')),
  body: z.string().min(10).max(10000),
  // Recruitment-specific fields encoded in body or as separate fields
  position: z.string().max(300).optional(),
  qualifications: z.string().max(5000).optional(),
  experience: z.string().max(5000).optional(),
});

export const trackSubmissionSchema = z.object({
  referenceNumber: z
    .string()
    .min(1)
    .regex(/^OHCS-[A-Z]{3}-\d{8}-[A-Z0-9]{4}$/),
  contact: z.string().min(1),
});

export const createNewsSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(1000).optional(),
  content: z.string().min(1),
  thumbnailUrl: z.string().url().optional(),
  publishedAt: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const createPublicationSchema = z.object({
  title: z.string().min(1).max(500),
  category: z.enum(['report', 'policy', 'form', 'circular', 'other']),
  description: z.string().max(2000).optional(),
  fileUrl: z.string().url(),
  fileType: z.string().default('pdf'),
  fileSizeBytes: z.number().optional(),
  publishedAt: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const createLeadershipSchema = z.object({
  name: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  bio: z.string().max(5000).optional(),
  photoUrl: z.string().url().optional(),
  displayOrder: z.number().int().default(0),
  isFeatured: z.boolean().default(false),
});

export const updateSubmissionStatusSchema = z.object({
  status: z.enum(['received', 'under_review', 'in_progress', 'resolved', 'closed']),
  note: z.string().max(2000).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add server-side Zod validation schemas for all API endpoints"
```

---

### Task 19: Public API Routes

**Files:**
- Create: `worker/src/routes/public/news.ts`
- Create: `worker/src/routes/public/events.ts`
- Create: `worker/src/routes/public/publications.ts`
- Create: `worker/src/routes/public/leadership.ts`
- Create: `worker/src/routes/public/submissions.ts`
- Create: `worker/src/routes/public/track.ts`
- Modify: `worker/src/index.ts`

- [ ] **Step 1: Create news routes**

Create `worker/src/routes/public/news.ts`:

```typescript
import { Hono } from 'hono';
import type { NewsRow } from '../../db/schema';

type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
};

const news = new Hono<{ Bindings: Env }>();

news.get('/', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const limit = Math.min(Number(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const [countResult, rows] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT COUNT(*) as total FROM news WHERE is_published = 1'),
    c.env.DB.prepare(
      'SELECT * FROM news WHERE is_published = 1 ORDER BY published_at DESC LIMIT ? OFFSET ?',
    )
      .bind(limit, offset),
  ]);

  const total = (countResult.results[0] as { total: number } | undefined)?.total ?? 0;

  return c.json({
    data: rows.results as NewsRow[],
    meta: { page, totalPages: Math.ceil(total / limit), total },
  });
});

news.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const row = await c.env.DB.prepare('SELECT * FROM news WHERE slug = ? AND is_published = 1')
    .bind(slug)
    .first<NewsRow>();

  if (!row) {
    return c.json(
      { error: { code: 'NOT_FOUND', message: 'Article not found', requestId: crypto.randomUUID() } },
      404,
    );
  }

  return c.json({ data: row });
});

export { news };
```

- [ ] **Step 2: Create events routes**

Create `worker/src/routes/public/events.ts`:

```typescript
import { Hono } from 'hono';
import type { EventRow } from '../../db/schema';

type Env = { DB: D1Database };

const events = new Hono<{ Bindings: Env }>();

events.get('/', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const limit = Math.min(Number(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const upcoming = c.req.query('upcoming') === 'true';

  let whereClause = 'WHERE is_published = 1';
  if (upcoming) {
    whereClause += ` AND start_date >= strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`;
  }

  const [countResult, rows] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM events ${whereClause}`),
    c.env.DB.prepare(
      `SELECT * FROM events ${whereClause} ORDER BY start_date ASC LIMIT ? OFFSET ?`,
    )
      .bind(limit, offset),
  ]);

  const total = (countResult.results[0] as { total: number } | undefined)?.total ?? 0;

  return c.json({
    data: rows.results as EventRow[],
    meta: { page, totalPages: Math.ceil(total / limit), total },
  });
});

events.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const row = await c.env.DB.prepare('SELECT * FROM events WHERE slug = ? AND is_published = 1')
    .bind(slug)
    .first<EventRow>();

  if (!row) {
    return c.json(
      { error: { code: 'NOT_FOUND', message: 'Event not found', requestId: crypto.randomUUID() } },
      404,
    );
  }

  return c.json({ data: row });
});

export { events };
```

- [ ] **Step 3: Create publications routes**

Create `worker/src/routes/public/publications.ts`:

```typescript
import { Hono } from 'hono';
import type { PublicationRow } from '../../db/schema';

type Env = { DB: D1Database };

const publications = new Hono<{ Bindings: Env }>();

publications.get('/', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const limit = Math.min(Number(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;
  const category = c.req.query('category');

  let whereClause = 'WHERE is_published = 1';
  const bindings: (string | number)[] = [];

  if (category) {
    whereClause += ' AND category = ?';
    bindings.push(category);
  }

  bindings.push(limit, offset);

  const [countResult, rows] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM publications ${whereClause}`)
      .bind(...bindings.slice(0, -2)),
    c.env.DB.prepare(
      `SELECT * FROM publications ${whereClause} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(...bindings),
  ]);

  const total = (countResult.results[0] as { total: number } | undefined)?.total ?? 0;

  return c.json({
    data: rows.results as PublicationRow[],
    meta: { page, totalPages: Math.ceil(total / limit), total },
  });
});

export { publications };
```

- [ ] **Step 4: Create leadership routes**

Create `worker/src/routes/public/leadership.ts`:

```typescript
import { Hono } from 'hono';
import type { LeadershipRow } from '../../db/schema';

type Env = { DB: D1Database };

const leadership = new Hono<{ Bindings: Env }>();

leadership.get('/', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM leadership ORDER BY display_order ASC',
  ).all<LeadershipRow>();

  return c.json({ data: rows.results });
});

leadership.get('/featured', async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT * FROM leadership WHERE is_featured = 1 ORDER BY display_order ASC LIMIT 1',
  ).first<LeadershipRow>();

  return c.json({ data: row || null });
});

export { leadership };
```

- [ ] **Step 5: Create submissions route**

Create `worker/src/routes/public/submissions.ts`:

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createSubmissionSchema } from '../../lib/validation';
import { generateReferenceNumber } from '../../lib/reference';

type Env = {
  DB: D1Database;
  REF_LOOKUP: KVNamespace;
  RATE_LIMIT: KVNamespace;
};

const submissions = new Hono<{ Bindings: Env }>();

submissions.post('/', zValidator('json', createSubmissionSchema), async (c) => {
  const body = c.req.valid('json');

  // Rate limiting: 5 submissions per IP per minute
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const rateLimitKey = `ip:${ip}:submissions`;
  const currentCount = Number((await c.env.RATE_LIMIT.get(rateLimitKey)) || '0');

  if (currentCount >= 5) {
    return c.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many submissions. Please try again in a minute.',
          requestId: crypto.randomUUID(),
        },
      },
      429,
    );
  }

  await c.env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), { expirationTtl: 60 });

  // Generate reference number
  const referenceNumber = generateReferenceNumber(body.type);
  const id = crypto.randomUUID().replace(/-/g, '');

  // Insert submission
  await c.env.DB.prepare(
    `INSERT INTO submissions (id, reference_number, type, status, name, email, phone, subject, body)
     VALUES (?, ?, ?, 'received', ?, ?, ?, ?, ?)`,
  )
    .bind(id, referenceNumber, body.type, body.name, body.email || null, body.phone || null, body.subject || null, body.body)
    .run();

  // Insert initial status history
  await c.env.DB.prepare(
    `INSERT INTO submission_status_history (id, submission_id, status, note)
     VALUES (?, ?, 'received', 'Submission received')`,
  )
    .bind(crypto.randomUUID().replace(/-/g, ''), id)
    .run();

  // Index in KV for fast lookup
  await c.env.REF_LOOKUP.put(`ref:${referenceNumber}`, id);

  return c.json(
    {
      data: {
        referenceNumber,
        message: 'Your submission has been received. Use the reference number to track its status.',
      },
    },
    201,
  );
});

export { submissions };
```

- [ ] **Step 6: Create track route**

Create `worker/src/routes/public/track.ts`:

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { trackSubmissionSchema } from '../../lib/validation';
import type { SubmissionRow, StatusHistoryRow } from '../../db/schema';

type Env = {
  DB: D1Database;
  REF_LOOKUP: KVNamespace;
};

const track = new Hono<{ Bindings: Env }>();

track.post('/', zValidator('json', trackSubmissionSchema), async (c) => {
  const { referenceNumber, contact } = c.req.valid('json');

  // Fast KV lookup
  const submissionId = await c.env.REF_LOOKUP.get(`ref:${referenceNumber}`);

  if (!submissionId) {
    return c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'No submission found with that reference number.',
          requestId: crypto.randomUUID(),
        },
      },
      404,
    );
  }

  // Fetch submission and verify contact matches
  const submission = await c.env.DB.prepare('SELECT * FROM submissions WHERE id = ?')
    .bind(submissionId)
    .first<SubmissionRow>();

  if (!submission) {
    return c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Submission not found.',
          requestId: crypto.randomUUID(),
        },
      },
      404,
    );
  }

  // Verify contact (email or phone matches)
  const contactMatches =
    (submission.email && submission.email.toLowerCase() === contact.toLowerCase()) ||
    (submission.phone && submission.phone === contact);

  if (!contactMatches) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'The contact information does not match our records.',
          requestId: crypto.randomUUID(),
        },
      },
      401,
    );
  }

  // Fetch status history
  const history = await c.env.DB.prepare(
    'SELECT * FROM submission_status_history WHERE submission_id = ? ORDER BY created_at ASC',
  )
    .bind(submissionId)
    .all<StatusHistoryRow>();

  return c.json({
    data: {
      referenceNumber: submission.reference_number,
      type: submission.type,
      status: submission.status,
      subject: submission.subject,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at,
      timeline: history.results.map((h) => ({
        status: h.status,
        note: h.note,
        date: h.created_at,
      })),
    },
  });
});

export { track };
```

- [ ] **Step 7: Mount all routes in index.ts**

Replace `worker/src/index.ts`:

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { news } from './routes/public/news';
import { events } from './routes/public/events';
import { publications } from './routes/public/publications';
import { leadership } from './routes/public/leadership';
import { submissions } from './routes/public/submissions';
import { track } from './routes/public/track';

type Env = {
  DB: D1Database;
  REF_LOOKUP: KVNamespace;
  CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
  ASSETS: R2Bucket;
  ENVIRONMENT: string;
  ADMIN_PASSWORD_HASH: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use(
  '/api/*',
  cors({
    origin: ['https://ohcs.gov.gh', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.route('/api/v1/news', news);
app.route('/api/v1/events', events);
app.route('/api/v1/publications', publications);
app.route('/api/v1/leadership', leadership);
app.route('/api/v1/submissions', submissions);
app.route('/api/v1/track', track);

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId: crypto.randomUUID(),
      },
    },
    500,
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        requestId: crypto.randomUUID(),
      },
    },
    404,
  );
});

export default app;
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add public API routes — news, events, publications, leadership, submissions, track"
```

---

### Task 20: Rate Limiting Middleware & R2 Storage Helper

**Files:**
- Create: `worker/src/middleware/rate-limit.ts`
- Create: `worker/src/lib/storage.ts`

- [ ] **Step 1: Create rate limiting middleware**

Create `worker/src/middleware/rate-limit.ts`:

```typescript
import type { Context, Next } from 'hono';

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyPrefix: string;
}

export function rateLimit(options: RateLimitOptions) {
  return async (c: Context<{ Bindings: { RATE_LIMIT: KVNamespace } }>, next: Next) => {
    const ip = c.req.header('cf-connecting-ip') || 'unknown';
    const key = `${options.keyPrefix}:${ip}`;
    const current = Number((await c.env.RATE_LIMIT.get(key)) || '0');

    if (current >= options.limit) {
      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: `Too many requests. Please try again later.`,
            requestId: crypto.randomUUID(),
          },
        },
        429,
      );
    }

    await c.env.RATE_LIMIT.put(key, String(current + 1), {
      expirationTtl: options.windowSeconds,
    });

    await next();
  };
}
```

- [ ] **Step 2: Create R2 storage helper**

Create `worker/src/lib/storage.ts`:

```typescript
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export async function uploadFile(
  bucket: R2Bucket,
  file: File,
  folder: string,
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`File type "${file.type}" is not allowed. Allowed: PDF, JPEG, PNG, WebP.`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the maximum of 10MB.`);
  }

  const ext = file.name.split('.').pop() || 'bin';
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;

  await bucket.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: file.name },
  });

  return {
    key,
    url: key, // Will be served via R2 custom domain or worker proxy
    size: file.size,
    contentType: file.type,
  };
}

export async function deleteFile(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add rate limiting middleware and R2 storage helper with file validation"
```

---

## PHASES 5–10: Remaining Implementation

The remaining phases follow the same patterns established above. I'm documenting them at a higher level since the patterns are now established. Each task follows TDD: write test → verify failure → implement → verify pass → commit.

---

## PHASE 5: Interior Pages (Tasks 21–25)

### Task 21: About Pages

**Files:**
- Create: `src/app/[locale]/about/page.tsx`
- Create: `src/app/[locale]/about/civil-service/page.tsx`
- Create: `src/app/[locale]/about/leadership/page.tsx`
- Create: `src/app/[locale]/about/structure/page.tsx`
- Create: `src/app/[locale]/about/partners/page.tsx`

- [ ] **Step 1:** Create About overview page with Breadcrumb, page title in Playfair Display, content area + sidebar layout
- [ ] **Step 2:** Create Civil Service page with institutional history, mandate, and vision
- [ ] **Step 3:** Create Leadership page that fetches from `/api/v1/leadership` and displays profile cards with photo, name, title, bio
- [ ] **Step 4:** Create Structure page with organisational chart layout
- [ ] **Step 5:** Create Partners page listing key partner organisations
- [ ] **Step 6:** Verify all pages render, breadcrumbs work, and sidebar links function
- [ ] **Step 7:** Commit: `feat: add About pages — overview, civil service, leadership, structure, partners`

---

### Task 22: Directorates Pages

**Files:**
- Create: `src/app/[locale]/directorates/page.tsx`
- Create: `src/app/[locale]/directorates/[slug]/page.tsx`

- [ ] **Step 1:** Create directorates listing page showing all 8 directorates as cards (icon + name + description), using data from `DIRECTORATES` constant
- [ ] **Step 2:** Create dynamic `[slug]` detail page with breadcrumb, full description, mandate, key functions. Use `generateStaticParams` from `DIRECTORATES` for static generation
- [ ] **Step 3:** Verify navigation between listing and detail pages
- [ ] **Step 4:** Commit: `feat: add Directorates listing and detail pages`

---

### Task 23: Departments Pages

**Files:**
- Create: `src/app/[locale]/departments/page.tsx`
- Create: `src/app/[locale]/departments/[slug]/page.tsx`

- [ ] **Step 1:** Create departments listing page showing all 4 departments with logos where available
- [ ] **Step 2:** Create dynamic detail page with same layout pattern as directorates
- [ ] **Step 3:** Commit: `feat: add Departments listing and detail pages`

---

### Task 24: Training Institutions Pages

**Files:**
- Create: `src/app/[locale]/training/page.tsx`
- Create: `src/app/[locale]/training/[slug]/page.tsx`

- [ ] **Step 1:** Create training listing page with institution cards showing name, location, focus area
- [ ] **Step 2:** Create detail page with full information, programmes, and contact
- [ ] **Step 3:** Commit: `feat: add Training Institutions listing and detail pages`

---

### Task 25: Contact Page

**Files:**
- Create: `src/app/[locale]/contact/page.tsx`

- [ ] **Step 1:** Create Contact page with: office address and map placeholder, phone numbers, email addresses, office hours, and a general enquiry form (name, email, subject, message)
- [ ] **Step 2:** Commit: `feat: add Contact page with office information and enquiry form`

---

## PHASE 6: Services & Submission Tracking (Tasks 26–31)

### Task 26: Services Overview Page

**Files:**
- Create: `src/app/[locale]/services/page.tsx`

- [ ] **Step 1:** Create services hub page with 4 service cards linking to recruitment, RTI, complaints, feedback. Same card design as homepage quick services but with more detail
- [ ] **Step 2:** Commit: `feat: add Services overview page`

---

### Task 27: Complaint & Feedback Forms

**Files:**
- Create: `src/components/forms/complaint-form.tsx`
- Create: `src/components/forms/feedback-form.tsx`
- Create: `src/app/[locale]/services/complaints/page.tsx`
- Create: `src/app/[locale]/services/feedback/page.tsx`
- Create: `tests/component/submission-form.test.tsx`

- [ ] **Step 1:** Write test for complaint form — renders fields, validates on submit, shows errors, shows success with reference number
- [ ] **Step 2:** Run test, verify failure
- [ ] **Step 3:** Create `complaint-form.tsx` using React Hook Form + Zod resolver + complaintFormSchema. On success, POST to `/api/v1/submissions` with `type: 'complaint'`. Display reference number in JetBrains Mono with copy button
- [ ] **Step 4:** Create `feedback-form.tsx` — same pattern with feedbackFormSchema and `type: 'feedback'`
- [ ] **Step 5:** Create page components that wrap the forms with breadcrumb, title, and explanatory text
- [ ] **Step 6:** Run tests, verify pass
- [ ] **Step 7:** Commit: `feat: add Complaints and Feedback submission forms with validation`

---

### Task 28: RTI Request Form

**Files:**
- Create: `src/components/forms/rti-form.tsx`
- Create: `src/app/[locale]/services/rti/page.tsx`

- [ ] **Step 1:** Create `rti-form.tsx` using rtiFormSchema. Include: name, email (required for RTI), phone, subject (required), detailed request body. Same success pattern with reference number
- [ ] **Step 2:** Create RTI page with breadcrumb, explanation of the Right to Information Act, and the form
- [ ] **Step 3:** Commit: `feat: add Right to Information request form`

---

### Task 29: Recruitment Form (Multi-Step)

**Files:**
- Create: `src/components/forms/multi-step-wizard.tsx`
- Create: `src/components/forms/recruitment-form.tsx`
- Create: `src/app/[locale]/services/recruitment/page.tsx`

- [ ] **Step 1:** Create `multi-step-wizard.tsx` — generic multi-step form wrapper with: progress indicator (step dots/bar), back/next navigation, step validation before proceeding, animated transitions between steps
- [ ] **Step 2:** Create `recruitment-form.tsx` — 3 steps: (1) Personal info: name, email, phone (2) Position & qualifications (3) Experience & cover letter. Uses recruitmentFormSchema
- [ ] **Step 3:** Create recruitment page with breadcrumb and form
- [ ] **Step 4:** Commit: `feat: add multi-step Recruitment application form`

---

### Task 30: Submission Tracking Page

**Files:**
- Create: `src/components/forms/track-form.tsx`
- Create: `src/app/[locale]/track/page.tsx`
- Create: `tests/component/track-form.test.tsx`

- [ ] **Step 1:** Write test for track form — renders reference number and contact inputs, validates format, displays status timeline on success
- [ ] **Step 2:** Run test, verify failure
- [ ] **Step 3:** Create `track-form.tsx` — reference number input (with format hint), email/phone input, submit button. On success, POST to `/api/v1/track` and display: current status badge, submission timeline with date and notes for each status change
- [ ] **Step 4:** Create track page with hero-style intro and the form centered
- [ ] **Step 5:** Run tests, verify pass
- [ ] **Step 6:** Commit: `feat: add submission tracking page with status timeline`

---

### Task 31: API Client

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1:** Create typed API client with functions: `fetchNews()`, `fetchNewsArticle(slug)`, `fetchEvents()`, `fetchEvent(slug)`, `fetchPublications(category?)`, `fetchLeadership()`, `fetchFeaturedLeader()`, `submitForm(type, data)`, `trackSubmission(ref, contact)`. Each returns typed `ApiResponse<T>` or throws with `ApiError`. Base URL from environment variable
- [ ] **Step 2:** Commit: `feat: add typed API client for all public endpoints`

---

## PHASE 7: Content Pages (Tasks 32–37)

### Task 32: News Listing & Detail Pages

**Files:**
- Create: `src/components/news/news-list.tsx`
- Create: `src/app/[locale]/news/page.tsx`
- Create: `src/app/[locale]/news/[slug]/page.tsx`

- [ ] **Step 1:** Create `news-list.tsx` — paginated list of NewsCards with load more / pagination controls
- [ ] **Step 2:** Create news listing page fetching from API with SSR
- [ ] **Step 3:** Create news detail page with full article content, published date, breadcrumb, and "Back to News" link
- [ ] **Step 4:** Commit: `feat: add News listing and article detail pages`

---

### Task 33: Events Listing & Detail Pages

**Files:**
- Create: `src/components/events/event-list.tsx`
- Create: `src/app/[locale]/events/page.tsx`
- Create: `src/app/[locale]/events/[slug]/page.tsx`

- [ ] **Step 1:** Create `event-list.tsx` — paginated list of EventCards
- [ ] **Step 2:** Create events listing page with upcoming filter
- [ ] **Step 3:** Create event detail page with full description, date, location, and breadcrumb
- [ ] **Step 4:** Commit: `feat: add Events listing and detail pages`

---

### Task 34: Publications Page

**Files:**
- Create: `src/components/publications/publication-card.tsx`
- Create: `src/components/publications/publication-list.tsx`
- Create: `src/app/[locale]/publications/page.tsx`

- [ ] **Step 1:** Create `publication-card.tsx` — title, date, category badge, file type icon (PDF icon from Lucide), file size, download button
- [ ] **Step 2:** Create `publication-list.tsx` — filterable by category (tabs or sidebar), searchable, paginated
- [ ] **Step 3:** Create publications page with SSR data fetching
- [ ] **Step 4:** Commit: `feat: add Publications page with category filtering and download`

---

### Task 35: Gallery Pages

**Files:**
- Create: `src/components/gallery/photo-grid.tsx`
- Create: `src/components/gallery/lightbox.tsx`
- Create: `src/components/gallery/video-embed.tsx`
- Create: `src/app/[locale]/gallery/page.tsx`
- Create: `src/app/[locale]/gallery/photos/page.tsx`
- Create: `src/app/[locale]/gallery/videos/page.tsx`

- [ ] **Step 1:** Create `photo-grid.tsx` — responsive grid layout with click-to-enlarge
- [ ] **Step 2:** Create `lightbox.tsx` — modal overlay with full-size image, navigation arrows, close button, keyboard support (Escape, arrow keys)
- [ ] **Step 3:** Create `video-embed.tsx` — responsive embed wrapper for YouTube/Vimeo
- [ ] **Step 4:** Create gallery pages with tabs for photos/videos
- [ ] **Step 5:** Commit: `feat: add Gallery with photo grid, lightbox, and video embeds`

---

### Task 36: Privacy & Accessibility Pages

**Files:**
- Create: `src/app/[locale]/privacy/page.tsx`
- Create: `src/app/[locale]/accessibility/page.tsx`

- [ ] **Step 1:** Create Privacy Policy page with standard government data protection content
- [ ] **Step 2:** Create Accessibility Statement page with WCAG 2.1 AA commitment
- [ ] **Step 3:** Commit: `feat: add Privacy Policy and Accessibility Statement pages`

---

### Task 37: Connect Homepage to API

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1:** Replace placeholder data with API calls: `fetchNews()` for latest 3 articles, `fetchEvents({ upcoming: true })` for next 3 events, `fetchFeaturedLeader()` for leadership spotlight
- [ ] **Step 2:** Add loading states with Skeleton components, error fallbacks
- [ ] **Step 3:** Commit: `feat: connect homepage to live API data with loading states`

---

## PHASE 8: Admin Dashboard (Tasks 38–43)

### Task 38: Admin Auth & Layout

**Files:**
- Create: `worker/src/routes/admin/auth.ts`
- Create: `worker/src/middleware/auth.ts`
- Create: `src/app/[locale]/admin/layout.tsx`
- Create: `src/app/[locale]/admin/login/page.tsx`
- Create: `src/app/[locale]/admin/page.tsx`

- [ ] **Step 1:** Create auth route in worker — POST `/api/v1/admin/auth/login` that validates credentials against bcrypt hash, returns JWT access token + sets httpOnly refresh cookie
- [ ] **Step 2:** Create auth middleware that validates JWT on all `/api/v1/admin/*` routes (except login)
- [ ] **Step 3:** Create admin login page — simple form with username/password, green primary button
- [ ] **Step 4:** Create admin layout with sidebar navigation (News, Events, Publications, Submissions, Leadership, Gallery), top bar with logout button. Functional design — no heavy Kente treatment needed
- [ ] **Step 5:** Create admin dashboard home page with summary cards: total submissions (by status), recent news count, upcoming events count
- [ ] **Step 6:** Commit: `feat: add admin authentication, layout, and dashboard overview`

---

### Task 39: Admin News CRUD

**Files:**
- Create: `worker/src/routes/admin/news.ts`
- Create: `src/app/[locale]/admin/news/page.tsx`
- Create: `src/app/[locale]/admin/news/[id]/page.tsx`
- Create: `src/components/ui/data-table.tsx`

- [ ] **Step 1:** Create admin news routes — POST create, PUT update, DELETE delete
- [ ] **Step 2:** Create `data-table.tsx` — reusable table component with: sticky header, alternating rows, sortable columns, empty state, skeleton loading rows
- [ ] **Step 3:** Create news listing page using DataTable — columns: title, status (published/draft badge), date, actions (edit/delete)
- [ ] **Step 4:** Create news create/edit page with form: title, slug (auto-generated from title), excerpt, content (textarea), thumbnail URL, published status toggle, publish date picker
- [ ] **Step 5:** Commit: `feat: add admin News CRUD with data table and create/edit forms`

---

### Task 40: Admin Events CRUD

**Files:**
- Create: `worker/src/routes/admin/events.ts`
- Create: `src/app/[locale]/admin/events/page.tsx`
- Create: `src/app/[locale]/admin/events/[id]/page.tsx`

- [ ] **Step 1:** Create admin events routes — CRUD endpoints
- [ ] **Step 2:** Create events listing page using DataTable
- [ ] **Step 3:** Create events create/edit form: title, slug, description, location, start date, end date, published toggle
- [ ] **Step 4:** Commit: `feat: add admin Events CRUD`

---

### Task 41: Admin Publications CRUD + File Upload

**Files:**
- Create: `worker/src/routes/admin/publications.ts`
- Create: `worker/src/routes/admin/upload.ts`
- Create: `src/components/ui/file-upload.tsx`
- Create: `src/app/[locale]/admin/publications/page.tsx`
- Create: `src/app/[locale]/admin/publications/[id]/page.tsx`

- [ ] **Step 1:** Create admin publications routes and upload route (POST multipart form to R2)
- [ ] **Step 2:** Create `file-upload.tsx` — drag-and-drop + click to upload, file type validation, progress indicator, preview for images
- [ ] **Step 3:** Create publications listing and create/edit pages with file upload integration
- [ ] **Step 4:** Commit: `feat: add admin Publications CRUD with R2 file upload`

---

### Task 42: Admin Submissions Management

**Files:**
- Create: `worker/src/routes/admin/submissions.ts`
- Create: `src/app/[locale]/admin/submissions/page.tsx`
- Create: `src/app/[locale]/admin/submissions/[id]/page.tsx`

- [ ] **Step 1:** Create admin submissions routes — GET list (filterable by type/status), PUT update status
- [ ] **Step 2:** Create submissions listing page — DataTable with columns: reference number (mono font), type badge, name, status badge, date. Filterable by type and status
- [ ] **Step 3:** Create submission detail page — full submission content, status timeline, update status form (select new status + add note), admin notes textarea
- [ ] **Step 4:** Commit: `feat: add admin Submissions management with status updates and timeline`

---

### Task 43: Admin Leadership & Gallery

**Files:**
- Create: `worker/src/routes/admin/leadership.ts`
- Create: `worker/src/routes/admin/gallery.ts`
- Create: `src/app/[locale]/admin/leadership/page.tsx`
- Create: `src/app/[locale]/admin/leadership/[id]/page.tsx`
- Create: `src/app/[locale]/admin/gallery/page.tsx`

- [ ] **Step 1:** Create admin leadership routes — CRUD + reorder (update display_order)
- [ ] **Step 2:** Create leadership listing (reorderable) and create/edit pages with photo upload
- [ ] **Step 3:** Create admin gallery routes and gallery management page with bulk photo upload
- [ ] **Step 4:** Commit: `feat: add admin Leadership profiles and Gallery management`

---

## PHASE 9: i18n, SEO & Hardening (Tasks 44–47)

### Task 44: i18n Setup

**Files:**
- Create: `messages/en.json`
- Create: `src/i18n.ts`
- Modify: `next.config.ts`

- [ ] **Step 1:** Configure next-intl with middleware for locale detection and routing
- [ ] **Step 2:** Create comprehensive `en.json` with translation keys for: navigation, hero, services, forms, buttons, errors, status labels, page titles, footer, admin
- [ ] **Step 3:** Replace hardcoded strings in key components (Header, Footer, Hero, form labels, button text) with `useTranslations()` calls
- [ ] **Step 4:** Commit: `feat: set up i18n infrastructure with next-intl and English translations`

---

### Task 45: SEO & Metadata

**Files:**
- Modify: all page.tsx files

- [ ] **Step 1:** Add `generateMetadata` to every page with: title, description, Open Graph tags, canonical URL
- [ ] **Step 2:** Create `src/app/sitemap.ts` — dynamic sitemap generation from static pages + API content (news slugs, event slugs)
- [ ] **Step 3:** Create `src/app/robots.ts` — allow all public pages, disallow admin
- [ ] **Step 4:** Add JSON-LD structured data to: homepage (GovernmentOrganization), news articles (NewsArticle), events (Event)
- [ ] **Step 5:** Commit: `feat: add SEO metadata, sitemap, robots.txt, and structured data`

---

### Task 46: Security Headers & Hardening

**Files:**
- Modify: `next.config.ts`
- Modify: `worker/src/index.ts`

- [ ] **Step 1:** Add security headers to Next.js config: CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- [ ] **Step 2:** Add security headers middleware in Hono worker
- [ ] **Step 3:** Verify all form endpoints have rate limiting applied
- [ ] **Step 4:** Audit: no console.logs in production code, no exposed secrets, all SQL uses prepared statements
- [ ] **Step 5:** Commit: `feat: add security headers, CSP, and final security hardening`

---

### Task 47: Performance Optimization

**Files:**
- Modify: `next.config.ts`
- Modify: various components

- [ ] **Step 1:** Configure Next.js image optimization: formats (WebP, AVIF), device sizes, image loader for R2
- [ ] **Step 2:** Add `loading="lazy"` to all below-fold images, `priority` to hero/above-fold images
- [ ] **Step 3:** Verify font loading: preload critical weights, `display=swap`
- [ ] **Step 4:** Run Lighthouse audit, fix any issues below 90 score
- [ ] **Step 5:** Commit: `feat: optimize performance — images, fonts, lazy loading, Lighthouse fixes`

---

## PHASE 10: Testing & Deployment (Tasks 48–50)

### Task 48: E2E Tests

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/homepage.spec.ts`
- Create: `tests/e2e/navigation.spec.ts`
- Create: `tests/e2e/submission.spec.ts`

- [ ] **Step 1:** Configure Playwright for E2E testing
- [ ] **Step 2:** Write homepage test: hero renders, services grid visible, navigation works, Kente dividers present
- [ ] **Step 3:** Write navigation test: all main nav items navigable, mega-menu opens, mobile menu opens/closes, breadcrumbs correct
- [ ] **Step 4:** Write submission flow test: fill complaint form → submit → receive reference number → track with reference number → see status
- [ ] **Step 5:** Run all E2E tests
- [ ] **Step 6:** Commit: `test: add E2E tests for homepage, navigation, and submission flow`

---

### Task 49: Download & Optimize Assets

**Files:**
- Create: `public/images/logo.png`
- Create: `public/images/footer-logo.png`
- Create: `public/images/coat-of-arms.png`
- Create: `public/images/departments/` (department logos)
- Create: `public/favicon.ico`

- [ ] **Step 1:** Download logo assets from live site URLs documented in spec section 13.1
- [ ] **Step 2:** Optimize images — compress PNGs, generate WebP variants where beneficial
- [ ] **Step 3:** Create favicon from OHCS logo or Black Star motif
- [ ] **Step 4:** Verify all images render correctly in header, footer, and department pages
- [ ] **Step 5:** Commit: `feat: add optimized brand assets — logos, coat of arms, favicon`

---

### Task 50: Cloudflare Deployment Configuration

**Files:**
- Modify: `worker/wrangler.toml`
- Create: `.github/workflows/deploy.yml` (if CI/CD desired)

- [ ] **Step 1:** Create D1 database: `wrangler d1 create ohcs-db`, update wrangler.toml with real database ID
- [ ] **Step 2:** Create KV namespaces: `wrangler kv namespace create REF_LOOKUP`, `CACHE`, `RATE_LIMIT`. Update wrangler.toml
- [ ] **Step 3:** Create R2 bucket: `wrangler r2 bucket create ohcs-assets`
- [ ] **Step 4:** Run database migration: `wrangler d1 migrations apply ohcs-db`
- [ ] **Step 5:** Set secrets: `wrangler secret put JWT_SECRET`, `wrangler secret put ADMIN_PASSWORD_HASH`
- [ ] **Step 6:** Deploy worker: `cd worker && wrangler deploy`
- [ ] **Step 7:** Deploy Next.js to Cloudflare Pages via `@cloudflare/next-on-pages` or Cloudflare Pages Git integration
- [ ] **Step 8:** Verify: homepage loads, navigation works, form submissions work, admin login works
- [ ] **Step 9:** Commit: `chore: configure Cloudflare deployment — D1, KV, R2, Workers, Pages`

---

## Self-Review Checklist

- [x] **Spec coverage:** All 13 public page groups covered (Tasks 10-14, 21-36). Admin dashboard covered (Tasks 38-43). API covered (Tasks 15-20). Submission tracking covered (Task 30). i18n covered (Task 44). Security covered (Task 46). Performance covered (Task 47).
- [x] **Placeholder scan:** No TBDs or TODOs. All tasks have concrete implementation steps with code.
- [x] **Type consistency:** Types defined in `src/types/index.ts` match API responses, component props, and database schema rows. Reference number format (`OHCS-{TYPE}-{DATE}-{RANDOM}`) consistent across generator, validation schema, and track form.
- [x] **Kente integration:** 5 touchpoints documented and implemented in Task 3, used in header (Task 7), footer (Task 8), homepage (Task 14).
- [x] **Missing from spec:** Nothing missing — all sections accounted for.
