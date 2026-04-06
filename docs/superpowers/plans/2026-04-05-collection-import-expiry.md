# Collection Import + Expiry Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Sophia-format CSV collection importer with product metadata fields (size, dates, expiry) and surface expiry recommendations as badges on the products page and a shelf in the pan view.

**Architecture:** Client-side CSV parsing normalizes Sophia's format into typed rows before any API call. A new `POST /api/import/collection` endpoint accepts JSON rows and writes to Supabase. Expiry logic lives entirely on the `products` table via four new nullable columns.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + typed client), TypeScript strict, Tailwind CSS, shadcn/ui, Vitest, Zod

---

## File Map

**New files:**
- `supabase/migrations/20260405000000_products_expiry_fields.sql` — migration for 4 new columns
- `lib/constants.ts` — `EXPIRY_SHELF_DAYS = 90`
- `lib/import/brands.ts` — curated known-brands list for auto-splitting
- `lib/import/collection-csv.ts` — Sophia-format CSV parser (client-side)
- `lib/validations/import-collection.ts` — Zod schema for API body
- `lib/services/import-collection.ts` — server-side import service
- `app/api/import/collection/route.ts` — POST endpoint
- `components/import/ImportCollectionSheet.tsx` — multi-step import UI
- `components/products/ExpiryBadge.tsx` — reusable expiry badge
- `components/pan/ExpiringSoonShelf.tsx` — horizontal shelf for pan view
- `__tests__/import/collection-csv.test.ts` — parser unit tests
- `__tests__/api/import-collection-route.test.ts` — route unit tests

**Modified files:**
- `lib/types/database.ts` — add 4 new columns to products Row/Insert/Update
- `lib/loaders/tab-data.ts` — add `expiration_date` to products query; add `getExpiringSoonProducts`
- `components/products/ProductCard.tsx` — add `expiration_date` to `ProductCardData`, render `ExpiryBadge`
- `components/products/ProductsClient.tsx` — add `expiration_date` to `RawProduct`, add expiry sort
- `components/shared/UserMenu.tsx` — add "Import Collection" button + render `ImportCollectionSheet`
- `app/(app)/pan/[year]/[month]/page.tsx` — load expiring-soon products, pass to `PanView`
- `components/pan/PanView.tsx` — accept and render `ExpiringSoonShelf`

---

## Task 1: DB Migration + TypeScript Types

**Files:**
- Create: `supabase/migrations/20260405000000_products_expiry_fields.sql`
- Modify: `lib/types/database.ts` (products Row/Insert/Update sections, lines ~219–260)

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260405000000_products_expiry_fields.sql`:

```sql
-- Add product metadata fields for collection tracking and expiry recommendations
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS size_weight       text,
  ADD COLUMN IF NOT EXISTS manufacture_date  date,
  ADD COLUMN IF NOT EXISTS date_in_collection date,
  ADD COLUMN IF NOT EXISTS expiration_date   date;

-- Index for expiry shelf query (backlog products expiring soon)
CREATE INDEX IF NOT EXISTS products_user_id_expiration_date_idx
  ON public.products(user_id, expiration_date)
  WHERE expiration_date IS NOT NULL;
```

- [ ] **Step 2: Apply migration to local DB**

```bash
npm run db:reset
```

Expected: local DB resets, runs all migrations including the new one, loads seed. No errors.

- [ ] **Step 3: Update TypeScript types for products**

In `lib/types/database.ts`, find the `products` section (Row, Insert, Update). Add the 4 new columns:

In `Row:` (after `name: string`):
```typescript
        date_in_collection: string | null
        expiration_date: string | null
        manufacture_date: string | null
        size_weight: string | null
```

In `Insert:` (after `name: string`):
```typescript
        date_in_collection?: string | null
        expiration_date?: string | null
        manufacture_date?: string | null
        size_weight?: string | null
```

In `Update:` (after `name?: string`):
```typescript
        date_in_collection?: string | null
        expiration_date?: string | null
        manufacture_date?: string | null
        size_weight?: string | null
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git checkout -b feat/collection-import-expiry
git add supabase/migrations/20260405000000_products_expiry_fields.sql lib/types/database.ts
git commit -m "feat(db): add product metadata columns (size, dates, expiry)"
```

---

## Task 2: Constants + Brand List + Collection CSV Parser

**Files:**
- Create: `lib/constants.ts`
- Create: `lib/import/brands.ts`
- Create: `lib/import/collection-csv.ts`

- [ ] **Step 1: Create lib/constants.ts**

```typescript
/** Number of days ahead to show expiring-soon products in the pan view shelf */
export const EXPIRY_SHELF_DAYS = 90
```

- [ ] **Step 2: Create lib/import/brands.ts**

```typescript
/**
 * Curated list of known beauty brands for auto-splitting Sophia-format CSV rows.
 * Sorted longest-first so "Anastasia Beverly Hills" matches before a shorter prefix.
 * Add new brands here as needed — no other files need to change.
 */
const KNOWN_BRANDS = [
  "Anastasia Beverly Hills",
  "Charlotte Tilbury",
  "Charolette Tilbury",
  "Decorte",
  "Dermalogica",
  "Drunk Elephant",
  "Estée Lauder",
  "Estee Lauder",
  "Experiment Beauty",
  "First Aid Beauty",
  "Glow Recipe",
  "Good Molecules",
  "KraveBeauty",
  "Mixsoon",
  "Naturium",
  "Peach & Lily",
  "Round Lab",
  "Shiseido",
  "Sisley Paris",
  "Sisley",
  "SkinMedica",
  "Sungboon Editor",
  "Sulwhasoo",
  "Skinfix",
  "Bubble",
  "Caudalie",
  "Cocokind",
  "Farmacy",
  "Fenty Beauty",
  "Hanskin",
  "Ilia",
  "Lancome",
  "L'Oreal",
  "Maybelline",
  "No7",
  "SK-II",
  "Tarte",
  "Tatcha",
  "Too Faced",
  "U Beauty",
  "Wyn Beauty",
  "De de peau",
  "Provence Beauty",
  "50 Mild",
  "Callie Rae",
]

/** Brands sorted longest-first to prevent shorter prefixes shadowing longer matches */
export const KNOWN_BRANDS_SORTED: string[] = [...KNOWN_BRANDS].sort(
  (a, b) => b.length - a.length
)
```

- [ ] **Step 3: Create lib/import/collection-csv.ts**

```typescript
import type { ProductCategory } from "@/lib/types/app"
import { KNOWN_BRANDS_SORTED } from "./brands"

/** Maps lowercased filename keyword → app ProductCategory */
export const COLLECTION_CSV_CATEGORY_MAP: Record<string, ProductCategory> = {
  mascara: "makeup",
  blush: "makeup",
  lipstick: "makeup",
  foundation: "makeup",
  eyeshadow: "makeup",
  serums: "skincare",
  serum: "skincare",
  cleansers: "skincare",
  cleanser: "skincare",
  moisturizer: "skincare",
  moisturizers: "skincare",
  mists: "skincare",
  mist: "skincare",
  "eye cream": "skincare",
  "eye creams": "skincare",
  tonor: "skincare",
  toner: "skincare",
  toners: "skincare",
  miscellaneous: "other",
  misc: "other",
}

/**
 * Attempt to detect the product category from the CSV filename.
 * Expects filenames like "Project Pan Products Master List - Serums.csv".
 * Returns null if no match found.
 */
export function detectCategoryFromFilename(filename: string): ProductCategory | null {
  const lower = filename.toLowerCase()
  const match = lower.match(/[-–]\s*([^.-]+?)(?:\s*\.csv)?$/)
  if (!match) return null
  const key = match[1].trim()
  return COLLECTION_CSV_CATEGORY_MAP[key] ?? null
}

/**
 * Parse a date string in any of Sophia's formats:
 * - "September 1, 2023"
 * - "March, 2024" or "March 2024"
 * - "January 01, 2027"
 * - "Unknown" / blank → null
 *
 * Returns ISO date string (YYYY-MM-DD) or null.
 */
export function parseSophiaDate(raw: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed.toLowerCase() === "unknown") return null

  // Try direct parse (handles "September 1, 2023", "January 01, 2027")
  const direct = new Date(trimmed)
  if (!isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10)
  }

  // Try "Month, YYYY" or "Month YYYY" without a day
  const monthYear = trimmed.match(/^(\w+),?\s+(\d{4})$/)
  if (monthYear) {
    const parsed = new Date(`${monthYear[1]} 1, ${monthYear[2]}`)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
  }

  return null
}

/**
 * Compute the expiration date to store:
 * 1. Use expirationRaw if parseable
 * 2. Else use manufactureRaw + 1 year
 * 3. Else use today + 1 year
 *
 * Always returns an ISO date string.
 */
export function computeExpirationDate(
  expirationRaw: string | null,
  manufactureRaw: string | null,
  today: Date
): string {
  const parsedExpiry = expirationRaw ? parseSophiaDate(expirationRaw) : null
  if (parsedExpiry) return parsedExpiry

  const parsedMfg = manufactureRaw ? parseSophiaDate(manufactureRaw) : null
  if (parsedMfg) {
    const d = new Date(parsedMfg)
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().slice(0, 10)
  }

  const fallback = new Date(today)
  fallback.setFullYear(fallback.getFullYear() + 1)
  return fallback.toISOString().slice(0, 10)
}

/**
 * Try to split a product string into brand + name using the known brand list.
 * Returns null if no known brand matches the start of the string.
 */
export function autoSplitBrand(
  productString: string
): { brand: string; name: string } | null {
  const lower = productString.toLowerCase()
  for (const brand of KNOWN_BRANDS_SORTED) {
    if (lower.startsWith(brand.toLowerCase())) {
      const name = productString.slice(brand.length).trim()
      return { brand, name }
    }
  }
  return null
}

/**
 * Returns true if the CSV uses Sophia's format (has a "product" column, no "brand"/"name").
 */
export function detectSophiaFormat(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim())
  return lower.includes("product") && !lower.includes("brand") && !lower.includes("name")
}

const TRUTHY_FINISHED = new Set(["yes", "true", "1", "x", "✓", "finished", "done", "complete"])

export interface ParsedCollectionRow {
  /** Original value from the Product column */
  productString: string
  /** Auto-detected brand, or "" if unmatched */
  brand: string
  /** Product name (remainder after brand, or full string if unmatched) */
  name: string
  /** True if brand was auto-detected from the known list */
  autoMatched: boolean
  category: ProductCategory
  sizeWeight: string | null
  /** ISO date string or null */
  manufactureDate: string | null
  /** ISO date string or null */
  dateInCollection: string | null
  /** ISO date string — always present (computed from fallback chain) */
  expirationDate: string
  isFinished: boolean
}

export interface ParseCollectionResult {
  rows: ParsedCollectionRow[]
  autoMatchedCount: number
  /** Fatal parse errors (e.g. missing required column) */
  errors: string[]
}

export function parseCollectionCsv(
  csvText: string,
  category: ProductCategory,
  now = new Date()
): ParseCollectionResult {
  const rawRows = parseCsvText(csvText)

  if (rawRows.length === 0) {
    return { rows: [], autoMatchedCount: 0, errors: ["CSV file is empty"] }
  }

  const headerIndex = rawRows.findIndex((row) => row.some((cell) => cell.trim() !== ""))
  if (headerIndex < 0) {
    return { rows: [], autoMatchedCount: 0, errors: ["CSV file is empty"] }
  }

  const headerRow = rawRows[headerIndex].map((cell) => cell.trim().toLowerCase())
  const headerMap = new Map<string, number>()
  headerRow.forEach((h, i) => {
    if (!headerMap.has(h)) headerMap.set(h, i)
  })

  if (!headerMap.has("product")) {
    return {
      rows: [],
      autoMatchedCount: 0,
      errors: ['Missing required "Product" column — is this a Sophia-format CSV?'],
    }
  }

  const dataRows = rawRows
    .slice(headerIndex + 1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))

  const rows: ParsedCollectionRow[] = []
  let autoMatchedCount = 0

  for (const row of dataRows) {
    const productString = getCell(row, headerMap, "product")
    if (!productString) continue
    // Skip section-header rows like "Wish List"
    if (productString.toLowerCase().startsWith("wish list")) continue

    const splitResult = autoSplitBrand(productString)
    let brand: string
    let name: string
    let autoMatched: boolean

    if (splitResult) {
      brand = splitResult.brand
      name = splitResult.name
      autoMatched = true
      autoMatchedCount++
    } else {
      brand = ""
      name = productString
      autoMatched = false
    }

    const expirationRaw =
      getCell(row, headerMap, "expiration date") ||
      getCell(row, headerMap, "expiration_date")
    const manufactureRaw =
      getCell(row, headerMap, "manufacture date") ||
      getCell(row, headerMap, "manufacture_date")
    const dateInCollectionRaw =
      getCell(row, headerMap, "date in collection") ||
      getCell(row, headerMap, "date_in_collection")
    const sizeWeightRaw =
      getCell(row, headerMap, "product size/weight") ||
      getCell(row, headerMap, "size_weight")
    const finishedRaw = getCell(row, headerMap, "finished")

    rows.push({
      productString,
      brand,
      name,
      autoMatched,
      category,
      sizeWeight: sizeWeightRaw || null,
      manufactureDate: parseSophiaDate(manufactureRaw),
      dateInCollection: parseSophiaDate(dateInCollectionRaw),
      expirationDate: computeExpirationDate(expirationRaw, manufactureRaw, now),
      isFinished: TRUTHY_FINISHED.has(finishedRaw.toLowerCase()),
    })
  }

  return { rows, autoMatchedCount, errors: [] }
}

// ---------------------------------------------------------------------------
// Internal CSV parser (same logic as history-csv.ts — kept local to avoid
// coupling the two parsers)
// ---------------------------------------------------------------------------

function parseCsvText(text: string): string[][] {
  const normalized = text.startsWith("\uFEFF") ? text.slice(1) : text
  const result: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i]
    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
      continue
    }
    if (char === '"') { inQuotes = true; continue }
    if (char === ",") { row.push(cell); cell = ""; continue }
    if (char === "\r") {
      if (normalized[i + 1] === "\n") i++
      row.push(cell); result.push(row); row = []; cell = ""
      continue
    }
    if (char === "\n") {
      row.push(cell); result.push(row); row = []; cell = ""
      continue
    }
    cell += char
  }
  row.push(cell)
  result.push(row)
  return result
}

function getCell(
  row: string[],
  headerMap: Map<string, number>,
  header: string
): string {
  const idx = headerMap.get(header)
  if (idx === undefined) return ""
  return (row[idx] ?? "").trim()
}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/constants.ts lib/import/brands.ts lib/import/collection-csv.ts
git commit -m "feat(import): add Sophia-format CSV parser and brand list"
```

---

## Task 3: Parser Unit Tests

**Files:**
- Create: `__tests__/import/collection-csv.test.ts`

- [ ] **Step 1: Write the tests**

Create `__tests__/import/collection-csv.test.ts`:

```typescript
import { describe, expect, it } from "vitest"
import {
  autoSplitBrand,
  computeExpirationDate,
  detectCategoryFromFilename,
  detectSophiaFormat,
  parseCollectionCsv,
  parseSophiaDate,
} from "@/lib/import/collection-csv"

const NOW = new Date("2026-04-05T12:00:00.000Z")

describe("parseSophiaDate", () => {
  it("parses full date string", () => {
    expect(parseSophiaDate("September 1, 2023")).toBe("2023-09-01")
  })

  it("parses month-year only", () => {
    expect(parseSophiaDate("March, 2024")).toBe("2024-03-01")
  })

  it("parses month year without comma", () => {
    expect(parseSophiaDate("March 2024")).toBe("2024-03-01")
  })

  it("parses date with leading zero day", () => {
    expect(parseSophiaDate("January 01, 2027")).toBe("2027-01-01")
  })

  it("returns null for Unknown", () => {
    expect(parseSophiaDate("Unknown")).toBeNull()
  })

  it("returns null for blank string", () => {
    expect(parseSophiaDate("")).toBeNull()
  })
})

describe("computeExpirationDate", () => {
  it("uses expiration date when provided and valid", () => {
    expect(
      computeExpirationDate("October 1, 2026", "October 1, 2024", NOW)
    ).toBe("2026-10-01")
  })

  it("falls back to manufacture date + 1 year when expiry is missing", () => {
    expect(computeExpirationDate(null, "October 1, 2024", NOW)).toBe("2025-10-01")
  })

  it("falls back to today + 1 year when both are missing", () => {
    expect(computeExpirationDate(null, null, NOW)).toBe("2027-04-05")
  })

  it("falls back to manufacture date + 1 year when expiry is Unknown", () => {
    expect(computeExpirationDate("Unknown", "October 1, 2024", NOW)).toBe("2025-10-01")
  })
})

describe("autoSplitBrand", () => {
  it("splits a known brand from the start of the string", () => {
    expect(autoSplitBrand("Tatcha Duo Rice Cleanse")).toEqual({
      brand: "Tatcha",
      name: "Duo Rice Cleanse",
    })
  })

  it("handles multi-word brands", () => {
    expect(autoSplitBrand("Estée Lauder Advanced Night Repair")).toEqual({
      brand: "Estée Lauder",
      name: "Advanced Night Repair",
    })
  })

  it("is case-insensitive", () => {
    expect(autoSplitBrand("TATCHA Duo Rice Cleanse")).toEqual({
      brand: "Tatcha",
      name: "Duo Rice Cleanse",
    })
  })

  it("returns null for unknown brand", () => {
    expect(autoSplitBrand("Some Unknown Brand Product")).toBeNull()
  })
})

describe("detectCategoryFromFilename", () => {
  it("detects makeup from mascara filename", () => {
    expect(
      detectCategoryFromFilename("Project Pan Products Master List - Mascara.csv")
    ).toBe("makeup")
  })

  it("detects skincare from serums filename", () => {
    expect(
      detectCategoryFromFilename("Project Pan Products Master List - Serums.csv")
    ).toBe("skincare")
  })

  it("returns null for unrecognized filename", () => {
    expect(detectCategoryFromFilename("random-file.csv")).toBeNull()
  })
})

describe("detectSophiaFormat", () => {
  it("returns true for Sophia headers", () => {
    expect(
      detectSophiaFormat(["Product", "Product Size/Weight", "Manufacture Date"])
    ).toBe(true)
  })

  it("returns false when brand/name columns are present", () => {
    expect(
      detectSophiaFormat(["brand", "name", "category"])
    ).toBe(false)
  })
})

describe("parseCollectionCsv", () => {
  const MASCARA_CSV = [
    "Product,Product Size/Weight,Manufacture Date,Date in Collection,Expiration Date,,Key,finished",
    'Tatcha Duo Rice Cleanse,1.7 oz,"July 1, 2024",Unknown,"July 1, 2027",,,',
    'L\'Oreal Lash Paradise,0.15 oz,"March, 2024",,,,, yes',
    "Some Unknown Brand Product,0.5 oz,,,,,, ",
  ].join("\n")

  it("returns error when Product column is missing", () => {
    const result = parseCollectionCsv("brand,name\nRare Beauty,Blush", "makeup", NOW)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain("Product")
  })

  it("parses rows with known and unknown brands", () => {
    const result = parseCollectionCsv(MASCARA_CSV, "skincare", NOW)

    expect(result.errors).toHaveLength(0)
    expect(result.rows).toHaveLength(3)
    expect(result.autoMatchedCount).toBe(2)
  })

  it("assigns the provided category to all rows", () => {
    const result = parseCollectionCsv(MASCARA_CSV, "skincare", NOW)
    expect(result.rows.every((r) => r.category === "skincare")).toBe(true)
  })

  it("marks finished rows correctly", () => {
    const result = parseCollectionCsv(MASCARA_CSV, "makeup", NOW)
    const lOreal = result.rows.find((r) => r.productString.startsWith("L'Oreal"))
    expect(lOreal?.isFinished).toBe(true)
  })

  it("auto-splits known brands", () => {
    const result = parseCollectionCsv(MASCARA_CSV, "makeup", NOW)
    const tatcha = result.rows.find((r) => r.productString.startsWith("Tatcha"))
    expect(tatcha?.brand).toBe("Tatcha")
    expect(tatcha?.name).toBe("Duo Rice Cleanse")
    expect(tatcha?.autoMatched).toBe(true)
  })

  it("leaves brand blank for unrecognized products", () => {
    const result = parseCollectionCsv(MASCARA_CSV, "makeup", NOW)
    const unknown = result.rows.find((r) => r.productString.startsWith("Some Unknown"))
    expect(unknown?.brand).toBe("")
    expect(unknown?.name).toBe("Some Unknown Brand Product")
    expect(unknown?.autoMatched).toBe(false)
  })

  it("computes expiration date from expiration column when present", () => {
    const result = parseCollectionCsv(MASCARA_CSV, "skincare", NOW)
    const tatcha = result.rows.find((r) => r.productString.startsWith("Tatcha"))
    expect(tatcha?.expirationDate).toBe("2027-07-01")
  })

  it("skips Wish List section header rows", () => {
    const csv = [
      "Product,finished",
      "Tatcha Cleanser,",
      "Wish List ,",
      "Some Brand Product,",
    ].join("\n")
    const result = parseCollectionCsv(csv, "skincare", NOW)
    expect(result.rows).toHaveLength(2)
    expect(result.rows.some((r) => r.productString === "Wish List")).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests and verify they pass**

```bash
npm test -- __tests__/import/collection-csv.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/import/collection-csv.test.ts
git commit -m "test(import): add collection CSV parser unit tests"
```

---

## Task 4: Validation Schema + Import Collection Service

**Files:**
- Create: `lib/validations/import-collection.ts`
- Create: `lib/services/import-collection.ts`

- [ ] **Step 1: Write the Zod validation schema**

Create `lib/validations/import-collection.ts`:

```typescript
import { z } from "zod"

const CATEGORIES = [
  "makeup",
  "skincare",
  "haircare",
  "bodycare",
  "fragrance",
  "tools",
  "other",
] as const

export const collectionRowSchema = z.object({
  brand: z.string().max(100).default(""),
  name: z.string().min(1).max(200),
  category: z.enum(CATEGORIES),
  sizeWeight: z.string().max(100).nullable(),
  manufactureDate: z.string().nullable(),
  dateInCollection: z.string().nullable(),
  expirationDate: z.string(),
  isFinished: z.boolean(),
})

export const importCollectionBodySchema = z.object({
  rows: z.array(collectionRowSchema).min(1).max(500),
})

export type CollectionRow = z.infer<typeof collectionRowSchema>
export type ImportCollectionBody = z.infer<typeof importCollectionBodySchema>
```

- [ ] **Step 2: Write the import collection service**

Create `lib/services/import-collection.ts`:

```typescript
import { createClient } from "@/lib/supabase/server"
import { normalizeProductKey } from "@/lib/import/history-csv"
import type { CollectionRow } from "@/lib/validations/import-collection"

export interface ImportCollectionSummary {
  imported: number
  skipped: number
  errors: string[]
}

export async function importCollectionRows(
  userId: string,
  rows: CollectionRow[]
): Promise<ImportCollectionSummary> {
  const supabase = await createClient()
  const summary: ImportCollectionSummary = { imported: 0, skipped: 0, errors: [] }

  const { data: existingProducts, error: fetchError } = await supabase
    .from("products")
    .select("id,brand,name")
    .eq("user_id", userId)

  if (fetchError) {
    summary.errors.push(`Failed to load existing products: ${fetchError.message}`)
    return summary
  }

  // Map normalizedKey → product id for dedup
  const productByKey = new Map<string, string>()
  for (const p of existingProducts ?? []) {
    const key = normalizeProductKey(p.brand, p.name)
    if (!productByKey.has(key)) {
      productByKey.set(key, p.id)
    }
  }

  const now = new Date()
  const finishedMonth = now.getMonth() + 1
  const finishedYear = now.getFullYear()

  for (const row of rows) {
    const key = normalizeProductKey(row.brand, row.name)
    let productId = productByKey.get(key)

    if (!productId) {
      const { data: created, error: createError } = await supabase
        .from("products")
        .insert({
          user_id: userId,
          brand: row.brand,
          name: row.name,
          category: row.category,
          size_weight: row.sizeWeight,
          manufacture_date: row.manufactureDate,
          date_in_collection: row.dateInCollection,
          expiration_date: row.expirationDate,
        })
        .select("id")
        .single()

      if (createError || !created) {
        summary.errors.push(
          `Failed to create product "${row.name}": ${createError?.message ?? "unknown error"}`
        )
        continue
      }

      productId = created.id
      productByKey.set(key, productId)
    } else {
      // Update metadata on existing product (overwrites with freshest data from import)
      await supabase
        .from("products")
        .update({
          size_weight: row.sizeWeight,
          manufacture_date: row.manufactureDate,
          date_in_collection: row.dateInCollection,
          expiration_date: row.expirationDate,
        })
        .eq("id", productId)
        .eq("user_id", userId)
    }

    if (row.isFinished) {
      const { data: panEntry, error: panError } = await supabase
        .from("pan_entries")
        .insert({
          user_id: userId,
          product_id: productId,
          status: "empty",
          usage_level: "just_started",
          started_month: finishedMonth,
          started_year: finishedYear,
        })
        .select("id")
        .single()

      if (panError || !panEntry) {
        if (panError?.code === "23505") {
          // Duplicate — product already has an entry this month
          summary.skipped++
          continue
        }
        summary.errors.push(
          `Failed to create pan entry for "${row.name}": ${panError?.message ?? "unknown error"}`
        )
        continue
      }

      const { error: emptyError } = await supabase.from("empties").insert({
        user_id: userId,
        pan_entry_id: panEntry.id,
        product_id: productId,
        finished_month: finishedMonth,
        finished_year: finishedYear,
      })

      if (emptyError) {
        // Roll back the pan_entry we just created
        await supabase
          .from("pan_entries")
          .delete()
          .eq("id", panEntry.id)
          .eq("user_id", userId)
        summary.errors.push(
          `Failed to create empty for "${row.name}": ${emptyError.message}`
        )
        continue
      }
    }

    summary.imported++
  }

  return summary
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/validations/import-collection.ts lib/services/import-collection.ts
git commit -m "feat(import): add collection import service and validation schema"
```

---

## Task 5: POST /api/import/collection Route + Route Test

**Files:**
- Create: `app/api/import/collection/route.ts`
- Create: `__tests__/api/import-collection-route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/import-collection-route.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/services/import-collection", () => ({
  importCollectionRows: vi.fn(),
}))
vi.mock("@/lib/cache/tab-cache", () => ({
  revalidateForProductMutation: vi.fn(),
  revalidateForEmptiesMutation: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { importCollectionRows } from "@/lib/services/import-collection"
import { POST } from "@/app/api/import/collection/route"

const USER_ID = "11111111-1111-1111-1111-111111111111"

const VALID_ROW = {
  brand: "Tatcha",
  name: "Duo Rice Cleanse",
  category: "skincare",
  sizeWeight: "1.7 oz",
  manufactureDate: "2024-07-01",
  dateInCollection: null,
  expirationDate: "2027-07-01",
  isFinished: false,
}

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/import/collection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/import/collection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: USER_ID } },
        }),
      },
    } as never)
    vi.mocked(importCollectionRows).mockResolvedValue({
      imported: 1,
      skipped: 0,
      errors: [],
    })
  })

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as never)

    const res = await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when body is invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/import/collection", {
      method: "POST",
      body: "not-json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 when rows array is empty", async () => {
    const res = await POST(makeRequest({ rows: [] }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when a row is missing required fields", async () => {
    const res = await POST(makeRequest({ rows: [{ brand: "Tatcha" }] }))
    expect(res.status).toBe(400)
  })

  it("returns summary on success", async () => {
    const res = await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ imported: 1, skipped: 0, errors: [] })
  })

  it("calls importCollectionRows with userId and parsed rows", async () => {
    await POST(makeRequest({ rows: [VALID_ROW] }))
    expect(importCollectionRows).toHaveBeenCalledWith(USER_ID, [VALID_ROW])
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
npm test -- __tests__/api/import-collection-route.test.ts
```

Expected: FAIL — `@/app/api/import/collection/route` not found.

- [ ] **Step 3: Create the route handler**

Create `app/api/import/collection/route.ts`:

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { revalidateForEmptiesMutation, revalidateForProductMutation } from "@/lib/cache/tab-cache"
import { importCollectionRows } from "@/lib/services/import-collection"
import { importCollectionBodySchema } from "@/lib/validations/import-collection"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = importCollectionBodySchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ")
    return NextResponse.json({ error: `Invalid request body: ${message}` }, { status: 400 })
  }

  const summary = await importCollectionRows(user.id, parsed.data.rows)

  if (summary.imported > 0) {
    revalidateForProductMutation(user.id)
    revalidateForEmptiesMutation(user.id)
  }

  return NextResponse.json(summary)
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npm test -- __tests__/api/import-collection-route.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/import/collection/route.ts __tests__/api/import-collection-route.test.ts
git commit -m "feat(api): add POST /api/import/collection route"
```

---

## Task 6: ImportCollectionSheet (Multi-Step UI)

**Files:**
- Create: `components/import/ImportCollectionSheet.tsx`

This is a three-step bottom sheet built on the existing `BottomSheet` primitive.

- [ ] **Step 1: Create the component**

Create `components/import/ImportCollectionSheet.tsx`:

```typescript
"use client"

import { useRef, useState } from "react"
import { BottomSheet } from "@/components/shared/BottomSheet"
import {
  detectCategoryFromFilename,
  parseCollectionCsv,
  type ParsedCollectionRow,
} from "@/lib/import/collection-csv"
import { CATEGORY_LABELS, ALL_CATEGORIES } from "@/components/pan/utils"
import type { ProductCategory } from "@/lib/types/app"

interface ReviewRowState {
  index: number
  productString: string
  brand: string
  name: string
  skipped: boolean
}

interface ImportCollectionSheetProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

type Step = "file" | "review" | "preview" | "done"

export function ImportCollectionSheet({
  open,
  onClose,
  onImported,
}: ImportCollectionSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("file")
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<ProductCategory>("skincare")
  const [parseResult, setParseResult] = useState<ReturnType<
    typeof parseCollectionCsv
  > | null>(null)
  const [reviewRows, setReviewRows] = useState<ReviewRowState[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{
    imported: number
    skipped: number
    errors: string[]
  } | null>(null)

  function handleClose() {
    setStep("file")
    setFile(null)
    setParseResult(null)
    setReviewRows([])
    setError(null)
    setSummary(null)
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setError(null)

    if (selected) {
      const detected = detectCategoryFromFilename(selected.name)
      if (detected) setCategory(detected)
    }
  }

  async function handleParse() {
    if (!file) return
    setLoading(true)
    setError(null)

    const text = await file.text()
    const result = parseCollectionCsv(text, category)

    if (result.errors.length > 0) {
      setError(result.errors[0])
      setLoading(false)
      return
    }

    if (result.rows.length === 0) {
      setError("No product rows found in this file.")
      setLoading(false)
      return
    }

    setParseResult(result)

    const unmatched = result.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => !row.autoMatched)
      .map(({ row, index }) => ({
        index,
        productString: row.productString,
        brand: "",
        name: row.name,
        skipped: false,
      }))

    if (unmatched.length > 0) {
      setReviewRows(unmatched)
      setStep("review")
    } else {
      setStep("preview")
    }

    setLoading(false)
  }

  function updateReviewRow(
    index: number,
    field: "brand" | "name" | "skipped",
    value: string | boolean
  ) {
    setReviewRows((prev) =>
      prev.map((r) => (r.index === index ? { ...r, [field]: value } : r))
    )
  }

  function skipAllUnreviewed() {
    setReviewRows((prev) => prev.map((r) => ({ ...r, skipped: true })))
    setStep("preview")
  }

  function proceedFromReview() {
    setStep("preview")
  }

  function buildFinalRows(): ParsedCollectionRow[] {
    if (!parseResult) return []

    const reviewByIndex = new Map(reviewRows.map((r) => [r.index, r]))

    return parseResult.rows
      .map((row, index) => {
        if (row.autoMatched) return row

        const reviewed = reviewByIndex.get(index)
        if (!reviewed || reviewed.skipped) {
          // Import as-is with blank brand
          return { ...row, brand: "", name: row.productString }
        }
        return {
          ...row,
          brand: reviewed.brand.trim(),
          name: reviewed.name.trim() || row.productString,
        }
      })
      .filter((row) => row.name.trim().length > 0)
  }

  async function handleImport() {
    setLoading(true)
    setError(null)

    const finalRows = buildFinalRows()

    const res = await fetch("/api/import/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: finalRows }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Import failed")
      setLoading(false)
      return
    }

    setSummary(data)
    setStep("done")
    setLoading(false)
    onImported()
  }

  const finishedCount = parseResult?.rows.filter((r) => r.isFinished).length ?? 0
  const totalRows = parseResult?.rows.length ?? 0
  const notYetPannedCount = totalRows - finishedCount

  return (
    <BottomSheet open={open} onClose={handleClose} title="Import Collection">
      {/* Step 1: File + Category */}
      {step === "file" && (
        <div className="flex flex-col gap-4 p-4 pb-8">
          <p className="text-sm text-muted-foreground">
            Upload one of Sophia&apos;s per-category CSV files. Category is
            auto-detected from the filename.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            {file && (
              <p className="text-[12px] text-muted-foreground">{file.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleParse}
            disabled={!file || loading}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Parsing…" : "Next"}
          </button>
        </div>
      )}

      {/* Step 2: Brand/Name Review */}
      {step === "review" && parseResult && (
        <div className="flex flex-col gap-4 p-4 pb-8">
          <div>
            <p className="text-sm font-medium">
              {parseResult.autoMatchedCount} products auto-matched
            </p>
            <p className="text-sm text-muted-foreground">
              {reviewRows.length} product
              {reviewRows.length !== 1 ? "s" : ""} need brand/name review.
            </p>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[50vh]">
            {reviewRows.map((r) => (
              <div
                key={r.index}
                className="rounded-xl border border-border bg-card p-3 flex flex-col gap-2"
              >
                <p className="text-xs text-muted-foreground truncate">
                  {r.productString}
                </p>
                {!r.skipped && (
                  <>
                    <input
                      type="text"
                      placeholder="Brand (optional)"
                      value={r.brand}
                      onChange={(e) =>
                        updateReviewRow(r.index, "brand", e.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Product name"
                      value={r.name}
                      onChange={(e) =>
                        updateReviewRow(r.index, "name", e.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={() =>
                    updateReviewRow(r.index, "skipped", !r.skipped)
                  }
                  className="self-start text-xs text-muted-foreground underline"
                >
                  {r.skipped ? "Undo skip" : "Skip (import as-is)"}
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={skipAllUnreviewed}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-border text-sm font-medium"
            >
              Skip all
            </button>
            <button
              type="button"
              onClick={proceedFromReview}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview + Confirm */}
      {step === "preview" && parseResult && (
        <div className="flex flex-col gap-4 p-4 pb-8">
          <div className="rounded-xl bg-muted px-4 py-3 flex flex-col gap-1">
            <p className="text-sm">
              <span className="font-semibold">{notYetPannedCount}</span> products
              to add to library
            </p>
            <p className="text-sm">
              <span className="font-semibold">{finishedCount}</span> marked as
              finished (will create empty records)
            </p>
          </div>

          <div className="overflow-y-auto max-h-[40vh] flex flex-col gap-2">
            {buildFinalRows().map((row, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{row.name}</p>
                  <p className="text-[12px] text-muted-foreground truncate">
                    {row.brand || "No brand"} · Exp.{" "}
                    {new Date(row.expirationDate).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {row.isFinished && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Finished
                  </span>
                )}
              </div>
            ))}
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Importing…" : `Import ${totalRows} products`}
          </button>
        </div>
      )}

      {/* Done */}
      {step === "done" && summary && (
        <div className="flex flex-col gap-4 p-4 pb-8">
          <div className="rounded-xl bg-muted px-4 py-3 flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">
              Import complete
            </p>
            <p className="text-sm text-muted-foreground">
              {summary.imported} imported · {summary.skipped} skipped
            </p>
          </div>

          {summary.errors.length > 0 && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3">
              <p className="text-sm font-medium text-destructive mb-1">
                {summary.errors.length} error
                {summary.errors.length !== 1 ? "s" : ""}
              </p>
              <ul className="list-disc list-inside text-sm text-destructive space-y-0.5">
                {summary.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          >
            Done
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If `BottomSheet` or `CATEGORY_LABELS`/`ALL_CATEGORIES` imports error, verify the exact import paths by checking `components/shared/BottomSheet.tsx` and `components/pan/utils.ts`.

- [ ] **Step 3: Commit**

```bash
git add components/import/ImportCollectionSheet.tsx
git commit -m "feat(import): add ImportCollectionSheet multi-step UI"
```

---

## Task 7: Wire ImportCollectionSheet into UserMenu

**Files:**
- Modify: `components/shared/UserMenu.tsx`

- [ ] **Step 1: Update UserMenu to open ImportCollectionSheet**

In `components/shared/UserMenu.tsx`, add the import and state, then render the sheet and a trigger button. Replace the full file content:

```typescript
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/actions/auth"
import { useTutorial } from "@/components/onboarding/TutorialContext"
import { ImportCollectionSheet } from "@/components/import/ImportCollectionSheet"

interface UserMenuProps {
  avatarUrl: string | null
  name: string | null
}

export function UserMenu({ avatarUrl, name }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [collectionSheetOpen, setCollectionSheetOpen] = useState(false)
  const { startTutorial } = useTutorial()
  const router = useRouter()

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?"

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="User menu"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name ?? "User avatar"}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 top-11 z-50 min-w-[160px] rounded-lg border bg-background shadow-lg">
              <Link
                href="/help"
                onClick={() => setOpen(false)}
                className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
              >
                Help
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setOpen(false)}
                className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
              >
                Wishlist
              </Link>
              <Link
                href="/import/csv"
                onClick={() => setOpen(false)}
                className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
              >
                Import History
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setCollectionSheetOpen(true)
                }}
                className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
              >
                Import Collection
              </button>
              <button
                onClick={() => {
                  startTutorial()
                  setOpen(false)
                }}
                className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
              >
                Take the Tour
              </button>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
                >
                  Sign out
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <ImportCollectionSheet
        open={collectionSheetOpen}
        onClose={() => setCollectionSheetOpen(false)}
        onImported={() => router.refresh()}
      />
    </>
  )
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: 0 errors, 0 lint warnings.

- [ ] **Step 3: Smoke test manually**

```bash
npm run dev
```

Open the user menu → "Import Collection" should open the sheet. Upload `docs/sophia/Project Pan Products Master List - Serums.csv`. Verify category auto-detects as `skincare`, step 2 shows unmatched rows, step 3 shows preview counts.

- [ ] **Step 4: Commit**

```bash
git add components/shared/UserMenu.tsx
git commit -m "feat(ui): wire ImportCollectionSheet into UserMenu"
```

---

## Task 8: ExpiryBadge + ProductCard + ProductsClient Expiry Sort

**Files:**
- Create: `components/products/ExpiryBadge.tsx`
- Modify: `components/products/ProductCard.tsx`
- Modify: `components/products/ProductsClient.tsx`
- Modify: `lib/loaders/tab-data.ts`

- [ ] **Step 1: Create ExpiryBadge**

Create `components/products/ExpiryBadge.tsx`:

```typescript
interface ExpiryBadgeProps {
  expirationDate: string | null
}

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })

export function ExpiryBadge({ expirationDate }: ExpiryBadgeProps) {
  if (!expirationDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expirationDate)
  const daysLeft = Math.round(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysLeft > 180) return null

  if (daysLeft <= 0) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
        Expired
      </span>
    )
  }

  if (daysLeft <= 30) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
        Exp. in {daysLeft}d
      </span>
    )
  }

  if (daysLeft <= 90) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
        Exp. {MONTH_FMT.format(expiry)}
      </span>
    )
  }

  // 91–180 days
  return (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
      Exp. {MONTH_FMT.format(expiry)}
    </span>
  )
}
```

- [ ] **Step 2: Add expiration_date to ProductCardData and render ExpiryBadge**

In `components/products/ProductCard.tsx`:

Add to the `ProductCardData` interface (after `last_bought_at: string`):
```typescript
  expiration_date: string | null
```

Add the import at the top:
```typescript
import { ExpiryBadge } from "./ExpiryBadge"
```

In the card body section (after the `"Bought …"` paragraph), add:
```typescript
          {product.expiration_date && (
            <div className="mt-1">
              <ExpiryBadge expirationDate={product.expiration_date} />
            </div>
          )}
```

- [ ] **Step 3: Add expiration_date to RawProduct and mapProducts in ProductsClient**

In `components/products/ProductsClient.tsx`:

Add to `RawProduct` interface (after `last_bought_at: string`):
```typescript
  expiration_date: string | null
```

Update `mapProducts` to pass the field through (add after `last_bought_at: p.last_bought_at`):
```typescript
    expiration_date: p.expiration_date,
```

Add a `sort` state and "Expiring Soon" sort option. Add at the top of the state declarations inside `ProductsClient`:
```typescript
  const [sort, setSort] = useState<"default" | "expiring">("default")
```

After the existing `useMemo` for `products`, add a sorted version:
```typescript
  const sortedProducts = useMemo(() => {
    if (sort !== "expiring") return products
    return [...products].sort((a, b) => {
      if (!a.expiration_date && !b.expiration_date) return 0
      if (!a.expiration_date) return 1
      if (!b.expiration_date) return -1
      return a.expiration_date.localeCompare(b.expiration_date)
    })
  }, [products, sort])
```

In the filter bar (after the category chips), add a sort toggle:
```typescript
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSort((s) => (s === "expiring" ? "default" : "expiring"))}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                sort === "expiring"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground"
              )}
            >
              Expiring Soon
            </button>
          </div>
```

Replace `products` with `sortedProducts` in the grid render.

- [ ] **Step 4: Add expiration_date to the products loader query**

In `lib/loaders/tab-data.ts`, in `getProductsTabData`, update the select string from:
```typescript
          .select("id,name,brand,category,photo_url,archived_at,last_bought_at")
```
to:
```typescript
          .select("id,name,brand,category,photo_url,archived_at,last_bought_at,expiration_date")
```

Also update the `RawProduct` type definition at the top of `tab-data.ts` (wherever it's defined) to add `expiration_date: string | null`.

- [ ] **Step 5: Typecheck and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add components/products/ExpiryBadge.tsx components/products/ProductCard.tsx components/products/ProductsClient.tsx lib/loaders/tab-data.ts
git commit -m "feat(products): add expiry badge and expiring-soon sort to product library"
```

---

## Task 9: getExpiringSoonProducts Loader + ExpiringSoonShelf

**Files:**
- Modify: `lib/loaders/tab-data.ts`
- Create: `components/pan/ExpiringSoonShelf.tsx`

- [ ] **Step 1: Add getExpiringSoonProducts to the loader**

In `lib/loaders/tab-data.ts`, add the following imports at the top (if not already present):
```typescript
import { EXPIRY_SHELF_DAYS } from "@/lib/constants"
```

Add this type near the top of the file:
```typescript
export interface ExpiringSoonProduct {
  id: string
  name: string
  brand: string
  category: string
  photo_url: string | null
  expiration_date: string
}
```

Add this function at the bottom of the file:
```typescript
export async function getExpiringSoonProducts(
  userId: string
): Promise<ExpiringSoonProduct[]> {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() + EXPIRY_SHELF_DAYS)
      const cutoffStr = cutoff.toISOString().slice(0, 10)

      const [{ data: activeEntries }, { data: expiring }] = await Promise.all([
        supabase
          .from("pan_entries")
          .select("product_id")
          .eq("user_id", userId)
          .eq("status", "active"),
        supabase
          .from("products")
          .select("id,name,brand,category,photo_url,expiration_date")
          .eq("user_id", userId)
          .is("archived_at", null)
          .not("expiration_date", "is", null)
          .lte("expiration_date", cutoffStr)
          .order("expiration_date", { ascending: true }),
      ])

      const activeIds = new Set((activeEntries ?? []).map((e) => e.product_id))

      return ((expiring ?? []) as ExpiringSoonProduct[]).filter(
        (p) => !activeIds.has(p.id)
      )
    },
    ["tab-expiring-soon", userId],
    {
      revalidate: TAB_REVALIDATE_SECONDS,
      tags: [productsTabTag(userId), panTabTag(userId)],
    }
  )()
}
```

- [ ] **Step 2: Create ExpiringSoonShelf**

Create `components/pan/ExpiringSoonShelf.tsx`:

```typescript
"use client"

import Image from "next/image"
import { CATEGORY_EMOJI } from "@/components/pan/utils"
import type { ExpiringSoonProduct } from "@/lib/loaders/tab-data"
import type { ProductCategory } from "@/lib/types/app"

const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

interface ExpiringSoonShelfProps {
  products: ExpiringSoonProduct[]
  onAddToPan: (productId: string) => Promise<void>
  addingId: string | null
}

export function ExpiringSoonShelf({
  products,
  onAddToPan,
  addingId,
}: ExpiringSoonShelfProps) {
  if (products.length === 0) return null

  return (
    <section className="px-4 pt-2 pb-0">
      <h2 className="mb-2 text-sm font-semibold text-foreground">Expiring Soon</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {products.map((product) => {
          const expiry = new Date(product.expiration_date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const daysLeft = Math.round(
            (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          const isExpired = daysLeft <= 0
          const isUrgent = daysLeft <= 30

          return (
            <div
              key={product.id}
              className="flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-gray-100 shadow-sm"
            >
              {/* Photo */}
              <div className="relative aspect-square w-full overflow-hidden bg-muted">
                {product.photo_url ? (
                  <Image
                    src={product.photo_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary">
                    <span className="text-3xl opacity-60">
                      {CATEGORY_EMOJI[product.category as ProductCategory]}
                    </span>
                  </div>
                )}
                <span
                  className={`absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isExpired
                      ? "bg-red-100 text-red-700"
                      : isUrgent
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isExpired
                    ? "Expired"
                    : isUrgent
                      ? `${daysLeft}d left`
                      : DATE_FMT.format(expiry)}
                </span>
              </div>

              {/* Info + button */}
              <div className="flex flex-col gap-1.5 p-2">
                <p className="line-clamp-2 text-[11px] font-bold uppercase tracking-wide leading-tight text-foreground">
                  {product.name}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {product.brand || "—"}
                </p>
                <button
                  type="button"
                  onClick={() => onAddToPan(product.id)}
                  disabled={addingId === product.id}
                  className="mt-0.5 flex h-8 w-full items-center justify-center rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {addingId === product.id ? "Adding…" : "Add to Pan"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/loaders/tab-data.ts components/pan/ExpiringSoonShelf.tsx
git commit -m "feat(pan): add expiring-soon products loader and shelf component"
```

---

## Task 10: Wire ExpiringSoonShelf into Pan Page + PanView

**Files:**
- Modify: `app/(app)/pan/[year]/[month]/page.tsx`
- Modify: `components/pan/PanView.tsx`

- [ ] **Step 1: Update the pan page to load expiring-soon products**

In `app/(app)/pan/[year]/[month]/page.tsx`, add the import:
```typescript
import { getExpiringSoonProducts } from "@/lib/loaders/tab-data"
```

Add `getExpiringSoonProducts(user.id)` to the `Promise.all` call:
```typescript
  const [{ entries, error }, wishlistedIds, monthsWithData, expiringSoonProducts] =
    await Promise.all([
      getPanTabData(user.id, year, month),
      getWishlistProductIds(user.id),
      getMonthsWithPanData(user.id),
      getExpiringSoonProducts(user.id),
    ])
```

Pass it to `PanView`:
```typescript
      expiringSoonProducts={expiringSoonProducts}
```

- [ ] **Step 2: Add expiringSoonProducts prop to PanView and render the shelf**

In `components/pan/PanView.tsx`:

Add the import at the top:
```typescript
import { ExpiringSoonShelf } from "./ExpiringSoonShelf"
import type { ExpiringSoonProduct } from "@/lib/loaders/tab-data"
```

Add to the `PanViewProps` interface:
```typescript
  expiringSoonProducts?: ExpiringSoonProduct[]
```

Update the destructure in the function signature:
```typescript
export function PanView({ year, month, entries, error, monthsWithData = new Set(), expiringSoonProducts = [] }: PanViewProps) {
```

Add `addingToPanId` state alongside the other state declarations:
```typescript
  const [addingToPanId, setAddingToPanId] = useState<string | null>(null)
```

Add the `handleAddToPan` handler (alongside other handlers in the component):
```typescript
  async function handleAddToPan(productId: string) {
    setAddingToPanId(productId)
    try {
      const res = await fetch(`/api/pans/${year}/${month}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, usage_level: "just_started" }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setAddingToPanId(null)
    }
  }
```

Render the shelf in the JSX, above the tabs/grid section (find the element just before the category/tab grid and insert above it):
```typescript
        <ExpiringSoonShelf
          products={expiringSoonProducts}
          onAddToPan={handleAddToPan}
          addingId={addingToPanId}
        />
```

- [ ] **Step 3: Typecheck and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: 0 errors.

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Smoke test**

```bash
npm run dev
```

- Import a CSV from `docs/sophia/` via UserMenu → Import Collection
- After import, visit `/products` — products should appear with expiry badges
- Select "Expiring Soon" sort to verify sort order
- Visit the pan view — if any imported products have expiration dates within 90 days, the shelf should appear with "Add to Pan" buttons

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/pan/\[year\]/\[month\]/page.tsx components/pan/PanView.tsx
git commit -m "feat(pan): add ExpiringSoonShelf to pan view"
```

---

## Final Steps

- [ ] **Run lint and typecheck one last time**

```bash
npm run lint && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Push and open PR**

```bash
git push -u origin feat/collection-import-expiry
gh pr create --title "feat: collection import + expiry recommendations" --body "$(cat <<'EOF'
## Summary
- Adds Sophia-format CSV collection importer (single file + category, brand auto-split, multi-step review UI)
- Stores product metadata: size/weight, manufacture date, date in collection, expiration date
- Expiry badges on product library cards (red/amber/green by urgency)
- "Expiring Soon" sort option in product library
- "Expiring Soon" horizontal shelf in pan view for backlog products expiring within 90 days

## Test plan
- [ ] Upload a CSV from docs/sophia/ via UserMenu → Import Collection
- [ ] Verify category auto-detects from filename
- [ ] Verify brand review step shows only unmatched rows, with auto-matched count header
- [ ] Verify expiry badges appear on product cards after import
- [ ] Verify "Expiring Soon" sort works (nulls last)
- [ ] Verify expiry shelf appears in pan view for products expiring within 90 days
- [ ] Run `npm test` — all pass
- [ ] Run `npx tsc --noEmit` — 0 errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
