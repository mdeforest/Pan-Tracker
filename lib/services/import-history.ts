import { createClient } from "@/lib/supabase/server"
import {
  normalizeProductKey,
  parseHistoryCsvText,
  toMonthToken,
  type ImportCsvError,
  type ParsedHistoryCsvRow,
} from "@/lib/import/history-csv"
import type { ProductCategory } from "@/lib/types/app"

interface ImportSummary {
  imported: number
  skipped: number
  errors: ImportCsvError[]
  oldestImportedMonth: string | null
}

interface ProductMatch {
  id: string
  category: ProductCategory
  archivedAt: string | null
}

function createEmptyKey(productId: string, finishedYear: number, finishedMonth: number) {
  return `${productId}::${finishedYear}::${finishedMonth}`
}

function createActiveKey(productId: string) {
  return `${productId}`
}

function pickPreferredProduct(current: ProductMatch | undefined, candidate: ProductMatch) {
  if (!current) return candidate
  if (current.archivedAt && !candidate.archivedAt) return candidate
  return current
}

function applyRowToOldestMonth(
  current: string | null,
  finishedYear: number,
  finishedMonth: number
): string {
  const next = toMonthToken(finishedYear, finishedMonth)
  if (!current) return next

  const [currentYear, currentMonth] = current.split("-").map(Number)
  if (finishedYear < currentYear) return next
  if (finishedYear === currentYear && finishedMonth < currentMonth) return next
  return current
}

async function loadImportContext(userId: string) {
  const supabase = await createClient()
  const [productsResult, emptiesResult, activeEntriesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id,brand,name,category,archived_at")
      .eq("user_id", userId),
    supabase
      .from("empties")
      .select("product_id,finished_year,finished_month")
      .eq("user_id", userId),
    supabase
      .from("pan_entries")
      .select("product_id")
      .eq("user_id", userId)
      .eq("status", "active"),
  ])

  if (productsResult.error) {
    return {
      supabase,
      productByKey: new Map<string, ProductMatch>(),
      existingEmptyKeys: new Set<string>(),
      existingActiveProductIds: new Set<string>(),
      error: `Failed to fetch products: ${productsResult.error.message}`,
    }
  }

  if (emptiesResult.error) {
    return {
      supabase,
      productByKey: new Map<string, ProductMatch>(),
      existingEmptyKeys: new Set<string>(),
      existingActiveProductIds: new Set<string>(),
      error: `Failed to fetch empties: ${emptiesResult.error.message}`,
    }
  }

  if (activeEntriesResult.error) {
    return {
      supabase,
      productByKey: new Map<string, ProductMatch>(),
      existingEmptyKeys: new Set<string>(),
      existingActiveProductIds: new Set<string>(),
      error: `Failed to fetch active pan entries: ${activeEntriesResult.error.message}`,
    }
  }

  const productByKey = new Map<string, ProductMatch>()
  for (const row of productsResult.data ?? []) {
    const key = normalizeProductKey(row.brand, row.name)
    const candidate = {
      id: row.id,
      category: row.category as ProductCategory,
      archivedAt: row.archived_at,
    }
    productByKey.set(key, pickPreferredProduct(productByKey.get(key), candidate))
  }

  const existingEmptyKeys = new Set<string>()
  for (const row of emptiesResult.data ?? []) {
    existingEmptyKeys.add(createEmptyKey(row.product_id, row.finished_year, row.finished_month))
  }

  const existingActiveProductIds = new Set<string>()
  for (const row of activeEntriesResult.data ?? []) {
    existingActiveProductIds.add(createActiveKey(row.product_id))
  }

  return { supabase, productByKey, existingEmptyKeys, existingActiveProductIds, error: null }
}

function initializeSummary(parsed: ReturnType<typeof parseHistoryCsvText>): ImportSummary {
  return {
    imported: 0,
    skipped: parsed.skipped,
    errors: [...parsed.errors],
    oldestImportedMonth: null,
  }
}

export async function previewHistoryCsvImport(
  userId: string,
  csvText: string,
  now = new Date()
): Promise<ImportSummary> {
  const parsed = parseHistoryCsvText(csvText, now)
  const summary = initializeSummary(parsed)

  if (parsed.rows.length === 0) {
    return summary
  }

  const context = await loadImportContext(userId)
  if (context.error) {
    summary.errors.push({ row: 0, message: context.error })
    return summary
  }

  for (const row of parsed.rows) {
    const product = context.productByKey.get(normalizeProductKey(row.brand, row.name))

    if (product && shouldSkipForExistingData(row, product.id, context.existingEmptyKeys, context.existingActiveProductIds)) {
      summary.skipped += 1
      continue
    }

    summary.imported += 1
    summary.oldestImportedMonth = applyOldestImportedMonth(summary.oldestImportedMonth, row)
  }

  return summary
}

export async function importHistoryCsv(
  userId: string,
  csvText: string,
  now = new Date()
): Promise<ImportSummary> {
  const parsed = parseHistoryCsvText(csvText, now)
  const summary = initializeSummary(parsed)

  if (parsed.rows.length === 0) {
    return summary
  }

  const context = await loadImportContext(userId)
  if (context.error) {
    summary.errors.push({ row: 0, message: context.error })
    return summary
  }

  for (const row of parsed.rows) {
    let product = context.productByKey.get(normalizeProductKey(row.brand, row.name))

    if (!product) {
      const created = await createProductForRow(context.supabase, userId, row)
      if (!created) {
        summary.errors.push({ row: row.row, message: "Failed to create product for row" })
        continue
      }
      product = created
      context.productByKey.set(normalizeProductKey(row.brand, row.name), created)
    }

    if (shouldSkipForExistingData(row, product.id, context.existingEmptyKeys, context.existingActiveProductIds)) {
      summary.skipped += 1
      continue
    }

    const result = await importRowByStatus(context.supabase, userId, product.id, row)
    if (!result.ok) {
      if (result.reason === "duplicate") {
        summary.skipped += 1
      } else {
        summary.errors.push({ row: row.row, message: result.reason })
      }
      continue
    }

    if (row.status === "empty" && row.finishedMonth !== null && row.finishedYear !== null) {
      context.existingEmptyKeys.add(createEmptyKey(product.id, row.finishedYear, row.finishedMonth))
    }
    if (row.status === "current_pan") {
      context.existingActiveProductIds.add(createActiveKey(product.id))
    }

    summary.imported += 1
    summary.oldestImportedMonth = applyOldestImportedMonth(summary.oldestImportedMonth, row)
  }

  return summary
}

async function createProductForRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  row: ParsedHistoryCsvRow
): Promise<ProductMatch | null> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      user_id: userId,
      brand: row.brand,
      name: row.name,
      category: row.category,
    })
    .select("id,category,archived_at")
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    category: data.category as ProductCategory,
    archivedAt: data.archived_at,
  }
}

function shouldSkipForExistingData(
  row: ParsedHistoryCsvRow,
  productId: string,
  existingEmptyKeys: Set<string>,
  existingActiveProductIds: Set<string>
) {
  if (row.status === "empty" && row.finishedMonth !== null && row.finishedYear !== null) {
    return existingEmptyKeys.has(createEmptyKey(productId, row.finishedYear, row.finishedMonth))
  }

  if (row.status === "current_pan") {
    return existingActiveProductIds.has(createActiveKey(productId))
  }

  return false
}

function applyOldestImportedMonth(current: string | null, row: ParsedHistoryCsvRow) {
  if (row.status !== "empty" || row.finishedMonth === null || row.finishedYear === null) {
    return current
  }
  return applyRowToOldestMonth(current, row.finishedYear, row.finishedMonth)
}

async function importRowByStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  productId: string,
  row: ParsedHistoryCsvRow
): Promise<{ ok: true } | { ok: false; reason: string | "duplicate" }> {
  if (row.status === "backlog") {
    return { ok: true }
  }

  if (row.status === "current_pan") {
    const startedMonth = row.finishedMonth ?? new Date().getMonth() + 1
    const startedYear = row.finishedYear ?? new Date().getFullYear()

    const { error } = await supabase
      .from("pan_entries")
      .insert({
        user_id: userId,
        product_id: productId,
        status: "active",
        usage_level: "just_started",
        started_month: startedMonth,
        started_year: startedYear,
      })

    if (!error) return { ok: true }
    if (error.code === "23505") return { ok: false, reason: "duplicate" }
    return { ok: false, reason: `Failed to create active pan entry: ${error.message}` }
  }

  if (row.finishedMonth === null || row.finishedYear === null) {
    return { ok: false, reason: "Empty rows require finished_month and finished_year" }
  }

  const { data: panEntry, error: panError } = await supabase
    .from("pan_entries")
    .insert({
      user_id: userId,
      product_id: productId,
      status: "empty",
      usage_level: "just_started",
      started_month: row.finishedMonth,
      started_year: row.finishedYear,
    })
    .select("id")
    .single()

  if (panError || !panEntry) {
    return {
      ok: false,
      reason: `Failed to create pan entry: ${panError?.message ?? "unknown error"}`,
    }
  }

  const { error: emptyError } = await supabase.from("empties").insert({
    user_id: userId,
    pan_entry_id: panEntry.id,
    product_id: productId,
    finished_month: row.finishedMonth,
    finished_year: row.finishedYear,
    rating: row.rating,
    would_repurchase: row.wouldRepurchase,
    review_notes: row.reviewNotes,
  })

  if (emptyError) {
    await supabase.from("pan_entries").delete().eq("id", panEntry.id).eq("user_id", userId)
    return { ok: false, reason: `Failed to create empty: ${emptyError.message}` }
  }

  return { ok: true }
}
