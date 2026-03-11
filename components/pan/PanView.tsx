"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { PanCard } from "./PanCard"
import { ProductDetailSheet } from "./ProductDetailSheet"
import { EmptyLoggerSheet } from "./EmptyLoggerSheet"
import { AddProductSheet } from "./AddProductSheet"
import { CarryOverBanner } from "./CarryOverBanner"
import { useToast } from "@/components/shared/ToastProvider"
import { currentYearMonth } from "@/lib/utils"
import { CATEGORY_LABELS, MONTH_NAMES } from "./utils"
import type { PanEntryWithProduct } from "./types"
import type { ProductCategory } from "@/lib/types/app"

type ActiveSheet = "detail" | "empty" | "addProduct" | null

interface PanViewProps {
  year: number
  month: number
  entries: PanEntryWithProduct[]
  error?: string
  wishlistedProductIds?: Set<string>
}

export function PanView({ year, month, entries, error, wishlistedProductIds }: PanViewProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [selectedEntry, setSelectedEntry] = useState<PanEntryWithProduct | null>(null)
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)
  // Track entries that were just emptied (for overlay badge)
  const [justEmptied, setJustEmptied] = useState<Set<string>>(new Set())
  const [showWishlistPrompt, setShowWishlistPrompt] = useState(false)

  const { year: nowYear, month: nowMonth } = currentYearMonth()
  const isPastMonth =
    year < nowYear || (year === nowYear && month < nowMonth)

  const prevMonthHref = month === 1 ? `/pan/${year - 1}/12` : `/pan/${year}/${month - 1}`
  const nextMonthHref = month === 12 ? `/pan/${year + 1}/1` : `/pan/${year}/${month + 1}`

  // Month nav
  function goToPrevMonth() {
    router.push(prevMonthHref)
  }
  function goToNextMonth() {
    router.push(nextMonthHref)
  }

  useEffect(() => {
    router.prefetch(prevMonthHref)
    router.prefetch(nextMonthHref)
  }, [nextMonthHref, prevMonthHref, router])

  const { activeEntries, emptyEntries, grouped } = useMemo(() => {
    const nextActive: PanEntryWithProduct[] = []
    const nextEmpty: PanEntryWithProduct[] = []
    const nextGrouped = {} as Record<ProductCategory, PanEntryWithProduct[]>

    for (const entry of entries) {
      if (entry.status === "empty") {
        nextEmpty.push(entry)
        continue
      }

      if (entry.status !== "active") {
        continue
      }

      nextActive.push(entry)

      const category = entry.products?.category as ProductCategory | undefined
      if (!category) {
        continue
      }

      if (!nextGrouped[category]) {
        nextGrouped[category] = []
      }

      nextGrouped[category].push(entry)
    }

    return {
      activeEntries: nextActive,
      emptyEntries: nextEmpty,
      grouped: nextGrouped,
    }
  }, [entries])

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
    setShowWishlistPrompt(true)
    router.refresh()
    // Clear the overlay badge after a short delay
    setTimeout(() => {
      setJustEmptied((prev) => {
        const next = new Set(prev)
        next.delete(entryId)
        return next
      })
    }, 4000)
    setTimeout(() => {
      setShowWishlistPrompt(false)
    }, 8000)
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
                    isWishlisted={!!entry.products && (wishlistedProductIds?.has(entry.products.id) ?? false)}
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
                  isWishlisted={!!entry.products && (wishlistedProductIds?.has(entry.products.id) ?? false)}
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

      {showWishlistPrompt && (
        <div
          className="fixed left-4 right-4 z-50 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-lg"
          style={{
            bottom: "calc(4rem + env(safe-area-inset-bottom) + 5.5rem)",
          }}
        >
          <p className="text-sm font-semibold text-amber-950">Empty logged. Nice work.</p>
          <p className="mt-1 text-xs text-amber-800">
            Want a reward queued up? Check your wishlist.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowWishlistPrompt(false)
                router.push("/wishlist")
              }}
              className="flex h-10 items-center justify-center rounded-xl bg-amber-500 px-3 text-sm font-semibold text-amber-950 active:opacity-80"
            >
              View Wishlist
            </button>
            <button
              type="button"
              onClick={() => setShowWishlistPrompt(false)}
              className="flex h-10 items-center justify-center rounded-xl border border-amber-200 bg-white px-3 text-sm font-semibold text-amber-900 active:opacity-80"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
