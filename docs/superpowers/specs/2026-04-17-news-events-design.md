# News & Events Section Design Spec

**Date:** 2026-04-17
**Status:** Approved
**Component:** Homepage News & Events Section

---

## Overview

A two-column section displaying the 3 latest news articles (left, 60%) and 3 upcoming events (right, 40%). Uses hardcoded sample data until the backend API is built in Phase 4. Clean, informational design that contrasts with the dramatic hero above.

## Layout

- Position: below Quick Services section
- Background: `var(--color-surface-card)` (#FFFFFF)
- Vertical padding: `py-16 lg:py-24`
- Grid: `lg:grid-cols-5` — news takes `lg:col-span-3`, events takes `lg:col-span-2`
- Gap: `gap-12`
- Stacks vertically on mobile

## News Column (Left, 60%)

### Header Row
- **Heading:** "Latest News" — Playfair Display, `text-2xl`, bold, `text-primary-dark`
- **"View all" link:** right-aligned, `text-sm`, `text-primary`, font-medium, ArrowRight icon (16px). Arrow shifts right on hover (`gap-1` → `gap-2`).

### NewsCard Component (`src/components/news/news-card.tsx`)

Props: `{ article: NewsArticle }`

Layout: horizontal flex (`flex gap-4 p-4`), wrapped in `<Link href="/news/{slug}">`, using `Card hoverable kenteAccent`.

- **Thumbnail:** 96x96px (`w-24 h-24`), rounded-md, `object-cover`, `flex-shrink-0`. Optional — hidden if `thumbnailUrl` is null.
- **Date:** `text-xs`, `text-text-muted`, `block mb-1`. Uses `formatDateShort()` from utils.
- **Title:** `font-semibold`, `text-sm`, `leading-snug`, `line-clamp-2`, `mb-1`
- **Excerpt:** `text-xs`, `text-text-muted`, `line-clamp-2`. Optional.

### Sample News Data

```typescript
const SAMPLE_NEWS: NewsArticle[] = [
  {
    id: 1,
    title: "Nigeria's Federal Civil Service Pays Courtesy Call on Ghana's Head of Civil Service",
    slug: 'nigeria-courtesy-call',
    excerpt: 'A delegation from Nigeria visited OHCS to discuss cross-border collaboration on civil service reforms and best practices.',
    content: '',
    thumbnailUrl: null,
    publishedAt: '2026-04-15T10:00:00Z',
    isPublished: true,
    createdAt: '2026-04-15T10:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
  },
  {
    id: 2,
    title: 'OHCS Launches 2026 Civil Service Training Programme for Senior Officers',
    slug: 'training-programme-2026',
    excerpt: 'The programme aims to equip 500 senior officers with modern leadership and digital governance skills.',
    content: '',
    thumbnailUrl: null,
    publishedAt: '2026-04-10T09:00:00Z',
    isPublished: true,
    createdAt: '2026-04-10T09:00:00Z',
    updatedAt: '2026-04-10T09:00:00Z',
  },
  {
    id: 3,
    title: 'Head of Civil Service Addresses Staff on Public Sector Reforms Agenda',
    slug: 'reforms-address',
    excerpt: 'Dr. Evans Aggrey-Darkoh outlined key priorities for the civil service transformation roadmap.',
    content: '',
    thumbnailUrl: null,
    publishedAt: '2026-04-05T14:00:00Z',
    isPublished: true,
    createdAt: '2026-04-05T14:00:00Z',
    updatedAt: '2026-04-05T14:00:00Z',
  },
];
```

## Events Column (Right, 40%)

### Header Row
Same pattern as news: "Upcoming Events" heading + "View all" arrow link.

### EventCard Component (`src/components/events/event-card.tsx`)

Props: `{ event: Event }`

Layout: horizontal flex (`flex items-start gap-4 p-4`), wrapped in `<Link href="/events/{slug}">`, using `Card hoverable`.

- **Date badge:** `w-14 h-14` (56px), `rounded-lg`, `bg-accent/10`, flex column centered. Month in `text-xs font-medium text-accent uppercase`, day in `text-lg font-bold text-accent leading-none`.
- **Title:** `font-semibold`, `text-sm`, `leading-snug`, `line-clamp-2`, `mb-1`
- **Location:** `text-xs`, `text-text-muted`, flex with `MapPin` icon (12px). Optional — hidden if no location.

### Sample Events Data

```typescript
const SAMPLE_EVENTS: Event[] = [
  {
    id: 1,
    title: 'Civil Service Week 2026 Opening Ceremony',
    slug: 'cs-week-2026',
    description: '',
    location: 'Accra International Conference Centre',
    startDate: '2026-05-05T09:00:00Z',
    endDate: '2026-05-05T17:00:00Z',
    isPublished: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Digital Governance Workshop for Regional Directors',
    slug: 'digital-governance-workshop',
    description: '',
    location: 'GIMPA Campus, Accra',
    startDate: '2026-05-12T10:00:00Z',
    endDate: '2026-05-12T16:00:00Z',
    isPublished: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 3,
    title: 'Quarterly Civil Service Council Meeting',
    slug: 'council-meeting-q2',
    description: '',
    location: 'OHCS Headquarters, Accra',
    startDate: '2026-05-20T09:00:00Z',
    endDate: '2026-05-20T15:00:00Z',
    isPublished: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
];
```

## Animation

- `useScrollReveal(0.1)` on the section container
- Single `animate-reveal` on the grid container (not per-card)

## Accessibility

- Each column has a `<h2>` heading
- Cards are full `<Link>` wrappers (entire card clickable)
- Images have empty `alt=""` (decorative thumbnails, title provides context)
- MapPin and ArrowRight icons: `aria-hidden="true"`
- Focus-visible ring on each Link

## Types Used

From `src/types/index.ts` (already defined):

```typescript
interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Dependencies

- `next/link`, `next/image`
- `lucide-react` — `ArrowRight`, `MapPin`, `Calendar`
- `@/components/ui/card` — Card with hoverable/kenteAccent
- `@/hooks/use-scroll-reveal`
- `@/lib/utils` — `cn()`, `formatDateShort()`
- `@/types` — `NewsArticle`, `Event`

## Files

| File | Purpose |
|------|---------|
| `src/components/news/news-card.tsx` | Reusable news card |
| `src/components/events/event-card.tsx` | Reusable event card |
| `src/components/home/news-events-section.tsx` | Homepage section with sample data |
| `tests/component/news-events-section.test.tsx` | Component tests |
| `src/app/page.tsx` | Modify: add section |
| `src/app/[locale]/page.tsx` | Modify: add section |
