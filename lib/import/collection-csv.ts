import type { ProductCategory } from "@/lib/types/app"
import { KNOWN_BRANDS_SORTED } from "./brands"

/** Maps lowercased filename keyword → app ProductCategory */
export const COLLECTION_CSV_CATEGORY_MAP: Record<string, ProductCategory> = {
  mascara: "mascara",
  cleansers: "cleanser",
  cleanser: "cleanser",
  serums: "serum",
  serum: "serum",
  moisturizer: "moisturizer",
  moisturizers: "moisturizer",
  mists: "mist",
  mist: "mist",
  "eye cream": "eye_cream",
  "eye creams": "eye_cream",
  tonor: "toner",
  toner: "toner",
  toners: "toner",
  miscellaneous: "miscellaneous",
  misc: "miscellaneous",
  blush: "miscellaneous",
  lipstick: "miscellaneous",
  foundation: "miscellaneous",
  eyeshadow: "miscellaneous",
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
 * Convert a Date object to a local ISO date string (YYYY-MM-DD).
 * Extracts local date components to avoid UTC timezone shift.
 */
function toLocalISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
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
    return toLocalISODate(direct)
  }

  // Try "Month, YYYY" or "Month YYYY" without a day
  const monthYear = trimmed.match(/^(\w+),?\s+(\d{4})$/)
  if (monthYear) {
    const parsed = new Date(`${monthYear[1]} 1, ${monthYear[2]}`)
    if (!isNaN(parsed.getTime())) {
      return toLocalISODate(parsed)
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
    const [yearStr, month, day] = parsedMfg.split("-")
    const nextYear = Number(yearStr) + 1
    // Clamp Feb 29 to Feb 28 in non-leap years
    const isLeap = nextYear % 4 === 0 && (nextYear % 100 !== 0 || nextYear % 400 === 0)
    const clampedDay = month === "02" && day === "29" && !isLeap ? "28" : day
    return `${nextYear}-${month}-${clampedDay}`
  }

  const fallback = new Date(today)
  fallback.setFullYear(fallback.getFullYear() + 1)
  return toLocalISODate(fallback)
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

export interface ParsedWishlistRow {
  /** Original value from the Product column */
  productString: string
  /** Auto-detected brand, or "" if unmatched */
  brand: string
  /** Product name (remainder after brand, or full string if unmatched) */
  name: string
  /** True if brand was auto-detected from the known list */
  autoMatched: boolean
}

export interface ParseCollectionResult {
  rows: ParsedCollectionRow[]
  autoMatchedCount: number
  wishlistRows: ParsedWishlistRow[]
  wishlistAutoMatchedCount: number
  /** Fatal parse errors (e.g. missing required column) */
  errors: string[]
}

export function parseCollectionCsv(
  csvText: string,
  category: ProductCategory,
  now = new Date()
): ParseCollectionResult {
  const rawRows = parseCsvText(csvText)

  const EMPTY: ParseCollectionResult = {
    rows: [],
    autoMatchedCount: 0,
    wishlistRows: [],
    wishlistAutoMatchedCount: 0,
    errors: [],
  }

  if (rawRows.length === 0) {
    return { ...EMPTY, errors: ["CSV file is empty"] }
  }

  const headerIndex = rawRows.findIndex((row) => row.some((cell) => cell.trim() !== ""))
  if (headerIndex < 0) {
    return { ...EMPTY, errors: ["CSV file is empty"] }
  }

  const headerRow = rawRows[headerIndex].map((cell) => cell.trim().toLowerCase())
  const headerMap = new Map<string, number>()
  headerRow.forEach((h, i) => {
    if (!headerMap.has(h)) headerMap.set(h, i)
  })

  if (!headerMap.has("product")) {
    return {
      ...EMPTY,
      errors: ['Missing required "Product" column — is this a Sophia-format CSV?'],
    }
  }

  const dataRows = rawRows
    .slice(headerIndex + 1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))

  const rows: ParsedCollectionRow[] = []
  let autoMatchedCount = 0
  const wishlistRows: ParsedWishlistRow[] = []
  let wishlistAutoMatchedCount = 0
  let inWishlistSection = false

  for (const row of dataRows) {
    const productString = getCell(row, headerMap, "product")
    if (!productString) continue

    // Detect wishlist/wants section header — rows after this go to the wishlist.
    // Handles: "Wish List", "Wishlist", "Wants", "Want" (case-insensitive, trimmed)
    const lowerProduct = productString.toLowerCase().trim()
    if (
      lowerProduct.startsWith("wish list") ||
      lowerProduct === "wishlist" ||
      lowerProduct === "wants" ||
      lowerProduct === "want"
    ) {
      inWishlistSection = true
      continue
    }

    const splitResult = autoSplitBrand(productString)
    const brand = splitResult ? splitResult.brand : ""
    const name = splitResult ? splitResult.name : productString
    const autoMatched = !!splitResult

    if (inWishlistSection) {
      const finishedRaw =
        getCell(row, headerMap, "finished?") ||
        getCell(row, headerMap, "finished")
      const isFinished = TRUTHY_FINISHED.has(finishedRaw.toLowerCase())

      if (isFinished) {
        // Finished wants items → add to product library with empty record
        if (autoMatched) autoMatchedCount++
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
          isFinished: true,
        })
      } else {
        // Not finished → add to wishlist
        if (autoMatched) wishlistAutoMatchedCount++
        wishlistRows.push({ productString, brand, name, autoMatched })
      }
      continue
    }

    if (autoMatched) autoMatchedCount++

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
    const finishedRaw =
      getCell(row, headerMap, "finished?") ||
      getCell(row, headerMap, "finished")

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

  return { rows, autoMatchedCount, wishlistRows, wishlistAutoMatchedCount, errors: [] }
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
