# OHCS Digital Portal & Recruitment Platform

**Product Requirements Document**

The Official Web Presence and End-to-End Recruitment System of the
Office of the Head of the Civil Service, Republic of Ghana

---

| | |
|---|---|
| **Document** | PRD v1.0.0 |
| **Date** | April 2026 |
| **Author** | OHCS Product Engineering |
| **Status** | Production — Sub-project A shipped, B–D scoped |
| **For** | Head of the Civil Service · Permanent Secretaries · Civil Service Council |
| **Classification** | Internal — OHCS Leadership |

---

## Table of Contents

1. **Executive Summary** — Vision, what we shipped, and what is next
2. **The Case for a Modern OHCS Portal** — Why the WordPress era ended
3. **The Case for a Digital Recruitment Pipeline** — Why paper recruitment has to stop
4. **Product Overview** — What the platform delivers today
5. **Target Audience & User Personas** — Who we serve and how
6. **Public Website — Feature Inventory** — Every page, every feature
7. **Recruitment Portal — The Applicant Journey** — Magic link to merit list
8. **Recruitment Portal — The Reviewer & Admin Workflow** — Open-queue vetting at scale
9. **AI & Intelligence** — Lexi AI assistant and document verification
10. **System Architecture** — Cloudflare-native edge platform
11. **Design System & UX** — "Institutional Luxury with Ghanaian Soul"
12. **Security & Privacy** — Defence in depth for citizen data
13. **Deployment & Operations** — How the platform runs in production
14. **Roadmap** — From shipped to fully operational

---

## 1. Executive Summary

The Office of the Head of the Civil Service has, for the better part of a decade, presented itself to Ghana through a basic WordPress brochure site and conducted recruitment on paper, in queues, with hand-delivered envelopes and manually adjudicated certificates. In a country where 65% of citizens reach the internet through a smartphone first, where graduate applicants come from twelve regional universities, and where every other arm of the Civil Service is being asked to digitise — that posture is no longer defensible.

The OHCS Digital Portal replaces both. It is a single, coherent web application that does two things at the same level of polish: it is the **public face** of the Civil Service, and it is the **end-to-end recruitment system** that selects who joins it.

> "The OHCS website should look and feel like the institution it represents — rigorous, dignified, modern, and unmistakably Ghanaian. The recruitment system should be the easiest part of joining the Civil Service, not the hardest."

| 22+ | 19 | 21 | 14 | 202 | 0 |
|:-:|:-:|:-:|:-:|:-:|:-:|
| Public pages | Public routes | Application states | Document types | Tests passing | TypeScript errors |

**What is shipped to production today (`ohcs.pages.dev`)**

- The full public website — homepage, About (5 pages), 5 Directorates, 6 Units, Departments, Services hub, Publications library, Training Institutions, Contact, /track lookup
- **Lexi** — the OHCS Live Engagement & eXpert Intelligence AI bot, with 25 seeded knowledge entries
- The complete admin shell — content management for News, Events, Publications, Leadership, Submissions, Users, Audit Log, Settings, and the Lexi Training Hub
- **Recruitment Sub-project A** — Applicant magic-link authentication, 5-step application wizard with auto-save, 15-document master library with AI-assisted verification, reviewer pipeline with side-by-side decision UI, per-document accept/reject/re-upload decisions, application-level vetting roll-up, appeals queue, status-transition audit trail, daily cron deadline processing
- A comprehensive security baseline — SHA-256 hashed magic-link tokens, HMAC-signed admin document URLs, constant-time comparisons, HTML-escaped outbound emails, per-email rate limiting

**What is next**

- **Sub-project B — Online Payment** (Hubtel MoMo + bank, GHS 100 cap, refunds, deferred per leadership instruction)
- **Sub-project C — Online Examination** (admin question bank, timed exam UI, server-enforced timer, auto-grade against per-exercise pass mark)
- **Sub-project D — Online Interview** (slot picker, Zoom or Microsoft Teams meeting auto-create, outcome capture, waitlist management)

**What is needed to operationalise**

The technology has been built. To go from a finished product to an operational national service:

1. **DNS cutover from `ohcs.pages.dev` to `ohcs.gov.gh`** — Coordination with NITA. The application is ready; the domain is gated externally.
2. **Real admin authentication** — A formal decision between Cloudflare Access SSO (recommended), magic-link admin, or D1-backed PBKDF2. The interim header-based gate must be replaced before the portal goes public to citizens.
3. **`ohcs.gov.gh` email sender via Resend or MailChannels** — Today every magic link sends from the Resend sandbox address `onboarding@resend.dev`, which only delivers to addresses verified on the OHCS Resend account. DKIM/SPF on `ohcs.gov.gh` unblocks real applicant testing.
4. **Knowledge population for Lexi** — Each directorate and unit can supply policy documents to deepen Lexi's grounding.
5. **Endorsement and rollout** — A formal announcement that recruitment will proceed exclusively through the portal for the next graduate exercise.

The cost of all four items combined is a fraction of a single year of paper recruitment.

---

## 2. The Case for a Modern OHCS Portal

The current `ohcs.gov.gh` is a stock WordPress installation. It loads slowly on metered mobile data, surfaces the same six press releases month after month, has no search, no application status lookup, and offers visiting officers, journalists, partners, and prospective recruits no meaningful way to engage with the institution other than to read whatever was last posted.

### 2.1 What citizens, civil servants, and partners actually need

| Need | Old WordPress Site | OHCS Digital Portal |
|---|---|---|
| **First impression** | Generic theme, undifferentiated stock images, broken thumbnails. | Cinematic hero carousel, animated OHCS crest, Kente-woven motifs, editorial typography. |
| **Find a directorate** | Buried in nested menus, no slugs, no visual hierarchy. | First-class `/directorates` and `/units` with detail pages for each of the 5 directorates and 6 units. |
| **Submit a complaint or RTI request** | PDF download, print, scan, email. | Native web forms at `/services/complaints`, `/services/rti`, `/services/feedback` with reference numbers and `/track` lookup. |
| **Apply for a Civil Service post** | Notice in a newspaper, queue at a regional office. | `/services/recruitment` → magic-link in email → 5-step wizard → applicant dashboard. |
| **Track an application** | Phone the office, hope someone picks up. | Self-service `/track` accepts both `OHCS-YYYY-NNNNN` (recruitment) and `OHCS-XXX-YYYYMMDD-XXXX` (complaint/RTI) reference formats. |
| **Get an answer at 11pm** | Wait until office hours. | **Lexi** at `/assistant` — 25-entry knowledge base on the Civil Service Act, RTI Act, leave entitlements, pension system, code of conduct, promotions, and discipline procedures. |
| **Read official publications** | Hyperlink farm with broken downloads. | Searchable `/publications` library, paginated 12 per page, category filters across forms, circulars, policy, reports, legislation, guidelines. |

### 2.2 The institutional argument

A government website is not a marketing surface. It is the most-visited document the institution publishes. It tells journalists, prospective recruits, foreign delegations, donor partners, and citizens what the Civil Service believes about itself. A site that cannot reach the height of professionalism the institution holds itself to in person is an active liability.

The OHCS Digital Portal corrects this. It is not a brochure that needs to be tolerated. It is a working instrument of governance that every other agency can be pointed to as a benchmark.

---

## 3. The Case for a Digital Recruitment Pipeline

Civil Service recruitment in Ghana, as conducted today, has five well-documented friction points: physical queues at a single Accra location for nationals of every region; opaque document checking with no audit trail; no consistent communication channel between the Service and the applicant; manual roll-up of decisions across hundreds of folders; and complete invisibility into where any given application sits in the pipeline at any given time.

### 3.1 What the platform changes

| Stage | Old Process | OHCS Recruitment Portal |
|---|---|---|
| **Discovery** | Newspaper notice, regional office circular. | `/services/recruitment` page, prominent on the homepage when an exercise is active. |
| **Apply** | Physical form, photocopies of certificates, courier or in-person. | Magic-link email → 5-step wizard → upload documents from a phone. |
| **Identity** | Visual check at counter. | NIA Ghana Card field with format enforcement, optional AI photo and identity verification. |
| **Document vetting** | Folder-by-folder by hand. | Side-by-side reviewer view: per-document Accept / Reject / Re-upload decisions, automatic application-level roll-up. |
| **AI assistance** | None. | Workers AI runs `@cf/llava-hf/llava-1.5-7b-hf` on uploaded image documents and `@cf/meta/llama-3.1-8b-instruct` on PDF text — flags suspicious certificates and obvious mismatches before a human ever opens the file. |
| **Communication** | Phone calls, sometimes letters. | Templated email and SMS at every status change — submission confirmation, vetting outcome, appeal acknowledgement. |
| **Appeals** | Walk in to file an appeal. Weeks of follow-up. | `/apply/appeal/` form, routed to a separate `recruitment_admin` reviewer who cannot self-approve. 7-day window enforced by daily cron. |
| **Audit** | Paper trail in folders. | Append-only `status_transitions` table with actor, role, reason, timestamp on every state change. |
| **Tracking** | Phone the office. | `/track` lookup using only the reference number. |

### 3.2 The five non-negotiables, locked in

After review with leadership, the following decisions are fixed and reflected in the system architecture:

1. **Maximum exam fee: GHS 100.** Hard-coded as the upper bound in Sub-project B's specification.
2. **Exams: fully online.** No physical centres. Sub-project C will deliver a server-timed, auto-graded exam UI.
3. **Interviews: fully online via Zoom or Microsoft Teams.** Choice between the two finalised in Sub-project D's design phase.
4. **A single active recruitment exercise at a time.** Server-enforced since Phase 3.5 — the constraint lives in D1, not in client memory.
5. **All time-critical notifications via SMS in addition to email.** Hubtel SMS already integrated; the helper falls back to a development log when the API key is not set.

---

## 4. Product Overview

The OHCS Digital Portal is a single Next.js 16 application deployed on Cloudflare Pages, with all server-side logic running as Pages Functions on Cloudflare's edge. It comprises three surfaces:

| Surface | Audience | What it delivers |
|---|---|---|
| **Public Website** | Citizens, journalists, prospective applicants, partners | 22+ pages including homepage, About, 5 Directorates, 6 Units, Departments, Services hub, Publications, Training, Contact, `/track`, Lexi AI assistant |
| **Recruitment Portal** | Applicants and Civil Service reviewers | Magic-link applicant authentication, 5-step application wizard, 15-document master library, AI-assisted verification, reviewer pipeline, appeals queue, status-transition audit trail |
| **Admin Console** | OHCS staff and content managers | News, Events, Publications, Leadership, Submissions, Users, Audit Log, Settings, and the **Lexi Training Hub** for managing the AI knowledge base |

The platform is multi-channel by design. Applicants receive notifications on email and (when phone is supplied) SMS; admins access the same data on desktop and mobile; the public site is fully responsive down to feature-phone-class viewports.

---

## 5. Target Audience & User Personas

### Akua — Graduate Applicant

KNUST BSc Computer Science, applying for her first Civil Service post.
Lives in Kumasi, applies from her phone on metered data, has never set up a Resend or Hubtel account in her life.

- One-tap magic link — no password to remember
- Auto-save at every wizard step — survives a Dumsor at any moment
- SMS receipts the moment vetting passes or fails
- `/track` page she can check from her mother's phone if her own runs out of credit

### Nana Yaw — Recruitment Reviewer

Recruitment Officer in the Recruitment, Training & Development Directorate (RTDD).
Reviews 80–120 applications per day during an active exercise. Wants to do it accurately and quickly without getting fatigued.

- Open-queue model — clicks "Take next" and is auto-assigned the oldest unclaimed application
- Side-by-side viewer — left pane: per-document decision; right pane: signed-URL R2 preview
- AI pre-flagging on uploaded documents
- 30-minute idle TTL on claims so abandoned reviews automatically return to the queue
- Cannot review his own appeal — the SQL filter excludes any application where he was the latest reviewer

### Mr Adzornu — Recruitment Admin (recruitment_admin role)

Senior Officer authorised to handle appeals.
Reviews escalated cases where an applicant disputes a vetting outcome.

- Dedicated `/admin/recruitment/appeals` queue, separated from the main pipeline
- Sees the original reviewer's decision, the applicant's appeal text, and full status history
- Two-click overturn or uphold with mandatory notes (minimum 10 characters)
- Decision triggers an applicant email with the outcome and next steps

### Mrs Aboah — Communications Officer

OHCS Communications team.
Publishes news, events, leadership profile updates, and downloadable publications.

- WYSIWYG-free admin shell — fields, not freeform HTML
- News, Events, Publications, Leadership all manageable through `/admin`
- Recently-changed activity feed on the admin dashboard
- Submissions inbox unifies RTI, complaints, and feedback for triage

---

## 6. Public Website — Feature Inventory

22+ pages, all server-rendered to static HTML for sub-second loads on 3G.

### Homepage (`/`)

- **Hero carousel** — 3-slide showcase with Ken Burns zoom, animated Kente mesh overlay, floating civic icons, gold bokeh particles, Kente-framed borders
- **Animated logo** — OHCS Ghana Civil Service crest with letter-by-letter reveal, gold divider growth, Kente stripe draw animation
- **Quick services** — 4-tile direct entry to the highest-traffic services
- **Stats banner** — current Civil Service strength
- **News & events section** — latest published items, admin-managed
- **Leadership spotlight** — featured leader with photo and quote (currently Dr. Evans Aggrey-Darkoh, Head of the Civil Service; Mr. Sylvanus Kofi Adzornu, Chief Director)
- **Directorates grid** — visual entry into all 5 line directorates
- **Lexi AI CTA** — invitation to talk to the assistant
- **Final CTA section** — recruitment entry point when an exercise is active

### About (`/about`)

| Route | Content |
|---|---|
| `/about` | Overview of the OHCS mandate |
| `/about/civil-service` | Constitutional and statutory framework |
| `/about/structure` | The 5 directorates + 6 units organogram |
| `/about/leadership` | Leadership team profiles |
| `/about/partners` | Partner institutions and collaborations |

### Organisational Surfaces

- `/directorates` — Master grid of all 5 line directorates
- `/directorates/[slug]` — Detail page for each (RSIMD, F&A, PBMED, CMD, RTDD)
- `/units` — Master grid of all 6 support units
- `/units/[slug]` — Detail page for each (Reform Coordinating Unit, Internal Audit Unit, Civil Service Council, Estate, Accounts, Stores)
- `/departments` — Civil Service departments directory
- `/training` — Training & development programmes
- `/training/[slug]` — Individual programme detail (CSTC, GIMPA collaboration, Regional Training)

### Services Hub (`/services`)

| Route | Function |
|---|---|
| `/services/recruitment` | Recruitment portal entry — process steps, scam warnings, active-exercise tracker. Hides the application form when no exercise is active to prevent fraud. |
| `/services/rti` | Right to Information request — educational FAQ accordion, process explainer, hidden-by-default request form |
| `/services/complaints` | Complaints submission portal |
| `/services/feedback` | General feedback form |

### Public Utilities

- `/publications` — Searchable, category-filtered document library (forms, circulars, policy, reports, legislation, guidelines), paginated 12 per page
- `/contact` — Office address, map, support channels
- `/track` — Universal submission tracker, accepts both reference formats
- `/assistant` — Standalone Lexi AI chat interface

---

## 7. Recruitment Portal — The Applicant Journey

The applicant never sees a password. They never see an "account" page. The whole flow is built around a single contract: **the email address you use to apply is the only thing you need to remember.**

### Step 0 — Discovery

Applicant lands on `/services/recruitment`. If a recruitment exercise is currently `active` in D1, they see the exercise name, the deadline, the scam warnings, and a single "Start Application" button. If no exercise is active, the form is hidden entirely — there is no way to fill out a phantom application during a quiet period.

### Step 1 — Magic Link Request

Applicant enters their email address and clicks a button. A POST request hits `/api/applications/start`:

1. Per-email rate limit (3 requests per rolling 5 minutes) is enforced before any work is done.
2. The active exercise is verified server-side.
3. A 256-bit random token is generated, **SHA-256 hashed**, and the hash is stored in D1 along with the email and exercise id.
4. The raw token is emailed to the applicant via Resend, embedded in a magic link.
5. Token expires in 30 minutes and is single-use.

This is the only authentication step the applicant ever does. There is no password to forget, no account to recover.

### Step 2 — Magic Link Click

Applicant clicks the link in their inbox. The endpoint at `/api/applications/magic/[token]` hashes the inbound token, looks up the matching row, marks it `used_at`, creates an `application_sessions` row keyed by an `HttpOnly; Secure; SameSite=Lax` cookie with a 7-day TTL, generates a unique reference number in the format `OHCS-YYYY-NNNNN`, creates a `draft` application in D1, and 302-redirects to `/apply/form/?step=1`.

### Step 3 — The 5-Step Wizard

The wizard at `/apply/form/` auto-saves the applicant's working draft on every field change with debounce. A header indicator shows **Saving / Saved / Error with retry** in real time so the applicant always knows whether they can close the tab safely.

| Step | Title | Captures |
|---|---|---|
| 1 | **Personal Details** | Full name, date of birth, gender, NIA Ghana Card number, phone, address, region, consent agreement |
| 2 | **Eligibility** | Holds first degree, professional qualification flag, PWD status. These flags drive conditional document requirements in Step 4. |
| 3 | **Education & Experience** | Highest qualification, field of study, institution, graduation year, degree class, years experience, current employment, work history |
| 4 | **Documents** | Upload required documents per exercise requirements. Each upload runs server-side magic-byte sniffing, MIME validation, size enforcement, and (where configured) Workers AI verification |
| 5 | **Review & Submit** | Final review, declarative signature, submit |

The applicant can close the tab at any moment, click the magic link again the next day from a different device, and pick up exactly where they left off.

### Step 4 — Submission

On submit, `/api/applications/me/submit` validates that all required documents are uploaded (respecting conditional requirements like "PWD applicants must upload a medical certificate"), confirms the declaration is agreed, writes a `draft → submitted` row to `status_transitions`, sets the application status to `submitted`, and sends a confirmation email containing the `OHCS-YYYY-NNNNN` reference number and a link to `/track`.

### Step 5 — Vetting Outcome

The applicant does nothing during vetting. When a reviewer reaches a decision, the applicant receives:

- **`vetting_passed`** — Email + SMS: "Your application has passed initial review. Please pay the exam fee to proceed." (Sub-project B will activate the payment link.)
- **`vetting_failed`** — Email: "Your application was not successful at vetting. Notes: [reviewer notes]. You may submit an appeal within the appeal window."
- **`requires_action`** — Email: "Your application needs additional information before vetting can complete: [list of documents to re-upload]."

All admin-supplied notes are HTML-escaped before being interpolated into the outbound email, so a malicious reviewer cannot inject arbitrary HTML into the applicant's inbox.

### Step 6 — Appeal (Optional)

If the application terminated at `vetting_failed`, `exam_failed`, or `rejected`, the applicant can visit `/apply/appeal/`, write a free-text reason (minimum 20 characters), and submit. The application transitions to `appeal_under_review` and is routed to the dedicated appeals queue, reviewed by `recruitment_admin` only — never the original reviewer. Default appeal window is 7 days, configurable per exercise.

### Step 7 — Track at any time

`/track` accepts the `OHCS-YYYY-NNNNN` reference and shows a status timeline with badges for every state the application has passed through.

### The 21-state ApplicationStatus enum

Every application moves through a subset of these states. The full list spans the entire lifecycle from draft to appointed.

| Phase | States |
|---|---|
| Application | `draft` → `submitted` → `under_review` |
| Vetting outcome | `vetting_passed` · `vetting_failed` · `requires_action` |
| Appeals | `appeal_under_review` → `appeal_overturned` · `appeal_upheld` |
| Payment | `awaiting_payment` → `paid` |
| Examination | `exam_scheduled` → `exam_completed` → `exam_passed` · `exam_failed` |
| Interview | `interview_scheduled` → `interview_completed` |
| Outcome | `shortlisted` · `waitlisted` · `appointed` · `rejected` |

Each transition writes one append-only row to `status_transitions` with the actor, role, reason, and timestamp.

---

## 8. Recruitment Portal — The Reviewer & Admin Workflow

### 8.1 The Open-Queue Model

There is no batch assignment. There is no team lead handing out folders. Every reviewer who logs in sees one button: **"Take next."** Clicking it triggers `/api/admin/applications/[id]/claim` which atomically picks the oldest `submitted` application, sets `review_claimed_by` and `review_claimed_at`, and routes the reviewer into the side-by-side detail view.

If the reviewer walks away without making a decision, the daily cron at `/api/system/run-deadlines` releases their claim after 30 minutes of inactivity. The application returns to the queue and another reviewer picks it up.

### 8.2 The Side-by-Side Reviewer View (`/admin/recruitment/pipeline/detail/`)

This is where the work happens. The page is split into two panes:

**Left pane — Per-document decisions**
- One card per required document type (e.g., National ID, First Degree Certificate, Reference Letter 1)
- Three-state radio: **Accept · Reject · Re-upload**
- Mandatory reason field for any non-accept decision (enforced both in the UI and again at the API layer)
- A live "X / Y decided" pill at the top of the pane shows progress at a glance
- A persistent footer holds the reviewer notes textarea and the **Submit Decision** button — pulled out of the scrollable area so it is always visible

**Right pane — Document viewer**
- Tabbed strip of every uploaded document, with file-type icons
- Active document is rendered inline via an HMAC-signed R2 URL with a 60-second time-to-live
- Keyboard navigation: ArrowLeft / ArrowRight / Home / End cycle through the documents (full WAI-ARIA tab pattern)
- AI verdict badge per document where Workers AI ran a check (clean ✓ or flagged ⚠)

### 8.3 The Roll-Up Logic

When the reviewer hits Submit Decision, the API computes the application-level outcome from the per-document decisions:

| Rule | Outcome |
|---|---|
| Any document **rejected** | `vetting_failed` |
| Otherwise, any document **needs re-upload** | `requires_action` |
| Otherwise (all accepted) | `vetting_passed` |

The endpoint atomically writes one `document_review_decisions` row per document, one `application_review_decisions` row for the overall outcome, one `status_transitions` row for the audit trail, updates the application status, releases the claim, and dispatches the applicant notification email and SMS.

### 8.4 Pipeline List (`/admin/recruitment/pipeline/`)

Filter chips for the most-used statuses (New · In Review · Awaiting Resubmit · Passed · Failed · All), search by reference or email, and a status badge that uses a single source of truth — `src/lib/application-status.ts` — for both the human-readable label and the AA-contrast colour. The desktop view is a six-column table; on mobile it collapses cleanly to a card stack so the reviewer can scan from a phone in the field.

### 8.5 Appeals Queue (`/admin/recruitment/appeals/`)

A separate queue, accessible only to `recruitment_admin` and `super_admin` roles. The SQL filter explicitly excludes any application where the caller was the latest reviewer — so an officer who failed an applicant cannot then adjudicate that applicant's appeal. The reviewer reads the original decision, the applicant's appeal text, and either **Overturns** (advancing the application back to `vetting_passed`) or **Upholds** (terminating to `appeal_upheld`). Both paths require notes of at least 10 characters. Both paths trigger an email to the applicant.

### 8.6 Audit Trail

Every status change writes a row to `status_transitions` with from-status, to-status, actor email, actor role, reason, and timestamp. This includes system-initiated transitions — when the daily cron promotes a stuck `requires_action` application to `vetting_failed` past its resubmission deadline, that transition appears with `actor_role = 'system'` and reason "Resubmission deadline expired." There are no silent state changes anywhere in the system.

### 8.7 Daily Cron

A GitHub Actions workflow at `.github/workflows/cron-deadlines.yml` POSTs `/api/system/run-deadlines` daily at 02:15 UTC with `SYSTEM_CRON_SECRET` as Bearer auth. The endpoint:

1. Releases stale review claims (older than 30 minutes idle)
2. Promotes `requires_action` applications past their resubmission deadline to `vetting_failed`, writing one audit row per affected application
3. Returns the count of affected rows so the workflow log shows what actually happened

---

## 9. AI & Intelligence

### 9.1 Lexi — The OHCS Live Engagement & eXpert Intelligence AI Bot

Lexi lives at `/assistant` and is also surfaced through the homepage CTA section. She is conversational, learns the visitor's name on request, varies her greeting by time of day ("Good morning" / "Good afternoon" / "Good evening"), and answers the questions the OHCS receives most often:

- The Civil Service Act (PNDCL 327) and the 1992 Constitution
- The Right to Information Act
- Leave entitlements (annual, sick, maternity, study leave, casual)
- The Civil Service Pension System (CAP 30 vs SSNIT)
- Code of conduct and discipline procedures
- Promotions and the performance management framework
- The 5 directorates, the 6 units, and the leadership team
- Recruitment frequency and how to apply

**The Lexi Training Hub** (`/admin/ai-training`) is a four-tab admin surface for the Communications team to extend her knowledge:

| Tab | Purpose |
|---|---|
| **Knowledge Base** | 25 seeded Q&A pairs, full CRUD, search across entries |
| **Documents** | 10 seeded source documents (Civil Service Act, RTI Act, Code of Conduct, Performance Framework, Conditions of Service, Pensions Act, Admin Instructions, Sexual Harassment Policy, Study Leave Guidelines), each with a processing-state indicator |
| **Conversations** | Review historic chats, capture user ratings and resolution status |
| **Settings** | Model parameter management |

### 9.2 Document Verification AI (Recruitment)

Workers AI runs server-side on every applicant document upload. Two models are used depending on the file type:

| Model | Used on | What it produces |
|---|---|---|
| `@cf/llava-hf/llava-1.5-7b-hf` | JPEG, PNG | Multi-modal vision verdict — for `identity` documents, checks whether the photo looks like an ID document; for `photo` documents, checks portrait-photo norms; for `certificate` documents, checks for institutional letterhead and signature regions |
| `@cf/meta/llama-3.1-8b-instruct` | PDF (text-extracted) | Document classification — does the text content match what the document type claims to be |

The AI verdict is **advisory**, never blocking. It is stored alongside the upload, surfaced as a badge on the reviewer's tab strip, and used to prioritise: applications with one or more flagged documents bubble to the top of the queue. The reviewer always retains final authority. Confidence threshold is 0.75; the prompt version is recorded so the system can identify which historical decisions were made under which prompt revision.

---

## 10. System Architecture

### 10.1 Edge-First on Cloudflare

| Layer | Technology | Responsibility |
|---|---|---|
| **Hosting** | Cloudflare Pages | Static HTML for the public site (Next.js App Router, `output: "export"`) |
| **Server logic** | Cloudflare Pages Functions | All `/api/**` routes, written in TypeScript, deployed as edge functions |
| **Database** | Cloudflare D1 (SQLite) | Applications, document types, exercise requirements, sessions, magic-link tokens (hashed), status transitions, review decisions |
| **Object storage** | Cloudflare R2 | Applicant document uploads, publication PDFs |
| **AI inference** | Cloudflare Workers AI | LLaVA vision + Llama 3.1 text classification |
| **Email** | Resend | Magic links, vetting outcomes, appeal acknowledgements (sandbox sender today; `ohcs.gov.gh` post-DNS) |
| **SMS** | Hubtel | Time-critical notifications when applicant phone is on file (helper falls back to console log when key not set, so dev runs without an account) |
| **Cron** | GitHub Actions | Daily `/api/system/run-deadlines` at 02:15 UTC |

### 10.2 Frontend Stack

| Component | Library | Version |
|---|---|---|
| Framework | Next.js | 16.2.4 |
| UI library | React | 19.2.4 |
| Styling | Tailwind CSS | 4 |
| Form management | react-hook-form | 7.72.1 |
| Schema validation | Zod | 4.3.6 (server-side input validation on every endpoint) |
| Server state | TanStack Query | 5.99.0 |
| Local state | Zustand | 5.0.12 |
| Animation | Framer Motion | 12.38.0 |
| Icons | Lucide React | 1.8.0 |
| Internationalisation | next-intl | 4.9.1 |
| Testing | Vitest | 4.1.4 (202 passing) |

### 10.3 Schema Footprint

Nine D1 migrations from `0001_initial_meta.sql` through `0009_pipeline_indexes.sql`, comprising 14 tables: `applications`, `application_sessions`, `magic_link_tokens`, `application_documents`, `document_types`, `exercise_document_requirements`, `recruitment_exercises`, `document_review_decisions`, `application_review_decisions`, `status_transitions`, `news`, `events`, `publications`, `submissions`, `leadership`, `gallery`, `sequences`. Indexes are tuned for the queries reviewers actually run — application status, claimed_by, claimed_at, document_type ordering by created_at.

### 10.4 The 15-Document Master Library

The recruitment system ships with a master library of reusable document types. Each exercise picks which subset to require, with optional conditional triggers (e.g., "PWD applicants must upload a medical certificate") and per-exercise size overrides.

| Type | Default size | Accepted MIMEs | AI check |
|---|---|---|---|
| National ID (Ghana Card) | 5 MB | PDF, JPEG, PNG | Identity |
| Birth Certificate | 5 MB | PDF, JPEG, PNG | Certificate |
| Passport-sized Photograph | 2 MB | JPEG, PNG | Photo |
| SSSCE / WASSCE Certificate | 5 MB | PDF, JPEG, PNG | Certificate |
| First Degree Certificate | 5 MB | PDF, JPEG, PNG | Certificate |
| Degree Transcript | 5 MB | PDF, JPEG, PNG | Certificate |
| National Service Certificate (NSS) | 5 MB | PDF, JPEG, PNG | Certificate |
| Postgraduate Certificate (Masters / PhD) | 5 MB | PDF, JPEG, PNG | Certificate |
| Professional Qualification (ICAG / GhIE / BAR / GMA) | 5 MB | PDF, JPEG, PNG | Certificate |
| Curriculum Vitae | 5 MB | PDF | — |
| Cover Letter / Statement of Purpose | 5 MB | PDF | — |
| Reference Letter 1 | 5 MB | PDF | — |
| Reference Letter 2 | 5 MB | PDF | — |
| Proof of Work Experience | 5 MB | PDF, JPEG, PNG | Certificate |
| Medical Certificate (PWD) | 5 MB | PDF | Certificate |

---

## 11. Design System & UX

### "Institutional Luxury with Ghanaian Soul"

The design language pairs the rigour of editorial government publishing with the warmth and craft of Ghana's Kente weaving tradition. Every surface should feel as though it was designed for the Civil Service first, and never as though it was retrofitted from a generic template.

### 11.1 Colour Palette

| Token | Hex | Usage |
|---|---|---|
| Ghana Green (primary) | `#1B5E20` | Headers, primary actions, brand surfaces |
| Ghana Green (light) | `#2E7D32` | Hover states, secondary surfaces |
| Ghana Gold (accent) | `#D4A017` | Active states, focus rings, accent details |
| Ghana Gold (light) | `#E8C547` | Hover accent, badge highlights |
| Kente Red | `#B71C1C` | Destructive actions, alerts, error states |
| Kente Black | `#212121` | Editorial type, structural lines |
| Cream surface | `#FDFAF5` | Page background — warm, paper-like |
| Card white | `#FFFFFF` | Card surfaces |
| Border | `#E5DDD0` | Card borders, dividers |
| Text primary | `#1A1A1A` | Long-form body type |
| Text muted | `#5C5549` | Captions, metadata |

All combinations meet WCAG AA contrast (4.5:1).

### 11.2 Typography

- **Display** — Playfair Display (serif). Used for headlines, hero copy, page titles.
- **Body** — Libre Baskerville (serif). Long-form readability.
- **Mono** — JetBrains Mono. Reference numbers, code, form fields.
- **Scale** — Major Third (1.25×) progression from `0.64rem` to `3.052rem`.

### 11.3 Distinctive Surfaces

- **Animated OHCS crest** — Ghana Civil Service coat-of-arms, letter-by-letter reveal on first paint, gold divider growth, Kente stripe draw animation
- **Hero carousel** — 3-slide showcase, Ken Burns slow zoom, animated Kente mesh overlay, floating civic icons (briefcase, scroll, gavel, balance), gold bokeh particles
- **Kente section dividers** — Horizontal woven-pattern strip with shimmer sweep, used between major sections
- **Floating geometric shapes** — Subtle parallax behind hero and CTA sections (E-Library inspired)
- **Card system** — 12–16px radius, subtle gold-tinted hover shadow, base-8 spacing
- **Status badges** — One label, one colour per state, centralised in `src/lib/application-status.ts`

### 11.4 UX Principles

- **Offline-first wherever possible** — auto-save every wizard step, retry on network errors, show clear save/error states
- **AA accessibility throughout** — 4.5:1 contrast, 44px touch targets, `focus-visible` rings on every interactive element, `prefers-reduced-motion` honoured globally, skip-to-content link present
- **Mobile-first** — every reviewer surface tested down to 375px viewport; pipeline table collapses to card stack on phones
- **No surprises in critical flows** — every async action shows a loading state; every error shows a retry; every success shows a confirmation

### 11.5 Voice

Across the marketing site and applicant-facing surfaces, the voice is the Civil Service's own: dignified, plain, accurate, no marketing fluff, no buzzwords. Microcopy is specific ("Submit Vetting Decision" rather than "Submit"), instructions are direct, and error messages name what went wrong rather than hide behind generic platitudes.

---

## 12. Security & Privacy

| Concern | Implementation |
|---|---|
| **Authentication (applicant)** | Magic link, 30-min TTL, single-use, SHA-256 hashed at rest in D1 |
| **Authentication (admin)** | Interim header-based gate today; Cloudflare Access SSO recommended for production launch |
| **Session** | 7-day TTL, `HttpOnly; Secure; SameSite=Lax` cookie, sliding extension on activity |
| **SQL injection** | Zero string interpolation into SQL; every query goes through prepared-statement helpers in `_shared/db.ts` |
| **Input validation** | Zod schemas on every POST/PUT body, enforced at the API layer |
| **HTML email** | All admin notes and applicant text HTML-escaped before interpolation into outbound emails |
| **Rate limiting** | 3 magic-link requests per email per 5-minute window |
| **Document URLs** | HMAC-SHA256 signed URLs with 60-second TTL; constant-time comparison; hard-fail when `SYSTEM_CRON_SECRET` is unset (no fallback secret) |
| **File uploads** | Server-side magic-byte sniffing, MIME validation, size enforcement, R2 keys derived from internal IDs (no path-traversal exposure) |
| **Cron auth** | Bearer token with constant-time comparison |
| **Audit trail** | Every status change writes a row to `status_transitions` with actor, role, reason, timestamp |
| **PII in logs** | Production logs never include applicant phone numbers (gated to non-production environments) |
| **`prefers-reduced-motion`** | Honoured globally in CSS — animations respect user accessibility preferences |

A comprehensive three-batch security audit was conducted on 2026-04-23, addressing every finding from parallel security, code-quality, and frontend audits. 202 tests passing across 44 files. TypeScript strict mode, zero errors. ESLint, zero errors.

---

## 13. Deployment & Operations

### Production

- **Live URL** — `https://ohcs.pages.dev` (target: `https://ohcs.gov.gh` post-DNS cutover)
- **Health check** — `GET /api/health` returns `{ status, checks: { d1, r2, workers_ai } }`
- **D1** — `ohcs-recruitment` (region WEUR), id `f2683715-2426-43d9-bb7c-885d9e64648d`
- **R2** — `ohcs-recruitment-uploads` (private, 7-year auto-delete lifecycle policy)
- **Workers AI** — implicit binding `AI`

### Deploy Commands

```bash
# Production deploy
cd ohcs-website
npm run pages:deploy

# D1 migrations
npm run migrate:remote

# Local development
npm run pages:dev    # Wrangler edge runtime emulation
npm run dev          # Next.js dev server (no Pages Functions)

# Tests
npm test -- --run

# Type check
npx tsc --noEmit
```

### Secrets (set via `wrangler pages secret put`)

| Secret | Purpose |
|---|---|
| `RESEND_API_KEY` | Magic link + notification email transport |
| `HUBTEL_SMS_API_KEY` | SMS transport (optional in dev) |
| `HUBTEL_SMS_FROM` | SMS sender ID |
| `SYSTEM_CRON_SECRET` | HMAC signing key for admin signed URLs + Bearer auth for the daily cron |

### CI / CD

- Cloudflare Pages auto-deploys from every push to `master`
- GitHub Actions cron at `.github/workflows/cron-deadlines.yml` fires daily at 02:15 UTC

---

## 14. Roadmap

### Phase 1 — Foundation (Completed)

- Cloudflare infrastructure: D1, R2, Workers AI, Resend, health check
- Public marketing site: 22+ pages, Lexi assistant, publications library
- Admin shell: News, Events, Publications, Leadership, Submissions, Users, Audit Log, Lexi Training Hub
- Recruitment Phases 0–3.5: master document library, exercise configuration, magic-link auth, 5-step wizard, uploads, submission, /track lookup
- Recruitment Sub-project A: reviewer pipeline, vetting, AI document verification, appeals queue, status-transition audit trail, daily cron
- Comprehensive three-batch security audit (token hashing, HMAC hardening, rate limiting, HTML escaping, appeals SQL fix, audit-trail completeness, accessibility polish, mobile responsive)

### Phase 2 — Operationalisation (Q2 2026)

- DNS cutover from `ohcs.pages.dev` to `ohcs.gov.gh`
- Resend or MailChannels with verified `ohcs.gov.gh` sender (DKIM + SPF)
- Real admin authentication (Cloudflare Access SSO recommended)
- Hubtel SMS production account
- First operational recruitment exercise on the platform

### Phase 3 — Sub-project B: Online Payment (deferred per leadership)

- Hubtel MoMo and bank integration with GHS 100 cap
- Webhook-confirmed payment status transition
- Refund API for the conditional refund cases (withdraw after pay, OHCS cancels, system fault)
- Refunds never apply to failed exams — the policy is hard-coded

### Phase 4 — Sub-project C: Online Examination

- Admin question bank with multiple choice, short answer, and case study formats
- Server-enforced timer with auto-save
- Auto-grade against per-exercise pass mark
- Anti-fraud: browser focus tracking, paste blocking, randomised question order

### Phase 5 — Sub-project D: Online Interview

- Slot picker for the applicant
- Zoom or Microsoft Teams meeting auto-create (final platform decision in spec phase)
- Email + SMS interview-hour reminders
- Interviewer outcome capture: shortlisted, waitlisted, rejected
- Admin-promoted waitlist (no automatic shuffling)

### Phase 6 — Hardening, Observability, Launch

- Structured logging in JSON envelopes for Cloudflare Logs
- Production observability dashboards
- Per-directorate knowledge base population for Lexi
- Public launch announcement and the first national-scale recruitment exercise on the platform

---

> "A government website is the most-visited document the institution publishes.
> The OHCS Digital Portal is built to be a benchmark every other agency can be pointed to."

---

**Office of the Head of the Civil Service**
Republic of Ghana
*Loyalty · Excellence · Service*

Prepared by OHCS Product Engineering · April 2026

`https://ohcs.pages.dev` (production) · `https://ohcs.gov.gh` (target)
