"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { PanCard } from "./PanCard"
import { ProductDetailSheet } from "./ProductDetailSheet"
import { EmptyLoggerSheet } from "./EmptyLoggerSheet"
import { AddProductSheet } from "./AddProductSheet"
import { CarryOverBanner } from "./CarryOverBanner"
import { useToast } from "@/components/shared/ToastProvider"
import { currentYearMonth } from "@/lib/utils"
import { ALL_CATEGORIES, CATEGORY_LABELS, MONTH_NAMES } from "./utils"
import type { PanEntryWithProduct } from "./types"
import type { ProductCategory } from "@/lib/types/app"

type ActiveSheet = "detail" | "empty" | "addProduct" | null

interface PanViewProps {
  year: number
  month: number
  entries: PanEntryWithProduct[]
  error?: string
}

export function PanView({ year, month, entries, error }: PanViewProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [selectedEntry, setSelectedEntry] = useState<PanEntryWithProduct | null>(null)
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)
  // Track entries that were just emptied (for overlay badge)
  const [justEmptied, setJustEmptied] = useState<Set<string>>(new Set())

  const { year: nowYear, month: nowMonth } = currentYearMonth()
  const isPastMonth =
    year < nowYear || (year === nowYear && month < nowMonth)

  // Month nav
  function goToPrevMonth() {
    if (month === 1) router.push(`/pan/${year - 1}/12`)
    else router.push(`/pan/${year}/${month - 1}`)
  }
  function goToNextMonth() {
    if (month === 12) router.push(`/pan/${year + 1}/1`)
    else router.push(`/pan/${year}/${month + 1}`)
  }

  // Split entries by status
  const activeEntries = entries.filter(
    (e) => e.status === "active" || e.status === "paused"
  )
  const emptyEntries = entries.filter((e) => e.status === "empty")

  // Group active entries by category (only non-empty categories)
  const grouped = ALL_CATEGORIES.reduce<Record<ProductCategory, PanEntryWithProduct[]>>(
    (acc, cat) => {
      const items = activeEntries.filter((e) => e.products?.category === cat)
      if (items.length > 0) acc[cat] = items
      return acc
    },
    {} as Record<ProductCategory, PanEntryWithProduct[]>
  )

  function handleCardTap(entry: PanEntryWithProduct) {
    setSelectedEntry(entry)
    setActiveSheet("detail")
  }

  function handleDetailClose() {
    setActiveSheet(null)
    setSelectedEntry(null)
  }

  function handleMarkEmpty() {
    // Keep selectedEntry, just switch sheet
    setActiveSheet("empty")
  }

  function handleEmptyLogged(entryId: string) {
    setJustEmptied((prev) => new Set(Array.from(prev).concat(entryId)))
    setActiveSheet(null)
    setSelectedEntry(null)
    router.refresh()
    // Clear the overlay badge after a short delay
    setTimeout(() => {
      setJustEmptied((prev) => {
        const next = new Set(prev)
        next.delete(entryId)
        return next
      })
    }, 4000)
  }

  return (
    <div className="flex flex-col">
      {/* Month navigation bar */}
      <div className="flex items-center justify-between px-2 py-2">
        <button
          onClick={goToPrevMonth}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground active:bg-muted"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h1 className="text-base font-bold tracking-tight">
          {MONTH_NAMES[month - 1]} {year}
        </h1>

        <button
          onClick={goToNextMonth}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground active:bg-muted"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Carry-over banner — past months with unfinished products */}
      {isPastMonth && activeEntries.length > 0 && (
        <CarryOverBanner
          year={year}
          month={month}
          entries={activeEntries}
          onCarriedOver={() => router.refresh()}
          onError={(msg) => toast(msg, "error")}
        />
      )}

      {/* Fetch error */}
      {error && (
        <div className="mx-4 mb-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Product list grouped by category */}
      <div className="flex flex-col gap-5 px-4 pb-4">
        {(Object.entries(grouped) as [ProductCategory, PanEntryWithProduct[]][]).map(
          ([cat, catEntries]) => (
            <div key={cat}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="flex flex-col gap-2">
                {catEntries.map((entry) => (
                  <PanCard
                    key={entry.id}
                    entry={entry}
                    currentMonth={month}
                    currentYear={year}
                    justEmptied={justEmptied.has(entry.id)}
                    onTap={() => handleCardTap(entry)}
                  />
                ))}
              </div>
            </div>
          )
        )}

        {/* Emptied section */}
        {emptyEntries.length > 0 && (
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Emptied
            </h2>
            <div className="flex flex-col gap-2">
              {emptyEntries.map((entry) => (
                <PanCard
                  key={entry.id}
                  entry={entry}
                  currentMonth={month}
                  currentYear={year}
                  justEmptied={justEmptied.has(entry.id)}
                  onTap={() => {}} // Empty entries are read-only
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">✨</span>
            <p className="text-sm text-muted-foreground">
              No products in your pan yet.
              <br />
              Tap + to add your first one.
            </p>
          </div>
        )}
      </div>

      {/* FAB — fixed above bottom nav */}
      <button
        onClick={() => setActiveSheet("addProduct")}
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg active:opacity-80"
        style={{
          bottom: "calc(4rem + env(safe-area-inset-bottom) + 1rem)",
        }}
        aria-label="Add product to pan"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Product Detail Sheet */}
      <ProductDetailSheet
        open={activeSheet === "detail" && selectedEntry !== null}
        entry={selectedEntry}
        year={year}
        month={month}
        onClose={handleDetailClose}
        onMarkEmpty={handleMarkEmpty}
        onUpdated={() => {
          router.refresh()
          handleDetailClose()
        }}
        onError={(msg) => toast(msg, "error")}
      />

      {/* Empty Logger Sheet */}
      <EmptyLoggerSheet
        open={activeSheet === "empty" && selectedEntry !== null}
        entry={selectedEntry}
        onClose={() => setActiveSheet("detail")}
        onLogged={handleEmptyLogged}
        onError={(msg) => toast(msg, "error")}
      />

      {/* Add Product Sheet */}
      <AddProductSheet
        open={activeSheet === "addProduct"}
        year={year}
        month={month}
        onClose={() => setActiveSheet(null)}
        onAdded={() => {
          setActiveSheet(null)
          router.refresh()
          toast("Added to pan!", "success")
        }}
        onError={(msg) => toast(msg, "error")}
      />
    </div>
  )
}
