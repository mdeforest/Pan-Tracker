# Workflow Notes — Project Pan Tracker

_Last updated: 2026-03-17_

## Current Workflow Summary

Single-developer build using Claude Code (Sonnet 4.6) across discrete linear phases. CLAUDE.md is the persistent context carrier loaded at every session start. Phase prompts in `docs/build-plan.md` scope each session; PRD sections loaded selectively per phase. Human reviews output after each phase before proceeding. Post-phase-7 features (CSV import, wishlist, etc.) are built ad-hoc without equivalent structured prompts.

## Open Issues

- [HIGH] build-plan.md phase prompts are stale — reference `monthly_pans` table and `original_pan_id` that were replaced/removed. Phases 2, 4, 5 affected. Future sessions will get conflicting inputs.
- [HIGH] CLAUDE.md is growing unboundedly (~500+ lines, all loaded every session). No pruning or archival strategy. Will degrade context quality as project matures.
- [MEDIUM] Three competing sources of truth: CLAUDE.md (current), build-plan.md (stale), docs/prd.md (original). Only CLAUDE.md is reliably updated.
- [MEDIUM] ADRs planned in project-management.md but never created. Key decisions (Prisma removal, NextAuth → Supabase Auth) are buried in per-phase deviation notes.
- [MEDIUM] No structured "plan before code" step for post-phase ad-hoc features. Wishlist and CSV import were scoped informally.
- [LOW] project-management.md CI definition-of-done references "prisma validate" — Prisma was never used.
- [LOW] Memory system underutilized for project decisions with rationale (e.g., why controlled state over react-hook-form, why wishlist is in user menu not nav).

## Resolved Issues

_(none yet)_

## Session Log

### 2026-03-17
First workflow critique run. Reviewed CLAUDE.md (500+ lines), docs/build-plan.md (7 phase prompts), docs/project-management.md, and docs/prd.md. Top findings: stale phase prompts creating future context conflicts; CLAUDE.md growth with no pruning strategy; ADRs planned but never created; no structured prompt discipline for post-phase features.
