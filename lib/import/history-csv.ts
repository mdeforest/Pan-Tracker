import type { ProductCategory, WouldRepurchase } from "@/lib/types/app"
import { padMonth } from "@/lib/utils"

export const IMPORT_CSV_REQUIRED_HEADERS = [
  "brand",
  "name",
  "category",
] as const

export const IMPORT_CSV_OPTIONAL_HEADERS = [
  "status",
  "finished_month",
  "finished_year",
  "rating",
  "would_repurchase",
  "review_notes",
] as const

export const IMPORT_CSV_MAX_BYTES = 1024 * 1024
export const IMPORT_CSV_MAX_ROWS = 500

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "mascara",
  "cleanser",
  "serum",
  "moisturizer",
  "mist",
  "eye_cream",
  "toner",
  "miscellaneous",
]

export const WOULD_REPURCHASE_VALUES: WouldRepurchase[] = ["yes", "no", "maybe"]

const PRODUCT_CATEGORY_SET = new Set(PRODUCT_CATEGORIES)
const WOULD_REPURCHASE_SET = new Set(WOULD_REPURCHASE_VALUES)

export type ImportProductStatus = "empty" | "current_pan" | "backlog"

export interface ImportCsvError {
  row: number
  message: string
  /** Raw cell values from the row (populated for data-row errors, not header errors) */
  rawValues?: Record<string, string>
  /** True for file-level errors (bad/missing headers) that prevent any rows from being parsed */
  isFatal?: boolean
}

export interface ParsedHistoryCsvRow {
  row: number
  brand: string
  name: string
  category: ProductCategory
  status: ImportProductStatus
  finishedMonth: number | null
  finishedYear: number | null
  rating: number | null
  wouldRepurchase: WouldRepurchase | null
  reviewNotes: string | null
}

export interface ParseHistoryCsvResult {
  rows: ParsedHistoryCsvRow[]
  skipped: number
  errors: ImportCsvError[]
}

export function validateImportCsvFileSize(size: number): string | null {
  if (size > IMPORT_CSV_MAX_BYTES) {
    return `CSV must be ${Math.floor(IMPORT_CSV_MAX_BYTES / 1024 / 1024)} MB or smaller`
  }
  return null
}

export function normalizeProductKey(brand: string, name: string): string {
  return `${normalizeToken(brand)}::${normalizeToken(name)}`
}

export function toMonthToken(year: number, month: number): string {
  return `${year}-${padMonth(month)}`
}

export function getRollingImportWindow(now = new Date()) {
  const maxYear = now.getFullYear()
  const maxMonth = now.getMonth() + 1
  const maxIndex = maxYear * 12 + (maxMonth - 1)
  const minIndex = maxIndex - 36
  const minYear = Math.floor(minIndex / 12)
  const minMonth = (minIndex % 12) + 1

  return {
    minYear,
    minMonth,
    maxYear,
    maxMonth,
    minIndex,
    maxIndex,
  }
}

export function parseHistoryCsvText(csvText: string, now = new Date()): ParseHistoryCsvResult {
  const errors: ImportCsvError[] = []
  const skippedKeys = new Set<string>()
  const rows: ParsedHistoryCsvRow[] = []
  const rawRows = parseCsv(csvText)

  if (rawRows.length === 0) {
    return {
      rows: [],
      skipped: 0,
      errors: [{ row: 1, message: "CSV file is empty", isFatal: true }],
    }
  }

  const headerIndex = rawRows.findIndex((row) => row.some((cell) => cell.trim() !== ""))
  if (headerIndex < 0) {
    return {
      rows: [],
      skipped: 0,
      errors: [{ row: 1, message: "CSV file is empty", isFatal: true }],
    }
  }

  const headerRow = rawRows[headerIndex].map((cell) => cell.trim().toLowerCase())
  const headerMap = new Map<string, number>()
  headerRow.forEach((header, idx) => {
    if (!headerMap.has(header)) {
      headerMap.set(header, idx)
    }
  })

  const missingHeaders = IMPORT_CSV_REQUIRED_HEADERS.filter((header) => !headerMap.has(header))
  if (missingHeaders.length > 0) {
    // Check if this looks like a Sophia-format collection CSV (has "product" column)
    const looksLikeSophiaFormat = headerMap.has("product") && !headerMap.has("brand") && !headerMap.has("name")
    return {
      rows: [],
      skipped: 0,
      errors: [
        {
          row: headerIndex + 1,
          message: `Missing required header(s): ${missingHeaders.join(", ")}`,
          isFatal: true,
          rawValues: looksLikeSophiaFormat ? { _sophiaFormat: "true" } : undefined,
        },
      ],
    }
  }

  const dataRows = rawRows
    .slice(headerIndex + 1)
    .map((row, idx) => ({ row, rowNumber: headerIndex + 2 + idx }))
    .filter(({ row }) => row.some((cell) => cell.trim() !== ""))

  if (dataRows.length > IMPORT_CSV_MAX_ROWS) {
    return {
      rows: [],
      skipped: 0,
      errors: [
        {
          row: dataRows[IMPORT_CSV_MAX_ROWS].rowNumber,
          message: `CSV can include at most ${IMPORT_CSV_MAX_ROWS} rows`,
          isFatal: true,
        },
      ],
    }
  }

  const range = getRollingImportWindow(now)
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  for (const { row, rowNumber } of dataRows) {
    const rowErrors: string[] = []
    const brand = getCell(row, headerMap, "brand")
    const name = getCell(row, headerMap, "name")
    const status = parseStatus(getCell(row, headerMap, "status"))
    const categoryText = getCell(row, headerMap, "category").toLowerCase()
    const monthText = getCell(row, headerMap, "finished_month")
    const yearText = getCell(row, headerMap, "finished_year")
    const ratingText = getCell(row, headerMap, "rating")
    const repurchaseText = getCell(row, headerMap, "would_repurchase").toLowerCase()
    const reviewNotesText = getCell(row, headerMap, "review_notes")

    if (!brand) rowErrors.push("brand is required")
    if (!name) rowErrors.push("name is required")
    if (brand.length > 100) rowErrors.push("brand must be 100 characters or fewer")
    if (name.length > 200) rowErrors.push("name must be 200 characters or fewer")

    if (!categoryText) {
      rowErrors.push("category is required")
    } else if (!PRODUCT_CATEGORY_SET.has(categoryText as ProductCategory)) {
      rowErrors.push(`category must be one of: ${PRODUCT_CATEGORIES.join(", ")}`)
    }

    if (!status) {
      rowErrors.push("status must be one of: empty, current_pan, backlog")
    }

    let finishedMonth: number | null = null
    let finishedYear: number | null = null
    const hasMonth = monthText.length > 0
    const hasYear = yearText.length > 0
    const requiresMonthYear = status === "empty"
    const monthYearProvided = hasMonth || hasYear

    if (requiresMonthYear && !monthYearProvided) {
      rowErrors.push("finished_month and finished_year are required when status=empty")
    }

    if ((hasMonth && !hasYear) || (!hasMonth && hasYear)) {
      rowErrors.push("finished_month and finished_year must be provided together")
    }

    if (monthYearProvided) {
      const parsedMonth = Number.parseInt(monthText, 10)
      const parsedYear = Number.parseInt(yearText, 10)

      if (Number.isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        rowErrors.push("finished_month must be an integer from 1 to 12")
      }

      if (Number.isNaN(parsedYear)) {
        rowErrors.push("finished_year must be a valid integer year")
      }

      if (!Number.isNaN(parsedMonth) && !Number.isNaN(parsedYear)) {
        finishedMonth = parsedMonth
        finishedYear = parsedYear
      }
    }

    if (finishedMonth !== null && finishedYear !== null) {
      const monthIndex = finishedYear * 12 + (finishedMonth - 1)
      if (monthIndex < range.minIndex || monthIndex > range.maxIndex) {
        rowErrors.push(
          `finished date must be between ${toMonthToken(
            range.minYear,
            range.minMonth
          )} and ${toMonthToken(range.maxYear, range.maxMonth)}`
        )
      }
    }

    let rating: number | null = null
    let wouldRepurchase: WouldRepurchase | null = null
    let reviewNotes = reviewNotesText || null

    if (status === "empty") {
      if (ratingText) {
        rating = Number.parseInt(ratingText, 10)
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          rowErrors.push("rating must be an integer from 1 to 5")
        }
      }

      if (repurchaseText) {
        if (!WOULD_REPURCHASE_SET.has(repurchaseText as WouldRepurchase)) {
          rowErrors.push("would_repurchase must be yes, no, or maybe")
        } else {
          wouldRepurchase = repurchaseText as WouldRepurchase
        }
      }

      if (reviewNotes !== null && reviewNotes.length > 2000) {
        rowErrors.push("review_notes must be 2000 characters or fewer")
      }
    }

    if (status === "current_pan" && finishedMonth === null && finishedYear === null) {
      finishedMonth = currentMonth
      finishedYear = currentYear
    }

    if (status !== "empty") {
      rating = null
      wouldRepurchase = null
      if (status === "backlog") {
        reviewNotes = null
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNumber,
        message: rowErrors.join("; "),
        rawValues: {
          brand: getCell(row, headerMap, "brand"),
          name: getCell(row, headerMap, "name"),
          category: getCell(row, headerMap, "category"),
          status: getCell(row, headerMap, "status"),
          finished_month: getCell(row, headerMap, "finished_month"),
          finished_year: getCell(row, headerMap, "finished_year"),
          rating: getCell(row, headerMap, "rating"),
          would_repurchase: getCell(row, headerMap, "would_repurchase"),
          review_notes: getCell(row, headerMap, "review_notes"),
        },
      })
      continue
    }

    const normalizedStatus = status as ImportProductStatus
    const duplicateKey =
      normalizedStatus === "empty"
        ? `${normalizeProductKey(brand, name)}::${normalizedStatus}::${finishedYear}::${finishedMonth}`
        : `${normalizeProductKey(brand, name)}::${normalizedStatus}`
    if (skippedKeys.has(duplicateKey)) {
      continue
    }

    skippedKeys.add(duplicateKey)
    rows.push({
      row: rowNumber,
      brand,
      name,
      category: categoryText as ProductCategory,
      status: normalizedStatus,
      finishedMonth,
      finishedYear,
      rating,
      wouldRepurchase,
      reviewNotes,
    })
  }

  return {
    rows,
    skipped: dataRows.length - rows.length - errors.length,
    errors,
  }
}

function parseCsv(inputText: string): string[][] {
  const text = inputText.startsWith("\uFEFF") ? inputText.slice(1) : inputText
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ",") {
      row.push(cell)
      cell = ""
      continue
    }

    if (char === "\r") {
      if (text[i + 1] === "\n") {
        i += 1
      }
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
      continue
    }

    if (char === "\n") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
      continue
    }

    cell += char
  }

  row.push(cell)
  rows.push(row)

  return rows
}

function getCell(row: string[], headerMap: Map<string, number>, header: string): string {
  const idx = headerMap.get(header)
  if (idx === undefined) return ""
  return (row[idx] ?? "").trim()
}

function normalizeToken(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

function parseStatus(raw: string): ImportProductStatus | null {
  const value = raw.trim().toLowerCase()

  if (!value || value === "empty" || value === "emptied") return "empty"
  if (
    value === "current_pan" ||
    value === "current pan" ||
    value === "active" ||
    value === "in_pan" ||
    value === "in pan" ||
    value === "pan"
  ) {
    return "current_pan"
  }

  if (
    value === "backlog" ||
    value === "product_backlog" ||
    value === "products backlog" ||
    value === "library"
  ) {
    return "backlog"
  }

  return null
}
