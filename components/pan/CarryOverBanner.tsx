"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { BottomSheet } from "@/components/shared/BottomSheet"
import { MONTH_NAMES } from "./utils"
import type { PanEntryWithProduct } from "./types"

interface CarryOverBannerProps {
  year: number
  month: number
  entries: PanEntryWithProduct[]
  onCarriedOver: () => void
  onError: (msg: string) => void
}

export function CarryOverBanner({
  year,
  month,
  entries,
  onCarriedOver,
  onError,
}: CarryOverBannerProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(
    new Set(entries.map((e) => e.id))
  )
  const [carrying, setCarrying] = useState(false)

  const targetMonth = month === 12 ? 1 : month + 1
  const targetYear = month === 12 ? year + 1 : year

  function toggleEntry(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleCarryOver() {
    if (selected.size === 0) return
    setCarrying(true)

    const productIds = entries
      .filter((e) => selected.has(e.id))
      .map((e) => e.product_id)

    try {
      const res = await fetch(`/api/pans/${targetYear}/${targetMonth}/carry-over`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: productIds }),
      })
      const json = (await res.json()) as { error?: unknown }
      if (!res.ok || json.error) {
        onError(typeof json.error === "string" ? json.error : "Carry-over failed")
        return
      }
      setSheetOpen(false)
      onCarriedOver()
    } catch {
      onError("Network error. Please try again.")
    } finally {
      setCarrying(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        className="mx-4 mb-3 flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-left active:bg-amber-100"
      >
        <span className="text-xl">📦</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">
            {entries.length} product{entries.length !== 1 ? "s" : ""} unfinished
          </p>
          <p className="text-xs text-amber-600">
            Tap to carry over to {MONTH_NAMES[targetMonth - 1]}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-amber-600" />
      </button>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Carry Over Products"
      >
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            Select products to carry to {MONTH_NAMES[targetMonth - 1]} {targetYear}
          </p>

          <ul className="flex flex-col gap-2">
            {entries.map((entry) => {
              if (!entry.products) return null
              const isSelected = selected.has(entry.id)
              return (
                <li key={entry.id}>
                  <button
                    onClick={() => toggleEntry(entry.id)}
                    className={cn(
                      "flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                      isSelected ? "border-foreground bg-foreground/5" : "border-input bg-white"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isSelected
                          ? "border-foreground bg-foreground"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {isSelected && (
                        <span className="text-xs leading-none text-background">✓</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.products.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.products.brand}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <button
              onClick={handleCarryOver}
              disabled={carrying || selected.size === 0}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-foreground text-base font-semibold text-background disabled:opacity-50 active:opacity-80"
            >
              {carrying
                ? "Carrying over…"
                : `Carry Over ${selected.size} Product${selected.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
