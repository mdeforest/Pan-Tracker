# Project Pan Tracker — Project Management Guide

## Overview

Solo project. Lightweight process — enough structure to stay sane, not so much that it slows you down.

---

## Branching Strategy

- `main` — production-ready at all times; Vercel deploys from here
- `feat/short-description` — feature branches; merge to main via PR
- `fix/short-description` — bug fixes
- `chore/short-description` — deps, config, non-functional changes

Rules:
- Never commit directly to `main`
- Each branch should be one logical change — small and reviewable
- Squash merge PRs to keep main history clean

---

## Workflow

Since this is a solo project, keep ceremony minimal:

1. **Before starting work:** open a GitHub Issue describing what you're building and why
2. **While building:** work in a feature branch; commit small and often with descriptive messages
3. **Before merging:** PR to main triggers CI (lint + typecheck + prisma validate); review your own diff before merging
4. **After merging:** Vercel auto-deploys; spot-check the deployed feature

Commit message format: `type(scope): description`
Examples: `feat(pan): add usage level progress bar`, `fix(picks): carry-over upsert now idempotent`, `chore: upgrade nextauth to v5.1`

---

## Issue Tracking (GitHub Issues)

Label taxonomy:

**Type:**
- `feature` — new functionality
- `bug` — something broken
- `chore` — maintenance, deps, config
- `ux` — UI/UX improvement without new functionality

**Priority:**
- `p0` — broken in production, fix immediately
- `p1` — current focus, should ship this week
- `p2` — backlog, ship when time allows

**Size:**
- `S` — under 1 hour
- `M` — half day
- `L` — 1–2 days
- `XL` — needs breakdown before starting

---

## Build Plan Phase Tracking

Use GitHub Issues to track progress through the 7 build plan phases. Create one issue per phase with the Claude Code prompt attached as a comment.

| Phase | Issue Label | Status Workflow |
|---|---|---|
| Phase 1: Scaffolding | `chore` | Open -> In Progress -> Done |
| Phase 2: DB & Seed | `chore` | Open -> In Progress -> Done |
| Phase 3: Auth | `feature` | Open -> In Progress -> Done |
| Phase 4: API Routes | `feature` | Open -> In Progress -> Done |
| Phase 5: Frontend | `feature` | Open -> In Progress -> Done |
| Phase 6: Hardening | `chore` | Open -> In Progress -> Done |
| Phase 7: Deployment | `chore` | Open -> In Progress -> Done |

---

## Definition of Done

A task is done when:
- [ ] Merged to main with CI green
- [ ] Feature works on mobile (test in browser devtools mobile view)
- [ ] No TypeScript errors (`npx tsc --noEmit` passes)
- [ ] CLAUDE.md updated if architecture or conventions changed
- [ ] Any new env variables added to `.env.local.example`

---

## Release Process

Since this is a personal app with a single primary user, releases are informal:

1. Merge to `main` — Vercel deploys automatically
2. Spot-check the affected feature on the production URL
3. If something breaks: revert the merge commit and redeploy (`git revert <sha>`)
4. For significant milestones (e.g., "v1 complete"), tag: `git tag v1.0.0 && git push --tags`

---

## Versioning

Semantic versioning for milestone tags:
- **MAJOR** (v2.0.0) — major feature set or breaking data migration
- **MINOR** (v1.1.0) — new features added
- **PATCH** (v1.0.1) — bug fixes only

---

## Post-v1 Backlog (Priority Order)

These are explicitly deferred from v1. Promote to active work when v1 is stable:

1. **Stats dashboard** — empties/month chart, category breakdown, repurchase rate. Great for content creation context.
2. **Public profile** — shareable /u/sophia URL with public empties log. Required if opening to other users.
3. **PWA** — Add to Home Screen for Sophia's phone. High value, low effort.
4. **Shareable monthly recap image** — auto-generated image of the month's empties for TikTok.
5. **Monthly email digest** — "You have 3 carry-overs from last month."
6. **Barcode scanning** — product lookup via Open Beauty Facts API.
7. **E2E tests** — Playwright tests for the core flows (add product, mark empty, monthly picks).
8. **Staging environment** — separate Supabase project for preview deployments.

---

## Architecture Decision Records

Store in `docs/adr/`. Create the following ADRs at project start to document key decisions:

- `0001-nextjs-fullstack.md` — Why Next.js App Router instead of separate frontend/backend
- `0002-supabase-postgres.md` — Why Supabase over Railway, PlanetScale, or self-hosted Postgres
- `0003-nextauth-google.md` — Why NextAuth v5 with Google-only OAuth instead of email/password
- `0004-vercel-hosting.md` — Why Vercel Hobby instead of self-hosting or Railway

ADR template:
```
# ADR-NNNN: [Decision Title]

**Date:** YYYY-MM-DD
**Status:** Accepted

## Context
What situation or constraint prompted this decision?

## Decision
What did we decide, and what alternatives were considered?

## Consequences
What becomes easier? What becomes harder? Any risks accepted?
```

---

## Long-Term Maintenance Notes

- Keep CLAUDE.md current — it's what Claude Code reads at session start
- Run `npm audit` monthly; address HIGH or CRITICAL vulnerabilities promptly
- Supabase free tier: check the dashboard monthly for approaching storage limits
- If Supabase starts pausing the project (1 week inactivity threshold): migrate to Neon free tier (drop-in Postgres, no pausing)
- Revisit the post-v1 backlog quarterly; promote items when user feedback indicates need
