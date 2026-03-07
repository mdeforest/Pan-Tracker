# CLAUDE.md — Project Pan Tracker

This file is read automatically by Claude Code. Keep it updated as the project evolves.

## Project Overview

Project Pan Tracker is a Next.js 14 web app for beauty enthusiasts tracking "project pans" — the challenge of finishing up products before buying new ones. Users manage an active pan of products, set monthly focus picks, log empties with reviews, and see carry-overs automatically. Designed for Sophia (@sophiaprojectpans) but supports multiple users via Google OAuth.

## Architecture

- **Frontend:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Route Handlers (no separate API server)
- **Database:** Supabase (PostgreSQL) via Prisma ORM
- **Auth:** NextAuth.js v5 (Auth.js) with Google OAuth provider; JWT in httpOnly cookie
- **File Storage:** Supabase Storage (product photos)
- **Hosting:** Vercel (Hobby or Pro)

## Key Commands

```bash
npm run dev           # Start local dev server (localhost:3000)
npm run build         # prisma generate + next build
npm run lint          # ESLint
npx tsc --noEmit      # Typecheck without emitting
npx prisma migrate dev --name <name>   # Create and run a new migration
npx prisma migrate deploy              # Run pending migrations (production)
npx prisma db seed    # Seed dev database
npx prisma studio     # Browse database in browser
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
import { getRequiredSession } from "@/lib/auth"
const session = await getRequiredSession() // redirects to /login if unauthenticated
const userId = session.user.id
```

All service functions take `userId` as their first argument and filter all queries by it.

## Environment Variables

See `.env.local.example` for full list with descriptions. Never commit `.env.local`.

Required: DATABASE_URL, DIRECT_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

## What NOT to Do

- Do not put DB queries in route handlers or components — use the service layer
- Do not hardcode user IDs, product IDs, or any data — always derive from session or params
- Do not skip the `userId` ownership check when fetching or mutating records
- Do not use `any` types — define proper interfaces in `types/` if needed
- Do not commit secrets or `.env.local`
- Do not add a new dependency without updating this file and the PRD tech stack section

## Current Status

Phase 1 scaffolding — update this as build plan phases complete.
