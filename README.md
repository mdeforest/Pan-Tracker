# PanTracker

A mobile-first web app for beauty enthusiasts tracking Project Pan — the challenge of finishing products before buying new ones.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript strict
- **Tailwind CSS** + shadcn/ui
- **Supabase** (PostgreSQL + Storage + Auth)
- **Prisma** ORM (added in Phase 2)
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
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (keep secret!) |

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Enable Google OAuth: Authentication → Providers → Google
3. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs

### 4. Run database migrations (Phase 2+)

```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Key Commands

```bash
npm run dev              # Start local dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npx tsc --noEmit         # Type-check without building
npx prisma studio        # Browse the database in a UI
npx prisma migrate dev   # Create and run a new migration
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

supabase/
  migrations/            # SQL migration files
```

## Deployment

Push to `main` → Vercel auto-deploys. Add all `.env.local` values to Vercel → Settings → Environment Variables.
