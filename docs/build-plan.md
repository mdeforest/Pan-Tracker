# PanTracker — Phased Build Plan

Each phase is designed as one Claude Code session. Read the output of each phase, verify it works, then proceed.

---

## Context Management Strategy

Claude Code has a finite context window. These rules keep token usage efficient and prevent the model from losing track of the codebase as it grows.

### The Golden Rule: One Phase = One Session
Never continue a failed or wandering session. If Claude Code gets confused mid-phase, **start a fresh session** and paste the phase prompt again. A clean context is worth more than saving a few minutes.

### Branch Before You Build
The first thing Claude Code does in every session — before writing a single line — is check the current branch and create a feature branch if on `main`. This is specified in `CLAUDE.md` and every phase prompt below reinforces it. Don't skip it.

### What to Include at the Start of Every Session
Every phase prompt below already includes a "Read CLAUDE.md first" header. Follow it. CLAUDE.md is the project's memory — it tells Claude Code the architecture, conventions, and current status without loading the whole codebase.

Only load PRD sections that are relevant to the current phase. Each phase prompt specifies exactly which sections to read.

### Keep CLAUDE.md as the Single Source of Truth
After each phase, update `CLAUDE.md`:
- Check off the completed phase in the status checklist
- Add any new conventions or gotchas discovered
- Note any decisions that deviated from the PRD

Claude Code reads `CLAUDE.md` automatically at session start. A well-maintained `CLAUDE.md` means zero tokens re-explaining the project each session.

### File-Level Context Hints
Add a one-line comment at the top of complex files:
```typescript
// Pan entry service — business logic only. No HTTP objects. No auth checks.
```
Costs ~10 tokens per file, saves Claude Code from misplacing logic.

### Scope Each Prompt With "Stop Here"
Every phase prompt ends with "Stop here." This is intentional. Claude Code will drift into future phases if unconstrained — burning tokens on work you'll throw away later.

If Claude Code starts building Phase 5 UI during Phase 4 API work, interrupt it: *"Stop — I only need the API routes right now."*

### When Context Gets Long Mid-Session
If a session runs long, summarize progress and start fresh:

```
We were working on [phase]. Here's where we got to:
- ✅ Completed: [list what's done]
- 🔧 In progress: [the specific thing that's partially built]
- ❌ Not started: [rest of phase]

CLAUDE.md is up to date. Continue from "In progress" only.
```

### Debugging: Isolate Before Fixing
Don't ask Claude Code to "fix it" in the context of the whole codebase. Instead:

```
This specific function is broken: [paste the function]
This is the error: [paste the error]
Fix only this. Don't touch other files.
```

Narrow context = faster fix = fewer wasted tokens.

---

## Phase 1: Repo Scaffolding + Local Dev

**What gets built:** Next.js 14 project, TypeScript strict, Tailwind, shadcn/ui, Supabase client, folder structure, ESLint, working local dev.

**Dependencies:** None.

**Manual steps before running:**
1. Create a free Supabase project at supabase.com (~2 min)
2. Copy project URL and anon key into `.env.local`
3. Enable Google OAuth: Supabase Dashboard → Auth → Providers → Google
4. Create a Google OAuth app in Google Cloud Console; paste client ID/secret into Supabase

**Environment variables:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-side only — never expose to client
```

---

### Claude Code Prompt — Phase 1

```
Read CLAUDE.md first — it has the full architecture, conventions, and current build status.
Then read PRD Sections 1, 9, 12, and 14 only.
Do not read other files beyond what's needed for scaffolding.

I'm building PanTracker, a mobile-first web app for tracking beauty Project Pans. PRD is attached.

Phase 1: Repo Scaffolding

1. Initialize a Next.js 14 project (App Router) with TypeScript strict mode
2. Install and configure Tailwind CSS
3. Install and initialize shadcn/ui (new-york style, neutral base color)
4. Install Supabase JS client (@supabase/supabase-js, @supabase/ssr)
5. Create this folder structure:
   app/
     (auth)/login/         # login page (unauthenticated)
     auth/callback/        # OAuth callback
     (app)/                # authenticated layout with bottom nav
       pan/[year]/[month]/ # monthly pan view
       empties/            # empties log
       products/           # product library
         [id]/             # product detail
     api/                  # API route handlers
   components/
     ui/                   # shadcn/ui generated — do not edit manually
     pan/                  # pan-specific components
     products/             # product components
     empties/              # empty-related components
     shared/               # nav, bottom sheets, shared UI
   lib/
     supabase/
       client.ts           # browser client (createBrowserClient)
       server.ts           # server client (createServerClient + cookies)
       server-admin.ts     # service role client — API routes ONLY
     types/
       database.ts         # generated from supabase gen types
       app.ts              # app-level types and enums
     utils.ts
   supabase/
     migrations/           # SQL migration files

6. Set up root middleware.ts for Supabase session refresh
7. Create a bottom navigation component: Pan (home) / Empties / Products tabs
   - Fixed to bottom of screen
   - Uses env(safe-area-inset-bottom) for iPhone home indicator padding
   - Tap targets minimum 48px height
8. Create .env.local.example with all variables and a comment per line
9. Configure ESLint with @typescript-eslint/recommended and next/recommended
10. Write README with local setup instructions

Conventions:
- TypeScript strict — no `any`
- Browser Supabase client: createBrowserClient from @supabase/ssr
- Server Supabase client: createServerClient from @supabase/ssr with cookies()
- Never import server-admin.ts in components or pages

Stop after Phase 1. Show me the folder structure and confirm `npm run dev` starts without errors.
```

---

## Phase 2: Database Schema + Migrations

**What gets built:** All Supabase tables with RLS policies, Supabase CLI setup, migration files.

**Dependencies:** Phase 1 complete; Supabase project created.

**Manual steps:**
1. Install Supabase CLI: `npm install -g supabase`
2. `supabase login` and `supabase link --project-ref YOUR_PROJECT_REF`

---

### Claude Code Prompt — Phase 2

```
Read CLAUDE.md first. Then read PRD Section 8 (Data Model) only.
Do not read other files unless checking a type definition.

Continuing PanTracker — PRD attached.

Phase 2: Database Schema

Using the Supabase CLI, create migration files for the full data model from PRD Section 8.

Tables:
- users: id (uuid = auth.uid()), email, display_name, avatar_url, created_at
- products: id, user_id FK, name, brand, category (enum: makeup/skincare/fragrance/body/other), photo_url, deleted_at (soft delete), created_at
- monthly_pans: id, user_id FK, month (1–12), year, created_at; UNIQUE(user_id, month, year)
- pan_entries: id, pan_id FK, product_id FK, status (enum: active/empty/carried_over), progress_pct (0–100, default 0), notes, original_pan_id (nullable FK → monthly_pans, tracks first month), created_at; UNIQUE(pan_id, product_id)
- empties: id, pan_entry_id FK, user_id FK (denormalized), would_repurchase (enum: yes/no/maybe), rating (1–5, nullable), replacement_notes (nullable), notes (nullable), emptied_at

RLS policies on every table:
- SELECT: auth.uid() = user_id
- INSERT: auth.uid() = user_id
- UPDATE: auth.uid() = user_id
- DELETE: auth.uid() = user_id (use soft delete for products via deleted_at)

Also:
- Trigger: on auth.users INSERT → insert row into public.users (handle_new_user)
- Indexes: products(user_id), monthly_pans(user_id, year, month), pan_entries(pan_id), empties(user_id, emptied_at)

Run `supabase gen types typescript --linked > lib/types/database.ts` to generate types.

Run `supabase db push` and confirm all migrations apply cleanly. Stop here.
```

---

## Phase 3: Auth Flow

**What gets built:** Google OAuth login page, protected route middleware, authenticated shell layout.

**Dependencies:** Phase 2 complete.

---

### Claude Code Prompt — Phase 3

```
Read CLAUDE.md first. Then read PRD Sections 7 (routes) and 11 (auth) only.

Continuing PanTracker — PRD attached.

Phase 3: Authentication

1. Login page (app/(auth)/login/page.tsx):
   - Centered card layout, clean and minimal
   - "Sign in with Google" button (full width, shadcn Button)
   - Calls supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })
   - If already logged in, redirect to /pan/[currentYear]/[currentMonth]

2. Auth callback (app/auth/callback/route.ts):
   - Exchange OAuth code for session via supabase.auth.exchangeCodeForSession()
   - On success → redirect to /pan/[currentYear]/[currentMonth]
   - On error → redirect to /login?error=auth_failed

3. Root middleware.ts:
   - Refresh session on every request
   - Unauthenticated requests to /(app)/ routes → redirect to /login
   - /(auth)/ routes pass through unauthenticated

4. Authenticated layout (app/(app)/layout.tsx):
   - Fetches current user server-side
   - Renders bottom navigation
   - Shows user avatar in top-right corner with a sign-out option on tap

5. Sign-out: calls supabase.auth.signOut(), redirects to /login

Verify the full flow: / → /login → Google OAuth → /pan/current-month. Sign out → /login. Stop here.
```

---

## Phase 4: Core API Routes

**What gets built:** All API routes from PRD Section 10, fully typed and auth-checked.

**Dependencies:** Phase 3 complete.

---

### Claude Code Prompt — Phase 4

```
Read CLAUDE.md first. Then read PRD Sections 8 (data model) and 10 (API contracts) only.
Only open source files to check type definitions.

Continuing PanTracker — PRD attached.

Phase 4: Core API Routes

Build all API routes from PRD Section 10 using Next.js App Router route handlers.

For every route:
- Validate auth via createServerClient + getUser() — return 401 if unauthenticated
- Use Zod for request body validation — return 400 with field errors on failure
- Return { data, error } envelope on all responses
- Use server-admin.ts (service role) only for carry-over (multi-row atomic operation)

Routes:
1. GET /api/products — list with ?q and ?category filters
2. POST /api/products — create product
3. PATCH /api/products/[id] — update (verify ownership)
4. DELETE /api/products/[id] — soft delete (set deleted_at)
5. GET /api/pans/[year]/[month] — fetch pan + all entries + product details (JOIN). Upsert pan if not exists.
6. POST /api/pans/[year]/[month]/carry-over — body: { product_ids: string[] }. For each: create pan_entry in target month with status=active, preserving original_pan_id from source (or using source pan_id if null).
7. POST /api/pans/[year]/[month]/entries — add product to pan
8. PATCH /api/pans/[year]/[month]/entries/[id] — update progress_pct, notes, or status
9. GET /api/empties — list with ?year, ?month, ?category filters
10. POST /api/empties — create empty record AND set pan_entry status to 'empty' (atomic)
11. POST /api/upload/product-photo — FormData with file field; validate type (jpg/png/webp) and size (max 5MB); upload to Supabase Storage bucket 'product-photos'; return { data: { url } }
12. GET /api/health — returns { status: 'ok', ts: new Date().toISOString() }

Verify /api/health returns 200. Test one or two routes with curl. Stop here.
```

---

## Phase 5: UI — Monthly Pan View

**What gets built:** The core screen Sophia uses every day.

**Dependencies:** Phase 4 complete.

---

### Claude Code Prompt — Phase 5

```
Read CLAUDE.md first. Then read PRD Sections 6.1, 6.2, 6.4, and 7 only.
Only open existing source files to check types or API shapes.

Continuing PanTracker — PRD attached.

Phase 5: Monthly Pan View

Build the main pan screen at app/(app)/pan/[year]/[month]/page.tsx.

MOBILE-FIRST REQUIREMENTS (this app lives on a phone — enforce these strictly):
- Design baseline: 390px viewport. No horizontal scroll anywhere.
- All tap targets minimum 44×44px — cards, buttons, nav items, close buttons.
- Bottom sheet pattern for all detail/form views — NOT centered modals. Sheets slide up from the bottom, are dismissible via swipe-down or backdrop tap, prevent background scroll.
- Progress control: large touch-friendly slider, not a tiny number input.
- No hover-only interactions — every element must work on touch.
- Safe area: bottom nav and any fixed-bottom buttons must use padding-bottom: env(safe-area-inset-bottom) for iPhone home indicator.
- Input font size: minimum 16px on all inputs and textareas to prevent iOS auto-zoom.
- FAB placement: fixed bottom-right, above bottom nav, with correct safe-area padding.

Layout:
- Top bar: "< February 2026 >" with 44px arrow buttons; month name centered
- FAB (Add Product) fixed bottom-right
- Products grouped by category; skip empty categories
- Each product card (full width, tappable):
  - 48px circular photo or category-colored placeholder initial
  - Product name (16px, bold) + brand (14px, muted)
  - Progress bar (color: green >75%, amber 30–75%, red <30%)
  - Progress % label
  - "X months in pan" badge if original_pan_id is set
  - Empty products: muted opacity + strikethrough on name

Product detail bottom sheet (tap card to open):
- Drag handle at top (visual indicator)
- Photo, name, brand
- Large progress slider (thumb 28px) with live % label
- Notes textarea (16px font)
- "Mark Empty" — full-width prominent button
- "Remove from pan" — small red text link at bottom

Add Product bottom sheet (tap FAB):
- Search input autofocused (16px font)
- Results: full-width rows, 48px min height each
- "Create new product" sticky row at bottom of results
- New product form: name, brand, category select, photo upload

Empty Logger bottom sheet (from "Mark Empty"):
- Would Repurchase: full-width 3-option segmented control (Yes / No / Maybe)
- Rating: large tappable 5-star row (optional)
- Replacement Notes: text input (16px)
- Notes: textarea (16px)
- "Log Empty" — full-width button pinned to bottom with safe-area padding

After logging empty:
- Card gets "EMPTY ✓" badge overlay
- canvas-confetti celebration (install the package)

Carry-over banner (shown on past months with unfinished products):
- Sticky banner above product list
- Opens bottom sheet with checklist + confirm

Loading: skeleton cards. Errors: shadcn toast.

Stop here. Verify the pan screen in a 390px Chrome DevTools viewport with bottom sheet interaction working.
```

---

## Phase 6: UI — Empties Log + Product Library

**What gets built:** Empties history and product library screens.

**Dependencies:** Phase 5 complete.

---

### Claude Code Prompt — Phase 6

```
Read CLAUDE.md first. Then read PRD Sections 6.3 and 7 only.
Only open source files to check shared components or types.

Continuing PanTracker — PRD attached.

Phase 6: Empties Log + Product Library

Apply the same mobile-first rules from Phase 5:
- All tap targets ≥ 44px
- 16px min font on all inputs
- Bottom sheets not modals
- Safe area insets on fixed bottom elements
- No hover-only interactions

--- Empties Screen (app/(app)/empties/page.tsx) ---
- Sticky filter bar: horizontal-scrollable month/year chips + category chips (no line wrap)
- Empty state: "Nothing finished yet — keep going! 💪"
- Full-width empty cards sorted newest first:
  - 40px circular photo + name + brand + category chip
  - Would Repurchase badge (green=Yes, red=No, gray=Maybe) — prominent placement
  - Star display if rated
  - Month/year emptied
  - Replacement notes (small italic, if present)
  - Tap to expand full notes inline (accordion, not a sheet)

--- Product Library (app/(app)/products/page.tsx) ---
- Sticky search bar (autofocus on tap, 16px font)
- Horizontal-scroll category filter chips below search
- 2-column grid: circular photo, name, brand, status chip (In Pan / Not In Pan)
- Add New Product FAB (fixed bottom-right, above bottom nav, safe-area padding)
- Empty state: "No products yet — add your first one!"

--- Product Detail (app/(app)/products/[id]/page.tsx) ---
- Full-width photo header (max 280px height, object-cover, gradient overlay)
- Name + brand + category chip over/under photo
- Edit button (top right)
- "Add to Current Pan" — full-width button (if not in this month's pan)
- Pan History: vertical timeline, each entry shows month + final progress + status
- Empty Record (if applicable): repurchase badge, stars, notes, replacement

Stop here. Show me both screens in a 390px viewport.
```

---

## Phase 7: Hardening + Deployment + PWA

**What gets built:** Security hardening, GitHub Actions CI, Vercel production deploy, PWA manifest for phone home screen install.

**Dependencies:** Phase 6 complete; GitHub repo created.

**Manual steps before this phase:**
1. Push to GitHub
2. Create a separate Supabase "production" project; run `supabase db push` against it
3. Connect Vercel to the GitHub repo (vercel.com → New Project)
4. Add production env vars in Vercel dashboard

---

### Claude Code Prompt — Phase 7

```
Read CLAUDE.md first. Then read PRD Sections 12, 13, and 14 only.

Continuing PanTracker — PRD attached.

Phase 7: Hardening + Deployment + PWA

1. Security headers in next.config.js:
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin
   - Content-Security-Policy: allow self, Supabase domain, Google OAuth domain

2. Error handling:
   - app/error.tsx (global error boundary with "Something went wrong" + retry button)
   - app/not-found.tsx (friendly 404)

3. Input validation audit:
   - All Zod schemas: add .trim() to strings, max length limits (name: 200, brand: 100, notes: 2000)
   - Verify all product photo uploads reject non-image MIME types server-side

4. Image optimization:
   - Add Supabase storage domain to next.config.js images.remotePatterns
   - All product photos rendered with Next/Image and appropriate sizes prop

5. PWA (so Sophia can install the app on her phone home screen):
   - Add app/manifest.json: name "PanTracker", short_name "PanTracker", display: "standalone", start_url: "/", theme_color matching app primary
   - Add 192px and 512px app icons (simple SVG — a palette or lipstick shape works)
   - Add <link rel="manifest">, <meta name="theme-color">, and <link rel="apple-touch-icon"> to root layout
   - Test: Chrome DevTools → Application → Manifest should show no errors

6. GitHub Actions CI (.github/workflows/ci.yml):
   - Trigger: pull_request to main
   - Steps: checkout, Node 20 setup, npm ci, tsc --noEmit, eslint, next build
   - Fail PR on any error

7. Supabase Storage migration:
   - Migration for 'product-photos' bucket
   - Storage policy: authenticated users can only upload to paths starting with their auth.uid()

8. Update README:
   - "Install on your phone": visit URL in Safari → Share → Add to Home Screen
   - Production deployment steps
   - How to run migrations against production

Show me security headers in curl -I output, Lighthouse PWA score ≥ 90, and CI passing on a test PR. Stop here.
```
