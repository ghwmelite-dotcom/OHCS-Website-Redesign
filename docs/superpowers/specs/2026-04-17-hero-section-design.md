# Hero Section Design Spec

**Date:** 2026-04-17
**Status:** Approved
**Component:** Homepage Hero Carousel

---

## Overview

A full-width, full-bleed cinematic carousel with 3 slides featuring OHCS leadership photography. Each slide layers a dimmed background photo, Kente mesh overlay, directional gradient, ambient floating civic icons, gold bokeh particles, and typographic content. The effect is institutional gravitas fused with distinctly Ghanaian cultural identity — unlike any government site.

## Visual Layer Stack (bottom to top)

1. **Background photo** — full `object-fit: cover`, brightness 28%, contrast 1.15, saturation 0.8, Ken Burns slow zoom (25s alternate, scale 1 → 1.06)
2. **Kente mesh overlay** — woven gold/green/red CSS grid lines at 9% opacity using `repeating-linear-gradient`
3. **Directional gradient** — `linear-gradient(to right, rgba(13,59,19,0.95) 0%, rgba(13,59,19,0.75) 45%, rgba(13,59,19,0.4) 70%, rgba(13,59,19,0.2) 100%)`
4. **Floating civic icons** — 16 governance-themed SVG stroke icons (scales of justice, shield, people, document, gear, star, building, globe, handshake, book, award, flag, laurel wreath, compass, crown, torch) drifting upward. Stroke: `rgba(212,160,23,0.35)`, stroke-width 1.5, with `drop-shadow(0 0 6px rgba(212,160,23,0.25))` glow. Staggered positions (left 2-55%), durations (17-27s), delays (0-12s).
5. **Gold bokeh particles** — 20 circular radial-gradient dots (4-10px) with box-shadow halos. Peak opacity 0.4-0.75. Float upward with slight horizontal drift via CSS custom properties.
6. **Gold accent lines** — top: 3px `linear-gradient(90deg, #D4A017, #E8C547 50%, #D4A017)` with box-shadow glow. Bottom: 1px at 40% opacity with transparent edges.
7. **Text content** — left-aligned, max-width 680px, padded 64px from left edge.
8. **Slide indicators** — bottom-left, gold active dot (52px wide) with glow, inactive dots 32px at 15% white opacity.

## Slide Content

### Slide 1 — The Institution
- **Image:** `/images/hero/head-of-civil-service.jpg` (Head of Service portrait with Civil Service crest)
- **Eyebrow:** "Republic of Ghana" (12px uppercase, letter-spacing 3.5px, `#D4A017`, preceded by 36px gold line)
- **Headline:** "Serving Ghana's" / "**Public Sector**" (Playfair Display, 54px desktop, weight 700, line-height 1.08. "Public Sector" in `#4CAF50`)
- **Subtitle:** "The Office of the Head of Civil Service drives excellence, accountability, and transformation across Ghana's civil service." (DM Sans, 17px, `rgba(255,255,255,0.65)`, line-height 1.65, max-width 460px)
- **CTAs:** "Find a Service" (primary green, Search icon) + "Track Submission" (accent gold, FileSearch icon)

### Slide 2 — The People
- **Image:** `/images/hero/chief-director.jpg` (Chief Director portrait)
- **Eyebrow:** "Republic of Ghana"
- **Headline:** "Committed to" / "**Excellence**"
- **Subtitle:** "Upholding the values of loyalty, excellence, and service in every aspect of Ghana's public administration."
- **CTAs:** Same persistent CTAs

### Slide 3 — The Mission
- **Image:** `/images/hero/council.jpg` (Civil Service Council group photo)
- **Eyebrow:** "Republic of Ghana"
- **Headline:** "Transforming Ghana's" / "**Civil Service**"
- **Subtitle:** "Building a modern, accountable, and citizen-centered civil service for Ghana's future."
- **CTAs:** Same persistent CTAs

## Transitions

### Slide-to-Slide: Cinematic Zoom-Fade
- **Outgoing slide:** scales from 1 → 1.05 while fading to opacity 0
- **Incoming slide:** fades from opacity 0 → 1 at standard scale
- **Duration:** 1s, `ease-in-out`
- **Auto-rotation:** 8 seconds per slide
- **Pause:** on hover and on focus-within

### On-Load Staggered Reveal
- Eyebrow: 0ms delay
- Headline: 100ms delay
- Subtitle: 200ms delay
- CTAs: 300ms delay
- Slide indicators: 400ms delay
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Transform: `translateY(28px)` → `translateY(0)` + opacity 0 → 1
- Duration: 800ms each

### Ambient Animations (continuous, not reset per slide)
- **Floating icons:** `floatUp` — start 80px below, drift up 650px, rotate 0° → 12°, scale 0.9 → 1.1. Opacity fades in at 6%, fades out at 88%.
- **Bokeh particles:** `drift` — translate along custom `--dx`/`--dy` vectors, scale 0.6 → 1.3. Opacity governed by `--max-opacity` custom property.
- **Ken Burns:** per-slide, 25s alternate, scale 1 → 1.06.

## Button Specifications

### "Find a Service"
- Variant: primary
- Background: `#1B5E20`
- Text: white
- Icon: Search (18px SVG)
- Hover: `#2E7D32`, translateY(-2px), scale(1.02), elevated box-shadow
- Link: `/services`

### "Track Submission"
- Variant: accent
- Background: `#D4A017`
- Text: `#1A1A1A`
- Icon: FileSearch (18px SVG)
- Hover: `#E8C547`, translateY(-2px), scale(1.02), elevated box-shadow
- Link: `/track`

### Shared Button Styles
- Padding: 15px 30px
- Border-radius: 8px
- Font: DM Sans, 15px, weight 600
- Gap (icon to text): 10px
- Min height: 44px (touch target compliance)
- Transition: `all 0.25s cubic-bezier(0.16, 1, 0.3, 1)`
- Box-shadow: 4px blur at rest, 8px on hover

## Responsive Behavior

### Mobile (<640px)
- Hero height: 500px
- Content padding: 24px
- Headline: `clamp(2rem, 7vw, 3.4rem)`
- CTAs: stack vertically (`flex-col`), full width
- Icons: reduced to 8 (performance)
- Particles: reduced to 10
- Slide indicators: bottom-left, 24px from edge

### Tablet (640px — 1023px)
- Hero height: 550px
- Content padding: 40px
- Headline: mid-range clamp scale
- CTAs: side-by-side

### Desktop (1024px+)
- Hero height: 600px
- Content padding: 64px
- Full treatment: 16 icons, 20 particles
- Max content width: 680px

## Accessibility

- `aria-live="polite"` on slide content region
- Each indicator: `aria-label="Slide N of 3"`, `role="tab"`, `aria-selected`
- Slide container: `role="tablist"`
- Auto-rotation pauses on focus-within and hover
- All decorative elements: `aria-hidden="true"` (icons, particles, kente mesh, gold lines)
- Keyboard: Tab to indicators, Enter/Space to select slide, arrow keys to navigate
- 44px minimum touch targets on all interactive elements
- `prefers-reduced-motion: reduce` — disable all keyframe animations, Ken Burns, and staggered reveals. Show content immediately with no motion.

## Design Tokens Used

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | #1B5E20 | Primary button, headline accent |
| `--color-primary-dark` | #0D3B13 | Gradient base |
| `--color-primary-light` | #2E7D32 | Button hover |
| `--color-accent` | #D4A017 | Gold accents, eyebrow, indicators, icons |
| `--color-accent-light` | #E8C547 | Accent button hover, gold line highlight |
| `--color-surface` | #FDFAF5 | Not used in hero (dark treatment) |
| `--color-text` | #1A1A1A | Accent button text |
| `--font-display` | Playfair Display | Headlines |
| `--font-body` | DM Sans | Subtitles, buttons, eyebrow |
| `--animate-reveal` | reveal 0.6s cubic-bezier(...) | Staggered entrance |

## Files

| File | Purpose |
|------|---------|
| `src/components/home/hero.tsx` | Main hero carousel component |
| `src/hooks/use-scroll-reveal.ts` | Reusable IntersectionObserver hook |
| `public/images/hero/head-of-civil-service.jpg` | Slide 1 photo (530KB) |
| `public/images/hero/chief-director.jpg` | Slide 2 photo (363KB) |
| `public/images/hero/council.jpg` | Slide 3 photo (988KB) |

## Dependencies

- `next/link` — CTA navigation
- `next/image` — optimized hero images
- `@/components/ui/button` — existing Button component
- `@/components/kente/kente-accent` — Kente background variant (optional, may use direct CSS)
- `@/lib/utils` — `cn()` classname utility
- No external carousel library — pure React state + CSS transitions
