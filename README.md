# OHCS Website Redesign

> **The Official Website of the Office of the Head of the Civil Service, Republic of Ghana**

A modern, world-class government portal built with Next.js 16, designed to serve Ghana's 20,000+ civil servants and the citizens they support. Featuring Kente-inspired design elements, cinematic animations, and a comprehensive suite of public services.

---

## Overview

This project is a complete redesign of [ohcs.gov.gh](https://ohcs.gov.gh) — transforming it from a basic WordPress site into a stunning, high-performance web application that reflects the professionalism and cultural identity of Ghana's Civil Service.

### Key Features

- **Cinematic Hero Carousel** — 3-slide showcase with Ken Burns zoom, animated Kente mesh overlay, floating civic icons, gold bokeh particles, and Kente-framed borders
- **Animated Logo** — Ghana Civil Service crest with letter-by-letter reveal, gold divider growth, and Kente stripe draw animation
- **Rich Mega-Menu Navigation** — 6 categorised menus with gradient icon badges, descriptions, and staggered entrance animations
- **22+ Pages** — Homepage, About (5 sub-pages), Directorates & Units, Departments, Training Institutions, Services (4 forms), Publications, Contact, and Submission Tracking
- **Multi-Step Recruitment Portal** — Smart notification system with anti-fraud warnings (form hidden when no active recruitment)
- **AI Bot Integration Ready** — Complaints & Feedback pages designed for custom AI assistant integration
- **Publications Library** — Category-filtered, searchable document library with pagination (12 per page)
- **Right to Information Portal** — Educational RTI page with FAQ accordion, process explainer, and hidden form reveal
- **Submission Tracking** — Citizens can track their submissions via reference number
- **Backend API** — Cloudflare Workers + Hono with D1 database, rate limiting, and R2 storage

### Design Language

- **"Institutional Luxury with Ghanaian Soul"** — editorial government design meets Kente-woven cultural identity
- **Kente Elements Throughout** — animated weaving threads in hero, shimmer-swept dividers between sections, mesh textures, corner accents
- **E-Library Inspired** — floating geometric shapes, pill badges, highlighted keywords, pastel-tinted cards (inspired by [ohcselibrary.xyz](https://ohcselibrary.xyz))
- **Typography** — Playfair Display (headings) + Libre Baskerville (body)
- **Color Palette** — Ghana Green (#1B5E20), Gold (#D4A017), Kente Red (#B71C1C), Cream (#FDFAF5)

---

## Tech Stack

### Frontend (`ohcs-website/`)

| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org) | React framework with App Router |
| [React 19](https://react.dev) | UI library |
| [TypeScript](https://typescriptlang.org) | Type safety (strict mode) |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [Lucide React](https://lucide.dev) | Icon library |
| [React Hook Form](https://react-hook-form.com) | Form management |
| [Zod](https://zod.dev) | Schema validation |
| [Vitest](https://vitest.dev) | Unit & component testing |

### Backend (`worker/`)

| Technology | Purpose |
|-----------|---------|
| [Cloudflare Workers](https://workers.cloudflare.com) | Edge runtime |
| [Hono](https://hono.dev) | Web framework |
| [Cloudflare D1](https://developers.cloudflare.com/d1) | SQLite database |
| [Cloudflare R2](https://developers.cloudflare.com/r2) | Document storage |
| [Cloudflare KV](https://developers.cloudflare.com/kv) | Reference lookups, caching, rate limiting |
| [Zod](https://zod.dev) | Request validation |

---

## Project Structure

```
OHCS-Website-Redesign/
├── ohcs-website/                    # Next.js 16 frontend
│   ├── src/
│   │   ├── app/                     # App Router pages (22+ pages)
│   │   │   ├── about/               # About section (5 sub-pages)
│   │   │   ├── contact/             # Contact with map + form
│   │   │   ├── departments/         # Department listing + detail
│   │   │   ├── directorates/        # Directorates & Units (merged)
│   │   │   ├── publications/        # Document library with pagination
│   │   │   ├── services/            # Recruitment, RTI, Complaints, Feedback
│   │   │   ├── track/               # Submission tracking
│   │   │   ├── training/            # Training institutions
│   │   │   └── units/               # Support units
│   │   ├── components/
│   │   │   ├── events/              # EventCard
│   │   │   ├── forms/               # SubmissionForm (reusable)
│   │   │   ├── home/                # Hero, Services, Stats, News, Leadership,
│   │   │   │                        # Directorates, CTA, FloatingShapes, Particles
│   │   │   ├── kente/               # KenteAccent, KenteLoader, KenteSectionDivider
│   │   │   ├── layout/              # Header, Footer, AnimatedLogo, PageHero,
│   │   │   │                        # Breadcrumb, Sidebar, MegaMenu, MobileNav
│   │   │   ├── news/                # NewsCard
│   │   │   └── ui/                  # Button, Card, Input, Badge, Skeleton
│   │   ├── hooks/                   # useScrollReveal
│   │   ├── lib/                     # api, constants, utils, validations
│   │   └── types/                   # TypeScript interfaces
│   ├── public/images/               # Logo, crest, coat of arms, hero photos
│   └── tests/                       # Vitest component + unit tests (55 tests)
│
├── worker/                          # Cloudflare Worker API
│   └── src/
│       ├── routes/public/           # News, Events, Publications, Leadership,
│       │                            # Submissions, Track
│       ├── middleware/               # Rate limiting
│       ├── db/                      # D1 schema + migrations (7 tables)
│       └── lib/                     # Reference generator, validation, R2 storage
│
└── docs/superpowers/                # Design specs + implementation plans
```

---

## Organisational Structure

The website reflects the actual OHCS structure:

### 5 Line Directorates
1. Research, Statistics & Information Management Directorate (RSIMD)
2. Finance & Administration Directorate (F&A)
3. Planning, Budgeting, Monitoring & Evaluation Directorate (PBMED)
4. Career Management Directorate (CMD)
5. Recruitment, Training & Development Directorate (RTDD)

### 6 Support Units
1. Reform Coordinating Unit (RCU)
2. Internal Audit Unit (IAU)
3. Civil Service Council (CSC)
4. Estate Unit
5. Accounts Unit
6. Stores Unit

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Frontend

```bash
cd ohcs-website
npm install
npm run dev
# Open http://localhost:3000
```

### Backend (Worker)

```bash
cd worker
npm install
npx wrangler dev
# API at http://localhost:8787
```

### Run Tests

```bash
cd ohcs-website
npx vitest run
# 55 tests across 10 test files
```

### Production Build

```bash
cd ohcs-website
npx next build
# Static pages generated via SSG where possible
```

---

## API Endpoints

### Public API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/news` | List published news (paginated) |
| GET | `/api/v1/news/:slug` | Single news article |
| GET | `/api/v1/events` | List events (`?upcoming=true` supported) |
| GET | `/api/v1/events/:slug` | Single event |
| GET | `/api/v1/publications` | List publications (`?category=` filter) |
| GET | `/api/v1/leadership` | Leadership profiles |
| GET | `/api/v1/leadership/featured` | Featured leader |
| POST | `/api/v1/submissions` | Create submission (rate limited) |
| POST | `/api/v1/track` | Track submission status |
| GET | `/api/health` | Health check |

### Database

7 tables: `news`, `events`, `publications`, `submissions`, `submission_status_history`, `leadership`, `gallery` — with 11 indexes for optimised queries.

---

## Related Projects

- **[OHCS E-Library](https://ohcselibrary.xyz)** — AI-powered document management, career development, and training platform for Ghana's Civil Service

---

## License

This project is proprietary to the Office of the Head of the Civil Service, Republic of Ghana.

---

<p align="center">
  <strong>Office of the Head of the Civil Service</strong><br>
  Republic of Ghana<br>
  <em>Loyalty • Excellence • Service</em>
</p>
