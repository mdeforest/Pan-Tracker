"use client"

import { useState, useEffect, useRef } from "react"
import { Search, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { BottomSheet } from "@/components/shared/BottomSheet"
import {
  CATEGORY_EMOJI,
  CATEGORY_BG,
  CATEGORY_TEXT,
  CATEGORY_LABELS,
  ALL_CATEGORIES,
} from "./utils"
import type { ProductRow } from "./types"
import type { ProductCategory } from "@/lib/types/app"

type SheetView = "search" | "create"

interface AddProductSheetProps {
  open: boolean
  year: number
  month: number
  onClose: () => void
  onAdded: () => void
  onError: (msg: string) => void
}

export function AddProductSheet({
  open,
  year,
  month,
  onClose,
  onAdded,
  onError,
}: AddProductSheetProps) {
  const [view, setView] = useState<SheetView>("search")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProductRow[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // New product form state
  const [newName, setNewName] = useState("")
  const [newBrand, setNewBrand] = useState("")
  const [newCategory, setNewCategory] = useState<ProductCategory>("skincare")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)

  // Auto-focus search input when sheet opens
  useEffect(() => {
    if (open && view === "search") {
      const timer = setTimeout(() => searchRef.current?.focus(), 350)
      return () => clearTimeout(timer)
    }
  }, [open, view])

  // Reset all state when sheet closes
  useEffect(() => {
    if (!open) {
      setView("search")
      setQuery("")
      setResults([])
      setNewName("")
      setNewBrand("")
      setNewCategory("skincare")
      setPhotoFile(null)
    }
  }, [open])

  // Debounced product search
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const url = query.trim()
          ? `/api/products?q=${encodeURIComponent(query.trim())}`
          : "/api/products"
        const res = await fetch(url)
        const json = (await res.json()) as { data?: ProductRow[] }
        setResults(json.data ?? [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, open])

  async function addToPan(productId: string) {
    setAdding(productId)
    try {
      const res = await fetch(`/api/pans/${year}/${month}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      })
      const json = (await res.json()) as { error?: unknown }
      if (!res.ok || json.error) {
        onError(typeof json.error === "string" ? json.error : "Failed to add to pan")
        return
      }
      onAdded()
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setAdding(null)
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !newBrand.trim()) {
      onError("Name and brand are required")
      return
    }
    setCreating(true)
    try {
      // 1. Create product
      const createRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          brand: newBrand.trim(),
          category: newCategory,
        }),
      })
      const createJson = (await createRes.json()) as {
        data?: { id: string }
        error?: unknown
      }
      if (!createRes.ok || createJson.error || !createJson.data) {
        onError(
          typeof createJson.error === "string" ? createJson.error : "Failed to create product"
        )
        return
      }
      const productId = createJson.data.id

      // 2. Upload photo if selected (non-fatal on failure)
      if (photoFile) {
        try {
          const fd = new FormData()
          fd.append("file", photoFile)
          const photoRes = await fetch("/api/upload/product-photo", {
            method: "POST",
            body: fd,
          })
          const photoJson = (await photoRes.json()) as { data?: { url?: string } }
          if (photoRes.ok && photoJson.data?.url) {
            await fetch(`/api/products/${productId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photo_url: photoJson.data.url }),
            })
          }
        } catch {
          // Non-fatal — product was created without photo
        }
      }

      // 3. Add to pan
      await addToPan(productId)
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const title = view === "search" ? "Add to Pan" : "New Product"

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {view === "search" ? (
        <div className="flex flex-col" style={{ minHeight: "60vh" }}>
          {/* Search input */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your product library…"
                className="h-11 w-full rounded-xl border border-input bg-white pl-9 pr-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ fontSize: "16px" }}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {searching ? (
              <div className="flex justify-center py-10">
                <span className="text-sm text-muted-foreground">Searching…</span>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <span className="text-3xl">🔍</span>
                <p className="text-sm text-muted-foreground">
                  {query ? "No products found." : "Your library is empty."}
                </p>
              </div>
            ) : (
              <ul>
                {results.map((product) => {
                  const cat = product.category as ProductCategory
                  return (
                    <li key={product.id}>
                      <button
                        onClick={() => addToPan(product.id)}
                        disabled={adding === product.id}
                        className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2 active:bg-muted"
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base",
                            CATEGORY_BG[cat]
                          )}
                        >
                          <span className={CATEGORY_TEXT[cat]}>{CATEGORY_EMOJI[cat]}</span>
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-medium">{product.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                        {adding === product.id ? (
                          <span className="shrink-0 text-xs text-muted-foreground">Adding…</span>
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Create new — sticky bottom */}
          <div className="shrink-0 border-t border-border px-4 py-3">
            <button
              onClick={() => setView("create")}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/40 text-sm text-muted-foreground active:bg-muted"
            >
              + Create new product
            </button>
          </div>
        </div>
      ) : (
        /* Create product form */
        <div className="flex flex-col gap-4 p-4">
          {/* Back */}
          <button
            onClick={() => setView("search")}
            className="self-start text-sm text-muted-foreground"
          >
            ← Back to search
          </button>

          {/* Product name */}
          <div>
            <label htmlFor="new-name" className="mb-1.5 block text-sm font-semibold">
              Product Name *
            </label>
            <input
              id="new-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Soft Pinch Liquid Blush"
              className="h-11 w-full rounded-xl border border-input bg-white px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontSize: "16px" }}
            />
          </div>

          {/* Brand */}
          <div>
            <label htmlFor="new-brand" className="mb-1.5 block text-sm font-semibold">
              Brand *
            </label>
            <input
              id="new-brand"
              type="text"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              placeholder="e.g. Rare Beauty"
              className="h-11 w-full rounded-xl border border-input bg-white px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ fontSize: "16px" }}
            />
          </div>

          {/* Category grid */}
          <div>
            <p className="mb-2 text-sm font-semibold">Category</p>
            <div className="grid grid-cols-4 gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewCategory(cat)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs transition-colors",
                    newCategory === cat
                      ? "border-foreground bg-foreground text-background"
                      : "border-input bg-white text-foreground"
                  )}
                >
                  <span className="text-lg">{CATEGORY_EMOJI[cat]}</span>
                  <span>{CATEGORY_LABELS[cat].slice(0, 5)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold">Photo (optional)</label>
            <label
              htmlFor="new-photo"
              className={cn(
                "flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 text-sm",
                photoFile
                  ? "border-foreground text-foreground"
                  : "border-muted-foreground/40 text-muted-foreground"
              )}
            >
              {photoFile ? photoFile.name : "Choose photo…"}
              <input
                id="new-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Submit */}
          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim() || !newBrand.trim()}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background disabled:opacity-50 active:opacity-80"
            >
              {creating ? "Creating…" : "Create & Add to Pan"}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
