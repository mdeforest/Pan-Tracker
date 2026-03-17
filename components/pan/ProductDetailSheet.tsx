"use client"

import { useLayoutEffect, useState } from "react"
import Image from "next/image"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { BottomSheet } from "@/components/shared/BottomSheet"
import {
  USAGE_LEVELS,
  USAGE_PERCENT,
  USAGE_SHORT_LABELS,
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
  const [updatingPick, setUpdatingPick] = useState(false)

  // Sync before paint so the slider/progress doesn't visibly jump on open.
  useLayoutEffect(() => {
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

  async function handleSave() {
    if (!entry) return
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

  async function handleTogglePick() {
    if (!entry) return
    setUpdatingPick(true)
    try {
      const res = await fetch(`/api/pans/${year}/${month}/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pick: !entry.is_pick }),
      })
      const json = (await res.json()) as { error?: unknown }
      if (!res.ok || json.error) {
        onError(typeof json.error === "string" ? json.error : "Failed to update pick")
        return
      }

      onUpdated()
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setUpdatingPick(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="flex flex-col gap-4 p-4">
        {/* Product header Card */}
        <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-gray-100 relative">
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
          <div className="flex-1 min-w-0 pr-8">
            <p className="text-lg font-bold leading-tight truncate">{product.name}</p>
            <p className="text-sm text-muted-foreground truncate">{product.brand}</p>
          </div>
          <button
            onClick={handleTogglePick}
            disabled={updatingPick}
            aria-label={entry.is_pick ? "Unmark pick" : "Mark as pick"}
            title={entry.is_pick ? "Unmark pick" : "Mark as pick"}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-60",
              entry.is_pick
                ? "bg-amber-100 text-amber-500"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Star className={cn("h-5 w-5", entry.is_pick && "fill-current")} />
          </button>
        </div>

        {/* Progress Display Card */}
        <div className="rounded-3xl bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-gray-100">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Remaining</span>
            <span className="text-xl font-bold">{pct}%</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-muted mb-6">
              <div
                className={cn(
                  "absolute left-0 top-0 h-full rounded-full transition-all",
                  progressColor(pct)
                )}
                style={{ width: `${pct}%` }}
              />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={4 - usageLevelIdx}
              onChange={(e) => setUsageLevelIdx(4 - parseInt(e.target.value, 10))}
              className="usage-slider w-full"
              aria-label="Usage level"
            />
          </div>
          
          <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-medium text-muted-foreground">
            <span>Empty</span>
            <span>Low</span>
            <span>Half</span>
            <span>Most</span>
            <span>Full</span>
          </div>
        </div>

        {/* Notes Card */}
        <div className="rounded-3xl bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] ring-1 ring-gray-100">
          <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="entry-notes">
            Notes
          </label>
          <textarea
            id="entry-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note…"
            className="min-h-[80px] w-full resize-none rounded-xl border border-input bg-muted/30 px-3 py-2 placeholder:text-muted-foreground focus:bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* Actions Dropdown / Group */}
        <div className="mt-2 flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background disabled:opacity-60 active:opacity-80"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>

          <button
            onClick={onMarkEmpty}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-green-600 text-base font-semibold text-white active:bg-green-700"
          >
            Mark Empty ✓
          </button>

          <button
            onClick={handleRemove}
            disabled={removing}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-red-50 text-base font-semibold text-red-600 active:bg-red-100 disabled:opacity-60"
          >
            {removing ? "Removing…" : "Remove from pan"}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
