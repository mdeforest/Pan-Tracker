"use client"

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ProductCard } from "./ProductCard"
import { NewProductSheet } from "./NewProductSheet"
import { CATEGORY_LABELS, ALL_CATEGORIES } from "@/components/pan/utils"
import type { ProductCardData } from "./ProductCard"
import type { ProductCategory } from "@/lib/types/app"

interface RawProduct {
  id: string
  name: string
  brand: string
  category: string
  photo_url: string | null
  archived_at: string | null
  last_bought_at: string
}

interface ProductsClientProps {
  activeProductIds: string[]
  initialProducts: RawProduct[]
}

function mapProducts(raw: RawProduct[], activeSet: Set<string>): ProductCardData[] {
  return raw.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category as ProductCategory,
    photo_url: p.photo_url,
    is_in_pan: activeSet.has(p.id),
    is_archived: !!p.archived_at,
    last_bought_at: p.last_bought_at,
  }))
}

export function ProductsClient({ activeProductIds, initialProducts }: ProductsClientProps) {
  const activeSet = useMemo(() => new Set(activeProductIds), [activeProductIds])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [showArchived, setShowArchived] = useState(false)
  const deferredQuery = useDeferredValue(query)
  const [products, setProducts] = useState<ProductCardData[]>(() =>
    mapProducts(initialProducts, activeSet)
  )
  const [loading, setLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  function showToast(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 3000)
  }

  useEffect(() => {
    if (!deferredQuery.trim() && category === "all" && !showArchived) {
      setProducts(mapProducts(initialProducts, activeSet))
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        const trimmedQuery = deferredQuery.trim()
        if (trimmedQuery) params.set("q", trimmedQuery)
        if (category !== "all") params.set("category", category)
        if (showArchived) params.set("include_archived", "true")
        const url = `/api/products${params.size > 0 ? `?${params}` : ""}`
        const res = await fetch(url, { signal: controller.signal })
        const json = (await res.json()) as { data?: RawProduct[] }
        const raw = json.data ?? []
        setProducts(mapProducts(raw, activeSet))
      } catch {
        if (controller.signal.aborted) return
        setProducts([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [deferredQuery, category, showArchived, initialProducts, activeSet])

  useEffect(() => {
    if (!deferredQuery.trim() && category === "all" && !showArchived) {
      setProducts(mapProducts(initialProducts, activeSet))
      return
    }
    setProducts((prev) =>
      prev.map((product) => ({ ...product, is_in_pan: activeSet.has(product.id) }))
    )
  }, [activeSet, category, deferredQuery, showArchived, initialProducts])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  function handleCreated(productId: string) {
    setSheetOpen(false)
    showToast("Product created!")
    router.push(`/products/${productId}`)
  }

  async function handleRestore(productId: string) {
    setRestoringId(productId)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      })
      const json = (await res.json()) as { error?: unknown }
      if (!res.ok || json.error) {
        showToast(typeof json.error === "string" ? json.error : "Failed to restore product")
        return
      }
      setProducts((prev) =>
        prev
          .map((product) =>
            product.id === productId ? { ...product, is_archived: false } : product
          )
          .filter((product) => showArchived || !product.is_archived)
      )
      showToast("Product restored!")
      router.refresh()
    } catch {
      showToast("Network error. Please try again.")
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="relative flex flex-col">

      {/* ── MOBILE HEADER ─────────────────────────────────────── */}
      <div className="md:hidden px-4 pt-5 pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Product Library</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your beauty collection</p>
      </div>

      {/* ── DESKTOP HEADER ────────────────────────────────────── */}
      <div className="hidden md:flex items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-foreground">
            Product Library
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? "s" : ""} in your collection
          </p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="Add new product"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New Product
        </button>
      </div>

      {/* ── FILTERS (sticky on mobile, static on desktop) ──── */}
      <div className="sticky top-14 z-30 bg-background md:top-0 md:border-b md:border-border md:bg-white">
        {/* Search */}
        <div className="px-4 pt-3 pb-2 md:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="h-11 w-full rounded-xl border border-input bg-white pl-9 pr-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontSize: "16px" }}
            />
          </div>
        </div>

        {/* Category chips */}
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-2 md:px-6"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          <CategoryChip label="All" active={category === "all"} onClick={() => setCategory("all")} />
          {ALL_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={CATEGORY_LABELS[cat as ProductCategory]}
              active={category === cat}
              onClick={() => setCategory(cat)}
            />
          ))}
        </div>

        {/* Show archived toggle */}
        <div className="px-4 pb-3 md:px-6">
          <button
            type="button"
            role="switch"
            aria-checked={showArchived}
            onClick={() => setShowArchived((prev) => !prev)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors active:opacity-80",
              showArchived
                ? "border-primary/30 bg-primary/5 text-foreground"
                : "border-border bg-white text-foreground"
            )}
          >
            <div>
              <p className="text-sm font-semibold">Show Archived</p>
              <p className="text-xs text-muted-foreground">
                Include archived products in your library results
              </p>
            </div>
            <span
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors",
                showArchived ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  showArchived ? "left-6" : "left-1"
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* ── PRODUCT GRID ──────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-3 md:px-6 md:py-6">
        {loading ? (
          <ProductGridSkeleton />
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="mb-4 text-5xl">📦</span>
            <p className="text-base font-semibold text-foreground">
              {query || category !== "all" ? "No products found." : "No products yet — add your first one!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onRestore={p.is_archived ? handleRestore : undefined}
                restoring={restoringId === p.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── FAB (mobile only) ─────────────────────────────────── */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Add new product"
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg active:opacity-80 transition-opacity md:hidden"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 1rem)" }}
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+5rem)] left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
          {toast}
        </div>
      )}

      {/* ── New product sheet ─────────────────────────────────── */}
      <NewProductSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={handleCreated}
        onError={showToast}
      />
    </div>
  )
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-white text-foreground hover:bg-muted"
      )}
      style={{ minHeight: "32px" }}
    >
      {label}
    </button>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
      ))}
    </div>
  )
}
