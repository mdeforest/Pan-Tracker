"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
}

interface ProductsClientProps {
  activeProductIds: string[]
}

export function ProductsClient({ activeProductIds }: ProductsClientProps) {
  const activeSet = useMemo(() => new Set(activeProductIds), [activeProductIds])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Debounced fetch
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams()
        if (query.trim()) params.set("q", query.trim())
        if (category !== "all") params.set("category", category)
        const url = `/api/products${params.size > 0 ? `?${params}` : ""}`
        const res = await fetch(url)
        const json = (await res.json()) as { data?: RawProduct[] }
        const raw = json.data ?? []
        setProducts(
          raw.map((p) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            category: p.category as ProductCategory,
            photo_url: p.photo_url,
            is_in_pan: activeSet.has(p.id),
          }))
        )
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, category, activeProductIds, activeSet])

  function handleCreated(productId: string) {
    setSheetOpen(false)
    showToast("Product created!")
    router.push(`/products/${productId}`)
  }

  return (
    <div className="relative">
      {/* Sticky search + filters */}
      <div className="sticky top-14 z-30 bg-background pb-1">
        {/* Search bar */}
        <div className="px-4 pt-3 pb-2">
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
          className="flex gap-2 overflow-x-auto px-4 pb-2"
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
      </div>

      {/* Grid */}
      <div className="px-4 pb-4">
        {loading ? (
          <ProductGridSkeleton />
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">📦</span>
            <p className="text-base font-semibold">
              {query || category !== "all" ? "No products found." : "No products yet — add your first one!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Add new product"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-foreground shadow-lg active:opacity-80"
      >
        <Plus className="h-6 w-6 text-background" />
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+5rem)] left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
          {toast}
        </div>
      )}

      {/* New product sheet */}
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
          ? "bg-foreground text-background"
          : "bg-white text-foreground border border-border"
      )}
      style={{ minHeight: "32px" }}
    >
      {label}
    </button>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 rounded-2xl bg-white animate-pulse" />
      ))}
    </div>
  )
}
