"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { BottomSheet } from "@/components/shared/BottomSheet"
import type { PanEntryWithProduct } from "./types"
import type { WouldRepurchase } from "@/lib/types/app"

const REPURCHASE_OPTIONS: { value: WouldRepurchase; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
]

interface EmptyLoggerSheetProps {
  open: boolean
  entry: PanEntryWithProduct | null
  onClose: () => void
  onLogged: (entryId: string) => void
  onError: (msg: string) => void
}

export function EmptyLoggerSheet({
  open,
  entry,
  onClose,
  onLogged,
  onError,
}: EmptyLoggerSheetProps) {
  const [repurchase, setRepurchase] = useState<WouldRepurchase | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [replacementNote, setReplacementNote] = useState("")
  const [reviewNotes, setReviewNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setRepurchase(null)
    setRating(null)
    setReplacementNote("")
    setReviewNotes("")
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!entry) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/empties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pan_entry_id: entry.id,
          rating: rating ?? undefined,
          would_repurchase: repurchase ?? undefined,
          review_notes: reviewNotes || undefined,
          replacement_free_text: replacementNote || undefined,
        }),
      })
      const json = (await res.json()) as { error?: unknown }
      if (!res.ok || json.error) {
        onError(typeof json.error === "string" ? json.error : "Failed to log empty")
        return
      }

      // Confetti celebration
      try {
        const confetti = (await import("canvas-confetti")).default
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
      } catch {
        // Non-fatal
      }

      reset()
      onLogged(entry.id)
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="Log Empty">
      <div className="flex flex-col gap-5 p-4">
        {/* Product label */}
        {entry?.products && (
          <p className="text-center text-sm text-muted-foreground">
            {entry.products.brand} · {entry.products.name}
          </p>
        )}

        {/* Would Repurchase — full-width segmented control */}
        <div>
          <p className="mb-2 text-sm font-semibold">Would you repurchase?</p>
          <div className="grid grid-cols-3 gap-2">
            {REPURCHASE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setRepurchase(repurchase === value ? null : value)}
                className={cn(
                  "flex h-11 items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                  repurchase === value
                    ? "border-foreground bg-foreground text-background"
                    : "border-input bg-white text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating — large tappable stars */}
        <div>
          <p className="mb-2 text-sm font-semibold">Rating (optional)</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(rating === star ? null : star)}
                className={cn(
                  "flex h-12 flex-1 items-center justify-center rounded-xl text-2xl transition-colors",
                  rating !== null && star <= rating ? "text-amber-400" : "text-muted"
                )}
                aria-label={`${star} star${star !== 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Replacement */}
        <div>
          <label htmlFor="replacement-note" className="mb-1.5 block text-sm font-semibold">
            Replacement (optional)
          </label>
          <input
            id="replacement-note"
            type="text"
            value={replacementNote}
            onChange={(e) => setReplacementNote(e.target.value)}
            placeholder="What's next?"
            className="h-11 w-full rounded-xl border border-input bg-white px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* Review notes */}
        <div>
          <label htmlFor="review-notes" className="mb-1.5 block text-sm font-semibold">
            Review Notes (optional)
          </label>
          <textarea
            id="review-notes"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Your thoughts on this product…"
            className="min-h-[80px] w-full resize-none rounded-xl border border-input bg-white px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ fontSize: "16px" }}
          />
        </div>

        {/* Submit — pinned to bottom with safe-area */}
        <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-green-600 text-base font-semibold text-white disabled:opacity-60 active:bg-green-700"
          >
            {submitting ? "Logging…" : "Log Empty 🎉"}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
