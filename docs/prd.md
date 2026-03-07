# Project Pan Tracker — Product Requirements Document

## 1. Executive Summary

Project Pan Tracker is a personal web app for beauty enthusiasts who participate in "Project Pan" — a challenge to fully use up makeup and skincare products before buying replacements. The app lets users manage their active pan, set monthly focus picks, log empties with reviews, and track carry-overs month to month. Designed first for Sophia (@sophiaprojectpans) but architected to support multiple users. The UI must be dead-simple — Sophia is not technical, and login should be one tap.

---

## 2. Problem Statement

Project Pan participants currently track everything mentally, in spreadsheets, or across scattered notes. There is no dedicated tool that mirrors the natural monthly rhythm: picking products at month start, updating progress, logging empties at month end, and carrying unfinished products forward. Without a structured tracker, users lose history, forget carry-overs, and can't reference their empties log to inform future purchases.

---

## 3. Goals & Success Criteria

**v1 Launch Goals:**
- Sophia logs in with Google in one tap and lands on her active pan dashboard
- She can add a product with a photo, log progress, and mark it empty — all from her phone browser
- Monthly picks set at month start; unfinished ones carry over automatically
- Empties log is browsable and filterable by month, category, and rating

**Key Metrics:**
- Log an empty: < 2 minutes
- Set monthly picks: < 5 minutes
- Zero data loss on carry-overs

**Non-Goals for v1:** native mobile app, social/public profiles, barcode scanning, AI recommendations, push notifications, export to CSV/PDF

---

## 4. User Personas

**Sophia (Primary):** Beauty content creator tracking 10–30 products across makeup and skincare. Not technically savvy — phone-first, needs obvious UI. Creates monthly TikTok recaps of empties and picks. Failure modes: forgetting monthly commitments, losing empties history.

**Future General User:** Any project panner who discovers the app. Same core workflow, potentially different categories (haircare, bodycare, fragrance).

---

## 5. User Stories

**Auth**
- As a user, I want to sign in with Google so I don't need a password. AC: OAuth completes; session persists across browser sessions.

**Products**
- As a user, I want to add a product (brand, name, category, photo) to my library. AC: Product saved; photo uploaded; category from predefined list.
- As a user, I want to edit or delete a product. AC: Edits persist; delete archives if referenced by pan entries.

**Active Pan**
- As a user, I want to add a product to my active pan. AC: Entry created with status `active`; start month/year set to current month.
- As a user, I want to update a product's usage level. AC: Usage level (Just Started / 25% / Half / 75% / Almost Done) selectable.
- As a user, I want to mark a product as empty. AC: Status → `empty`; empty log modal opens.

**Monthly Picks**
- As a user, I want to designate up to 10 products as picks for the current month. AC: Only active pan entries can be picked.
- As a user, I want a focused view of my current month's picks. AC: Shows only picked entries with progress indicators.
- As a user, I want unfinished picks to carry over to next month. AC: Active picks from prior month appear with "Carry-over" badge.

**Empties Log**
- As a user, I want to log an empty with rating, repurchase flag, notes, and optional replacement. AC: Saved with finished month/year, rating 1–5, would_repurchase, free-text notes.
- As a user, I want to browse empties with filters. AC: Filter by month, category, rating, repurchase flag.

---

## 6. Feature Specification

### Feature 1: Active Pan Dashboard
Main screen. Grid of all products in the pan with usage level and status.
- Mobile-first: 2-col on phone, 3-col on tablet/desktop
- Each card: photo (category emoji fallback), brand + name, usage progress bar, monthly pick badge
- Tap entry → detail drawer: update usage level, add note, mark as empty
- FAB to add new product to pan
- Business rules: one active entry per product per user; usage defaults to "Just Started"
- Edge cases: photo fail → save without photo; 50+ items → paginate at 24

### Feature 2: Monthly Picks
Focused view of the month's selected products.
- If no picks set, prompted to select from active pan (checklist modal, max 10)
- Carry-overs from prior month shown with "Carried Over" badge
- Month selector at top; past months read-only
- Picks editable any time during month; max 10; product emptied → auto-removed from picks

### Feature 3: Log Empty
Review flow when a product is marked finished.
- Modal: confirm product, then rate (1–5 stars), would repurchase (yes/no/maybe), notes, optional replacement (search library or free text)
- Finished month/year auto-set to current month
- Confetti on submit
- Empty entries immutable after saving (⚠️ Assumption — add edit flow in v1.1 if needed)

### Feature 4: Empties Log
Historical archive of all finished products.
- Reverse-chronological list
- Filter by month, category, rating, repurchase flag
- Tap entry to expand full review

---

## 7. Information Architecture

| Route | Description |
|---|---|
| `/` | Redirect to `/pan` if authed, else `/login` |
| `/login` | Google OAuth sign-in |
| `/pan` | Active pan dashboard |
| `/pan/picks` | Monthly picks view |
| `/empties` | Empties log |
| `/products` | Product library |
| `/products/new` | Add product |
| `/products/[id]/edit` | Edit product |

Navigation: bottom nav bar on mobile (Pan, Picks, Empties, Products); sidebar on desktop.

---

## 8. Data Model

### users
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text NOT NULL UNIQUE | |
| name | text | |
| avatar_url | text | From Google |
| google_id | text NOT NULL UNIQUE | |
| created_at | timestamptz DEFAULT now() | |

### products
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users NOT NULL | |
| brand | text NOT NULL | |
| name | text NOT NULL | |
| category | text NOT NULL | makeup, skincare, haircare, bodycare, fragrance, tools, other |
| photo_url | text | Supabase Storage URL |
| notes | text | |
| archived_at | timestamptz | null = active |
| created_at | timestamptz DEFAULT now() | |

Index: (user_id, archived_at)

### pan_entries
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users NOT NULL | |
| product_id | uuid FK products NOT NULL | |
| status | text DEFAULT 'active' | active, empty, paused |
| usage_level | text DEFAULT 'just_started' | just_started, quarter, half, three_quarters, almost_done |
| started_month | integer NOT NULL | 1-12 |
| started_year | integer NOT NULL | |
| notes | text | |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

Constraint: UNIQUE (user_id, product_id) WHERE status = 'active'

### monthly_picks
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users NOT NULL | |
| pan_entry_id | uuid FK pan_entries NOT NULL | |
| month | integer NOT NULL | |
| year | integer NOT NULL | |
| carried_over_from_month | integer | null if originally picked this month |
| carried_over_from_year | integer | |
| created_at | timestamptz DEFAULT now() | |

Index: (user_id, month, year) | Constraint: UNIQUE (user_id, pan_entry_id, month, year)

### empties
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK users NOT NULL | |
| pan_entry_id | uuid FK pan_entries NOT NULL | |
| product_id | uuid FK products NOT NULL | Denormalized |
| finished_month | integer NOT NULL | |
| finished_year | integer NOT NULL | |
| rating | integer | 1-5, nullable |
| would_repurchase | text | yes, no, maybe, nullable |
| review_notes | text | |
| replacement_product_id | uuid FK products | nullable |
| replacement_free_text | text | nullable |
| created_at | timestamptz DEFAULT now() | |

Index: (user_id, finished_year, finished_month DESC)

---

## 9. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript strict | Full-stack one repo; server components for fast mobile load; trivial Vercel deploy |
| Styling | Tailwind CSS + shadcn/ui | Fast to build; accessible components; mobile defaults |
| Database | Supabase (PostgreSQL) | Free tier: 500MB DB + 1GB storage; RLS included |
| ORM | Prisma | Type-safe queries; migration tooling |
| Auth | NextAuth.js v5 + Google provider | One-tap Google login; httpOnly cookie session |
| File Storage | Supabase Storage | Co-located with DB; free tier |
| Hosting | Vercel Hobby | Free for personal apps; zero-config Next.js |

Estimated monthly cost: $0 (Vercel Hobby + Supabase free tier)

> Assumption: Supabase free tier pauses after 1 week inactivity. Swap to Neon (free, no pausing) if disruptive.

---

## 10. API Contracts

All Next.js App Router Route Handlers under /app/api/. Auth required on all routes.
Response envelope: { data: T | null, error: string | FieldError[] | null }

**Products:** GET /api/products | POST /api/products { brand, name, category, notes? } | PATCH /api/products/[id] | DELETE /api/products/[id] | POST /api/products/[id]/photo (multipart, max 5MB, jpeg/png/webp)

**Pan Entries:** GET /api/pan?status=active | POST /api/pan { product_id } -> 409 on duplicate | PATCH /api/pan/[id] { usage_level?, notes?, status? }

**Monthly Picks:** GET /api/picks?month&year | POST /api/picks { pan_entry_ids[], month, year } -> 422 if >10 | DELETE /api/picks/[id] | POST /api/picks/carry-over { from_month, from_year, to_month, to_year }

**Empties:** GET /api/empties?month&year&category&rating&would_repurchase | POST /api/empties { pan_entry_id, rating?, would_repurchase?, review_notes?, replacement_product_id?, replacement_free_text? } — side effect: sets pan_entry status to 'empty'

**Health:** GET /api/health -> { status: "ok", db: "ok" }

---

## 11. Authentication & Authorization

- Google OAuth via NextAuth.js v5; JWT in httpOnly cookie; 30-day expiry
- First login auto-creates user record from Google profile
- Single user role; all data scoped to user_id at app layer + Supabase RLS as defense-in-depth
- Sign-out clears session cookie

---

## 12. Infrastructure & Deployment

Required environment variables:
```
DATABASE_URL            # Supabase pooled connection string
DIRECT_URL              # Supabase direct URL (for migrations)
NEXTAUTH_URL            # https://your-app.vercel.app
NEXTAUTH_SECRET         # openssl rand -base64 32
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Deployment: push to main -> Vercel auto-deploys. prisma migrate deploy runs as Vercel build step. Secrets in Vercel Environment Variables.

GitHub Actions CI (on PR): npm ci, npx tsc --noEmit, npm run lint, npx prisma validate

---

## 13. Observability

- Structured console.log to Vercel Function Logs (v1); add Sentry in v1.1
- GET /api/health confirms DB reachable via Prisma ping
- Vercel Analytics (free) for page views

---

## 14. Non-Functional Requirements

**Performance**
- FCP < 2s on 4G mobile via server components + Next.js image optimization
- All product photos served via Supabase CDN with width transform params; rendered with Next/Image

**Mobile-First (primary design constraint — this is a phone app)**
- Design baseline: 390px viewport (iPhone 14 Pro). No horizontal scroll anywhere.
- All touch targets: minimum 44×44px — cards, buttons, sliders, nav items, close controls.
- All modals replaced with **bottom sheets**: slide up from bottom, swipe-to-dismiss or backdrop tap, prevent background scroll while open.
- Input/textarea font size: minimum **16px** everywhere to prevent iOS Safari auto-zoom on focus.
- Safe area insets: bottom nav and all fixed-bottom buttons must apply `env(safe-area-inset-bottom)` padding for iPhone home indicator.
- FABs: fixed bottom-right, layered above bottom nav, with correct safe-area padding.
- **No hover-only interactions** — every interactive state must be reachable by tap.
- PWA manifest + apple-touch-icon so the app can be added to the iOS home screen and launched full-screen (no browser chrome).

**Accessibility**
- WCAG 2.1 AA; shadcn/ui components are accessible by default
- All icon-only buttons have `aria-label`
- Bottom nav items have `aria-current="page"` on the active tab

**Security**
- CSRF via NextAuth session cookie; Supabase RLS as defense-in-depth; Prisma parameterized queries
- File uploads: type and size validated server-side (reject non image/jpeg, image/png, image/webp; max 5MB)
- No user-supplied HTML rendered raw

---

## 15. Edge Cases & Error Handling

| Scenario | Handling |
|---|---|
| Google OAuth fails | Error page with retry |
| Photo > 5MB | Client-side check before upload |
| Duplicate active pan entry | 409 -> toast: "Already in your pan" |
| Empty marked while monthly pick | Pick auto-removed |
| Carry-over creates duplicate | Upsert - silently idempotent |
| Network error during empty submit | Optimistic rollback + retry toast |
| Supabase Storage unavailable | Product saves without photo; retry shown |

---

## 16. Future Considerations (Post-v1)

- Public profiles: shareable /u/sophia URL with public empties log
- Stats dashboard: empties/month chart, category breakdown, repurchase rate
- Barcode scanning via Open Beauty Facts API
- Monthly email digest of carry-overs
- Shareable monthly recap image for TikTok content
- Technical debt accepted in v1: no E2E tests; preview deployments share production DB
