# Help Page — Design Spec

**Date:** 2026-03-20
**Status:** Approved

## Overview

A standalone reference page at `/help` that explains how to use PanTracker. Targeted at Sophia — the primary user who already knows what "project pan" means as a beauty concept, and just needs a reference for the app's specific features.

## Goals

- Give Sophia a quick reference she can return to when she forgets how a feature works
- Cover every major feature area in one scrollable page
- Zero maintenance burden — static content, no database, no client state

## Non-Goals

- Onboarding flow or first-visit walkthrough
- Interactive tooltips or coach marks
- Public-facing marketing copy

---

## Route & Access

| Item | Value |
|------|-------|
| Route | `app/(app)/help/page.tsx` |
| Layout | Inherited `(app)` layout (auth + nav already handled) |
| Component type | Pure server component |
| Auth | Protected (inside `(app)`) |

**Entry points:**
- `components/shared/UserMenu.tsx` — add "Help" link to dropdown (mobile header)
- `components/shared/SideNav.tsx` — add "Help" link to bottom menu (desktop sidebar)

Both already have a pattern for extra menu links (Wishlist, Import History) — follow that pattern exactly.

---

## Page Layout

```
<div class="max-w-2xl mx-auto px-4 py-8 space-y-4">
  <PageHeader />        ← title + subtitle
  <PanSection />        ← white card
  <PicksSection />      ← white card
  <EmptySection />      ← white card
  <ProductsSection />   ← white card
  <EmptiesLogSection /> ← white card
  <StatsSection />      ← white card
  <WishlistSection />   ← white card
  <ImportSection />     ← white card
</div>
```

**Card pattern** (consistent across all sections):
```tsx
<div className="rounded-2xl bg-white shadow-sm p-6 space-y-3">
  <div className="flex items-center gap-3">
    <Icon className="h-5 w-5 text-primary" />
    <h2 className="font-bold text-lg tracking-tight">Section Title</h2>
  </div>
  {/* prose or bullet list */}
</div>
```

**Page header:**
```tsx
<div className="space-y-1 pt-2 pb-2">
  <h1 className="text-2xl font-bold tracking-tight">How to use PanTracker</h1>
  <p className="text-muted-foreground text-sm">A quick reference for everything in the app.</p>
</div>
```

---

## Sections

### 1. Your Pan (`Sparkles`)

- The Pan is your active list of products you're working through this month.
- Tap the **+** button (bottom right) to add a product from your library, or create a new one on the spot.
- Each product card has a usage slider — set it to Low, Medium, or High to track how quickly you're getting through it.
- Tap the **month label** at the top to jump to a different month. Products carry over automatically from previous months unless you remove them.

### 2. Monthly Picks (`Star`)

- Picks are your focus products for the month — the ones you're prioritising.
- Open a product's detail sheet (tap the card) and tap the **star icon** in the top corner to mark it as a monthly pick.
- Picks appear with a star badge and are visually highlighted in the pan view.

### 3. Logging an Empty (`FlaskConical`)

- When you finish a product, open its detail sheet and tap **Mark Empty**.
- You'll be prompted to leave a quick review: a star rating, whether you'd repurchase, and optional notes.
- Once logged, the product moves out of your active pan and into your Empties log.

### 4. Products Library (`Package`)

- The Products tab is your full library of every product you've added to the app.
- Tap the **+** button to add a new product. You can set the brand, name, category, and upload a photo.
- Tap any product to view its full history — past pan entries and empties with reviews.
- Tap **Edit** from the detail sheet to update name, brand, category, or photo.

### 5. Empties Log (`FlaskConical`)

- The Empties tab shows everything you've finished, with your review for each.
- Filter by month/year using the selector at the top, or filter by category using the chips below it.
- Tap an empty card to expand it and read your full review notes.

### 6. Stats (`BarChart2`)

- The Stats tab gives you a summary of your panning progress over time.
- See how many products you've emptied, your most-panned categories, repurchase rates, and more.

### 7. Wishlist (`Heart`)

- The Wishlist lives in the user menu (tap your avatar). Use it to track products you want to buy next.
- Add items as free-text (brand + name) or link them to an existing product in your library.
- Mark items as **Purchased** once you've bought them — they'll stay in your history for reference.
- The wishlist total gives you a running estimate of what you'd spend if you bought everything on it.

### 8. Importing history (`Upload`)

- Import History is also in the user menu. Use it to bulk-import past pan history from a CSV file.
- The CSV supports three statuses: `current_pan` (adds to active pan), `empty` (logs an empty), and `backlog` (adds to product library only).
- After uploading, you'll see a preview of what will be imported before anything is saved. Review it carefully — imports can't be undone from the UI.

---

## Implementation Notes

- All content is hardcoded in the `.tsx` file — no CMS, no MDX, no dynamic data
- Icons: reuse the same lucide icons already used in nav (`Sparkles`, `FlaskConical`, `Package`, `BarChart2`) plus `Star`, `Heart`, `Upload` for new sections
- No new dependencies
- `UserMenu` and `SideNav` both need a "Help" link added — follow the existing link pattern (`<Link href="/help" onClick={...}>Help</Link>`)
- Page title metadata: `export const metadata = { title: "Help — PanTracker" }`

---

## Files Changed

| File | Change |
|------|--------|
| `app/(app)/help/page.tsx` | **New** — help page server component |
| `components/shared/UserMenu.tsx` | Add Help link to dropdown |
| `components/shared/SideNav.tsx` | Add Help link to bottom menu |
