"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  USAGE_PERCENT,
  CATEGORY_BG,
  CATEGORY_TEXT,
  CATEGORY_EMOJI,
  monthsInPan,
} from "./utils"
import type { PanEntryWithProduct } from "./types"
import type { UsageLevel, ProductCategory } from "@/lib/types/app"

interface PanCardProps {
  entry: PanEntryWithProduct
  currentMonth: number
  currentYear: number
  justEmptied: boolean
  isWishlisted: boolean
  onTap: () => void
}

export function PanCard({
  entry,
  currentMonth,
  currentYear,
  justEmptied,
  isWishlisted,
  onTap,
}: PanCardProps) {
  const product = entry.products
  if (!product) return null

  const pct = USAGE_PERCENT[entry.usage_level as UsageLevel]
  const category = product.category as ProductCategory
  const isEmpty = entry.status === "empty"
  const months = monthsInPan(
    entry.started_month,
    entry.started_year,
    currentMonth,
    currentYear
  )

  return (
    <button
      onClick={isEmpty ? undefined : onTap}
      disabled={isEmpty}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-sm border border-border",
        "active:scale-[0.98] transition-transform",
        isEmpty && "opacity-60"
      )}
    >
      {/* Photo or category placeholder */}
      <div
        className={cn(
          "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-xl",
          !product.photo_url && CATEGORY_BG[category]
        )}
      >
        {product.photo_url ? (
          <Image
            src={product.photo_url}
            alt={product.name}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className={CATEGORY_TEXT[category]}>{CATEGORY_EMOJI[category]}</span>
        )}
      </div>

      {/* Info column */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/* Status label */}
            {!isEmpty && (
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                {entry.is_pick ? "Pick of the month" : "In progress"}
              </p>
            )}
            <p
              className={cn(
                "truncate text-sm font-bold leading-tight",
                isEmpty && "line-through text-muted-foreground"
              )}
            >
              {product.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">{product.brand}</p>
          </div>

          {/* Badges */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            {!isEmpty && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                Active
              </span>
            )}
            {isWishlisted && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                🛍️
              </span>
            )}
            {months > 0 && !isEmpty && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                {months}mo
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isEmpty && (
          <div className="mt-2 flex items-center gap-2">
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-7 shrink-0 text-right text-[11px] font-semibold text-primary">
              {pct}%
            </span>
          </div>
        )}

        {/* Empty tag */}
        {isEmpty && (
          <p className="mt-1 text-xs text-muted-foreground">EMPTY ✓</p>
        )}
      </div>

      {/* Confetti overlay for just-emptied */}
      {justEmptied && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-green-50/90">
          <span className="text-sm font-bold text-green-700">EMPTY ✓</span>
        </div>
      )}
    </button>
  )
}
