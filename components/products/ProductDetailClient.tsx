"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProductEditSheet } from "./ProductEditSheet"
import {
  CATEGORY_EMOJI,
  CATEGORY_BG,
  CATEGORY_LABELS,
  USAGE_LABELS,
  USAGE_PERCENT,
  MONTH_NAMES,
  progressColor,
} from "@/components/pan/utils"
import type { ProductCategory, UsageLevel, WouldRepurchase } from "@/lib/types/app"

interface PanHistoryEntry {
  id: string
  started_month: number
  started_year: number
  status: string
  usage_level: UsageLevel
  notes: string | null
  empties: Array<{
    id: string
    finished_month: number
    finished_year: number
    rating: number | null
    would_repurchase: WouldRepurchase | null
    review_notes: string | null
    replacement_free_text: string | null
  }>
}

interface ProductDetailClientProps {
  product: {
    id: string
    name: string
    brand: string
    category: ProductCategory
    photo_url: string | null
    notes: string | null
  }
  panHistory: PanHistoryEntry[]
  isInPan: boolean
  currentYear: number
  currentMonth: number
}

function RepurchaseBadge({ value }: { value: WouldRepurchase | null }) {
  if (!value) return null
  const config = {
    yes: { label: "Would Repurchase", className: "bg-green-100 text-green-700" },
    no: { label: "Won't Repurchase", className: "bg-red-100 text-red-700" },
    maybe: { label: "Maybe", className: "bg-gray-100 text-gray-600" },
  }
  const { label, className } = config[value]
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
      {label}
    </span>
  )
}

function StarRow({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  )
}

export function ProductDetailClient({
  product,
  panHistory,
  isInPan,
  currentYear,
  currentMonth,
}: ProductDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [addingToPan, setAddingToPan] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const router = useRouter()
  const cat = product.category

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleAddToPan() {
    setAddingToPan(true)
    try {
      const res = await fetch(`/api/pans/${currentYear}/${currentMonth}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      })
      const json = (await res.json()) as { error?: unknown }
      if (!res.ok || json.error) {
        showToast(typeof json.error === "string" ? json.error : "Failed to add to pan")
        return
      }
      showToast("Added to current pan!")
      router.push(`/pan/${currentYear}/${currentMonth}`)
    } catch {
      showToast("Network error. Please try again.")
    } finally {
      setAddingToPan(false)
    }
  }

  function handleEditSaved() {
    setEditOpen(false)
    showToast("Product updated!")
    router.refresh()
  }

  return (
    <div className="pb-6">
      {/* Photo header */}
      <div className="relative" style={{ maxHeight: "280px", overflow: "hidden" }}>
        {product.photo_url ? (
          <>
            <img
              src={product.photo_url}
              alt={product.name}
              className="h-64 w-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Edit button */}
            <button
              onClick={() => setEditOpen(true)}
              className="absolute top-4 right-4 flex h-11 min-w-[44px] items-center justify-center rounded-xl bg-black/40 px-3 text-sm font-medium text-white backdrop-blur-sm active:opacity-80"
            >
              Edit
            </button>
            {/* Name + brand over photo */}
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-xl font-bold text-white leading-tight">{product.name}</p>
              <p className="text-sm text-white/80">{product.brand}</p>
            </div>
          </>
        ) : (
          <>
            <div
              className={cn("flex h-48 w-full items-center justify-center", CATEGORY_BG[cat])}
            >
              <span className="text-7xl">{CATEGORY_EMOJI[cat]}</span>
            </div>
            {/* Edit button */}
            <button
              onClick={() => setEditOpen(true)}
              className="absolute top-4 right-4 flex h-11 min-w-[44px] items-center justify-center rounded-xl bg-black/10 px-3 text-sm font-medium text-foreground active:opacity-80"
            >
              Edit
            </button>
          </>
        )}
      </div>

      {/* Info below photo (when no photo overlay) */}
      {!product.photo_url && (
        <div className="px-4 pt-3">
          <p className="text-xl font-bold tracking-tight">{product.name}</p>
          <p className="text-sm text-muted-foreground">{product.brand}</p>
        </div>
      )}

      {/* Category chip */}
      <div className="px-4 pt-3">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {CATEGORY_LABELS[cat]}
        </span>
      </div>

      {/* Add to Pan button */}
      {!isInPan && (
        <div className="px-4 pt-4">
          <button
            onClick={handleAddToPan}
            disabled={addingToPan}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background disabled:opacity-50 active:opacity-80"
          >
            {addingToPan ? "Adding…" : "Add to Current Pan"}
          </button>
        </div>
      )}

      {/* Pan History */}
      {panHistory.length > 0 && (
        <div className="px-4 pt-6">
          <h2 className="text-base font-bold tracking-tight mb-3">Pan History</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="flex flex-col gap-5">
              {panHistory.map((entry) => {
                const pct = USAGE_PERCENT[entry.usage_level]
                const empty = entry.empties?.[0] ?? null
                const isActive = entry.status === "active"
                const statusLabel =
                  entry.status === "empty" ? "Finished" : entry.status === "paused" ? "Paused" : "Active"

                return (
                  <div key={entry.id} className="pl-5 relative">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-background",
                        isActive
                          ? "bg-green-500"
                          : entry.status === "empty"
                          ? "bg-foreground"
                          : "bg-muted-foreground"
                      )}
                    />

                    <div className="bg-white rounded-2xl shadow-sm p-3">
                      {/* Month + status */}
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold">
                          {MONTH_NAMES[entry.started_month - 1]} {entry.started_year}
                        </p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            isActive
                              ? "bg-green-100 text-green-700"
                              : entry.status === "empty"
                              ? "bg-foreground/10 text-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {USAGE_LABELS[entry.usage_level]}
                          </span>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", progressColor(pct))}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Empty record */}
                      {empty && (
                        <div className="mt-3 border-t border-border pt-3">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-xs text-muted-foreground">
                              Finished {MONTH_NAMES[empty.finished_month - 1]} {empty.finished_year}
                            </p>
                            <RepurchaseBadge value={empty.would_repurchase} />
                          </div>
                          <StarRow rating={empty.rating} />
                          {empty.review_notes && (
                            <p className="mt-1.5 text-xs text-foreground leading-relaxed">
                              {empty.review_notes}
                            </p>
                          )}
                          {empty.replacement_free_text && (
                            <p className="mt-1 text-xs italic text-muted-foreground">
                              Replacement: {empty.replacement_free_text}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
          {toast}
        </div>
      )}

      {/* Edit sheet */}
      <ProductEditSheet
        open={editOpen}
        productId={product.id}
        initialName={product.name}
        initialBrand={product.brand}
        initialCategory={product.category}
        onClose={() => setEditOpen(false)}
        onSaved={handleEditSaved}
        onError={showToast}
      />
    </div>
  )
}
