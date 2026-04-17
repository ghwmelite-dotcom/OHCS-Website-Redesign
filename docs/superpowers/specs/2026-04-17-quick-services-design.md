# Quick Services Grid Design Spec

**Date:** 2026-04-17
**Status:** Approved
**Component:** Homepage Quick Access Services Section

---

## Overview

A clean, minimal 4-card grid section sitting directly below the hero. Provides immediate access to OHCS's four core public-facing services. Designed as a calm, functional contrast to the dramatic hero section above — white cards on cream background with subtle Kente border hover accents.

## Layout

- Position: directly below the hero, separated by a `KenteAccent variant="divider"` (6px stripe)
- Background: `var(--color-surface)` (`#FDFAF5`)
- Vertical padding: `py-16` mobile (64px), `lg:py-24` desktop (96px)
- Content max-width: `var(--max-w-content)` (1280px), centered
- Horizontal padding: `px-4 sm:px-6 lg:px-8`

## Section Header

- **Heading:** "How Can We Help You?"
  - Font: Playfair Display (`font-display`)
  - Size: `text-3xl` (2.441rem)
  - Weight: bold
  - Color: `var(--color-primary-dark)` (#0D3B13)
  - ID: `services-heading` (for `aria-labelledby`)
- **Subtext:** "Access key civil service resources and submit requests online."
  - Font: DM Sans (`font-body`)
  - Color: `var(--color-text-muted)` (#5C5549)
  - Max-width: `max-w-2xl` (672px)
  - Centered
- Text alignment: centered
- Bottom margin: `mb-12` (48px)

## Cards Grid

- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Gap: `gap-6` (24px)
- Each card is equal height (`h-full`)

### Card Content

Each card is wrapped in a `<Link>` element making the entire card clickable.

| # | Service | Icon (Lucide) | Description | Link |
|---|---------|---------------|-------------|------|
| 1 | Recruitment | `UserPlus` | Apply for civil service positions across Ghana. | `/services/recruitment` |
| 2 | Right to Information | `FileText` | Submit RTI requests for public records and data. | `/services/rti` |
| 3 | Complaints & Feedback | `MessageSquareWarning` | Report issues or share feedback about civil service delivery. | `/services/complaints` |
| 4 | Publications & Downloads | `Download` | Access reports, policies, forms, and circulars. | `/publications` |

### Card Styling

- Background: `var(--color-surface-card)` (#FFFFFF)
- Border: 1px solid `var(--color-border)` (#E5DDD0)
- Border-radius: `var(--radius-lg)` (16px)
- Shadow: `var(--shadow-card)` — `0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)`
- Padding: `p-8` (32px)
- Text alignment: centered
- Position: relative (for Kente border accent)
- Overflow: hidden (clips the Kente border)
- Uses the existing `Card` component with `hoverable` and `kenteAccent` props

### Card Inner Elements

- **Icon container:** `w-14 h-14` (56px), `rounded-lg`, `bg-primary/10`, flex centered, `mx-auto`, `mb-4`
- **Icon:** `h-7 w-7` (28px), `text-primary` (#1B5E20), `aria-hidden="true"`
- **Title:** `font-semibold`, `text-lg` (1.25rem), `mb-2`
- **Description:** `text-sm` (0.8rem), `text-text-muted`

### Card Hover State

- Transform: `translateY(-2px)`
- Shadow: `var(--shadow-card-hover)` — `0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08)`
- Kente gold left border: 3px vertical gradient (green → gold → red) fades in from `opacity-0` to `opacity-100` via the `KenteAccent variant="border"` component (already built into Card's `kenteAccent` prop)
- Transition: `200ms`

### Card Focus State

- `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- Applied to the wrapping `<Link>` element

## Animation

- Section uses `useScrollReveal(0.1)` hook to detect when it enters the viewport
- Each card gets `animate-reveal` class with staggered delays:
  - Card 1: 0ms
  - Card 2: 80ms
  - Card 3: 160ms
  - Card 4: 240ms
- `animate-reveal` keyframe: `reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards` — translateY(24px) → translateY(0), opacity 0 → 1
- No ambient effects — clean entrance only

## Kente Divider

A `KenteAccent variant="divider"` (6px horizontal stripe in green-gold-red-black) is placed between the hero section and this section as a visual separator.

## Accessibility

- Section: `<section aria-labelledby="services-heading">`
- Heading: `<h2 id="services-heading">`
- Each card: entire card is a `<Link>` (full clickable area)
- Icons: `aria-hidden="true"` (decorative)
- Focus ring on each Link
- Minimum touch target: cards are well above 44px in all dimensions

## Responsive Behavior

- **Mobile (<640px):** Single column, full-width cards stacked
- **Tablet (640-1023px):** 2-column grid
- **Desktop (1024px+):** 4-column grid

## Dependencies

- `next/link` — card navigation
- `lucide-react` — icons (`UserPlus`, `FileText`, `MessageSquareWarning`, `Download`)
- `@/components/ui/card` — existing Card component with `hoverable` and `kenteAccent` props
- `@/components/kente/kente-accent` — divider variant
- `@/hooks/use-scroll-reveal` — scroll-triggered animation
- `@/lib/utils` — `cn()` utility

## Files

| File | Purpose |
|------|---------|
| `src/components/home/quick-services.tsx` | Quick Services Grid component |
| `tests/component/quick-services.test.tsx` | Component tests |
| `src/app/page.tsx` | Add QuickServices to homepage (modify) |
| `src/app/[locale]/page.tsx` | Add QuickServices to locale homepage (modify) |

## Design Tokens Used

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | #1B5E20 | Icon color, icon container tint |
| `--color-primary-dark` | #0D3B13 | Section heading |
| `--color-text-muted` | #5C5549 | Description text, subtext |
| `--color-surface` | #FDFAF5 | Section background |
| `--color-surface-card` | #FFFFFF | Card background |
| `--color-border` | #E5DDD0 | Card border |
| `--shadow-card` | layered | Card resting shadow |
| `--shadow-card-hover` | layered | Card hover shadow |
| `--radius-lg` | 16px | Card border-radius |
| `--font-display` | Playfair Display | Section heading |
| `--font-body` | DM Sans | All card text |
| `--animate-reveal` | reveal 0.6s... | Staggered card entrance |
