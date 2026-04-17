# OHCS.gov.gh — Complete Website Redesign

**Date:** 2026-04-16
**Project:** Office of the Head of Civil Service, Ghana — Website Overhaul
**URL:** ohcs.gov.gh
**Status:** Design Approved

---

## 1. Project Overview

### 1.1 What Is OHCS?

The Office of the Head of Civil Service (OHCS) is the central administrative body overseeing Ghana's entire civil service. It manages recruitment, training, career development, policy reforms, and institutional coordination for public sector workers across the country.

### 1.2 Why Redesign?

The current WordPress-based site suffers from:

- Outdated visual design that doesn't reflect a modern civil service
- Poor mobile experience (majority of Ghanaian citizens access the web via mobile)
- Broken/incomplete features (empty calendar widgets, duplicated news items, legacy migration remnants)
- No form submission tracking for citizens
- No structured content management workflow
- Slow performance and limited SEO optimization

### 1.3 Priority Order

1. **Citizen trust & accessibility** — Easy to find services, submit forms, track requests
2. **Institutional modernization** — Project competence and professionalism
3. **Operational efficiency** — Streamline submissions and content management

### 1.4 Success Metrics

- LCP < 2s on 3G mobile connections
- All citizen services reachable in 2 clicks from homepage
- Form submissions trackable via reference number
- AA accessibility compliance minimum
- All public pages SSR for full SEO indexability
- Total initial page weight < 500KB

---

## 2. Tech Stack

### 2.1 Frontend

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | SSR/SSG framework, deployed to Cloudflare Pages |
| TypeScript (strict mode) | Type safety across the entire codebase |
| Tailwind CSS | Utility-first styling with custom design tokens |
| Framer Motion | Subtle animations, Kente loading animation, page transitions |
| next-intl | i18n infrastructure (English at launch, translation-ready) |
| React Hook Form + Zod | Form handling with validation |
| TanStack Query | Server state management for admin dashboard |
| Zustand | Minimal global state (search, navigation) |

### 2.2 Backend / Edge

| Technology | Purpose |
|---|---|
| Cloudflare Workers (Hono) | API routes for all form submissions and admin operations |
| Cloudflare D1 (SQLite) | Database for submissions, content records, reference lookups |
| Cloudflare KV | Reference number indexing, caching, rate limiting |
| Cloudflare R2 | Document storage (PDFs, publications, images, gallery media) |

### 2.3 Tooling

| Tool | Purpose |
|---|---|
| Wrangler CLI | Cloudflare deployment and local development |
| Vitest | Unit and component testing |
| Playwright | E2E testing for critical user journeys |
| ESLint + Prettier | Code quality enforcement |
| GitHub Actions | CI/CD pipeline |

### 2.4 Data Flow

```
CITIZEN SUBMISSION FLOW:
Citizen fills form → Client-side Zod validation
                   → POST to Workers API (server-side Zod re-validation)
                   → D1: store submission record with generated reference number
                   → KV: index reference number → submission ID mapping
                   → Return reference number to citizen (display + copy option)

STATUS CHECK FLOW:
Citizen enters reference number + email/phone
→ KV lookup (fast, edge-cached) → D1 fetch full record
→ Display current status + timeline

CONTENT FLOW:
Admin dashboard → authenticated Workers API
               → D1: CRUD operations for news, events, leadership, publications
               → R2: upload/serve documents and images

PUBLIC PAGE RENDERING:
Next.js SSR → Workers API → D1 query → render HTML at edge
           → ISR revalidation for content freshness
```

---

## 3. Visual Design System

### 3.1 Design Direction: "Dignified Warmth"

The site must project institutional authority and legitimacy while remaining warm and accessible. Citizens should feel they're interacting with a professional, competent government body that genuinely wants to help them.

**The feeling:** Walking into a well-designed, modern government office — professional, organized, staffed by people who want to help.

### 3.2 Color Palette

```css
:root {
  /* Primary — Ghana flag green */
  --color-primary:        #1B5E20;
  --color-primary-light:  #2E7D32;
  --color-primary-dark:   #0D3B13;

  /* Accent — Ghana coat of arms / Kente gold */
  --color-accent:         #D4A017;
  --color-accent-light:   #E8C547;

  /* Surfaces */
  --color-surface:        #FDFAF5;  /* warm cream page background */
  --color-surface-card:   #FFFFFF;  /* card backgrounds */

  /* Borders */
  --color-border:         #E5DDD0;  /* warm neutral */

  /* Text */
  --color-text:           #1A1A1A;  /* primary body */
  --color-text-muted:     #5C5549;  /* secondary */

  /* Kente pattern colors */
  --color-kente-red:      #B71C1C;  /* sparingly — alerts, flag, accents */
  --color-kente-black:    #212121;  /* pattern strokes */

  /* Semantic */
  --color-success:        #2E7D32;
  --color-error:          #C62828;
  --color-warning:        #E65100;
  --color-info:           #1565C0;
}
```

**Color usage rules:**

- Green is the dominant institutional color (header, CTAs, active states)
- Gold is the accent (highlights, badges, hover states, Kente elements)
- Red is used sparingly — alerts, destructive actions, and Kente pattern accents only
- Cream surface (#FDFAF5) — not sterile white, warm and approachable
- All color combinations meet AA contrast minimum (4.5:1 body text, 3:1 large text)

### 3.3 Typography

```css
:root {
  /* Display — dignified, authoritative */
  --font-display: 'Playfair Display', Georgia, serif;

  /* Body — clean, highly readable */
  --font-body: 'DM Sans', system-ui, sans-serif;

  /* Mono — reference numbers, data tables */
  --font-mono: 'JetBrains Mono', monospace;

  /* Scale (Major Third — 1.25x) */
  --text-xs:    0.64rem;
  --text-sm:    0.8rem;
  --text-base:  1rem;      /* 16px */
  --text-lg:    1.25rem;
  --text-xl:    1.563rem;
  --text-2xl:   1.953rem;
  --text-3xl:   2.441rem;
  --text-4xl:   3.052rem;
  --text-hero:  clamp(3rem, 8vw, 5rem);
}
```

**Typography rules:**

- Playfair Display for page titles, hero text, section headings (h1, h2)
- DM Sans for body text, navigation, buttons, form labels, sub-headings (h3-h6)
- JetBrains Mono for reference numbers, data tables, code-like content
- Line height: 1.2 for headings, 1.6 for body
- Max line length: 70 characters for body text
- Letter spacing: -0.02em for headings larger than text-2xl
- Fonts loaded from Google Fonts with `display=swap`, preload critical weights

### 3.4 Kente Pattern Integration

Kente cloth is the quintessential visual symbol of Ghanaian prestige and culture. It is integrated as **texture, not theme** — the geometry, color logic, and precision of Kente weaving become design tokens throughout the site.

**Implementation:** A single `kente-patterns.svg` tile set containing abstracted geometric Kente weave patterns. Exposed via a reusable `<KenteAccent />` React component with variants.

**5 integration points:**

1. **Header band** — 4px Kente-pattern strip beneath the main navigation. Green, gold, red, black geometric interlocking blocks. Always visible, establishes Ghanaian identity immediately.

2. **Section dividers** — 6px tall abstracted Kente geometric strip between major page sections. Used on homepage between hero, services, news, leadership, etc. SVG pattern tile, repeating.

3. **Hero backgrounds** — Faint Kente geometric grid overlaid on hero sections at 3-4% opacity. Adds warmth and texture without competing with content. Applied via CSS `background-image` with the SVG tile.

4. **Card hover accents** — On service cards and featured content cards, a gold Kente-inspired left border (3px) fades in on hover with a 200ms transition. Subtle interactive feedback tied to cultural identity.

5. **Loading animation** — Instead of a generic spinner, Kente threads weave together progressively. CSS animation using SVG paths that draw in sequence, mimicking the loom process. Used for page transitions and async data loading.

**The `<KenteAccent />` component:**

```typescript
type KenteVariant = 'divider' | 'border' | 'background' | 'loader' | 'header-band';

interface KenteAccentProps {
  variant: KenteVariant;
  className?: string;
}
```

### 3.5 Spacing & Layout

```css
:root {
  /* Base-8 spacing scale */
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-6:   24px;
  --space-8:   32px;
  --space-12:  48px;
  --space-16:  64px;
  --space-24:  96px;
  --space-32:  128px;
}
```

- 12-column grid for desktop, 4-column for mobile
- Gutters: 16px mobile, 24px tablet, 32px desktop
- Max content width: 1280px, centered
- Generous whitespace throughout — government content needs breathing room
- CSS Grid for 2D layouts, Flexbox for 1D alignment

### 3.6 Component Aesthetics

**Cards:**

- Background: white (#FFFFFF) on cream surface
- Border: 1px solid var(--color-border)
- Shadow: layered — `0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)`
- Hover: translateY(-2px) + increased shadow + Kente gold left border fade-in
- Border radius: 12px
- Padding: 24px

**Buttons:**

- Primary: green fill (#1B5E20), white text, 8px radius, padding 12px 24px
- Primary hover: brightness shift + subtle scale(1.02)
- Secondary: outlined with green border, green text, transparent fill
- Secondary hover: light green background fill
- Gold accent button: for special CTAs (Track Submission), gold fill with dark text
- All buttons: 44px minimum height (touch target), font-weight 500
- Loading state: inline spinner, width locked to prevent layout shift

**Forms:**

- Labels above inputs (never placeholder-as-label)
- Input height: 48px (generous touch target)
- Border: 1px solid var(--color-border), 8px radius
- Focus: 2px solid var(--color-primary), outline-offset 2px
- Error: red border + inline error message below + error icon
- Success: green border + checkmark
- Disabled: opacity 0.5, cursor not-allowed

**Navigation:**

- Sticky header on scroll with subtle shadow
- Mega-dropdown for complex sections (About, Directorates, Departments, Services)
- Mobile: full-screen slide-out panel from right, 40px tap targets
- Active page indicator: gold underline on current nav item

### 3.7 Iconography

- **Library:** Lucide React (consistent stroke width, government-appropriate)
- All SVG, never icon fonts
- Size: 20px for inline, 24px for navigation, 32-48px for service card icons
- Stroke-based in UI, filled for status indicators
- The Black Star of Ghana: used as favicon, empty state illustrations, decorative heading element

### 3.8 Imagery

- Source existing assets from live site (logo, coat of arms, department logos)
- Optimize to WebP/AVIF, serve from R2 with responsive srcset
- Photography: high-quality images of Ghanaian civil service, government buildings, national landmarks
- No generic stock photos — all imagery should feel authentically Ghanaian
- Lazy load all images below the fold

### 3.9 Motion & Animation

- Staggered reveal on page load (cards, list items) — 600ms, 80ms delay between items
- Scroll-triggered fade-up for content sections — IntersectionObserver based
- Page transitions: subtle fade (300ms)
- Hover states: 200ms transitions
- Kente loader: SVG thread-weaving animation (800ms loop)
- All motion respects `prefers-reduced-motion: reduce`

### 3.10 Accessibility

- AA contrast minimum on all text (targeting AAA where possible)
- 44x44px minimum touch targets
- Focus-visible states on all interactive elements (never outline: none without replacement)
- Semantic HTML: buttons are `<button>`, links are `<a>`, headings are hierarchical
- ARIA labels only when HTML semantics are insufficient
- Color is never the sole indicator — always paired with icon, pattern, or label
- Skip-to-content link for keyboard navigation
- Alt text on all images
- Form error announcements via aria-live regions

---

## 4. Page Structure

### 4.1 Site Map

```
ohcs.gov.gh/
├── / (Homepage)
├── /about/
│   ├── /about/civil-service
│   ├── /about/leadership
│   ├── /about/structure
│   └── /about/partners
├── /directorates/
│   ├── /directorates/career-management
│   ├── /directorates/finance-administration
│   ├── /directorates/reforms
│   ├── /directorates/[slug] (5 more)
│   └── (8 directorate detail pages total)
├── /departments/
│   ├── /departments/iad
│   ├── /departments/msd
│   ├── /departments/praad
│   └── /departments/pscmd
├── /training/
│   ├── /training/[institution-slug] (3 centres)
├── /services/
│   ├── /services/recruitment
│   ├── /services/rti (Right to Information)
│   ├── /services/complaints
│   └── /services/feedback
├── /news/
│   └── /news/[slug] (article detail)
├── /events/
│   └── /events/[slug] (event detail)
├── /publications/
│   └── (document library with categories and search)
├── /gallery/
│   ├── /gallery/photos
│   └── /gallery/videos
├── /track/ (submission status checker)
├── /contact/
├── /privacy/
├── /accessibility/
└── /admin/ (dashboard — authenticated)
    ├── /admin/news
    ├── /admin/events
    ├── /admin/publications
    ├── /admin/submissions
    ├── /admin/leadership
    └── /admin/settings
```

### 4.2 Homepage

**Sections in order:**

1. **Hero** — Full-width, warm cream background with faint Kente texture at 3% opacity. Headline: institutional tagline in Playfair Display. Two prominent CTAs: "Find a Service" (green) and "Track Your Submission" (gold). Optional: subtle photography of government complex or national landmark.

2. **Kente divider**

3. **Quick Access Services** — 4-column grid of service cards with icons. Recruitment, Right to Information, Complaints & Feedback, Publications & Downloads. Each card has icon, title, one-line description, arrow link. Hover: lift + Kente gold border.

4. **Kente divider**

5. **Latest News + Upcoming Events** — Two-column layout (60/40 split). Left: 3 latest news article cards with thumbnail, date, title, excerpt. Right: 3 upcoming event cards with date badge, title, location. "View all" links for both.

6. **Kente divider**

7. **Leadership Spotlight** — Featured section with photo of Head of Civil Service, name, title, and brief institutional message or quote. Link to full leadership page.

8. **Kente divider**

9. **Directorates & Departments** — Icon grid showing all 8 directorates and 4 departments as compact cards. Icon + name + one-line mandate. Links to detail pages.

10. **Kente divider**

11. **Training Institutions** — 3 cards for training centres with location, focus area, and link.

12. **Footer**

### 4.3 Header

- **Utility bar (top):** Ghana coat of arms (left), OHCS wordmark, search icon, language selector placeholder (right)
- **Main navigation:** Home, About (mega-dropdown), Directorates (mega-dropdown), Departments (mega-dropdown), Services (mega-dropdown), News, Events, Publications, Contact
- **Kente header band:** 4px strip beneath navigation
- **Behavior:** Sticky on scroll with subtle shadow transition, condensed height on scroll
- **Mobile:** Hamburger icon, full-screen slide-out panel with all navigation items

### 4.4 Footer

- **Kente band** at the very top of the footer
- **3-column layout:**
  - Column 1: OHCS logo, brief institutional description, social media links (Facebook, Twitter/X, Instagram)
  - Column 2: Quick links (About, Services, News, Contact, RTI)
  - Column 3: Contact information (address, phone, email, office hours)
- **Bottom bar:** Ghana coat of arms, copyright notice, policy links (Privacy, Accessibility, Sitemap)
- **Background:** var(--color-primary-dark) — deep green

### 4.5 Interior Page Template

- Breadcrumb navigation at top
- Page title (Playfair Display h1)
- Optional subtitle/description
- Content area (70%) + sidebar (30%) on desktop, stacked on mobile
- Sidebar: quick links, related pages, department-specific contact info
- Content supports: rich text, images, tables, embedded documents, accordions

### 4.6 Form Pages (Recruitment, RTI, Complaints, Feedback)

- Multi-step wizard for complex forms (recruitment) with progress indicator
- Single-page form for simpler submissions (complaints, feedback)
- Inline Zod validation with helpful error messages
- Success screen: reference number displayed prominently in JetBrains Mono, copy button, "What happens next" explanation, estimated response timeline

### 4.7 Track Submission Page (/track)

- Simple centered form: reference number input + email or phone input
- Submit → display submission status with timeline
- States: Received → Under Review → In Progress → Resolved/Completed
- Each state shows date and any notes
- If not found: helpful message with contact information

### 4.8 Publications Page

- Category filter (sidebar or top tabs): Reports, Policies, Forms, Circulars, etc.
- Search within publications
- Each publication card: title, date, category badge, file type icon (PDF), file size, download button
- Documents served from R2

### 4.9 Gallery

- Photo gallery: masonry or grid layout with lightbox viewer
- Video gallery: embedded players with thumbnails
- Category/year filters
- Lazy-loaded images with blur-up placeholder

### 4.10 Admin Dashboard (/admin)

- Protected by authentication (admin credentials, not public-facing)
- Clean data table interface for managing: news, events, publications, submissions
- CRUD operations for content
- Submission viewer with status management (update status, add notes)
- R2 file upload for documents and images
- Simple, functional design — no need for heavy aesthetic treatment

---

## 5. Database Schema

### 5.1 D1 Tables

```sql
-- News articles
CREATE TABLE news (
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
CREATE TABLE events (
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

-- Publications / Downloads
CREATE TABLE publications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'report' | 'policy' | 'form' | 'circular' | 'other'
  description TEXT,
  file_url TEXT NOT NULL, -- R2 URL
  file_type TEXT NOT NULL DEFAULT 'pdf',
  file_size_bytes INTEGER,
  is_published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Submissions (recruitment, RTI, complaints, feedback)
CREATE TABLE submissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  reference_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'recruitment' | 'rti' | 'complaint' | 'feedback'
  status TEXT NOT NULL DEFAULT 'received', -- 'received' | 'under_review' | 'in_progress' | 'resolved' | 'closed'
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  body TEXT NOT NULL,
  attachments TEXT, -- JSON array of R2 URLs
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Submission status history (for timeline tracking)
CREATE TABLE submission_status_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Leadership profiles
CREATE TABLE leadership (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_featured INTEGER NOT NULL DEFAULT 0, -- for homepage spotlight
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Gallery items
CREATE TABLE gallery (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  type TEXT NOT NULL, -- 'photo' | 'video'
  title TEXT,
  description TEXT,
  url TEXT NOT NULL, -- R2 URL for photos, embed URL for videos
  thumbnail_url TEXT,
  category TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
```

### 5.2 Indexes

```sql
CREATE INDEX idx_news_published ON news(is_published, published_at DESC);
CREATE INDEX idx_news_slug ON news(slug);
CREATE INDEX idx_events_date ON events(is_published, start_date DESC);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_publications_category ON publications(is_published, category);
CREATE INDEX idx_submissions_reference ON submissions(reference_number);
CREATE INDEX idx_submissions_type_status ON submissions(type, status);
CREATE INDEX idx_submissions_email ON submissions(email);
CREATE INDEX idx_status_history_submission ON submission_status_history(submission_id, created_at DESC);
CREATE INDEX idx_leadership_order ON leadership(display_order);
CREATE INDEX idx_gallery_type ON gallery(type, created_at DESC);
```

### 5.3 KV Namespaces

| Namespace | Key Pattern | Value | TTL |
|---|---|---|---|
| `OHCS_REF_LOOKUP` | `ref:{reference_number}` | submission ID | None |
| `OHCS_CACHE` | `page:{path}` | rendered page data | 5 min |
| `OHCS_RATE_LIMIT` | `ip:{ip}:{endpoint}` | request count | 1 min |

### 5.4 R2 Bucket Structure

```
ohcs-assets/
├── publications/     (PDFs, documents)
├── images/
│   ├── news/         (article thumbnails)
│   ├── gallery/      (photo gallery)
│   ├── leadership/   (profile photos)
│   └── branding/     (logos, coat of arms)
├── submissions/      (uploaded attachments)
└── videos/           (if self-hosted)
```

---

## 6. API Routes

### 6.1 Public API (Workers + Hono)

```
GET    /api/v1/news                    — list published news (paginated)
GET    /api/v1/news/:slug              — single news article
GET    /api/v1/events                  — list upcoming events
GET    /api/v1/events/:slug            — single event
GET    /api/v1/publications            — list publications (filterable by category)
GET    /api/v1/leadership              — list leadership profiles
GET    /api/v1/gallery                 — list gallery items (filterable by type)
POST   /api/v1/submissions             — create new submission (recruitment/RTI/complaint/feedback)
GET    /api/v1/track/:referenceNumber  — check submission status (requires email or phone verification)
```

### 6.2 Admin API (authenticated)

```
POST   /api/v1/admin/auth/login        — admin login
POST   /api/v1/admin/news              — create news article
PUT    /api/v1/admin/news/:id          — update news article
DELETE /api/v1/admin/news/:id          — delete news article
POST   /api/v1/admin/events            — create event
PUT    /api/v1/admin/events/:id        — update event
DELETE /api/v1/admin/events/:id        — delete event
POST   /api/v1/admin/publications      — create publication
PUT    /api/v1/admin/publications/:id  — update publication
DELETE /api/v1/admin/publications/:id  — delete publication
GET    /api/v1/admin/submissions       — list all submissions (filterable, paginated)
PUT    /api/v1/admin/submissions/:id   — update submission status/notes
POST   /api/v1/admin/leadership        — create leadership profile
PUT    /api/v1/admin/leadership/:id    — update leadership profile
DELETE /api/v1/admin/leadership/:id    — delete leadership profile
POST   /api/v1/admin/gallery           — add gallery item
DELETE /api/v1/admin/gallery/:id       — delete gallery item
POST   /api/v1/admin/upload            — upload file to R2
```

### 6.3 API Response Envelope

```typescript
// Success
{
  data: T,
  meta: { page?: number, totalPages?: number, total?: number }
}

// Error
{
  error: {
    code: string,        // 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'RATE_LIMITED'
    message: string,     // human-readable
    details?: unknown,   // field-level validation errors
    requestId: string    // for log correlation
  }
}
```

---

## 7. Reference Number System

### 7.1 Format

```
OHCS-{TYPE}-{YYYYMMDD}-{RANDOM}
```

Examples:

- `OHCS-REC-20260416-A7F3` — Recruitment submission
- `OHCS-RTI-20260416-B2D1` — Right to Information request
- `OHCS-CMP-20260416-C9E4` — Complaint
- `OHCS-FBK-20260416-D5A8` — Feedback

### 7.2 Type Codes

| Type | Code |
|---|---|
| Recruitment | REC |
| Right to Information | RTI |
| Complaint | CMP |
| Feedback | FBK |

### 7.3 Generation

- Date portion: submission date in YYYYMMDD
- Random portion: 4 alphanumeric characters (uppercase), generated server-side
- Uniqueness enforced by D1 UNIQUE constraint + retry logic (collision probability negligible)

### 7.4 Status Tracking

| Status | Description |
|---|---|
| `received` | Submission recorded, awaiting review |
| `under_review` | Being reviewed by OHCS staff |
| `in_progress` | Action being taken |
| `resolved` | Completed/resolved |
| `closed` | Closed (no further action) |

Each status change creates a `submission_status_history` record for the timeline view.

---

## 8. Security

### 8.1 Input Validation

- Zod schemas on every form (client-side) and every API endpoint (server-side)
- Never trust client data — always re-validate server-side

### 8.2 Rate Limiting

- Public form submissions: 5 per IP per minute (KV counter)
- Status check: 10 per IP per minute
- Admin API: 60 per IP per minute
- Return `429 Too Many Requests` with `Retry-After` header

### 8.3 CORS

- Explicit origin allowlist: `https://ohcs.gov.gh` (and staging domain)
- Never wildcard `*` in production

### 8.4 Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.r2.dev; font-src 'self' https://fonts.gstatic.com
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 8.5 Admin Authentication

- Username/password login (bcrypt hashed, cost 12)
- JWT access token (15 min) in memory + refresh token (7 days) in httpOnly cookie
- Session stored in KV keyed by session ID
- Admin routes protected by middleware that validates JWT on every request

### 8.6 File Uploads

- Validate file type (allowlist: PDF, JPG, PNG, WebP)
- Max file size: 10MB
- Sanitize filenames
- Store in R2 with generated keys (never user-provided filenames in storage path)

---

## 9. i18n Infrastructure

### 9.1 Setup

- next-intl configured with English (`en`) as default locale
- All user-facing strings in translation files: `messages/en.json`
- URL structure: `/en/about` (English), `/tw/about` (future Twi), etc.
- Language selector in header utility bar (shows "English" at launch, expandable later)

### 9.2 Translation File Structure

```
messages/
├── en.json          (English — complete)
├── tw.json          (Twi — future)
├── ee.json          (Ewe — future)
└── gaa.json         (Ga — future)
```

### 9.3 Usage Pattern

```typescript
// All strings go through the translation function
const t = useTranslations('home');
return <h1>{t('hero.title')}</h1>;
```

No hardcoded strings in components. When translations are commissioned, it's a content task — swap in the JSON file and the site renders in that language.

---

## 10. Performance Targets

| Metric | Target | How |
|---|---|---|
| LCP | < 2s on 3G | SSR, preloaded fonts, optimized hero image |
| FID | < 100ms | Minimal client-side JS, code-split routes |
| CLS | < 0.1 | Explicit image dimensions, font-display swap |
| Initial page weight | < 500KB | Tree-shaking, WebP images, lazy loading |
| Time to Interactive | < 3s on 3G | Progressive hydration, deferred non-critical JS |
| Lighthouse score | > 90 (all categories) | Continuous monitoring |

---

## 11. Responsive Breakpoints

```css
/* Mobile first */
--breakpoint-sm:  640px;   /* large phones */
--breakpoint-md:  768px;   /* tablets */
--breakpoint-lg:  1024px;  /* small desktops */
--breakpoint-xl:  1280px;  /* desktops */
--breakpoint-2xl: 1536px;  /* large desktops */
```

- Mobile (< 640px): single column, hamburger nav, stacked cards, full-width forms
- Tablet (768px): 2-column grids, condensed navigation
- Desktop (1024px+): full 12-column grid, mega-dropdown navigation, sidebar layouts

---

## 12. Project Structure

```
ohcs-website/
├── src/
│   ├── app/                    (Next.js App Router pages)
│   │   ├── [locale]/           (i18n routing)
│   │   │   ├── page.tsx        (homepage)
│   │   │   ├── about/
│   │   │   ├── directorates/
│   │   │   ├── departments/
│   │   │   ├── services/
│   │   │   ├── news/
│   │   │   ├── events/
│   │   │   ├── publications/
│   │   │   ├── gallery/
│   │   │   ├── track/
│   │   │   ├── contact/
│   │   │   └── admin/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 (base components: Button, Card, Input, etc.)
│   │   ├── layout/             (Header, Footer, Sidebar, Breadcrumb)
│   │   ├── kente/              (KenteAccent, KenteLoader, KenteDivider)
│   │   ├── forms/              (SubmissionForm, TrackForm, MultiStepWizard)
│   │   ├── news/               (NewsCard, NewsList, NewsDetail)
│   │   ├── events/             (EventCard, EventList, EventDetail)
│   │   └── gallery/            (PhotoGrid, Lightbox, VideoEmbed)
│   ├── lib/
│   │   ├── api.ts              (API client for Workers endpoints)
│   │   ├── utils.ts            (shared utilities)
│   │   ├── constants.ts        (site-wide constants)
│   │   └── validations.ts      (shared Zod schemas)
│   ├── hooks/                  (custom React hooks)
│   ├── types/                  (TypeScript type definitions)
│   └── styles/
│       ├── tokens.css          (CSS custom properties)
│       └── kente-patterns.svg  (Kente pattern tile set)
├── worker/
│   ├── src/
│   │   ├── index.ts            (Hono app entry point)
│   │   ├── routes/
│   │   │   ├── public/         (news, events, publications, submissions, track)
│   │   │   └── admin/          (CRUD endpoints, auth, upload)
│   │   ├── middleware/         (auth, rate-limit, cors, error-handler)
│   │   ├── services/           (business logic)
│   │   ├── db/
│   │   │   ├── schema.ts       (Drizzle ORM schema)
│   │   │   └── migrations/     (numbered SQL files)
│   │   └── lib/
│   │       ├── reference.ts    (reference number generator)
│   │       ├── storage.ts      (R2 upload/download helpers)
│   │       └── validation.ts   (Zod schemas)
│   └── wrangler.toml
├── messages/
│   └── en.json                 (English translations)
├── public/
│   ├── fonts/                  (self-hosted if needed)
│   └── images/                 (static assets, logos)
├── tests/
│   ├── unit/
│   ├── component/
│   └── e2e/
├── docs/
│   └── superpowers/specs/      (this spec + future specs)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 13. Assets

### 13.1 Source

All branding assets sourced from the current live site (ohcs.gov.gh):

- OHCS header logo: `https://ohcs.gov.gh/wp-content/themes/ohch/assets/img/logo.png`
- OHCS footer logo: `https://ohcs.gov.gh/wp-content/themes/ohch/assets/img/footer-logo.png`
- Ghana Coat of Arms: `https://ohcs.gov.gh/wp-content/themes/ohch/assets/img/Coat-of-arms2x.png`
- PSCMD logo: `https://ohcs.gov.gh/wp-content/themes/ohch/assets/img/pscmd-logo.png`
- PRAAD logo: `https://ohcs.gov.gh/wp-content/themes/ohch/assets/img/Public-Records-and-Archives-Administration-Department.png`
- CSTC logo: `https://ohcs.gov.gh/wp-content/themes/ohch/assets/img/Civil-Service-Training-Centre.png`

### 13.2 Optimization

- Convert to WebP/AVIF where applicable
- Generate responsive srcset variants (320w, 640w, 960w, 1280w)
- Attempt SVG conversion for logos (cleaner scaling)
- Store optimized assets in R2, serve via Cloudflare CDN

---

## 14. Out of Scope (for initial launch)

- Multiple language translations (infrastructure only — no translated content)
- Citizen user accounts
- Online payment integration
- Real-time chat/support
- Full CMS with WYSIWYG editor (admin dashboard is functional but lightweight)
- Email notifications for submission status changes (can be added later)
- Analytics dashboard (use Cloudflare Web Analytics — free, privacy-respecting)
