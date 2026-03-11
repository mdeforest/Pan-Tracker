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
npm run db:start      # Start local Supabase/Postgres stack via Docker
npm run db:status     # Show local URLs, DB connection string, anon/service keys
npm run db:reset      # Reset local DB, run migrations, and load supabase/seed.sql
npm run db:stop       # Stop local Supabase stack
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

## Workflow Preferences (user-configured)

**Autonomy:** Operate more autonomously. Proceed without asking for most actions. Only pause to confirm truly destructive or irreversible operations (force push, drop table, deleting branches with unmerged work, mass deletes). Flag surprises in the response but don't block on approval.

**Verbosity:** Detailed. Explain decisions, trade-offs, and next steps. Don't pad with filler, but don't skip context that helps the user understand what was done and why.

**Scope/bugs found in passing:** Fix small bugs or code smells encountered during a task without asking. Mention what was fixed. Surface larger issues as a note and move on — don't fix them unilaterally.

**TypeScript / lint errors:** Fix all errors encountered immediately, including pre-existing ones, not just those introduced by the current change.

**Memory:** Proactively update `.claude/projects/*/memory/` files as stable patterns and preferences are confirmed. Don't wait to be asked.

**Session end (always do all of these):**
1. Run `npm run lint` and `npx tsc --noEmit` — fix any errors
2. Commit all changes at logical checkpoints (already in the Git section above)
3. Push branch and open a PR to `main`
4. Update CLAUDE.md (Current Status, deviations, new conventions)

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

## Design System / Visual Theme

All UI must follow this aesthetic (established after Phase 3):

- **Background:** warm cream — `bg-background` resolves to `oklch(0.965 0.006 80)` (CSS var `--background`)
- **Cards:** pure white — `bg-card` or `bg-white`; use `rounded-2xl shadow-sm` for card surfaces
- **Border radius:** `--radius: 1rem` (16px) — shadcn lg/md/sm tokens scale from this; prefer `rounded-xl` or `rounded-2xl` on hand-authored elements
- **Bottom nav:** solid near-black background (`oklch(0.13 0 0)`); white icons at full opacity when active, `white/40` when inactive
- **Header:** `bg-card shadow-sm` — no border
- **Typography:** Geist Sans; `font-bold tracking-tight` for headings; `text-muted-foreground` for secondary text
- **Buttons:** `rounded-xl` on hand-authored buttons (shadcn Button inherits radius from `--radius` automatically)
- **No border-based card separation** — use shadow + white card on cream background instead

**`next.config.mjs` image domains:**
- `lh3.googleusercontent.com` — Google avatar CDN (already added in Phase 3)
- Supabase Storage domain — to be added in Phase 7

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
- ✅ **Phase 3 — Authentication** (2026-03-07): Login page with Google OAuth button, auth callback (code exchange → redirect to `/pan/year/month`), app layout upgraded with sticky header + `UserMenu`, server action for sign-out in `lib/actions/auth.ts`.
- ✅ **Phase 4 — Core API Routes** (2026-03-07): All 12 route handlers implemented with Zod validation and `{ data, error }` envelope. Service layer in `lib/services/`. Validation schemas in `lib/validations/`. `/api/health` includes db ping. Middleware updated to pass `/api/*` routes through for JSON 401 responses.
- ✅ **Phase 5 — Monthly Pan View** (2026-03-07): Full pan screen at `app/(app)/pan/[year]/[month]/page.tsx`. Month navigation, product cards grouped by category, progress bars, pick/months badges. BottomSheet primitive, ToastProvider, canvas-confetti on empty. ProductDetailSheet (slider + notes), EmptyLoggerSheet (repurchase + stars), AddProductSheet (search + create + photo), CarryOverBanner (past months). Skeleton loading.tsx.
- ✅ **Phase 6 — Empties Log + Product Library** (2026-03-07): Empties log at `app/(app)/empties/page.tsx` — sticky dual filter bar (month/year + category chips), accordion EmptyCard (expand-in-place for notes). Product library at `app/(app)/products/page.tsx` — sticky search + category chips, 2-col grid, FAB opens NewProductSheet. Product detail at `app/(app)/products/[id]/page.tsx` — photo header with gradient overlay, edit sheet, "Add to Current Pan" button, full pan history timeline with embedded empty records.
- ✅ **Phase 7 — Hardening + PWA + CI** (2026-03-10): Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP) in `next.config.mjs`. `app/error.tsx` and `app/not-found.tsx`. Zod schema audit (`.trim()` + max lengths). All `<img>` → `Next/Image`. PWA: `app/manifest.ts`, SVG icons in `public/icons/`, layout meta tags. GitHub Actions CI at `.github/workflows/ci.yml`. Storage migration `supabase/migrations/20260310000000_storage_product_photos.sql`. README updated.
- ✅ **Post-Phase 7 API Completion** (2026-03-10): Fixed month-scoped pan queries so entries only appear in their `started_month`/`started_year`. Implemented `/api/picks` GET/POST and `/api/picks/[id]` DELETE backed by `monthly_picks`. Implemented legacy compatibility routes `/api/pan`, `/api/pan/[id]`, and `/api/products/[id]/photo` so no API route remains stubbed with 501.
- ✅ **Wishlist Feature** (2026-03-10): DB migration `supabase/migrations/20260310000003_wishlist_items.sql` (table + RLS + ownership trigger + indexes). API routes `GET/POST /api/wishlist` and `PATCH/DELETE /api/wishlist/[id]`. Service layer `lib/services/wishlist.ts`, Zod schemas `lib/validations/wishlist.ts`. SSR loader `getWishlistTabData` with `unstable_cache`. `/wishlist` page + `WishlistClient` (summary card, status filter chips, add/edit bottom sheet, inline delete confirmation, toggle purchased, linked product autofill). Wishlist link in `UserMenu`. Post-empty CTA prompt in `PanView`. `wishlist_items` seed data. Full test coverage (validations, services, API routes, cache tags). Lint, typecheck, and 134 tests all pass.

## Wishlist Deviations & Notes

- **No new bottom-nav tab:** Wishlist is exposed via the user menu to avoid crowding the 3-tab mobile nav.
- **Inline delete confirmation:** Used state-based confirm flow in the card footer instead of `window.confirm` for better mobile UX.
- **Money-saved total not in stats:** Wishlist summary (estimated to-buy total) lives only on the wishlist page for now; stats dashboard is unchanged.
- **Linked products are optional:** Wishlist items can exist as free-text entries (brand + name only) or be linked to an existing product in the user's library via `product_id`. DB-level ownership is enforced by a trigger.
- **Post-empty prompt auto-dismisses:** The "Want a reward?" banner in `PanView` appears for 8 seconds after logging an empty, then dismisses automatically. Users can also dismiss early.

## Phase 7 Deviations & Notes

- **Local seed data added after Phase 7:** `supabase/config.toml` already pointed to `supabase/seed.sql`; that file now exists and seeds a deterministic local dataset for `supabase db reset`. Includes auth users, products, pan entries, picks, empties, and one archived product.
- **Monthly pan views are now month-scoped:** Earlier builds mistakenly showed all active/paused pan entries in every month because `getPanEntries` did not filter by `started_month` and `started_year`. Fixed on 2026-03-10.
- **Monthly picks API now exists, but picks UI still does not:** The backend endpoints and service layer are implemented; there is still no user-facing picks management UI in the app.

- **SVG icons for PWA:** Used inline SVG files (lipstick design) at 192×192 and 512×512 rather than PNG bitmaps — simpler to create and fully scalable. Chrome DevTools Manifest panel accepts SVG. If a PWA install prompt requires PNG, generate PNGs from the SVGs in Phase 8.
- **`purpose: "maskable"` on 512px icon only:** Next.js `MetadataRoute.Manifest` type doesn't accept `"any maskable"` as a combined string — split into separate `"any"` and `"maskable"` entries if both are needed; for now 192 is `"any"` and 512 is `"maskable"`.
- **CSP uses `'unsafe-inline'` and `'unsafe-eval'`:** Required by Next.js App Router hydration. Can tighten with nonces in v1.1 once a Sentry/observability layer is in place.
- **CI `next build` requires secrets:** The CI workflow passes secrets via GitHub Actions environment; without them the build step will skip (Next.js won't crash on missing optional env vars that are only used at runtime). Add secrets to the repo before merging.

## Phase 6 Deviations & Notes

- **`<img>` instead of Next/Image:** Consistent with Phase 5 — Supabase Storage photos use regular `<img>` in EmptyCard, ProductCard, and ProductDetailClient. Resolved in Phase 7: all switched to Next/Image.
- **Empties category filter via Supabase join:** `products.category` filter in `listEmpties` relies on Supabase's foreign table filter syntax. Client-side in-memory filtering is applied as a fallback in `EmptiesClient` (the join filter is applied server-side but may return nulls for non-matching rows; client ignores those).
- **ProductsClient is fully client-side:** Products page fetches from `/api/products` on the client with debounced search, since search needs reactive updates. Active pan status is passed from the server as a `Set<string>` on initial render.
- **No product delete UI in Phase 6:** Archive/delete is deferred to v1.1 per PRD. Edit sheet only updates name/brand/category/photo.

## Phase 5 Deviations & Notes

- **`original_pan_id` not in schema:** Phase prompt specified "X months in pan badge if `original_pan_id` is set". Field doesn't exist (documented in Phase 4 notes). Badge instead shows months since `started_month`/`started_year` when > 0.
- **`<img>` instead of Next/Image for product photos:** Used regular `<img>` tag in PanCard and ProductDetailSheet to avoid Next.js domain config for Supabase Storage (already added `*.supabase.co` to `next.config.mjs`; can switch to Next/Image in Phase 7 once confirmed).
- **No react-hook-form in Phase 5 forms:** CLAUDE.md recommends react-hook-form for forms, but Phase 5 forms (EmptyLoggerSheet, AddProductSheet) use controlled state — complexity doesn't justify the dependency. Will add if forms grow.
- **`canvas-confetti` + `@types/canvas-confetti` added:** Both packages added to dependencies.
- **Supabase Storage domain added now (not Phase 7):** `*.supabase.co` added to `next.config.mjs` remotePatterns since Phase 5 adds product photos via upload.
- **ToastProvider in root layout:** Added to `app/layout.tsx` so toasts are available across the whole app (not just pan routes).
- **Carry-over "Remove from pan":** Maps to setting `status: "paused"` — no delete endpoint exists; paused entries are excluded from active pan view.

## Phase 4 Deviations & Notes

- **URL structure:** Phase prompt used `/api/pans/[year]/[month]` (plural) while existing stubs used `/api/pan`. New routes created under `/api/pans/` — old `/api/pan` stubs remain as 501 placeholders.
- **No `/api/pans` table:** PRD data model has no `pans` table; GET `/api/pans/[year]/[month]` returns all active/paused `pan_entries` with product details and an `is_pick` flag derived from `monthly_picks`.
- **carry-over:** Phase prompt mentioned `original_pan_id` which doesn't exist in the schema. Carry-over inserts new `pan_entries` for target month/year using the admin client; duplicates are skipped gracefully via `Promise.allSettled`.
- **Middleware fix:** Middleware was redirecting all unauthenticated requests (including `/api/*`) to `/login`. Updated to pass API routes through so route handlers can return JSON `{ data: null, error: "Unauthorized" }` with 401.
- **Photo upload endpoint:** Built at `/api/upload/product-photo` (FormData) per phase prompt — separate from the scaffolded `/api/products/[id]/photo` stub.
- **zod added:** `npm install zod` added to dependencies.

## Phase 3 Deviations & Notes

- **Route structure:** PRD Section 7 shows `/pan` but Phase 1 implemented `/pan/[year]/[month]`. Auth callback and middleware redirect to the full year/month path.
- **UserMenu:** Simple client component with avatar/initials + backdrop-dismissed dropdown. No additional shadcn/ui components needed.
- **Server action for sign-out:** Using Next.js 14 server action (`lib/actions/auth.ts`) called via `<form action={signOut}>` in `UserMenu`. Redirects to `/login` after sign-out.
- **`next.config.mjs` image domain:** Added `lh3.googleusercontent.com` to `images.remotePatterns` so Next/Image can render Google OAuth avatars. Phase 7 will add the Supabase Storage domain.
- **Design theme applied:** After Phase 3, a warm-cream / white-card / dark-nav visual theme was applied globally via `globals.css` CSS variable overrides and `BottomNav` class updates. See the Design System section above for the full spec.

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
