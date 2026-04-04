# Collection Import + Expiry Recommendations — Design Spec

**Date:** 2026-04-04  
**Status:** Approved

## Overview

Two related features:

1. **Collection Import** — a new import flow that accepts Sophia's per-category CSV format (one file at a time), parses product metadata including size, dates, and expiration, and writes all new fields into the product library.
2. **Expiry Recommendations** — surface products with upcoming expiration dates as badges in the product library and as an actionable "Expiring Soon" shelf in the pan view.

---

## 1. Data Model

One migration adds four nullable columns to `public.products`:

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `size_weight` | `text` | yes | e.g. "1 oz", "0.1 oz" |
| `manufacture_date` | `date` | yes | |
| `date_in_collection` | `date` | yes | When the user added the product to their stash |
| `expiration_date` | `date` | yes | See fallback chain below |

**Expiration date fallback chain** (applied at parse time, stored in DB):
1. Use parsed `Expiration Date` column if present and valid
2. Else use `Manufacture Date` + 1 year
3. Else use today's date + 1 year

No changes to `pan_entries` or `empties`. Expiry logic lives entirely on `products`.

---

## 2. Import Flow (UI)

A new **"Import Collection"** option added to the UserMenu alongside the existing "Import History" entry point. Opens a new `ImportCollectionSheet` bottom sheet with three to four steps.

### Step 1 — File + Category

- Single file upload (one CSV at a time)
- Category dropdown (app's 7 categories: `makeup`, `skincare`, `haircare`, `bodycare`, `fragrance`, `tools`, `other`)
- Category auto-detected from filename (e.g. `- Mascara.csv` → `makeup`, `- Serums.csv` → `skincare`, `- Cleansers.csv` → `skincare`, `- Moisturizer.csv` → `skincare`, `- Mists.csv` → `skincare`, `- Eye Cream.csv` → `skincare`, `- Tonor.csv` → `skincare`, `- Miscellaneous.csv` → `other`)
- User can override the category before proceeding

### Step 2 — Brand/Name Review *(shown only if unmatched rows exist)*

- Header: "X products auto-matched" (count only, not listed)
- Table of only the unmatched rows, each showing:
  - The full `Product` string (read-only)
  - Editable `Brand` field
  - Editable `Name` field
  - "Skip" toggle — if toggled, the row imports with full string as `name`, blank `brand`
- "Skip all unreviewed" button proceeds without fixing remaining rows

### Step 3 — Preview + Confirm

- Summary counts: X products to add, Y duplicates skipped (matched by normalized `brand::name` key — note: blank-brand rows won't match existing products that have a brand, so they'll create new entries), Z marked as finished
- Scrollable list of all parsed rows showing key fields
- "Import" button writes to DB
- Finished rows create an `empty` record dated to current month (editable afterward like any other empty)

---

## 3. CSV Parsing (Client-Side)

All parsing happens in the browser. The Sophia format is detected by the presence of a `Product` header (vs the existing format's `brand`/`name` headers).

### Expected Sophia CSV Headers

| Header | Required | Maps To |
|---|---|---|
| `Product` | yes | brand + name (split via brand list) |
| `Product Size/Weight` | no | `size_weight` |
| `Manufacture Date` | no | `manufacture_date` |
| `Date in Collection` | no | `date_in_collection` |
| `Expiration Date` | no | `expiration_date` |
| `finished` | no | status (`yes`/`true`/`1`/`x`/`✓`/`finished` → `empty`, else `backlog`) |

The `Key` column (Excel color legend artifact) is ignored.

### Date Parsing

Handles Sophia's inconsistent date formats:
- `"September 1, 2023"` → full date parse
- `"March, 2024"` → first of month fallback
- `"January 01, 2027"` → full date parse
- `"Unknown"` / blank → `null`

Strategy: attempt `Date.parse`, then regex fallback for month-year-only strings (`/^(\w+),?\s+(\d{4})$/`). Unparseable values stored as `null`.

### Brand Auto-Split

A curated list of ~50–100 known beauty brands matched case-insensitively against the start of the `Product` string. Matched brands are split off; the remainder becomes `name`.

Examples:
- `"Anastasia Beverly Hills"` → brand: `Anastasia Beverly Hills`, name: *(empty — edge case, goes to review)*
- `"Tatcha Duo Rice Cleanse"` → brand: `Tatcha`, name: `Duo Rice Cleanse`
- `"Estée Lauder Advanced Night Repair"` → brand: `Estée Lauder`, name: `Advanced Night Repair`

Rows where no known brand matches go to the Step 2 review table.

### Status Mapping

- `finished` column truthy (`yes`, `true`, `1`, `x`, `✓`, `finished`) → `empty` → creates `empty` record dated current month
- All other rows → `backlog` (added to product library, not placed in pan)

---

## 4. API Changes

The existing `POST /api/import/csv` endpoint is extended to accept four new optional fields per row:

```typescript
size_weight?: string
manufacture_date?: string // ISO date string
date_in_collection?: string // ISO date string
expiration_date?: string // ISO date string
```

By the time a Sophia-format import reaches the API, it is already normalized to the internal format. The server doesn't need to know anything about the Sophia CSV structure.

The existing history import format is unaffected — those rows omit the new fields, which default to `null`.

The import service layer (`lib/services/import-history.ts`) is updated to write the new fields when present.

---

## 5. Expiry Recommendations

### Product Library Cards

An expiry badge on any product with an `expiration_date`, color-coded by urgency:

| Threshold | Badge | Color |
|---|---|---|
| Expired or ≤ 30 days | "Expires soon" / "Expired" | Red |
| 31–90 days | "Expires in ~X weeks" | Yellow/amber |
| 91–180 days | "Expires in ~X months" | Green |
| > 180 days | No badge | — |

A new **"Expiring Soon"** sort option in the existing library filter bar sorts products by `expiration_date` ascending (nulls last).

### Pan View Shelf

A horizontal scrollable **"Expiring Soon"** shelf rendered above the product grid in the pan view. Shows backlog products (not currently in the active pan) with `expiration_date` within 90 days. Each card shows the product name, category, expiry date, and an **"Add to Pan"** button.

The shelf is hidden entirely when there are no qualifying products.

The 90-day threshold is a named constant (`EXPIRY_SHELF_DAYS = 90`) in `lib/constants.ts`.

---

## 6. Security

- All import writes are scoped to the authenticated user's `user_id` — ownership enforced at the service layer as with all other mutations
- CSV parsing is fully client-side — no raw file content is sent to the server, only the parsed, validated row payload
- New `products` columns have no RLS changes needed — existing per-user RLS policies on `products` cover them automatically
- `expiration_date`, `manufacture_date`, `date_in_collection` are stored as dates, never rendered as HTML — no XSS risk

---

## 7. Out of Scope (v1)

- User-editable brand list
- Multi-file upload (all 8 CSVs at once)
- Expiry push notifications
- User-configurable urgency thresholds
- Expiry data for the existing wishlist items
