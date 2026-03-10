import { createAdminClient } from "@/lib/supabase/server-admin"
import { currentYearMonth } from "@/lib/utils"
import type { ProductCategory } from "@/lib/types/app"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryBreakdownPoint {
  category: ProductCategory
  label: string
  count: number
}

export interface MonthlyTrendPoint {
  label: string
  year: number
  month: number
  count: number
}

export interface BrandCount {
  brand: string
  count: number
}

export interface CategoryAvgMonths {
  category: ProductCategory
  label: string
  avgMonths: number
  count: number
}

export interface StatsData {
  totalEmpties: number
  currentStreak: number
  longestStreak: number
  categoryBreakdown: CategoryBreakdownPoint[]
  monthlyTrend: MonthlyTrendPoint[]
  topBrands: BrandCount[]
  avgTimeByCategory: CategoryAvgMonths[]
  hasData: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  makeup: "Makeup",
  skincare: "Skincare",
  haircare: "Haircare",
  bodycare: "Bodycare",
  fragrance: "Fragrance",
  tools: "Tools",
  other: "Other",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns "YYYY-M" key for a year+month pair. */
function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

/**
 * Decrements a year/month by one month.
 * month is 1-based (1 = January).
 */
function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

/**
 * Increments a year/month by one month.
 * month is 1-based.
 */
function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

/** Short display label: "Mar 25" */
function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${String(year).slice(2)}`
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

function computeCurrentStreak(
  monthsWithEmpties: Set<string>,
  currentYear: number,
  currentMonth: number
): number {
  // If the current month already has an empty, count it; otherwise start
  // from the previous month (the streak can still be alive mid-month).
  let { year, month } = currentMonthHasEmpty(monthsWithEmpties, currentYear, currentMonth)
    ? { year: currentYear, month: currentMonth }
    : prevMonth(currentYear, currentMonth)

  let streak = 0
  while (monthsWithEmpties.has(monthKey(year, month))) {
    streak++
    const p = prevMonth(year, month)
    year = p.year
    month = p.month
    // Safety: don't go back more than 120 months (10 years)
    if (streak > 120) break
  }
  return streak
}

function currentMonthHasEmpty(
  monthsWithEmpties: Set<string>,
  year: number,
  month: number
): boolean {
  return monthsWithEmpties.has(monthKey(year, month))
}

function computeLongestStreak(monthsWithEmpties: Set<string>): number {
  if (monthsWithEmpties.size === 0) return 0

  // Parse all keys and sort chronologically
  const sorted = Array.from(monthsWithEmpties)
    .map((key) => {
      const [y, m] = key.split("-").map(Number)
      return { year: y, month: m }
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })

  let longest = 1
  let current = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    const expected = nextMonth(prev.year, prev.month)

    if (expected.year === curr.year && expected.month === curr.month) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }

  return longest
}

function buildLast12Months(currentYear: number, currentMonth: number): MonthlyTrendPoint[] {
  const months: MonthlyTrendPoint[] = []
  let { year, month } = { year: currentYear, month: currentMonth }

  // Build from oldest to newest: push 12 months, then reverse
  for (let i = 0; i < 12; i++) {
    months.push({
      label: monthLabel(year, month),
      year,
      month,
      count: 0,
    })
    const p = prevMonth(year, month)
    year = p.year
    month = p.month
  }

  return months.reverse()
}

// ---------------------------------------------------------------------------
// Main service function
// ---------------------------------------------------------------------------

interface NormalizedRow {
  id: string
  finished_month: number
  finished_year: number
  brand: string | null
  category: ProductCategory | null
  started_month: number | null
  started_year: number | null
}

export async function getStatsData(userId: string): Promise<StatsData> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("empties")
    .select(
      "id, finished_month, finished_year, products:products!empties_product_id_fkey(brand, category), pan_entry:pan_entries!empties_pan_entry_id_fkey(started_month, started_year)"
    )
    .eq("user_id", userId)

  if (error) {
    console.error("getStatsData: failed to fetch empties", {
      userId,
      error: error.message,
    })
    return emptyStats()
  }

  const rows = ((data ?? []) as unknown[]).map((row): NormalizedRow => {
    const r = row as Record<string, unknown>

    // Supabase may return joined rows as array or object — normalize both
    const rawProduct = r.products
    const product = Array.isArray(rawProduct) ? (rawProduct[0] ?? null) : (rawProduct ?? null)

    const rawEntry = r.pan_entry
    const panEntry = Array.isArray(rawEntry) ? (rawEntry[0] ?? null) : (rawEntry ?? null)

    const p = product as Record<string, unknown> | null
    const e = panEntry as Record<string, unknown> | null

    return {
      id: r.id as string,
      finished_month: r.finished_month as number,
      finished_year: r.finished_year as number,
      brand: p ? (p.brand as string) : null,
      category: p ? (p.category as ProductCategory) : null,
      started_month: e ? (e.started_month as number) : null,
      started_year: e ? (e.started_year as number) : null,
    }
  })

  if (rows.length === 0) return emptyStats()

  const { year: currentYear, month: currentMonth } = currentYearMonth()

  // --- Months with empties set (for streak) ---
  const monthsWithEmpties = new Set<string>()
  for (const row of rows) {
    monthsWithEmpties.add(monthKey(row.finished_year, row.finished_month))
  }

  // --- Streak ---
  const currentStreak = computeCurrentStreak(monthsWithEmpties, currentYear, currentMonth)
  const longestStreak = computeLongestStreak(monthsWithEmpties)

  // --- Category breakdown ---
  const categoryCountMap = new Map<ProductCategory, number>()
  for (const row of rows) {
    if (!row.category) continue
    categoryCountMap.set(row.category, (categoryCountMap.get(row.category) ?? 0) + 1)
  }
  const categoryBreakdown: CategoryBreakdownPoint[] = Array.from(categoryCountMap.entries())
    .map(([category, count]) => ({
      category,
      label: CATEGORY_LABELS[category],
      count,
    }))
    .sort((a, b) => b.count - a.count)

  // --- Monthly trend (last 12 months) ---
  const monthlyTrend = buildLast12Months(currentYear, currentMonth)
  const trendMap = new Map(monthlyTrend.map((p) => [monthKey(p.year, p.month), p]))
  for (const row of rows) {
    const key = monthKey(row.finished_year, row.finished_month)
    const point = trendMap.get(key)
    if (point) point.count++
  }

  // --- Top brands ---
  const brandCountMap = new Map<string, number>()
  for (const row of rows) {
    if (!row.brand) continue
    brandCountMap.set(row.brand, (brandCountMap.get(row.brand) ?? 0) + 1)
  }
  const topBrands: BrandCount[] = Array.from(brandCountMap.entries())
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // --- Avg time to pan by category ---
  // Accumulate total months and count per category, then divide
  const categoryTotalMonths = new Map<ProductCategory, number>()
  const categoryValidCount = new Map<ProductCategory, number>()

  for (const row of rows) {
    if (!row.category || row.started_month === null || row.started_year === null) continue
    const delta = Math.max(
      0,
      (row.finished_year - row.started_year) * 12 + (row.finished_month - row.started_month)
    )
    categoryTotalMonths.set(
      row.category,
      (categoryTotalMonths.get(row.category) ?? 0) + delta
    )
    categoryValidCount.set(row.category, (categoryValidCount.get(row.category) ?? 0) + 1)
  }

  const avgTimeByCategory: CategoryAvgMonths[] = Array.from(categoryValidCount.entries())
    .map(([category, count]) => ({
      category,
      label: CATEGORY_LABELS[category],
      avgMonths: Math.round(((categoryTotalMonths.get(category) ?? 0) / count) * 10) / 10,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    totalEmpties: rows.length,
    currentStreak,
    longestStreak,
    categoryBreakdown,
    monthlyTrend,
    topBrands,
    avgTimeByCategory,
    hasData: true,
  }
}

function emptyStats(): StatsData {
  const { year: currentYear, month: currentMonth } = currentYearMonth()
  return {
    totalEmpties: 0,
    currentStreak: 0,
    longestStreak: 0,
    categoryBreakdown: [],
    monthlyTrend: buildLast12Months(currentYear, currentMonth),
    topBrands: [],
    avgTimeByCategory: [],
    hasData: false,
  }
}
