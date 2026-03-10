# PanTracker

A mobile-first web app for beauty enthusiasts tracking Project Pan — the challenge of finishing products before buying new ones.

## Install on your phone

**iOS (Safari):** Open the app URL → tap the Share button → tap **Add to Home Screen** → tap Add. The app launches full-screen with no browser chrome.

**Android (Chrome):** Open the app URL → tap the three-dot menu → tap **Add to Home screen**.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript strict
- **Tailwind CSS** + shadcn/ui
- **Supabase** (PostgreSQL + Storage + Auth with Google OAuth)
- **Vercel** hosting

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd project-pan
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in all required values:

| Variable | Where to find it |
|---|---|
| `DATABASE_URL` | Supabase project → Settings → Database → Connection string (Transaction mode) |
| `DIRECT_URL` | Supabase project → Settings → Database → Connection string (Session mode) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (keep secret!) |

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Enable Google OAuth: Authentication → Providers → Google
3. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs

### 4. Run database migrations

```bash
npx supabase db push --db-url "$DIRECT_URL"
```

This applies all SQL migrations under `supabase/migrations/` to your database, including the schema and storage bucket setup.

To regenerate TypeScript types after a schema change:

```bash
npx supabase gen types typescript --linked > lib/types/database.ts
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Key Commands

```bash
npm run dev                                              # Start local dev server
npm run build                                            # Build for production
npm run lint                                             # Run ESLint
npx tsc --noEmit                                         # Type-check without building
npx supabase db push --db-url "$DIRECT_URL"              # Apply migrations to remote DB
npx supabase gen types typescript --linked > lib/types/database.ts  # Regenerate types
```

## Project Structure

```
app/
  (auth)/login/          # Login page (unauthenticated)
  auth/callback/         # OAuth callback route
  (app)/                 # Authenticated layout (bottom nav)
    pan/[year]/[month]/  # Monthly pan view
    empties/             # Empties log
    products/[id]/       # Product detail
  api/                   # API route handlers
  manifest.ts            # PWA manifest (auto-served at /manifest.webmanifest)

components/
  ui/                    # shadcn/ui (do not edit manually)
  shared/                # BottomNav and shared layout components
  pan/                   # Pan-specific components
  products/              # Product components
  empties/               # Empties components

lib/
  supabase/
    client.ts            # Browser client — use in Client Components
    server.ts            # Server client — use in Server Components / Route Handlers
    server-admin.ts      # Service role — API routes ONLY, never in components
  types/
    database.ts          # Supabase-generated types
    app.ts               # App enums and interfaces
  utils.ts               # cn(), currentYearMonth(), etc.

middleware.ts             # Session refresh + auth guard

public/
  icons/                 # PWA icons (192px, 512px)

supabase/
  migrations/            # SQL migration files (apply with supabase db push)
```

## Production Deployment

### Vercel

1. Connect the GitHub repo to Vercel
2. Add all environment variables in Vercel → Settings → Environment Variables (same keys as `.env.local`)
3. Push to `main` → Vercel auto-deploys

### Run migrations against production

```bash
# Set DIRECT_URL in your shell to the production Supabase direct connection string
npx supabase db push --db-url "$DIRECT_URL"
```

Or run from the Supabase dashboard: Database → SQL Editor → paste the migration SQL.

### GitHub Actions CI

CI runs on every PR to `main`: typecheck → lint → build. Add the required environment variables as [GitHub repository secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) to enable full build validation in CI.

## Security

- Security headers applied on all routes: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`
- All data scoped to the authenticated user's `user_id` in both app logic and Supabase RLS
- Product photo uploads validated server-side: JPEG/PNG/WebP only, max 5 MB, stored under `{uid}/` in Supabase Storage
