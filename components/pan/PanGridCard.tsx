"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { USAGE_PERCENT, CATEGORY_LABELS } from "./utils"
import type { PanEntryWithProduct } from "./types"
import type { UsageLevel } from "@/lib/types/app"

interface PanGridCardProps {
  entry: PanEntryWithProduct
  justEmptied: boolean
  onTap: () => void
}

export function PanGridCard({ entry, justEmptied, onTap }: PanGridCardProps) {
  const product = entry.products
  if (!product) return null

  const pct = USAGE_PERCENT[entry.usage_level as UsageLevel]
  const isEmpty = entry.status === "empty"
  const categoryLabel = CATEGORY_LABELS[product.category as keyof typeof CATEGORY_LABELS] ?? product.category

  return (
    <button
      onClick={isEmpty ? undefined : onTap}
      disabled={isEmpty}
      className={cn(
        "group relative flex w-full flex-col rounded-2xl bg-card border border-border shadow-sm text-left overflow-hidden transition-transform active:scale-[0.98] hover:shadow-md",
        isEmpty && "opacity-60"
      )}
      aria-label={`View details for ${product.name}`}
    >
      {/* Product image — square aspect */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        {product.photo_url ? (
          <Image
            src={product.photo_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary">
            <span className="text-5xl opacity-30">
              {product.category === "makeup" ? "💄" :
               product.category === "skincare" ? "🧴" :
               product.category === "haircare" ? "💆" :
               product.category === "bodycare" ? "🧖" :
               product.category === "fragrance" ? "🌸" :
               product.category === "tools" ? "🪮" : "✨"}
            </span>
          </div>
        )}

        {/* Category label — overlaid bottom-left */}
        <span className="absolute bottom-2 left-2 rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-sm">
          {categoryLabel}
        </span>

        {/* Pick badge — top right */}
        {entry.is_pick && (
          <span className="absolute right-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
            Pick ★
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3">
        {/* Product name */}
        <p className={cn(
          "text-xs font-bold uppercase tracking-wide leading-tight line-clamp-2",
          isEmpty ? "line-through text-muted-foreground" : "text-foreground"
        )}>
          {product.name}
        </p>

        {/* Progress row */}
        {!isEmpty ? (
          <div className="space-y-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] font-semibold text-primary">{pct}%</p>
          </div>
        ) : (
          <p className="text-[10px] uppercase font-semibold text-muted-foreground">Empty ✓</p>
        )}
      </div>

      {/* Confetti overlay */}
      {justEmptied && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-green-50/90">
          <span className="text-sm font-bold text-green-700">EMPTY ✓</span>
        </div>
      )}
    </button>
  )
}
