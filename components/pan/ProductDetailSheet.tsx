"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { BottomSheet } from "@/components/shared/BottomSheet"
import {
  USAGE_LEVELS,
  USAGE_PERCENT,
  USAGE_LABELS,
  CATEGORY_BG,
  CATEGORY_TEXT,
  CATEGORY_EMOJI,
  progressColor,
} from "./utils"
import type { PanEntryWithProduct } from "./types"
import type { UsageLevel, ProductCategory } from "@/lib/types/app"

interface ProductDetailSheetProps {
  open: boolean
  entry: PanEntryWithProduct | null
  year: number
  month: number
  onClose: () => void
  onMarkEmpty: () => void
  onUpdated: () => void
  onError: (msg: string) => void
}

export function ProductDetailSheet({
  open,
  entry,
  year,
  month,
  onClose,
  onMarkEmpty,
  onUpdated,
  onError,
}: ProductDetailSheetProps) {
  const [usageLevelIdx, setUsageLevelIdx] = useState(0)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  // Sync local state when entry changes
  useEffect(() => {
    if (entry) {
      const idx = USAGE_LEVELS.indexOf(entry.usage_level as UsageLevel)
      setUsageLevelIdx(idx >= 0 ? idx : 0)
      setNotes(entry.notes ?? "")
    }
  }, [entry])

  if (!entry || !entry.products) return null

  const product = entry.products
  const category = product.category as ProductCategory
  const pct = USAGE_PERCENT[USAGE_LEVELS[usageLevelIdx]]
  const isDirty =
    USAGE_LEVELS[usageLevelIdx] !== (entry.usage_level as UsageLevel) ||
    notes !== (entry.notes ?? "")

  async function handleSave() {
    if (!entry || !isDirty) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pans/${year}/${month}/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usage_level: USAGE_LEVELS[usageLevelIdx],
          notes: notes || null,
        }),
      })
      const json = (await res.json()) as { error?: unknown }
      if (!res.ok || json.error) {
        onError(typeof json.error === "string" ? json.error : "Failed to save changes")
      } else {
        onUpdated()
        onClose()
      }
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!entry) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/pans/${year}/${month}/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paused" }),
      })
      const json = (await res.json()) as { error?: unknown }
      if (!res.ok || json.error) {
        onError(typeof json.error === "string" ? json.error : "Failed to remove from pan")
      } else {
        onUpdated()
        onClose()
      }
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setRemoving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="flex flex-col gap-4 p-4">
        {/* Product header */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl",
              !product.photo_url && CATEGORY_BG[category]
            )}
          >
            {product.photo_url ? (
              <Image
                src={product.photo_url}
                alt={product.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className={CATEGORY_TEXT[category]}>{CATEGORY_EMOJI[category]}</span>
            )}
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">{product.name}</p>
            <p className="text-sm text-muted-foreground">{product.brand}</p>
          </div>
        </div>

        {/* Progress display */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-base font-bold">{pct}%</span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "absolute left-0 top-0 h-full rounded-full transition-all duration-200",
                progressColor(pct)
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Usage level slider */}
        <div>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={usageLevelIdx}
            onChange={(e) => setUsageLevelIdx(parseInt(e.target.value, 10))}
            className="usage-slider w-full"
            aria-label="Usage level"
          />
          <div className="mt-1 flex justify-between">
            {USAGE_LEVELS.map((level, i) => (
              <span
                key={level}
                className={cn(
                  "text-xs",
                  i === usageLevelIdx ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {USAGE_LABELS[level].split(" ")[0]}
              </span>
            ))}
          </div>
        </div>

        {/* Notes textarea */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="entry-notes">
            Notes
          </label>
          <textarea
            id="entry-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note…"
            className="min-h-[80px] w-full resize-none rounded-xl border border-input bg-white px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* Save button — only shown when dirty */}
        {isDirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background disabled:opacity-60 active:opacity-80"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        )}

        {/* Mark Empty */}
        <button
          onClick={onMarkEmpty}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-green-600 text-base font-semibold text-white active:bg-green-700"
        >
          Mark Empty ✓
        </button>

        {/* Remove from pan */}
        <button
          onClick={handleRemove}
          disabled={removing}
          className="py-3 text-center text-sm text-destructive disabled:opacity-60"
        >
          {removing ? "Removing…" : "Remove from pan"}
        </button>
      </div>
    </BottomSheet>
  )
}
