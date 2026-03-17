"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { BottomSheet } from "@/components/shared/BottomSheet"
import { cn } from "@/lib/utils"
import { MONTH_NAMES } from "./utils"
import { getRollingImportWindow } from "@/lib/import/history-csv"

const MONTH_ABBREVS = MONTH_NAMES.map((m) => m.slice(0, 3))

interface MonthPickerSheetProps {
  open: boolean
  onClose: () => void
  currentYear: number
  currentMonth: number
  monthsWithData: Set<string>
}

export function MonthPickerSheet({
  open,
  onClose,
  currentYear,
  currentMonth,
  monthsWithData,
}: MonthPickerSheetProps) {
  const router = useRouter()
  const now = new Date()
  const nowYear = now.getFullYear()
  const nowMonth = now.getMonth() + 1

  // Year range: 3 years back to current year
  const minYear = nowYear - 3
  const maxYear = nowYear

  const [pickerYear, setPickerYear] = useState(() =>
    Math.min(Math.max(currentYear, minYear), maxYear)
  )

  // Rolling 36-month window for enabled range
  const window = getRollingImportWindow(now)

  function isMonthEnabled(year: number, month: number) {
    const idx = year * 12 + (month - 1)
    return idx >= window.minIndex && idx <= nowYear * 12 + (nowMonth - 1)
  }

  function isCurrentlyViewing(year: number, month: number) {
    return year === currentYear && month === currentMonth
  }

  function handleMonthSelect(month: number) {
    if (!isMonthEnabled(pickerYear, month)) return
    router.push(`/pan/${pickerYear}/${month}`)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Jump to Month">
      <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
        {/* Year selector */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPickerYear((y) => Math.max(y - 1, minYear))}
            disabled={pickerYear <= minYear}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground disabled:opacity-30 active:bg-muted"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-base font-bold">{pickerYear}</span>
          <button
            type="button"
            onClick={() => setPickerYear((y) => Math.min(y + 1, maxYear))}
            disabled={pickerYear >= maxYear}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground disabled:opacity-30 active:bg-muted"
            aria-label="Next year"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-2">
          {MONTH_ABBREVS.map((abbrev, idx) => {
            const month = idx + 1
            const enabled = isMonthEnabled(pickerYear, month)
            const active = isCurrentlyViewing(pickerYear, month)
            const hasData = monthsWithData.has(
              `${pickerYear}-${String(month).padStart(2, "0")}`
            )

            return (
              <button
                key={month}
                type="button"
                onClick={() => handleMonthSelect(month)}
                disabled={!enabled}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center rounded-xl text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : enabled
                      ? "bg-white text-foreground border border-border active:bg-muted"
                      : "bg-muted/40 text-muted-foreground cursor-not-allowed"
                )}
                aria-label={`${abbrev} ${pickerYear}`}
                aria-current={active ? "page" : undefined}
              >
                {abbrev}
                {hasData && !active && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
                )}
                {hasData && active && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-primary-foreground" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </BottomSheet>
  )
}
