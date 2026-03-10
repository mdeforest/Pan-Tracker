"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronDown, ChevronUp, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CATEGORY_EMOJI,
  CATEGORY_BG,
  CATEGORY_LABELS,
  MONTH_NAMES,
} from "@/components/pan/utils"
import type { ProductCategory, WouldRepurchase } from "@/lib/types/app"

export interface EmptyCardData {
  id: string
  finished_month: number
  finished_year: number
  rating: number | null
  would_repurchase: WouldRepurchase | null
  review_notes: string | null
  replacement_free_text: string | null
  products: {
    id: string
    name: string
    brand: string
    category: ProductCategory
    photo_url: string | null
  } | null
}

interface EmptyCardProps {
  empty: EmptyCardData
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
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>
      {label}
    </span>
  )
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
        />
      ))}
    </div>
  )
}

export function EmptyCard({ empty }: EmptyCardProps) {
  const [expanded, setExpanded] = useState(false)
  const product = empty.products
  const cat = (product?.category ?? "other") as ProductCategory
  const monthName = MONTH_NAMES[(empty.finished_month ?? 1) - 1]

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 active:bg-muted/40 text-left"
        aria-expanded={expanded}
      >
        {/* Photo / Emoji */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg",
            CATEGORY_BG[cat]
          )}
        >
          {product?.photo_url ? (
            <Image
              src={product.photo_url}
              alt={product.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span>{CATEGORY_EMOJI[cat]}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{product?.name ?? "Unknown"}</p>
              <p className="truncate text-xs text-muted-foreground">{product?.brand}</p>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            )}
          </div>

          {/* Badges row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {CATEGORY_LABELS[cat]}
            </span>
            <RepurchaseBadge value={empty.would_repurchase} />
          </div>

          {/* Stars + month */}
          <div className="mt-1.5 flex items-center gap-3">
            <StarDisplay rating={empty.rating} />
            <span className="text-xs text-muted-foreground">
              Finished {monthName} {empty.finished_year}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded notes */}
      {expanded && (
        <div className="border-t border-border px-4 py-3">
          {empty.review_notes ? (
            <p className="text-sm text-foreground leading-relaxed">{empty.review_notes}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">No review notes.</p>
          )}
          {empty.replacement_free_text && (
            <p className="mt-2 text-xs italic text-muted-foreground">
              Replacement: {empty.replacement_free_text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
