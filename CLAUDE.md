# CLAUDE.md — Project Pan Tracker

This file is read automatically by Claude Code. Keep it updated as the project evolves.

## Project Overview

Project Pan Tracker is a Next.js 14 web app for beauty enthusiasts tracking "project pans" — the challenge of finishing up products before buying new ones. Users manage an active pan of products, set monthly focus picks, log empties with reviews, and see carry-overs automatically. Designed for Sophia (@sophiaprojectpans) but supports multiple users via Google OAuth.

## Architecture

- **Frontend:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers (no separate API server)
- **Database:** Supabase (PostgreSQL); native SQL migrations via Supabase CLI; typed via `lib/types/database.ts`
- **Auth:** Supabase Auth with Google OAuth provider (via @supabase/ssr); session in cookies managed by middleware
- **File Storage:** Supabase Storage (product photos)
- **Hosting:** Vercel (Hobby or Pro)

## Key Commands

```bash
npm run dev           # Start local dev server (localhost:3000)
npm run build         # next build
npm run lint          # ESLint
npx tsc --noEmit      # Typecheck without emitting
npx supabase db push --db-url "$DIRECT_URL"          # Apply pending migrations to remote DB
npx supabase gen types typescript --linked > lib/types/database.ts  # Regenerate DB types
```

## Folder Structure

```
app/
  api/              # Route handlers — thin, delegate to lib/services/
    auth/           # NextAuth handler
    products/       # Product CRUD + photo upload
    pan/            # Pan entry management
    picks/          # Monthly picks + carry-over
    empties/        # Empty logging
    health/         # Health check
  (auth)/
    login/          # Login page (unauthenticated)
  (app)/            # Authenticated layout with nav
    pan/            # Active pan dashboard
    pan/picks/      # Monthly picks view
    empties/        # Empties log
    products/       # Product library
  error.tsx         # Global error boundary
  not-found.tsx     # 404 page

lib/
  auth.ts           # NextAuth config + getRequiredSession()
  prisma.ts         # Prisma client singleton
  supabase.ts       # Supabase client (storage)
  services/         # Business logic — all DB queries live here
    products.ts
    pan.ts
    picks.ts
    empties.ts
    storage.ts      # Supabase Storage upload helper
  validations/      # Zod schemas matching API contracts

components/
  ui/               # shadcn/ui components (auto-generated)
  pan/              # PanCard, AddToPanModal, UsageLevelSelector
  picks/            # PicksGrid, SetPicksModal
  empties/          # EmptyCard, LogEmptyModal
  products/         # ProductCard, ProductForm

prisma/
  schema.prisma
  seed.ts
  migrations/

supabase/
  rls.sql           # RLS policy definitions (documentation + re-runnable)

docs/
  deploy-checklist.md
  runbook.md
```

## Git Branching (Claude Code must follow this every session)

At the start of every session, before writing any code:
1. Check the current branch: `git branch --show-current`
2. If on `main`, create and switch to the correct feature branch: `git checkout -b feat/phase-N-short-description`
3. Never commit directly to `main`

Branch naming:
- `feat/phase-1-scaffolding`, `feat/phase-2-schema`, `feat/phase-5-pan-ui`, etc.
- `fix/short-description` for bug fixes
- `chore/short-description` for non-feature work (deps, config, docs)

Commit behavior during a session:
- Commit at logical checkpoints — after each major unit of work, not just at the end
- Commit message format: `type(scope): short description` — e.g. `feat(pan): add product detail bottom sheet`, `fix(auth): handle missing session cookie`
- Never bundle unrelated changes in one commit

At the end of every session:
1. Run `npm run lint` and `npx tsc --noEmit` — fix any errors before committing
2. Commit all changes on the feature branch
3. Open a PR to `main` (or note that one should be opened — don't merge without CI passing)
4. Update the Current Status section of this file

## Doc Management (Claude Code must follow this every session)

At the end of every session, before finishing:

**Always update this file (CLAUDE.md):**
- Check off completed phases in the Current Status section
- Add any new conventions discovered (e.g. "all bottom sheets use the BottomSheet component in components/shared/")
- Add any deviations from the PRD (e.g. "used X instead of Y because Z")
- Update Key Commands if new scripts were added

**Update docs/prd.md if:**
- A feature was built differently than specced — update the relevant section to match reality
- A data model field was added, removed, or renamed
- An API contract changed (method, path, request/response shape)

**Update docs/build-plan.md if:**
- A phase took a different approach than the prompt described — add a note under that phase
- A phase is fully complete — add a ✅ and the completion date

**Never leave CLAUDE.md stale.** It's the only file Claude Code reads automatically. If it doesn't reflect reality, every future session starts with wrong assumptions.

## Context Management (Claude Code Sessions)

Each build phase is one Claude Code session. Every phase prompt starts with "Read CLAUDE.md first" — do this before reading anything else.

**Only load what the phase needs.** Each phase prompt specifies exactly which PRD sections are relevant. Don't read the whole PRD; don't load files that aren't being touched.

**After each phase:** update the Current Status checklist below, and add any new conventions or surprises discovered. This file is the project memory — keep it current.

**If a session goes sideways:** start a fresh session, paste the phase prompt again. Clean context beats trying to rescue a confused session.

## Mobile-First Rules (enforce on every UI component)

This app is used on a phone. These rules are non-negotiable:

- **390px baseline** — design and test at 390px. No horizontal scroll.
- **Touch targets ≥ 44×44px** — cards, buttons, close icons, nav items, everything.
- **Bottom sheets, not modals** — all detail views and forms slide up from the bottom. Swipe-to-dismiss or backdrop tap to close. Prevent background scroll while open.
- **16px minimum font on all inputs/textareas** — prevents iOS Safari auto-zoom on focus.
- **Safe area insets** — bottom nav and any `position: fixed` bottom elements must use `padding-bottom: env(safe-area-inset-bottom)`.
- **FABs above bottom nav** — floating action buttons are fixed bottom-right, layered above the nav, with safe-area padding.
- **No hover-only states** — every interaction must work by tap alone.



- **TypeScript:** strict mode — no `any`, no non-null assertions without comment explaining why
- **Errors:** route handlers return `{ data: null, error: string }` on failure; use appropriate HTTP status codes
- **DB queries:** only in `lib/services/` — never in route handlers or components
- **Logging:** `console.error` for errors with context (route, user_id); never log tokens, passwords, or photo URLs
- **Secrets:** always from `process.env` — never hardcoded, never logged
- **Forms:** react-hook-form + Zod validation; Zod schemas must match API validation schemas
- **Styling:** Tailwind utility classes only — no inline styles, no CSS modules

## Data Model Summary

- `users` — Google OAuth users (auto-created on first sign-in)
- `products` — user's product library (brand, name, category, photo_url)
- `pan_entries` — products currently being tracked (status: active/empty/paused, usage_level)
- `monthly_picks` — which pan entries are focus picks for a given month/year
- `empties` — completed products with review (rating, would_repurchase, review_notes)

Key constraint: UNIQUE (user_id, product_id) WHERE pan_entries.status = 'active' — a product can only appear once in the active pan.

## Auth Pattern

Every server component and route handler that needs the current user calls:
```typescript
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect("/login")
const userId = user.id
```

All service functions take `userId` as their first argument and filter all queries by it.

Middleware at `middleware.ts` handles session refresh and redirects unauthenticated users to `/login`.

## Environment Variables

See `.env.local.example` for full list with descriptions. Never commit `.env.local`.

Required: DATABASE_URL, DIRECT_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

Note: NEXTAUTH_URL and NEXTAUTH_SECRET are in .env.local.example for reference but are NOT used — auth is handled by Supabase, not NextAuth.

## What NOT to Do

- Do not put DB queries in route handlers or components — use the service layer
- Do not hardcode user IDs, product IDs, or any data — always derive from session or params
- Do not skip the `userId` ownership check when fetching or mutating records
- Do not use `any` types — define proper interfaces in `types/` if needed
- Do not commit secrets or `.env.local`
- Do not add a new dependency without updating this file and the PRD tech stack section

## Current Status

- ✅ **Phase 1 — Scaffolding** (2026-03-06): Next.js 14 initialized, Tailwind + shadcn/ui configured, Supabase SSR clients created, middleware wired, folder structure in place, bottom nav built, ESLint + TS strict passing, `npm run dev` starts clean.
- ✅ **Phase 2 — Database Schema** (2026-03-06): Migration SQL written (`supabase/migrations/20260306000000_initial_schema.sql`), `supabase/config.toml` initialized, TypeScript types hand-written to `lib/types/database.ts`. **Pending:** `supabase db push` — requires DB password in `.env.local` (replace `[YOUR-PASSWORD]`) then run `npx supabase db push --db-url $DIRECT_URL`.

## Phase 2 Deviations & Notes

- **No Prisma:** Architecture section referenced Prisma ORM but Phase 2 used Supabase native SQL migrations. Prisma is not installed. All DB access uses the typed Supabase client with the `Database` type from `lib/types/database.ts`. Key Commands updated accordingly.
- **Types hand-written vs. generated:** `supabase gen types typescript --linked` requires CLI auth. Types were written manually to match the migration. After running `supabase db push`, regenerate with: `npx supabase gen types typescript --linked > lib/types/database.ts`.
- **Phase prompt schema vs PRD:** Phase 2 prompt described a `monthly_pans` table. PRD Section 8 and CLAUDE.md Data Model Summary use a flat `pan_entries` table with `started_month`/`started_year`. Implemented PRD schema as authoritative.
- **`supabase db push` pending:** `.env.local` has `[YOUR-PASSWORD]` placeholder. To apply migrations: fill in the real DB password, then run `npx supabase db push --db-url "$DIRECT_URL"`.

## Phase 1 Deviations & Notes

- **shadcn/ui style:** Latest shadcn CLI no longer supports `--style new-york`. Default is "base-nova" with neutral base color (the modern equivalent). Can be changed later in `components.json`.
- **Auth:** Phase 1 prompt specified Supabase Auth (`@supabase/ssr`) rather than NextAuth.js v5. Architecture section updated to reflect this. `lib/supabase/` has three clients: `client.ts` (browser), `server.ts` (server), `server-admin.ts` (API routes only).
- **Pan route:** Uses `/pan/[year]/[month]` URL structure (from phase prompt) rather than just `/pan` (from PRD). Root page redirects to current month.
- **Bottom nav:** 3 tabs — Pan / Empties / Products. Built as `components/shared/BottomNav.tsx` with `env(safe-area-inset-bottom)` padding and `aria-current="page"` on active tab.
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`:** Added to `.env.local.example` (was missing from PRD env variable list).
