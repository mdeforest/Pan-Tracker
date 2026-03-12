"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { PanGridCard } from "./PanGridCard"
import { ProductDetailSheet } from "./ProductDetailSheet"
import { EmptyLoggerSheet } from "./EmptyLoggerSheet"
import { AddProductSheet } from "./AddProductSheet"
import { CarryOverBanner } from "./CarryOverBanner"
import { useToast } from "@/components/shared/ToastProvider"
import { currentYearMonth } from "@/lib/utils"
import { MONTH_NAMES } from "./utils"
import type { PanEntryWithProduct } from "./types"

type ActiveSheet = "detail" | "empty" | "addProduct" | null
type ActiveTab = "active" | "emptied"

interface PanViewProps {
  year: number
  month: number
  entries: PanEntryWithProduct[]
  error?: string
  wishlistedProductIds?: Set<string>
}

export function PanView({ year, month, entries, error }: PanViewProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [selectedEntry, setSelectedEntry] = useState<PanEntryWithProduct | null>(null)
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)
  const [justEmptied, setJustEmptied] = useState<Set<string>>(new Set())
  const [showWishlistPrompt, setShowWishlistPrompt] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>("active")

  const { year: nowYear, month: nowMonth } = currentYearMonth()
  const isPastMonth = year < nowYear || (year === nowYear && month < nowMonth)

  const prevMonthHref = month === 1 ? `/pan/${year - 1}/12` : `/pan/${year}/${month - 1}`
  const nextMonthHref = month === 12 ? `/pan/${year + 1}/1` : `/pan/${year}/${month + 1}`

  function goToPrevMonth() { router.push(prevMonthHref) }
  function goToNextMonth() { router.push(nextMonthHref) }

  useEffect(() => {
    router.prefetch(prevMonthHref)
    router.prefetch(nextMonthHref)
  }, [nextMonthHref, prevMonthHref, router])

  const { activeEntries, emptyEntries } = useMemo(() => {
    const nextActive: PanEntryWithProduct[] = []
    const nextEmpty: PanEntryWithProduct[] = []

    for (const entry of entries) {
      if (entry.status === "empty") {
        nextEmpty.push(entry)
      } else if (entry.status === "active") {
        nextActive.push(entry)
      }
    }

    return { activeEntries: nextActive, emptyEntries: nextEmpty }
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
    setActiveSheet("empty")
  }

  function handleEmptyLogged(entryId: string) {
    setJustEmptied((prev) => new Set(Array.from(prev).concat(entryId)))
    setActiveSheet(null)
    setSelectedEntry(null)
    setShowWishlistPrompt(true)
    router.refresh()
    setTimeout(() => {
      setJustEmptied((prev) => {
        const next = new Set(prev)
        next.delete(entryId)
        return next
      })
    }, 4000)
    setTimeout(() => setShowWishlistPrompt(false), 8000)
  }

  // Shared header: title, subtitle, month nav, tabs
  function PageHeader({ desktop }: { desktop?: boolean }) {
    return desktop ? (
      <div className="flex items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-foreground">
            Current Project Pan
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Focusing on {activeEntries.length} essential product{activeEntries.length !== 1 ? "s" : ""} this month
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav />
          <button
            onClick={() => setActiveSheet("addProduct")}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add Product
          </button>
        </div>
      </div>
    ) : (
      <div className="px-4 pt-5 pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Current Project Pan</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Track your progress and hit the pan.</p>
        <div className="mt-3 flex items-center gap-2">
          <MonthNav />
        </div>
      </div>
    )
  }

  function MonthNav() {
    return (
      <>
        <button
          onClick={goToPrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:bg-muted"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          onClick={goToNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:bg-muted"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </>
    )
  }

  function Tabs({ className }: { className?: string }) {
    return (
      <div className={`flex items-center gap-6 border-b border-border px-4 pt-4 md:px-6 ${className ?? ""}`}>
        {(["active", "emptied"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? "relative pb-3 text-sm font-semibold text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-primary"
                : "pb-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            }
          >
            {tab === "active" ? "Active" : "Emptied"}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {tab === "active" ? activeEntries.length : emptyEntries.length}
            </span>
          </button>
        ))}
      </div>
    )
  }

  const tabEntries = activeTab === "active" ? activeEntries : emptyEntries

  return (
    <div className="flex flex-col">

      {/* ── MOBILE ────────────────────────────────────────────── */}
      <div className="md:hidden">
        <PageHeader />

        {isPastMonth && activeEntries.length > 0 && (
          <div className="px-4 mb-2">
            <CarryOverBanner
              year={year}
              month={month}
              entries={activeEntries}
              onCarriedOver={() => router.refresh()}
              onError={(msg) => toast(msg, "error")}
            />
          </div>
        )}

        {error && (
          <div className="mx-4 mb-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Tabs />

        <div className="px-4 py-4">
          {tabEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-5xl">✨</span>
              <p className="text-sm text-muted-foreground">
                {activeTab === "active"
                  ? "No products in your pan yet.\nTap + to add your first one."
                  : "No emptied products this month."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tabEntries.map((entry) => (
                <PanGridCard
                  key={entry.id}
                  entry={entry}
                  justEmptied={justEmptied.has(entry.id)}
                  onTap={() => handleCardTap(entry)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats strip — only shown on active tab */}
        {activeTab === "active" && entries.length > 0 && (
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                In Pan
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{activeEntries.length}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Emptied
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {emptyEntries.length}
                {emptyEntries.length > 0 && <span className="ml-1 text-base">🔥</span>}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP ───────────────────────────────────────────── */}
      <div className="hidden md:block">
        <PageHeader desktop />

        {isPastMonth && activeEntries.length > 0 && (
          <div className="px-6 pt-4">
            <CarryOverBanner
              year={year}
              month={month}
              entries={activeEntries}
              onCarriedOver={() => router.refresh()}
              onError={(msg) => toast(msg, "error")}
            />
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Tabs />

        <div className="p-6">
          {tabEntries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <span className="text-5xl">✨</span>
              <p className="text-sm text-muted-foreground">
                {activeTab === "active"
                  ? `No active products this month. Click "Add Product" to get started.`
                  : "No emptied products this month."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {tabEntries.map((entry) => (
                <PanGridCard
                  key={entry.id}
                  entry={entry}
                  justEmptied={justEmptied.has(entry.id)}
                  onTap={() => handleCardTap(entry)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FAB (mobile only) ─────────────────────────────────── */}
      <button
        onClick={() => setActiveSheet("addProduct")}
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg active:opacity-80 transition-opacity md:hidden"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 1rem)" }}
        aria-label="Add product to pan"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* ── SHEETS ────────────────────────────────────────────── */}
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

      <EmptyLoggerSheet
        open={activeSheet === "empty" && selectedEntry !== null}
        entry={selectedEntry}
        onClose={() => setActiveSheet("detail")}
        onLogged={handleEmptyLogged}
        onError={(msg) => toast(msg, "error")}
      />

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

      {/* ── Wishlist prompt ────────────────────────────────────── */}
      {showWishlistPrompt && (
        <div
          className="fixed left-4 right-4 z-50 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-lg md:left-auto md:right-6 md:w-80"
          style={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 5.5rem)" }}
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
