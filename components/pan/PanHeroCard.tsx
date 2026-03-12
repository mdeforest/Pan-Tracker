"use client"

import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { USAGE_PERCENT, CATEGORY_LABELS } from "./utils"
import type { PanEntryWithProduct } from "./types"
import type { UsageLevel } from "@/lib/types/app"

interface PanHeroCardProps {
  entry: PanEntryWithProduct
  justEmptied: boolean
  onTap: () => void
}

export function PanHeroCard({ entry, justEmptied, onTap }: PanHeroCardProps) {
  const product = entry.products
  if (!product) return null

  const pct = USAGE_PERCENT[entry.usage_level as UsageLevel]
  const statusLabel = entry.is_pick ? "Pick of the Month" : "In Progress"

  return (
    <button
      onClick={onTap}
      className={cn(
        "relative w-full rounded-2xl bg-card border border-border shadow-sm text-left overflow-hidden transition-transform active:scale-[0.99]",
        justEmptied && "opacity-60"
      )}
      aria-label={`View details for ${product.name}`}
    >
      {/* Product image */}
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
        {product.photo_url ? (
          <Image
            src={product.photo_url}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary">
            <span className="text-5xl opacity-40">
              {product.category === "makeup" ? "💄" :
               product.category === "skincare" ? "🧴" :
               product.category === "haircare" ? "💆" :
               product.category === "bodycare" ? "🧖" :
               product.category === "fragrance" ? "🌸" :
               product.category === "tools" ? "🪮" : "✨"}
            </span>
          </div>
        )}

        {/* ACTIVE badge — top right */}
        <span className="absolute right-3 top-3 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
          Active
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Status label */}
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
          {statusLabel}
        </p>

        {/* Name + brand */}
        <p className="text-base font-bold leading-snug text-foreground">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {CATEGORY_LABELS[product.category as keyof typeof CATEGORY_LABELS]}
          {product.brand ? ` · ${product.brand}` : ""}
        </p>

        {/* Progress row */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Usage Progress</span>
            <span className="text-xs font-bold text-primary">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* CTA button */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3">
          <span className="text-sm font-semibold text-primary-foreground">Log Progress</span>
          <ChevronRight className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
      </div>

      {/* Confetti overlay for just-emptied */}
      {justEmptied && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-green-50/90">
          <span className="text-base font-bold text-green-700">EMPTY ✓</span>
        </div>
      )}
    </button>
  )
}
